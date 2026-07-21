// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur Stripe — structure complète + HMAC réel.
//  Doc : https://stripe.com/docs/webhooks/signatures
//
//  Initiation : POST https://api.stripe.com/v1/checkout/sessions
//               (Bearer <secret_key>, form-urlencoded) → { id, url }
//
//  Webhook : en-tête `stripe-signature` = `t=<ts>,v1=<hmac>[,v1=...]`
//   v1 = HMAC-SHA256("<ts>.<rawBody>", webhook_signing_secret `whsec_...`).
//   payload = { id:'evt_...', type:'checkout.session.completed', data:{ object:{
//   id, amount_total, currency, payment_status, client_reference_id, metadata }}}.
//
//  Unité : Stripe utilise la plus petite unité (1:1 avec nos centimes) SAUF pour
//  les devises "zero-decimal" (XOF en fait partie !) où le montant est en unité
//  entière. XOF étant zéro-décimale chez Stripe, on convertit /100 à l'envoi et
//  *100 au retour. Adapter si la devise cliente est décimale (EUR, USD → 1:1).
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

const STRIPE_BASE = 'https://api.stripe.com/v1';

// Devises "zero-decimal" chez Stripe (montant en unité entière).
const ZERO_DECIMAL = new Set([
  'XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XPF',
]);

@Injectable()
export class StripeGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.STRIPE;
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private readonly http: HttpService) {}

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    // Sandbox = clé de test `sk_test_...`.
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    if (!secretKey) throw new Error('Stripe: secretKey manquant dans la config');

    // Stripe attend un corps x-www-form-urlencoded (API "form" historique).
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', secrets.returnUrl ?? 'https://santarex.local/return');
    params.set('cancel_url', secrets.cancelUrl ?? secrets.returnUrl ?? 'https://santarex.local/cancel');
    params.set('client_reference_id', tx.reference);
    params.set('metadata[reference]', tx.reference);
    params.set('metadata[tenantId]', tx.tenantId);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', tx.currency.toLowerCase());
    params.set(
      'line_items[0][price_data][unit_amount]',
      String(this.toGatewayAmount(tx.amountExpected, tx.currency)),
    );
    params.set('line_items[0][price_data][product_data][name]', `SANTAREX ERP — ${tx.reference}`);
    if (tx.payerEmail) params.set('customer_email', tx.payerEmail);

    const { data } = await firstValueFrom(
      this.http.post<any>(`${STRIPE_BASE}/checkout/sessions`, params.toString(), {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    const paymentUrl: string | undefined = data?.url;
    const gatewayTransactionId: string | undefined = data?.id;
    if (!paymentUrl || !gatewayTransactionId) {
      this.logger.error('Stripe: réponse checkout invalide', data);
      throw new Error('Stripe: initialisation échouée (url absent)');
    }
    return { gatewayTransactionId, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const header = headerValue(headers, 'stripe-signature');
    const secret = secrets.webhookSecret ?? secrets.webhook_secret; // whsec_...

    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };
    if (!secret || !header) return invalid;

    // Parse `t=...,v1=...,v1=...`
    let ts = '';
    const v1: string[] = [];
    for (const part of header.split(',')) {
      const [k, v] = part.split('=');
      if (k?.trim() === 't') ts = v?.trim();
      if (k?.trim() === 'v1' && v) v1.push(v.trim());
    }
    if (!ts || v1.length === 0) return invalid;

    const expected = createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
    // Stripe peut fournir plusieurs v1 (rotation de secret) : au moins un match.
    if (!v1.some((sig) => safeEqualHex(expected, sig))) {
      this.logger.warn('Stripe webhook: signature invalide');
      return invalid;
    }

    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return invalid;
    }

    const obj = event?.data?.object ?? {};
    const currency = String(obj?.currency ?? '').toUpperCase();
    const reference: string = obj?.client_reference_id ?? obj?.metadata?.reference ?? '';
    const amountRaw = Number(obj?.amount_total ?? obj?.amount ?? 0);
    return {
      valid: true,
      eventId: String(event?.id ?? ''),
      reference,
      amount: this.fromGatewayAmount(amountRaw, currency),
      status: this.mapStatus(String(event?.type ?? ''), String(obj?.payment_status ?? '')),
    };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
  ): Promise<StatusVerification> {
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    const { data } = await firstValueFrom(
      this.http.get<any>(`${STRIPE_BASE}/checkout/sessions/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      }),
    );
    const currency = String(data?.currency ?? '').toUpperCase();
    return {
      status: this.mapStatus('', String(data?.payment_status ?? '')),
      amount: this.fromGatewayAmount(Number(data?.amount_total ?? 0), currency),
      reference: data?.client_reference_id ?? data?.metadata?.reference ?? '',
    };
  }

  private mapStatus(type: string, paymentStatus: string): NormalizedStatus {
    if (type === 'checkout.session.completed' || paymentStatus === 'paid') return 'succeeded';
    if (
      type === 'checkout.session.expired' ||
      type === 'payment_intent.payment_failed' ||
      paymentStatus === 'unpaid'
    ) {
      // 'unpaid' peut aussi être un état transitoire → prudence : échec seulement
      // sur événements explicitement terminaux.
      if (type.includes('failed') || type.includes('expired')) return 'failed';
    }
    return 'pending';
  }

  private toGatewayAmount(centimes: number, currency: string): number {
    return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(centimes / 100) : centimes;
  }
  private fromGatewayAmount(amount: number, currency: string): number {
    return ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(amount * 100) : amount;
  }
}
