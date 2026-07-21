// ════════════════════════════════════════════════════════════════════════════
//  GatewayService — orchestrateur des paiements par passerelle électronique.
//
//  Responsabilités :
//   - initiate()      : lance un paiement via l'adaptateur idoine, persiste
//                       gatewayTransactionId + paymentUrl, passe la tx en PROCESSING.
//   - handleWebhook() : pipeline de sécurité NON NÉGOCIABLE (voir plus bas).
//
//  SÉCURITÉ (handleWebhook) :
//   1. Signature HMAC/RSA vérifiée sur le corps BRUT ; sinon → WebhookEvent INVALID + 401.
//   2. Idempotence stricte : insertion (gateway, eventId) UNIQUE ; doublon → IGNORED + 200.
//   3. Montant reçu == attendu (tolérance ≤ 1 centime) sinon refus (pas d'activation).
//   4. succeeded → tx SUCCEEDED + licenceLifecycle.activateFromTransaction(tx).
//   5. WebhookEvent marqué PROCESSED.
//   → L'activation de licence n'a lieu QU'ICI, jamais sur l'URL de retour client.
// ════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { randomUUID } from 'crypto';

import { PaymentTransaction } from './entities/payment-transaction.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PaymentGateway, PaymentStatus, WebhookStatus } from './payments.enums';

// ── Dépendances IMPORTÉES (fournies par d'autres fichiers du module) ─────────
//  Ces services ne sont PAS réécrits ici (hors périmètre). Ils doivent exister
//  et être exportés par le PaymentsModule :
//   - PaymentConfigService.getForGateway(key) → { config, secrets déchiffrés }
//   - LicenceLifecycleService.activateFromTransaction(tx) → active la licence.
import { PaymentConfigService } from './payments-config.service';
import { LicenceLifecycleService } from './licence-lifecycle.service';

// ── Adaptateurs ──────────────────────────────────────────────────────────────
import { PaymentGatewayAdapter, WebhookHeaders } from './gateways/gateway.interface';
import { MonerooGateway } from './gateways/moneroo.gateway';
import { CinetpayGateway } from './gateways/cinetpay.gateway';
import { PaystackGateway } from './gateways/paystack.gateway';
import { FedapayGateway } from './gateways/fedapay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaypalGateway } from './gateways/paypal.gateway';

/** Tolérance de contrôle du montant (en centimes). */
const AMOUNT_TOLERANCE = 1;

