// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur CinetPay — IMPLÉMENTATION CONCRÈTE (HTTP réel + HMAC).
//  Doc : https://docs.cinetpay.com
//
//  Initiation : POST https://api-checkout.cinetpay.com/v2/payment
//               body { apikey, site_id, transaction_id, amount, currency, ... }
//               → { code:'201', data:{ payment_token, payment_url } }
//               (transaction_id est GÉNÉRÉ côté SANTAREX = tx.reference)
//
//  Webhook (notify_url) : POST application/x-www-form-urlencoded.
//   Vérification : en-tête `x-token` = HMAC-SHA256(secret_key, concat des champs
//   dans l'ordre EXACT ci-dessous). Le notify ne porte PAS de statut final
//   fiable → on confirme via /v2/payment/check (verifyStatus).
//
//  Unité de montant : CinetPay attend le montant en unité ENTIÈRE de la devise
//  (XOF sans décimale). Le module modélise les montants en centimes (1 XOF = 100).
//  On convertit donc /100 à l'envoi et *100 au retour. Ajuster si la convention
//  centime du projet diffère.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import { PaymentGateway } from '../payments.enums';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import {
  PaymentGatewayAdapter,
  GatewaySecrets,
  WebhookHeaders,
  InitiateResult,
  WebhookVerification,
  StatusVerification,
  NormalizedStatus,
  headerValue,
  rawBodyString,
  safeEqualHex,
} from './gateway.interface';

const CINETPAY_BASE = 'https://api-checkout.cinetpay.com/v2';

// Ordre EXACT de concaténation pour le HMAC du webhook (cf. doc CinetPay).
const TOKEN_FIELDS = [
  'cpm_site_id',
  'cpm_trans_id',
  'cpm_trans_date',
  'cpm_amount',
  'cpm_currency',
  'signature',
  'payment_method',
  'cel_phone_num',
  'cpm_phone_prefixe',
  'cpm_language',
  'cpm_version',
  'cpm_payment_config',
  'cpm_page_action',
  'cpm_custom',
  'cpm_designation',
  'cpm_error_message',
];

@Injectable()
export class CinetpayGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.CINETPAY;
  private readonly logger = new Logger(CinetpayGateway.name);

  constructor(private readonly http: HttpService) {}

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    const apikey = secrets.apiKey ?? secrets.apikey;
    const siteId = secrets.siteId ?? secrets.site_id;
    if (!apikey || !siteId) {
      throw new Error('CinetPay: apiKey/siteId manquant dans la config');
    }

    const body = {
      apikey,
      site_id: siteId,
      transaction_id: tx.reference, // sert d'identifiant côté passerelle
      amount: this.toGatewayAmount(tx.amountExpected),
      currency: tx.currency,
      description: `SANTAREX ERP — ${tx.reference}`,
      return_url: secrets.returnUrl ?? '',
      notify_url: secrets.webhookUrl ?? '',
      channels: 'ALL',
      customer_name: tx.payerName ?? '',
      customer_email: tx.payerEmail ?? '',
      customer_phone_number: tx.payerPhone ?? '',
      metadata: JSON.stringify({ reference: tx.reference, sandbox }),
    };

    const { data } = await firstValueFrom(
      this.http.post<any>(`${CINETPAY_BASE}/payment`, body, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      }),
    );

    const paymentUrl: string | undefined = data?.data?.payment_url;
    if (!paymentUrl) {
      this.logger.error('CinetPay: réponse payment invalide', data);
      throw new Error('CinetPay: initialisation échouée (payment_url absent)');
    }
    // gatewayTransactionId = notre transaction_id (CinetPay le réutilise partout).
    return { gatewayTransactionId: tx.reference, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const token = headerValue(headers, 'x-token');
    const secret = secrets.secretKey ?? secrets.secret_key;

    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };
    if (!secret || !token) return invalid;

    // Le notify arrive en x-www-form-urlencoded.
    const params = new URLSearchParams(raw);
    const concat = TOKEN_FIELDS.map((f) => params.get(f) ?? '').join('');
    const expected = createHmac('sha256', secret).update(concat).digest('hex');
    if (!safeEqualHex(expected, token)) {
      this.logger.warn('CinetPay webhook: x-token invalide');
      return invalid;
    }

    const transId = params.get('cpm_trans_id') ?? '';
    const amountXof = Number(params.get('cpm_amount') ?? 0);

    // Le notify CinetPay ne porte pas de statut final garanti → 'pending'.
    // GatewayService confirmera via verifyStatus (server-to-server).
    return {
      valid: true,
      eventId: transId, // unique par transaction
      reference: transId, // == tx.reference
      amount: this.fromGatewayAmount(amountXof),
      status: 'pending',
    };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
  ): Promise<StatusVerification> {
    const apikey = secrets.apiKey ?? secrets.apikey;
    const siteId = secrets.siteId ?? secrets.site_id;

    const { data } = await firstValueFrom(
      this.http.post<any>(
        `${CINETPAY_BASE}/payment/check`,
        { apikey, site_id: siteId, transaction_id: gatewayTransactionId },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
      ),
    );

    const d = data?.data ?? {};
    // code '00' = ACCEPTED (succès). Sinon en attente/échec selon status.
    const code = String(data?.code ?? d?.code ?? '');
    const statusStr = String(d?.status ?? '');
    return {
      status: this.mapStatus(code, statusStr),
      amount: this.fromGatewayAmount(Number(d?.amount ?? 0)),
      reference: d?.metadata ? this.safeRef(d.metadata, gatewayTransactionId) : gatewayTransactionId,
    };
  }

  private safeRef(metadata: string, fallback: string): string {
    try {
      const m = JSON.parse(metadata);
      return m?.reference ?? fallback;
    } catch {
      return fallback;
    }
  }

  private mapStatus(code: string, statusStr: string): NormalizedStatus {
    if (code === '00' || statusStr === 'ACCEPTED') return 'succeeded';
    if (statusStr === 'REFUSED' || code === '627' || statusStr === 'FAILED') return 'failed';
    return 'pending';
  }

  // Centimes internes → unité entière CinetPay (XOF).
  private toGatewayAmount(centimes: number): number {
    return Math.round(centimes / 100);
  }
  // Unité CinetPay (XOF) → centimes internes.
  private fromGatewayAmount(xof: number): number {
    return Math.round(xof * 100);
  }
}
