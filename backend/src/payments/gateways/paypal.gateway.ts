// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur PayPal — structure complète + vérification de signature.
//  Doc : https://developer.paypal.com/api/rest/webhooks/
//
//  Initiation (2 étapes) :
//   1) POST /v1/oauth2/token (Basic client_id:secret) → access_token
//   2) POST /v2/checkout/orders (Bearer access_token) → { id, links:[{rel:'approve'}] }
//
//  Webhook : PayPal N'UTILISE PAS un simple HMAC. La signature est RSA-SHA256 :
//   en-têtes `paypal-transmission-id`, `paypal-transmission-time`,
//   `paypal-transmission-sig`, `paypal-cert-url`, `paypal-auth-algo`.
//   Message signé = `${transmissionId}|${transmissionTime}|${webhookId}|${crc32(rawBody)}`.
//   La signature est vérifiée avec la clé PUBLIQUE du certificat `paypal-cert-url`.
//
//   ⚠️ La récupération du certificat (`cert-url`) est un appel réseau ASYNC.
//   Pour rester dans le contrat SYNCHRONE de `verifyWebhook`, le certificat PEM
//   doit être fourni via la config (`secrets.webhookCertPem`, mis en cache après
//   un premier fetch côté ops) ainsi que `secrets.webhookId`. À défaut de cert,
//   la vérification échoue volontairement (fail-closed) — NE JAMAIS activer sans.
//   Alternative recommandée en prod : appeler l'endpoint
//   `/v1/notifications/verify-webhook-signature` (async) — laissé en commentaire.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createVerify } from 'crypto';
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
} from './gateway.interface';