export interface WebhookResult {
  status: WebhookStatus | 'not_found' | 'amount_mismatch';
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly adapters = new Map<PaymentGateway, PaymentGatewayAdapter>();

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
    @InjectRepository(WebhookEvent)
    private readonly webhookRepo: Repository<WebhookEvent>,
    private readonly configService: PaymentConfigService,
    private readonly licenceLifecycle: LicenceLifecycleService,
    moneroo: MonerooGateway,
    cinetpay: CinetpayGateway,
    paystack: PaystackGateway,
    fedapay: FedapayGateway,
    stripe: StripeGateway,
    paypal: PaypalGateway,
  ) {
    for (const a of [moneroo, cinetpay, paystack, fedapay, stripe, paypal]) {
      this.adapters.set(a.gateway, a);
    }
  }

  private getAdapter(gateway: PaymentGateway): PaymentGatewayAdapter {
    const adapter = this.adapters.get(gateway);
    if (!adapter) {
      throw new BadRequestException(`Passerelle non supportée : ${gateway}`);
    }
    return adapter;
  }

  // ─── Initiation ────────────────────────────────────────────────────────────

  async initiate(tx: PaymentTransaction): Promise<PaymentTransaction> {
    // La config (et donc la passerelle + secrets) provient de la base, jamais du code.
    const { config, secrets } = await this.configService.getForGateway(tx.methodKey);
    if (!config?.gateway) {
      throw new BadRequestException(
        `Config "${tx.methodKey}" sans passerelle électronique associée`,
      );
    }
    const adapter = this.getAdapter(config.gateway);

    const result = await adapter.initiate(tx, secrets, config.sandbox);

    tx.gatewayTransactionId = result.gatewayTransactionId;
    tx.paymentUrl = result.paymentUrl;
    tx.status = PaymentStatus.PROCESSING;
    tx.metadata = { ...(tx.metadata ?? {}), gateway: config.gateway };

    return this.txRepo.save(tx);
  }

  // ─── Webhook (pipeline sécurisé) ─────────────────────────────────────────────

  async handleWebhook(
    gateway: PaymentGateway,
    rawBody: Buffer | string,
    headers: WebhookHeaders,
  ): Promise<WebhookResult> {
    const adapter = this.getAdapter(gateway);

    // Secrets + environnement (sandbox) déchiffrés depuis la base.
    // Convention de clé des configs passerelle : `gateway.<name>` (cf. seedDefaults).
    const { config, secrets } = await this.configService.getForGateway(`gateway.${gateway}`);

    // 1) VÉRIFICATION DE SIGNATURE (sur le corps BRUT).
    const verification = adapter.verifyWebhook(rawBody, headers, secrets);
    if (!verification.valid) {
      // Trace la tentative invalide (eventId synthétique pour éviter la collision
      // sur la contrainte UNIQUE lorsque l'eventId n'a pas pu être extrait).
      await this.safeRecordInvalid(gateway, rawBody);
      throw new UnauthorizedException('Signature de webhook invalide');
    }

    const eventId = verification.eventId || randomUUID();

    // 2) IDEMPOTENCE : insertion (gateway, eventId) UNIQUE.
    let eventRow: WebhookEvent;
    try {
      eventRow = await this.webhookRepo.save(
        this.webhookRepo.create({
          gateway,
          eventId,
          status: WebhookStatus.RECEIVED,
          signatureValid: true,
          transactionReference: verification.reference,
          payload: this.parsePayload(rawBody),
        }),
      );
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        // Doublon → NE PAS réactiver. 200 idempotent.
        this.logger.log(`Webhook ${gateway}/${eventId} déjà traité → IGNORED`);
        return { status: WebhookStatus.IGNORED };
      }
      throw e;
    }

    // Transaction ciblée par la référence.
    const tx = await this.txRepo.findOne({ where: { reference: verification.reference } });
    if (!tx) {
      await this.markEvent(eventRow, WebhookStatus.IGNORED);
      this.logger.warn(`Webhook ${gateway}: transaction "${verification.reference}" introuvable`);
      return { status: 'not_found' };
    }

    // Résolution du statut : certaines passerelles (ex. CinetPay) ne portent pas
    // de statut final fiable dans le notify → confirmation server-to-server.
    let status = verification.status;
    let amount = verification.amount;
    if (status === 'pending' && adapter.verifyStatus) {
      const gwTxId = tx.gatewayTransactionId ?? verification.reference;
      const confirmed = await adapter.verifyStatus(gwTxId, secrets, config.sandbox);
      status = confirmed.status;
      if (confirmed.amount > 0) amount = confirmed.amount;
    }

    // 3) CONTRÔLE DU MONTANT (tolérance ≤ 1 centime).
    if (Math.abs(amount - tx.amountExpected) > AMOUNT_TOLERANCE) {
      this.logger.error(
        `Webhook ${gateway}: montant ${amount} ≠ attendu ${tx.amountExpected} (réf ${tx.reference}) → refus`,
      );
      await this.markEvent(eventRow, WebhookStatus.IGNORED);
      return { status: 'amount_mismatch' };
    }

    // 4) APPLICATION DU STATUT + activation licence UNIQUEMENT si succès.
    if (status === 'succeeded') {
      tx.status = PaymentStatus.SUCCEEDED;
      tx.amountReceived = amount;
      await this.txRepo.save(tx);
      await this.licenceLifecycle.activateFromTransaction(tx);
      this.logger.log(`Paiement ${tx.reference} confirmé (${gateway}) → licence activée`);
    } else if (status === 'failed') {
      tx.status = PaymentStatus.FAILED;
      tx.amountReceived = amount || null;
      await this.txRepo.save(tx);
    }
    // status 'pending' résiduel : on ne touche pas la tx (reste PROCESSING).

    // 5) Event PROCESSED.
    await this.markEvent(eventRow, WebhookStatus.PROCESSED);
    return { status: WebhookStatus.PROCESSED };
  }

  // ─── Helpers internes ────────────────────────────────────────────────────────

  private async markEvent(row: WebhookEvent, status: WebhookStatus): Promise<void> {
    row.status = status;
    row.processedAt = new Date();
    await this.webhookRepo.save(row);
  }

  private async safeRecordInvalid(
    gateway: PaymentGateway,
    rawBody: Buffer | string,
  ): Promise<void> {
    try {
      await this.webhookRepo.save(
        this.webhookRepo.create({
          gateway,
          eventId: `invalid-${randomUUID()}`,
          status: WebhookStatus.INVALID,
          signatureValid: false,
          payload: this.parsePayload(rawBody),
          processedAt: new Date(),
        }),
      );
    } catch (e) {
      // Ne jamais faire échouer la réponse 401 à cause du journal.
      this.logger.error(`Impossible de journaliser un webhook invalide (${gateway})`, e as Error);
    }
  }

  private parsePayload(rawBody: Buffer | string): Record<string, unknown> {
    const raw = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : { raw };
    } catch {
      // Corps form-urlencoded (ex. CinetPay) : on stocke tel quel.
      return { raw };
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    // Postgres : code 23505 (unique_violation).
    const err = e as QueryFailedError & { code?: string; driverError?: { code?: string } };
    const code = err?.driverError?.code ?? err?.code;
    return e instanceof QueryFailedError && code === '23505';
  }
}
