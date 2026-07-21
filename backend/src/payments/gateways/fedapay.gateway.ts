// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur FedaPay — structure complète + HMAC réel.
//  Doc : https://docs.fedapay.com
//
//  Initiation (2 étapes) :
//   1) POST /v1/transactions (Bearer <secret_key>) → transaction.id
//   2) POST /v1/transactions/{id}/token → { token, url }  (url = page de paiement)
//
//  Webhook : en-tête `x-fedapay-signature` = `t=<ts>,s=<hmac>` (schéma type Stripe)
//   s = HMAC-SHA256("<ts>.<rawBody>", webhook_secret).
//   payload = { id, name:'transaction.approved'|..., data:{ entity:{ id, amount,
//   reference, status } } }.
//
//  Unité : FedaPay manipule le montant en unité entière de la devise (XOF).
//  Conversion centimes ↔ XOF comme CinetPay.
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

@Injectable()
export class FedapayGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.FEDAPAY;
  private readonly logger = new Logger(FedapayGateway.name);

  constructor(private readonly http: HttpService) {}

  private baseUrl(sandbox: boolean): string {
    return sandbox
      ? 'https://sandbox-api.fedapay.com/v1'
      : 'https://api.fedapay.com/v1';
  }

  async initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult> {
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    if (!secretKey) throw new Error('FedaPay: secretKey manquant dans la config');
    const base = this.baseUrl(sandbox);
    const auth = { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' };
    const { firstName, lastName } = splitName(tx.payerName);

    // 1) créer la transaction
    const { data: created } = await firstValueFrom(
      this.http.post<any>(
        `${base}/transactions`,
        {
          description: `SANTAREX ERP — ${tx.reference}`,
          amount: this.toGatewayAmount(tx.amountExpected),
          currency: { iso: tx.currency },
          callback_url: secrets.returnUrl ?? '',
          customer: {
            firstname: firstName,
            lastname: lastName,
            email: tx.payerEmail ?? '',
          },
          // FedaPay n'a pas de champ "reference" client → on trace via metadata.
          custom_metadata: { reference: tx.reference, tenantId: tx.tenantId },
        },
        { headers: { ...auth, 'Content-Type': 'application/json' } },
      ),
    );

    const transactionId: string = String(
      created?.['v1/transaction']?.id ?? created?.transaction?.id ?? created?.id ?? '',
    );
    if (!transactionId) {
      this.logger.error('FedaPay: création transaction invalide', created);
      throw new Error('FedaPay: initialisation échouée (id absent)');
    }

    // 2) générer le token → URL de paiement
    const { data: tokenRes } = await firstValueFrom(
      this.http.post<any>(`${base}/transactions/${transactionId}/token`, {}, { headers: auth }),
    );
    const paymentUrl: string | undefined = tokenRes?.url;
    if (!paymentUrl) {
      this.logger.error('FedaPay: génération token invalide', tokenRes);
      throw new Error('FedaPay: initialisation échouée (url absent)');
    }
    return { gatewayTransactionId: transactionId, paymentUrl };
  }

  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification {
    const raw = rawBodyString(rawBody);
    const header = headerValue(headers, 'x-fedapay-signature');
    const secret = secrets.webhookSecret ?? secrets.webhook_secret;

    const invalid: WebhookVerification = {
      valid: false,
      eventId: '',
      reference: '',
      amount: 0,
      status: 'pending',
    };
    if (!secret || !header) return invalid;

    // Parse `t=<ts>,s=<sig>`
    const parts = Object.fromEntries(
      header.split(',').map((kv) => {
        const [k, v] = kv.split('=');
        return [k?.trim(), v?.trim()];
      }),
    );
    const ts = parts['t'];
    const sig = parts['s'];
    if (!ts || !sig) return invalid;

    const expected = createHmac('sha256', secret).update(`${ts}.${raw}`).digest('hex');
    if (!safeEqualHex(expected, sig)) {
      this.logger.warn('FedaPay webhook: signature invalide');
      return invalid;
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return invalid;
    }

    const entity = payload?.data?.entity ?? payload?.entity ?? {};
    const eventId: string = String(payload?.id ?? entity?.id ?? '');
    const reference: string =
      entity?.custom_metadata?.reference ?? entity?.reference ?? '';
    return {
      valid: true,
      eventId,
      reference,
      amount: this.fromGatewayAmount(Number(entity?.amount ?? 0)),
      status: this.mapStatus(String(payload?.name ?? ''), String(entity?.status ?? '')),
    };
  }

  async verifyStatus(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
    sandbox = true,
  ): Promise<StatusVerification> {
    const secretKey = secrets.secretKey ?? secrets.secret_key;
    const { data } = await firstValueFrom(
      this.http.get<any>(`${this.baseUrl(sandbox)}/transactions/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
      }),
    );
    const entity = data?.['v1/transaction'] ?? data?.transaction ?? data ?? {};
    return {
      status: this.mapStatus('', String(entity?.status ?? '')),
      amount: this.fromGatewayAmount(Number(entity?.amount ?? 0)),
      reference: entity?.custom_metadata?.reference ?? entity?.reference ?? '',
    };
  }

  private mapStatus(name: string, status: string): NormalizedStatus {
    if (name === 'transaction.approved' || status === 'approved' || status === 'transferred') {
      return 'succeeded';
    }
    if (
      name === 'transaction.declined' ||
      name === 'transaction.canceled' ||
      status === 'declined' ||
      status === 'canceled'
    ) {
      return 'failed';
    }
    return 'pending';
  }

  private toGatewayAmount(centimes: number): number {
    return Math.round(centimes / 100);
  }
  private fromGatewayAmount(xof: number): number {
    return Math.round(xof * 100);
  }
}