@Injectable()
export class PaypalGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.PAYPAL;
  private readonly logger = new Logger(PaypalGateway.name);

  constructor(private readonly http: HttpService) {}

  private baseUrl(sandbox: boolean): string {
    return sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async accessToken(secrets: GatewaySecrets, sandbox: boolean): Promise<string> {
    const clientId = secrets.clientId ?? secrets.client_id;
    const secret = secrets.clientSecret ?? secrets.client_secret ?? secrets.secretKey;
    if (!clientId || !secret) throw new Error('PayPal: clientId/clientSecret manquant');
    const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const { data } = await firstValueFrom(
      this.http.post<any>(
        `${this.baseUrl(sandbox)}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    if (!data?.access_token) throw new Error('PayPal: obtention access_token échouée');
    return data.access_token;
  }

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    const token = await this.accessToken(secrets, sandbox);

    const { data } = await firstValueFrom(
      this.http.post<any>(
        `${this.baseUrl(sandbox)}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: tx.reference,
              custom_id: tx.reference,
              description: `SANTAREX ERP — ${tx.reference}`,
              amount: {
                currency_code: tx.currency,
                // PayPal attend un montant décimal en unité principale.
                value: this.toDecimal(tx.amountExpected, tx.currency),
              },
            },
          ],
          application_context: {
            return_url: secrets.returnUrl ?? '',
            cancel_url: secrets.cancelUrl ?? secrets.returnUrl ?? '',
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      ),
    );

    const gatewayTransactionId: string | undefined = data?.id;
    const approve = (data?.links ?? []).find((l: any) => l?.rel === 'approve');
    const paymentUrl: string | undefined = approve?.href;
    if (!gatewayTransactionId || !paymentUrl) {
      this.logger.error('PayPal: création order invalide', data);
      throw new Error('PayPal: initialisation échouée (approve url absent)');
    }
    return { gatewayTransactionId, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };

    const transmissionId = headerValue(headers, 'paypal-transmission-id');
    const transmissionTime = headerValue(headers, 'paypal-transmission-time');
    const transmissionSig = headerValue(headers, 'paypal-transmission-sig');
    const webhookId = secrets.webhookId ?? secrets.webhook_id;
    const certPem = secrets.webhookCertPem ?? secrets.webhook_cert_pem;

    // Fail-closed : sans cert PEM en cache ni webhookId, on refuse.
    // (Voir en-tête : alternative async /verify-webhook-signature en prod.)
    if (!transmissionId || !transmissionTime || !transmissionSig || !webhookId || !certPem) {
      this.logger.warn('PayPal webhook: éléments de vérification manquants (fail-closed)');
      return invalid;
    }

    // Message signé par PayPal = id|time|webhookId|crc32(rawBody)
    const crc = this.crc32(raw) >>> 0;
    const message = `${transmissionId}|${transmissionTime}|${webhookId}|${crc}`;
    let signatureValid = false;
    try {
      const verifier = createVerify('RSA-SHA256');
      verifier.update(message);
      verifier.end();
      signatureValid = verifier.verify(certPem, transmissionSig, 'base64');
    } catch (e) {
      this.logger.warn(`PayPal webhook: échec vérif RSA — ${(e as Error).message}`);
      return invalid;
    }
    if (!signatureValid) {
      this.logger.warn('PayPal webhook: signature RSA invalide');
      return invalid;
    }

    let event: any;
    try {
      event = JSON.parse(raw);
    } catch {
      return invalid;
    }

    const resource = event?.resource ?? {};
    const pu = (resource?.purchase_units ?? [])[0] ?? {};
    const reference: string =
      resource?.custom_id ?? pu?.custom_id ?? pu?.reference_id ?? resource?.reference_id ?? '';
    const currency = String(
      resource?.amount?.currency_code ?? pu?.amount?.currency_code ?? '',
    );
    const value =
      resource?.amount?.value ?? pu?.amount?.value ?? resource?.seller_receivable_breakdown?.gross_amount?.value ?? '0';

    return {
      valid: true,
      eventId: String(event?.id ?? ''),
      reference,
      amount: this.fromDecimal(String(value), currency),
      status: this.mapStatus(String(event?.event_type ?? '')),
    };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
    sandbox = true,
  ): Promise<StatusVerification> {
    const token = await this.accessToken(secrets, sandbox);
    const { data } = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl(sandbox)}/v2/checkout/orders/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    const pu = (data?.purchase_units ?? [])[0] ?? {};
    const currency = String(pu?.amount?.currency_code ?? '');
    const value = pu?.amount?.value ?? '0';
    // Statut order : COMPLETED / APPROVED / VOIDED
    const status: NormalizedStatus =
      data?.status === 'COMPLETED'
        ? 'succeeded'
        : data?.status === 'VOIDED'
          ? 'failed'
          : 'pending';
    return {
      status,
      amount: this.fromDecimal(String(value), currency),
      reference: pu?.custom_id ?? pu?.reference_id ?? '',
    };
  }

  private mapStatus(eventType: string): NormalizedStatus {
    if (
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'CHECKOUT.ORDER.COMPLETED'
    ) {
      return 'succeeded';
    }
    if (
      eventType === 'PAYMENT.CAPTURE.DENIED' ||
      eventType === 'PAYMENT.CAPTURE.DECLINED' ||
      eventType === 'CHECKOUT.ORDER.VOIDED'
    ) {
      return 'failed';
    }
    // CHECKOUT.ORDER.APPROVED = client a approuvé mais capture pas encore faite.
    return 'pending';
  }

  // Centimes internes → chaîne décimale (unité principale) pour PayPal.
  private toDecimal(centimes: number, currency: string): string {
    if (this.isZeroDecimal(currency)) return String(Math.round(centimes / 100));
    return (centimes / 100).toFixed(2);
  }
  private fromDecimal(value: string, currency: string): number {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    if (this.isZeroDecimal(currency)) return Math.round(n * 100);
    return Math.round(n * 100);
  }
  private isZeroDecimal(currency: string): boolean {
    return ['XOF', 'XAF', 'JPY', 'KRW', 'GNF', 'XPF'].includes(currency.toUpperCase());
  }

  // CRC32 (utilisé par PayPal dans le message signé).
  private crc32(str: string): number {
    let crc = ~0;
    const bytes = Buffer.from(str, 'utf8');
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return ~crc;
  }
}
