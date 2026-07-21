// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur Paystack — structure complète + HMAC réel.
//  Doc : https://paystack.com/docs
//
//  Initiation : POST https://api.paystack.co/transaction/initialize
//               (Bearer <secret_key>) body { amount, email, currency, reference,
//               callback_url } → data.data.authorization_url + data.data.reference
//
//  Webhook : en-tête `x-paystack-signature` = HMAC-SHA512(rawBody, secret_key).
//            payload = { event, data:{ id, reference, amount, status, ... } }
//
//  Unité : Paystack attend la plus petite unité (kobo/pesewa/centime) → 1:1 avec
//  nos centimes.  NB : Paystack ne supporte pas nativement XOF — vérifier la
//  devise activée sur le compte client avant mise en production.
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

const PAYSTACK_BASE = 'https://api.paystack.co';

@Injectable()
export class PaystackGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.PAYSTACK;
  private readonly logger = new Logger(PaystackGateway.name);

  constructor(private readonly http: HttpService) {}

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    // Sandbox = utilisation d'une clé de test `sk_test_...` (pas d'URL dédiée).
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    if (!secretKey) throw new Error('Paystack: secretKey manquant dans la config');

    const body = {
      amount: tx.amountExpected, // déjà en plus petite unité
      email: tx.payerEmail ?? 'client@santarex.local',
      currency: tx.currency,
      reference: tx.reference,
      callback_url: secrets.returnUrl ?? '',
      metadata: { reference: tx.reference, tenantId: tx.tenantId, sandbox },
    };

    const { data } = await firstValueFrom(
      this.http.post<any>(`${PAYSTACK_BASE}/transaction/initialize`, body, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
    );

    const paymentUrl: string | undefined = data?.data?.authorization_url;
    const gatewayTransactionId: string =
      data?.data?.reference ?? data?.data?.access_code ?? tx.reference;
    if (!paymentUrl) {
      this.logger.error('Paystack: réponse initialize invalide', data);
      throw new Error('Paystack: initialisation échouée (authorization_url absent)');
    }
    return { gatewayTransactionId, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const signature = headerValue(headers, 'x-paystack-signature');
    const secretKey = secrets.secretKey ?? secrets.secret_key;

    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };
    if (!secretKey || !signature) return invalid;

    // Paystack signe le corps BRUT en HMAC-SHA512 avec la SECRET KEY.
    const expected = createHmac('sha512', secretKey).update(raw).digest('hex');
    if (!safeEqualHex(expected, signature)) {
      this.logger.warn('Paystack webhook: signature invalide');
      return invalid;
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return invalid;
    }

    const d = payload?.data ?? {};
    const eventId: string = String(d?.id ?? d?.reference ?? '');
    return {
      valid: true,
      eventId,
      reference: d?.reference ?? '',
      amount: Number(d?.amount ?? 0),
      status: this.mapStatus(String(payload?.event ?? ''), String(d?.status ?? '')),
    };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
  ): Promise<StatusVerification> {
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    const { data } = await firstValueFrom(
      this.http.get<any>(
        `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(gatewayTransactionId)}`,
        { headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' } },
      ),
    );
    const d = data?.data ?? {};
    return {
      status: this.mapStatus('', String(d?.status ?? '')),
      amount: Number(d?.amount ?? 0),
      reference: d?.reference ?? '',
    };
  }

  private mapStatus(event: string, status: string): NormalizedStatus {
    if (event === 'charge.success' || status === 'success') return 'succeeded';
    if (event === 'charge.failed' || status === 'failed' || status === 'abandoned') {
      return 'failed';
    }
    return 'pending';
  }
}
