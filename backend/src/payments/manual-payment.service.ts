import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { PaymentMethodConfig } from './entities/payment-method-config.entity';
import { PaymentStatus } from './payments.enums';
import { CreateTransactionDto } from './dto/client.dto';
import { ProofStorageService, UploadedProofFile } from './proof-storage.service';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { LicenceLifecycleService } from './licence-lifecycle.service';
import { MailService } from '../mail/mail.service';

/** Contexte du tenant/utilisateur appelant (dérivé de req.user). */
export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
  userId?: string;
}

/** Statuts terminaux : plus aucune action client/preuve n'est acceptée. */
const TERMINAL_STATUSES: PaymentStatus[] = [
  PaymentStatus.SUCCEEDED,
  PaymentStatus.REJECTED,
  PaymentStatus.REFUNDED,
  PaymentStatus.EXPIRED,
];

/**
 * Orchestration du flux de paiement MANUEL (preuve + validation admin).
 * SÉCURITÉ : la licence n'est JAMAIS activée sur simple retour client ;
 * l'activation n'a lieu que dans `adminValidate`.
 */
@Injectable()
export class ManualPaymentService {
  private readonly logger = new Logger(ManualPaymentService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentProof)
    private readonly proofRepo: Repository<PaymentProof>,
    @InjectRepository(PaymentMethodConfig)
    private readonly methodRepo: Repository<PaymentMethodConfig>,
    private readonly offres: OffresSaasService,
    private readonly proofStorage: ProofStorageService,
    private readonly licenceLifecycle: LicenceLifecycleService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Tolérance de rapprochement de montant (plus petite unité). Défaut : 1. */
  private get amountTolerance(): number {
    const v = Number(this.config.get('PAYMENT_AMOUNT_TOLERANCE'));
    return Number.isFinite(v) && v >= 0 ? v : 1;
  }

