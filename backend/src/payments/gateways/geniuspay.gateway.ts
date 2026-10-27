// ════════════════════════════════════════════════════════════════════════════
//  Adaptateur GeniusPay — paiement des licences SANTAREX (Mobile Money, Wave, carte…).
//  Doc : https://geniuspay.ci/docs/api
//
//  Authentification : en-têtes X-API-Key (pk_…) + X-API-Secret (sk_…).
//   L'environnement (sandbox / live) est porté par le PRÉFIXE des clés (pk_sandbox_… / pk_live_…).
//
//  Initiation : POST {base}/payments  { amount (XOF entier, min 200), description, customer, success_url,
//               error_url, metadata:{ reference } }  — sans `payment_method` : GeniusPay renvoie une page de
//               paiement (`checkout_url`) où le client choisit son opérateur. Lien valable 24 h.
//
//  Webhook : en-têtes X-Webhook-Signature + X-Webhook-Timestamp.
//   signature = HMAC-SHA256( timestamp + "." + CORPS_BRUT , whsec_… ) en hexadécimal.
//   Rejeu : rejet si |maintenant − timestamp| > 300 s. La vérification porte sur le corps BRUT.
//   Événements utiles : payment.success → succès ; payment.failed / cancelled / expired → échec.
//
//  Unité de montant : GeniusPay travaille en XOF entiers ; le module modélise les centimes (1 XOF = 100).
//  Seule la devise XOF est acceptée ici (le montant de l'API est exprimé en XOF).
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

const GENIUSPAY_BASE = 'https://geniuspay.ci/api/v1/merchant';
/** Montant minimum accepté par GeniusPay (XOF). */
const MONTANT_MINIMUM_XOF = 200;
/** Fenêtre anti-rejeu du webhook (secondes). */
const FENETRE_REJEU_S = 300;

@Injectable()
export class GeniuspayGateway implements PaymentGatewayAdapter {
  readonly gateway = PaymentGateway.GENIUSPAY;
  private readonly logger = new Logger(GeniuspayGateway.name);

  constructor(private readonly http: HttpService) {}

  /** Lit les clés de la configuration et refuse une incohérence sandbox / production. */
  private cles(secrets: GatewaySecrets, sandbox?: boolean): { apiKey: string; apiSecret: string } {
    const apiKey = secrets.apiKey ?? secrets.api_key;
    const apiSecret = secrets.apiSecret ?? secrets.api_secret;
    if (!apiKey || !apiSecret) {
      throw new Error('GeniusPay: apiKey / apiSecret manquant dans la config');
    }
    if (sandbox !== undefined) {
      const cleSandbox = apiKey.startsWith('pk_sandbox_');
      if (sandbox && !cleSandbox) throw new Error('GeniusPay: config en mode sandbox mais la clé n’est pas une clé de test (pk_sandbox_…)');
      if (!sandbox && cleSandbox) throw new Error('GeniusPay: config en production mais la clé est une clé de test (pk_sandbox_…)');
    }
    return { apiKey, apiSecret };
  }

  private entetes(apiKey: string, apiSecret: string) {
    return { 'X-API-Key': apiKey, 'X-API-Secret': apiSecret, 'Content-Type': 'application/json', Accept: 'application/json' };
  }

  async initiate(tx: PaymentTransaction, secrets: GatewaySecrets, sandbox: boolean): Promise<InitiateResult> {
    const { apiKey, apiSecret } = this.cles(secrets, sandbox);

    if ((tx.currency ?? 'XOF') !== 'XOF') {
      throw new Error('GeniusPay: seule la devise XOF est prise en charge');
    }
    const montantXof = this.versXof(tx.amountExpected);
    if (montantXof < MONTANT_MINIMUM_XOF) {
      throw new Error(`GeniusPay: montant minimum ${MONTANT_MINIMUM_XOF} XOF (reçu ${montantXof})`);
    }

    const retour = secrets.returnUrl ?? secrets.return_url;
    const body: Record<string, unknown> = {
      amount: montantXof,
      currency: 'XOF',
      description: `SANTAREX ERP — ${tx.reference}`.slice(0, 500),
      customer: {
        name: tx.payerName ?? undefined,
        email: tx.payerEmail ?? undefined,
        phone: tx.payerPhone ?? undefined,
      },
      success_url: secrets.successUrl ?? retour ?? undefined,
      error_url: secrets.errorUrl ?? retour ?? undefined,
      metadata: { reference: tx.reference, tenant: tx.tenantSlug },
    };

    const { data } = await firstValueFrom(
      this.http.post<any>(`${GENIUSPAY_BASE}/payments`, body, { headers: this.entetes(apiKey, apiSecret) }),
    );

    const reference: string | undefined = data?.data?.reference;
    const paymentUrl: string | undefined = data?.data?.checkout_url ?? data?.data?.payment_url;
    if (!data?.success || !reference || !paymentUrl) {
      this.logger.error(`GeniusPay: réponse de création invalide (code ${data?.error?.code ?? 'inconnu'})`);
      throw new Error(`GeniusPay: initialisation échouée${data?.error?.message ? ` — ${data.error.message}` : ''}`);
    }
    // Référence GeniusPay (MTX-…) : sert à interroger le statut. Notre référence est dans metadata.
    return { gatewayTransactionId: reference, paymentUrl };
  }

