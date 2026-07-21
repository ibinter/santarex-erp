// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur Moneroo — IMPLÉMENTATION CONCRÈTE (HTTP réel + HMAC).
//  Doc : https://docs.moneroo.io  (Payments API + Webhooks)
//
//  Initiation : POST /v1/payments/initialize  (Bearer <secret_key>)
//  Webhook    : en-tête `X-Moneroo-Signature` = HMAC-SHA256(rawBody, webhook_secret)
//               payload = { id, event, data: { id, status, amount, currency, ... } }
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
  splitName,
} from './gateway.interface';

const MONEROO_BASE = 'https://api.moneroo.io/v1';

@Injectable()
export class MonerooGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.MONEROO;
  private readonly logger = new Logger(MonerooGateway.name);

  constructor(private readonly http: HttpService) {}

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    // Sandbox vs prod chez Moneroo se distingue par la clé (test vs live),
    // pas par l'URL. `sandbox` est journalisé pour traçabilité.
    const secretKey = secrets.secretKey ?? secrets.apiKey ?? secrets.secret_key;
    if (!secretKey) {
      throw new Error('Moneroo: secretKey manquant dans la config');
    }
    const { firstName, lastName } = splitName(tx.payerName);

    const body = {
      amount: tx.amountExpected, // Moneroo attend la plus petite unité
      currency: tx.currency,
      description: `SANTAREX ERP — réf. ${tx.reference}`,
      return_url: secrets.returnUrl ?? '',
      webhook_url: secrets.webhookUrl ?? '',
      reference: tx.reference,
      customer: {
        email: tx.payerEmail ?? '',
        first_name: firstName,
        last_name: lastName,
        phone: tx.payerPhone ?? '',
      },
      metadata: { reference: tx.reference, tenantId: tx.tenantId, sandbox },
    };

    const { data } = await firstValueFrom(
      this.http.post<any>(`${MONEROO_BASE}/payments/initialize`, body, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    );

    const paymentUrl: string | undefined = data?.data?.checkout_url;
    const gatewayTransactionId: string | undefined = data?.data?.id;
    if (!paymentUrl || !gatewayTransactionId) {
      this.logger.error('Moneroo: réponse initialize invalide', data);
      throw new Error('Moneroo: initialisation échouée (checkout_url absent)');
    }
    return { gatewayTransactionId, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const signature = headerValue(headers, 'x-moneroo-signature');
    const secret = secrets.webhookSecret ?? secrets.webhook_secret;

    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };
    if (!secret || !signature) return invalid;

    // HMAC-SHA256 du corps BRUT (jamais du JSON re-sérialisé).
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (!safeEqualHex(expected, signature)) {
      this.logger.warn('Moneroo webhook: signature invalide');
      return invalid;
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return invalid;
    }

    const eventId: string = payload?.id ?? payload?.data?.id ?? '';
    const inner = payload?.data ?? {};
    const reference: string = inner?.reference ?? inner?.metadata?.reference ?? '';
    const amount: number = Number(inner?.amount ?? 0);
    const status = this.mapStatus(String(inner?.status ?? payload?.event ?? ''));

    return { valid: true, eventId, reference, amount, status };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
  ): Promise<StatusVerification> {
    const secretKey = secrets.secretKey ?? secrets.apiKey ?? secrets.secret_key;
    const { data } = await firstValueFrom(
      this.http.get<any>(`${MONEROO_BASE}/payments/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      }),
    );
    const d = data?.data ?? {};
    return {
      status: this.mapStatus(String(d?.status ?? '')),
      amount: Number(d?.amount ?? 0),
      reference: d?.reference ?? '',
    };
  }

  private mapStatus(raw: string): NormalizedStatus {
    const s = raw.toLowerCase();
    if (s.includes('success') || s === 'completed' || s === 'paid') return 'succeeded';
    if (s.includes('fail') || s.includes('cancel') || s.includes('declin')) return 'failed';
    return 'pending';
  }
}