  /** Durée de validité d'une commande non payée (heures). Défaut : 48h. */
  private get expiryHours(): number {
    const v = Number(this.config.get('PAYMENT_TRANSACTION_EXPIRY_HOURS'));
    return Number.isFinite(v) && v > 0 ? v : 48;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Création
  // ─────────────────────────────────────────────────────────────────────────

  async createTransaction(
    dto: CreateTransactionDto,
    tenant: TenantContext,
  ): Promise<PaymentTransaction> {
    if (!tenant?.tenantId) {
      throw new BadRequestException('Contexte tenant manquant.');
    }

    // Résolution du moyen de paiement (type + activation).
    const method = await this.methodRepo.findOne({ where: { key: dto.methodKey } });
    if (!method || !method.enabled) {
      throw new BadRequestException(`Moyen de paiement "${dto.methodKey}" indisponible.`);
    }

    // Montant attendu depuis l'offre. `prix` est en FCFA entiers ; la table
    // pay_transactions raisonne en plus petite unité (centimes) → ×100.
    const offre = await this.offres.findByCode(dto.offerCode);
    const amountExpected = Math.round(offre.prix * 100);
    if (amountExpected <= 0) {
      throw new BadRequestException("Le montant de l'offre est invalide.");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.expiryHours * 3_600_000);

    const tx = this.txRepo.create({
      reference: await this.generateReference(now),
      tenantId: tenant.tenantId,
      tenantSlug: tenant.tenantSlug || tenant.tenantId,
      offreCode: offre.code,
      methodType: method.type,
      methodKey: method.key,
      status: PaymentStatus.AWAITING_PROOF,
      amountExpected,
      amountReceived: null,
      currency: 'XOF',
      payerName: dto.payer?.name ?? null,
      payerEmail: dto.payer?.email ?? null,
      payerPhone: dto.payer?.phone ?? null,
      expiresAt,
      metadata: {},
    });

    const saved = await this.persistWithUniqueReference(tx, now);
    this.logger.log(
      `Transaction créée ${saved.reference} tenant=${tenant.tenantId} offre=${offre.code} montant=${amountExpected}`,
    );
    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Preuves & références client
  // ─────────────────────────────────────────────────────────────────────────

  async submitProof(
    txRef: string,
    file: UploadedProofFile,
    uploaderId?: string,
  ): Promise<PaymentTransaction> {
    const tx = await this.getActiveTransaction(txRef);

    if (!file) {
      throw new BadRequestException('Aucun fichier de preuve fourni.');
    }

    // Déduplication par SHA256 AVANT écriture disque : une preuve déjà connue
    // (même sur une autre transaction) est refusée.
    const sha256 = this.proofStorage.computeSha256(file.buffer);
    const duplicate = await this.proofRepo.findOne({ where: { sha256 } });
    if (duplicate) {
      throw new ConflictException('Cette preuve a déjà été soumise (empreinte identique).');
    }

    const stored = await this.proofStorage.store(file, tx.tenantId);

    // Garde-fou anti-course : re-vérifie après stockage.
    const dupAfter = await this.proofRepo.findOne({ where: { sha256: stored.sha256 } });
    if (dupAfter) {
      throw new ConflictException('Cette preuve a déjà été soumise (empreinte identique).');
    }

    const proof = this.proofRepo.create({
      transactionId: tx.id,
      storagePath: stored.storagePath,
      originalName: stored.originalName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      sha256: stored.sha256,
      uploadedById: uploaderId,
    });
    await this.proofRepo.save(proof);

    tx.status = PaymentStatus.UNDER_REVIEW;
    const saved = await this.txRepo.save(tx);
    this.logger.log(`Preuve soumise pour ${tx.reference} → UNDER_REVIEW`);
    return saved;
  }

  async submitReference(txRef: string, clientReference: string): Promise<PaymentTransaction> {
    const tx = await this.getActiveTransaction(txRef);
    const ref = (clientReference || '').trim();
    if (!ref) {
      throw new BadRequestException('Référence client vide.');
    }
    tx.clientReference = ref;
    tx.status = PaymentStatus.UNDER_REVIEW;
    const saved = await this.txRepo.save(tx);
    this.logger.log(`Référence client enregistrée pour ${tx.reference} → UNDER_REVIEW`);
    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Décisions admin
  // ─────────────────────────────────────────────────────────────────────────

  async adminValidate(
    txRef: string,
    adminId: string,
    notes?: string,
  ): Promise<PaymentTransaction> {
    const tx = await this.findByRef(txRef);

    if (tx.status === PaymentStatus.SUCCEEDED) {
      throw new ConflictException('Transaction déjà validée.');
    }
    if (TERMINAL_STATUSES.includes(tx.status)) {
      throw new BadRequestException(`Transaction non validable (statut ${tx.status}).`);
    }
    if (tx.status !== PaymentStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        "Aucune preuve/référence en attente de revue pour cette transaction.",
      );
    }

    // Contrôle du montant : le reçu doit correspondre à l'attendu (tolérance ≤ 1).
    // En flux manuel, l'admin confirme le montant → si non renseigné, on aligne
    // le reçu sur l'attendu ; s'il l'est déjà, on vérifie l'écart.
    if (tx.amountReceived == null) {
      tx.amountReceived = tx.amountExpected;
    } else if (Math.abs(tx.amountReceived - tx.amountExpected) > this.amountTolerance) {
      throw new BadRequestException(
        `Montant reçu (${tx.amountReceived}) différent de l'attendu (${tx.amountExpected}).`,
      );
    }

    tx.status = PaymentStatus.SUCCEEDED;
    tx.reviewedById = adminId;
    tx.reviewedAt = new Date();
    tx.reviewNotes = notes ?? null;
    await this.txRepo.save(tx);

    // Activation licence — UNIQUEMENT ici, jamais sur retour client.
    const licence = await this.licenceLifecycle.activateFromTransaction(tx);
    if (licence?.id) {
      tx.licenceId = licence.id;
      await this.txRepo.save(tx);
    }

    this.logger.log(
      `Transaction ${tx.reference} VALIDÉE par admin=${adminId} → licence activée (${licence?.id ?? 'n/a'})`,
    );

    // Reçu de paiement — envoyé UNE seule fois (adminValidate refuse une tx déjà
    // SUCCEEDED), best-effort, ne bloque jamais la validation.
    if (tx.payerEmail) {
      this.sendReceipt(tx).catch((err) =>
        this.logger.error(`Email reçu paiement ${tx.reference} échoué: ${err.message}`),
      );
    }

    return tx;
  }

  /** Envoi (best-effort) du reçu de paiement au payeur après validation admin. */
  private async sendReceipt(tx: PaymentTransaction): Promise<void> {
    let offreNom = tx.offreCode;
    try {
      const offre = await this.offres.findByCode(tx.offreCode);
      offreNom = offre?.nom ?? tx.offreCode;
    } catch {
      // offre introuvable → on garde le code comme libellé.
    }

    const prenom = (tx.payerName ?? '').trim().split(/\s+/)[0] || 'Cher client';
    const montantFcfa = Math.round((tx.amountReceived ?? tx.amountExpected ?? 0) / 100);

    await this.mailService.envoyerPaiementRecu({
      to: tx.payerEmail as string,
      prenom,
      nomEtablissement: tx.tenantSlug || tx.tenantId,
      refTransaction: tx.reference,
      datePaiement: (tx.reviewedAt ?? new Date()).toLocaleDateString('fr-FR'),
      montant: montantFcfa,
      modePaiement: tx.methodType,
      offreNom,
      delaiActivation: 'quelques minutes',
    });
  }

  async adminReject(txRef: string, adminId: string, reason: string): Promise<PaymentTransaction> {
    const tx = await this.findByRef(txRef);
    if (TERMINAL_STATUSES.includes(tx.status)) {
      throw new BadRequestException(`Transaction non rejetable (statut ${tx.status}).`);
    }
    const motif = (reason || '').trim();
    if (!motif) {
      throw new BadRequestException('Motif de rejet requis.');
    }
    tx.status = PaymentStatus.REJECTED;
    tx.reviewedById = adminId;
    tx.reviewedAt = new Date();
    tx.reviewNotes = motif;
    const saved = await this.txRepo.save(tx);
    this.logger.warn(`Transaction ${tx.reference} REJETÉE par admin=${adminId} : ${motif}`);
    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Consultations
  // ─────────────────────────────────────────────────────────────────────────

  listForReview(): Promise<PaymentTransaction[]> {
    return this.txRepo.find({
      where: { status: PaymentStatus.UNDER_REVIEW },
      order: { createdAt: 'ASC' },
    });
  }

  listByTenant(tenantId: string): Promise<PaymentTransaction[]> {
    return this.txRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers internes
  // ─────────────────────────────────────────────────────────────────────────

  private async findByRef(txRef: string): Promise<PaymentTransaction> {
    const tx = await this.txRepo.findOne({ where: { reference: txRef } });
    if (!tx) throw new NotFoundException(`Transaction "${txRef}" introuvable.`);
    return tx;
  }

  /** Charge une transaction et vérifie qu'elle accepte encore une action client. */
  private async getActiveTransaction(txRef: string): Promise<PaymentTransaction> {
    const tx = await this.findByRef(txRef);

    if (TERMINAL_STATUSES.includes(tx.status)) {
      throw new ConflictException(`Transaction clôturée (statut ${tx.status}).`);
    }
    if (tx.expiresAt && tx.expiresAt.getTime() < Date.now()) {
      tx.status = PaymentStatus.EXPIRED;
      await this.txRepo.save(tx);
      throw new BadRequestException('Cette commande de paiement a expiré.');
    }
    return tx;
  }

  /** Génère une référence PAY-AAAA-NNNNNN séquentielle sur l'année. */
  private async generateReference(now: Date): Promise<string> {
    const year = now.getFullYear();
    const prefix = `PAY-${year}-`;
    const count = await this.txRepo
      .createQueryBuilder('t')
      .where('t.reference LIKE :p', { p: `${prefix}%` })
      .getCount();
    const seq = String(count + 1).padStart(6, '0');
    return `${prefix}${seq}`;
  }

  /** Sauvegarde avec régénération de la référence en cas de collision unique. */
  private async persistWithUniqueReference(
    tx: PaymentTransaction,
    now: Date,
  ): Promise<PaymentTransaction> {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.txRepo.save(tx);
      } catch (err: any) {
        const msg = String(err?.message || err);
        const isUnique =
          err?.code === '23505' || /unique|duplicate/i.test(msg);
        if (!isUnique) throw err;
        tx.reference = await this.generateReference(now);
      }
    }
    throw new ConflictException('Impossible de générer une référence de transaction unique.');
  }
}