  verifyWebhook(rawBody: Buffer | string, headers: WebhookHeaders, secrets: GatewaySecrets): WebhookVerification {
    const invalide: WebhookVerification = { valid: false, eventId: '', reference: '', amount: 0, status: 'pending' };
    const raw = rawBodyString(rawBody);
    const secret = secrets.webhookSecret ?? secrets.webhook_secret;
    const signature = headerValue(headers, 'x-webhook-signature');
    const horodatage = headerValue(headers, 'x-webhook-timestamp');
    if (!secret || !signature || !horodatage) return invalide;

    // Anti-rejeu.
    const ts = Number(horodatage);
    if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > FENETRE_REJEU_S) {
      this.logger.warn('GeniusPay webhook: horodatage hors fenêtre (rejeu possible)');
      return invalide;
    }

    // Signature sur le corps BRUT.
    const attendue = createHmac('sha256', secret).update(`${horodatage}.${raw}`).digest('hex');
    if (!safeEqualHex(attendue, signature.replace(/^sha256=/i, ''))) {
      this.logger.warn('GeniusPay webhook: signature invalide');
      return invalide;
    }

    let payload: any;
    try {
      payload = JSON.parse(raw);
    } catch {
      return invalide;
    }
    const data = payload?.data ?? {};
    const reference = String(data?.metadata?.reference ?? '');
    const evenement = String(payload?.event ?? '');
    return {
      valid: true,
      // `id` de l'événement fourni par GeniusPay = clé d'idempotence (jamais généré ici).
      eventId: String(payload?.id ?? `${evenement}:${data?.reference ?? ''}`),
      reference,
      amount: this.versCentimes(Number(data?.amount ?? 0)),
      status: this.statutEvenement(evenement),
    };
  }

  async verifyStatus(gatewayTransactionId: string, secrets: GatewaySecrets, sandbox?: boolean): Promise<StatusVerification> {
    const { apiKey, apiSecret } = this.cles(secrets, sandbox);
    const { data } = await firstValueFrom(
      this.http.get<any>(`${GENIUSPAY_BASE}/payments/${encodeURIComponent(gatewayTransactionId)}`, {
        headers: this.entetes(apiKey, apiSecret),
      }),
    );
    const d = data?.data ?? {};
    return {
      status: this.statutApi(String(d?.status ?? '')),
      amount: this.versCentimes(Number(d?.amount ?? 0)),
      reference: String(d?.metadata?.reference ?? gatewayTransactionId),
    };
  }

  private statutEvenement(evenement: string): NormalizedStatus {
    if (evenement === 'payment.success') return 'succeeded';
    if (evenement === 'payment.failed' || evenement === 'payment.cancelled' || evenement === 'payment.expired') return 'failed';
    // payment.initiated, payment.refunded, webhook.test… : aucun effet sur la licence.
    return 'pending';
  }

  private statutApi(statut: string): NormalizedStatus {
    if (statut === 'completed') return 'succeeded';
    if (statut === 'failed' || statut === 'cancelled' || statut === 'expired') return 'failed';
    return 'pending';
  }

  // Centimes internes → XOF entiers GeniusPay.
  private versXof(centimes: number): number {
    return Math.round(centimes / 100);
  }
  // XOF GeniusPay → centimes internes.
  private versCentimes(xof: number): number {
    return Math.round(xof * 100);
  }
}
