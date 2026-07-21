// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Cycle de vie des licences (module paiement SaaS).
//
//  Ce service orchestre la création / le renouvellement / l'octroi des licences
//  à partir des différentes sources de paiement (transaction passerelle ou
//  manuelle validée, voucher prépayé, essai gratuit, octroi provisoire admin).
//
//  Il RÉUTILISE l'entité `Licence` existante (colonne Postgres `statut` de type
//  enum `LicenceStatut`) SANS altérer cet enum. Le cycle de vie étendu
//  (`LicenceLifecycle` : TRIAL, AWAITING_PAYMENT, PROVISIONAL, ACTIVE, GRACE,
//  EXPIRED, SUSPENDED, REVOKED) est persisté dans la colonne texte `notes` via
//  un bloc machine encadré par des marqueurs `<<<LLC … LLC>>>`. Le texte humain
//  éventuel de `notes` est préservé. Voir `readState` / `writeState`.
//
//  Ce fichier NE modifie NI `licences.service.ts` NI `payments.module.ts` :
//  il est simplement provisionné et câblé par l'agent d'intégration.
// ════════════════════════════════════════════════════════════════════════════

import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

import {
  Licence,
  LicenceStatut,
  LicenceModePaiement,
} from '../licences/entities/licence.entity';
import { OffreSaas, OffreCycle } from '../offres-saas/entities/offre-saas.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { TenantsService } from '../tenants/tenants.service';
import { MailService } from '../mail/mail.service';
import {
  NotificationsService,
} from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationCategorie,
} from '../notifications/entities/notification.entity';

import { PaymentTransaction } from './entities/payment-transaction.entity';
import { Voucher } from './entities/voucher.entity';
import { LicenceLifecycle, PaymentStatus } from './payments.enums';

// ── État étendu persisté dans `Licence.notes` ────────────────────────────────
interface LifecycleState {
  /** État courant du cycle de vie étendu. */
  lc: LicenceLifecycle;
  /** Date de fin RÉELLE payée (base du renouvellement anticipé), ISO. */
  paidThrough: string | null;
  /** Fin de la période de grâce, ISO (défini uniquement en GRACE). */
  graceEndsAt: string | null;
  /** Fin de la période provisoire, ISO (défini uniquement en PROVISIONAL). */
  provisionalUntil: string | null;
  /** Essai gratuit déjà consommé par ce tenant. */
  trialConsumed: boolean;
  /** Références (tx / vouchers) déjà appliquées → idempotence des activations. */
  processedRefs: string[];
  /** Rappels d'expiration déjà envoyés pour le cycle courant : {7|3|1: ISO}. */
  reminders: Record<string, string>;
}

const LLC_START = '<<<LLC';
const LLC_END = 'LLC>>>';
const LLC_RE = /<<<LLC([\s\S]*?)LLC>>>/;

@Injectable()
export class LicenceLifecycleService {
  private readonly logger = new Logger(LicenceLifecycleService.name);

  // Durées configurables (env) — défauts métier 14j / 7j / 48h / 14j.
  private readonly trialDays: number;
  private readonly graceDays: number;
  private readonly orderExpiryHours: number;
  private readonly provisionalMaxDays: number;
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepo: Repository<Licence>,
    private readonly offresSaasService: OffresSaasService,
    private readonly tenantsService: TenantsService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {
    this.trialDays = this.numEnv('LICENCE_TRIAL_DAYS', 14);
    this.graceDays = this.numEnv('LICENCE_GRACE_DAYS', 7);
    this.orderExpiryHours = this.numEnv('PAYMENT_ORDER_EXPIRY_HOURS', 48);
    this.provisionalMaxDays = this.numEnv('LICENCE_PROVISIONAL_MAX_DAYS', 14);
    this.frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'https://app.santarex.ci',
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  API PUBLIQUE
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Active (ou renouvelle) une licence à partir d'une transaction SUCCEEDED.
   * Renouvellement anticipé : si la licence est encore active/essai/grâce, la
   * nouvelle échéance est calculée DEPUIS la date de fin actuelle (paidThrough),
   * pas depuis aujourd'hui. Sinon, on repart d'aujourd'hui.
   * Idempotent : une même `tx.reference` n'est jamais appliquée deux fois.
   */
  async activateFromTransaction(tx: PaymentTransaction): Promise<Licence> {
    if (tx.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException(
        `Transaction ${tx.reference} non confirmée (statut ${tx.status}).`,
      );
    }
    if (!tx.tenantSlug || !tx.offreCode) {
      throw new BadRequestException(
        `Transaction ${tx.reference} sans tenantSlug/offreCode : activation impossible.`,
      );
    }

    const offre = await this.offresSaasService.findByCode(tx.offreCode);
    const months = this.monthsForCycle(offre.cycle);
    const amount = tx.amountReceived ?? tx.amountExpected ?? 0;

    return this.applyGrant({
      tenantSlug: tx.tenantSlug,
      offre,
      ref: tx.reference,
      amount,
      addMonths: months,
      modePaiement: LicenceModePaiement.CINETPAY,
      mailContext: 'renew',
    });
  }

  /**
   * Octroie / renouvelle une licence à partir d'un voucher prépayé.
   * La durée provient de `voucher.durationDays`. Idempotent via `voucher.code`.
   */
  async grantFromVoucher(voucher: Voucher, tenant: Tenant | string): Promise<Licence> {
    const tenantSlug = typeof tenant === 'string' ? tenant : tenant.slug;
    const offerCode = voucher.offerCode;
    if (!offerCode) {
      throw new BadRequestException(
        `Voucher ${voucher.code} sans offre associée : activation impossible.`,
      );
    }
    if (!voucher.durationDays || voucher.durationDays <= 0) {
      throw new BadRequestException(
        `Voucher ${voucher.code} sans durée valide (durationDays).`,
      );
    }

    const offre = await this.offresSaasService.findByCode(offerCode);
    return this.applyGrant({
      tenantSlug,
      offre,
      ref: `VOUCHER:${voucher.code}`,
      amount: voucher.value ?? 0,
      addDays: voucher.durationDays,
      modePaiement: LicenceModePaiement.MANUEL,
      mailContext: 'renew',
    });
  }

  /**
   * Démarre un essai gratuit. Un seul essai autorisé par tenant : refuse si le
   * tenant a déjà consommé un essai (ou possède/possédait une licence d'essai).
   */
  async startTrial(tenant: Tenant | string, offreCode: string): Promise<Licence> {
    const tenantSlug = typeof tenant === 'string' ? tenant : tenant.slug;
    await this.tenantsService.findBySlug(tenantSlug); // valide l'existence

    if (await this.hasHadTrial(tenantSlug)) {
      throw new ConflictException(
        `Le tenant "${tenantSlug}" a déjà bénéficié d'un essai gratuit.`,
      );
    }

    const offre = await this.offresSaasService.findByCode(offreCode);
    const now = new Date();
    const expiration = this.addDays(now, this.trialDays);

    const state = this.defaultState();
    state.lc = LicenceLifecycle.TRIAL;
    state.paidThrough = expiration.toISOString();
    state.trialConsumed = true;

    const licence = this.licenceRepo.create({
      cle: this.generateCle(),
      tenantSlug,
      offreId: offre.id,
      offreCode: offre.code,
      statut: LicenceStatut.ESSAI,
      dateDebut: now,
      dateExpiration: expiration,
      maxUtilisateurs: offre.maxUtilisateurs,
      montantPaye: 0,
      modePaiement: LicenceModePaiement.GRATUIT,
      joursEssai: this.trialDays,
      modulesActivesJson: offre.modulesInclus,
    });
    this.writeState(licence, state);

    const saved = await this.licenceRepo.save(licence);
    this.logger.log(
      `Essai démarré pour ${tenantSlug} (${this.trialDays}j) → ${saved.cle}`,
    );
    await this.notifyTrialStarted(saved, offre).catch((e) =>
      this.logger.error(`Notif essai ${tenantSlug} échouée: ${e.message}`),
    );
    return saved;
  }

  /**
   * Octroie une licence PROVISIONAL (accès accordé manuellement par un admin,
   * plafonné à `provisionalMaxDays`, défaut 14j).
   */
  async grantProvisional(
    tenantSlug: string,
    offreCode: string,
    adminId: string,
    jours = this.provisionalMaxDays,
  ): Promise<Licence> {
    await this.tenantsService.findBySlug(tenantSlug);
    const capped = Math.min(Math.max(1, Math.floor(jours)), this.provisionalMaxDays);
    if (jours > this.provisionalMaxDays) {
      this.logger.warn(
        `grantProvisional: ${jours}j demandés > max ${this.provisionalMaxDays}j — plafonné.`,
      );
    }

    const offre = await this.offresSaasService.findByCode(offreCode);
    const now = new Date();
    const until = this.addDays(now, capped);

    const licence =
      (await this.findLicence(tenantSlug, offre.code)) ??
      this.licenceRepo.create({
        cle: this.generateCle(),
        tenantSlug,
        offreId: offre.id,
        offreCode: offre.code,
        dateDebut: now,
        maxUtilisateurs: offre.maxUtilisateurs,
        montantPaye: 0,
        joursEssai: 0,
        modulesActivesJson: offre.modulesInclus,
      });

    const state = this.readState(licence);
    state.lc = LicenceLifecycle.PROVISIONAL;
    state.provisionalUntil = until.toISOString();
    state.graceEndsAt = null;
    state.reminders = {};

    licence.offreId = offre.id;
    licence.offreCode = offre.code;
    licence.statut = LicenceStatut.ACTIVE; // provisoire = accès accordé
    licence.dateExpiration = until;
    licence.modePaiement = LicenceModePaiement.MANUEL;
    licence.activeParId = adminId;
    this.writeState(licence, state);

    const saved = await this.licenceRepo.save(licence);
    this.logger.log(
      `Licence PROVISOIRE ${capped}j pour ${tenantSlug} par admin ${adminId} → ${saved.cle}`,
    );
    return saved;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  TRANSITIONS (appelées par le scheduler)
  // ══════════════════════════════════════════════════════════════════════════

  /** ACTIVE → GRACE : conserve l'accès pendant la période de grâce. */
  async transitionToGrace(licence: Licence): Promise<Licence> {
    const state = this.readState(licence);
    if (state.lc === LicenceLifecycle.GRACE) return licence; // idempotent

    const trueEnd = licence.dateExpiration ?? new Date();
    const graceEnd = this.addDays(trueEnd, this.graceDays);

    state.lc = LicenceLifecycle.GRACE;
    state.paidThrough = trueEnd.toISOString();
    state.graceEndsAt = graceEnd.toISOString();

    // On étend `dateExpiration` jusqu'à la fin de grâce pour que la logique
    // existante (findActive: dateExpiration > now) continue d'autoriser l'accès.
    licence.dateExpiration = graceEnd;
    licence.statut = LicenceStatut.ACTIVE;
    this.writeState(licence, state);

    const saved = await this.licenceRepo.save(licence);
    this.logger.log(
      `Licence ${licence.cle} (${licence.tenantSlug}) → GRÂCE jusqu'au ${graceEnd.toISOString()}`,
    );
    await this.notifyExpiring(saved, 0, 'grace').catch(() => undefined);
    return saved;
  }

  /**
   * Expire une licence et coupe l'accès (EXPIRED → SUSPENDED).
   * Utilisé en fin de grâce et en fin de période provisoire.
   */
  async expireAndSuspend(licence: Licence, reason: string): Promise<Licence> {
    const state = this.readState(licence);
    if (state.lc === LicenceLifecycle.SUSPENDED) return licence; // idempotent

    state.lc = LicenceLifecycle.SUSPENDED; // état final (passe par EXPIRED)
    state.graceEndsAt = null;
    state.provisionalUntil = null;
    licence.statut = LicenceStatut.SUSPENDUE;
    this.writeState(licence, state);

    const saved = await this.licenceRepo.save(licence);
    this.logger.log(
      `Licence ${licence.cle} (${licence.tenantSlug}) EXPIRÉE puis SUSPENDUE — ${reason}`,
    );
    await this.notifyExpired(saved, reason).catch((e) =>
      this.logger.error(`Notif expiration ${licence.tenantSlug} échouée: ${e.message}`),
    );
    return saved;
  }

  /**
   * Envoie (au plus une fois par palier et par cycle) le rappel d'expiration
   * J-7 / J-3 / J-1. Idempotent grâce à `state.reminders`.
   */
  async maybeSendReminder(licence: Licence): Promise<void> {
    const state = this.readState(licence);
    if (
      state.lc !== LicenceLifecycle.ACTIVE &&
      state.lc !== LicenceLifecycle.TRIAL &&
      state.lc !== LicenceLifecycle.PROVISIONAL
    ) {
      return;
    }
    if (!licence.dateExpiration) return;

    const days = this.daysUntil(licence.dateExpiration);
    const mark = [7, 3, 1].find((m) => m === days);
    if (!mark) return;
    if (state.reminders[String(mark)]) return; // déjà envoyé pour ce palier

    await this.notifyExpiring(licence, mark, 'reminder');
    state.reminders[String(mark)] = new Date().toISOString();
    this.writeState(licence, state);
    await this.licenceRepo.save(licence);
  }

  // Accès en lecture au cycle de vie étendu (utile au scheduler / API).
  getLifecycle(licence: Licence): LifecycleState {
    return this.readState(licence);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CŒUR : octroi / renouvellement mutualisé
  // ══════════════════════════════════════════════════════════════════════════

  private async applyGrant(opts: {
    tenantSlug: string;
    offre: OffreSaas;
    ref: string;
    amount: number;
    addMonths?: number;
    addDays?: number;
    modePaiement: LicenceModePaiement;
    mailContext: 'activate' | 'renew';
  }): Promise<Licence> {
    const { tenantSlug, offre, ref, amount } = opts;
    await this.tenantsService.findBySlug(tenantSlug);

    let licence = await this.findLicence(tenantSlug, offre.code);
    const now = new Date();

    // ── Idempotence : cette référence a-t-elle déjà été appliquée ? ──────────
    if (licence) {
      const existing = this.readState(licence);
      if (existing.processedRefs.includes(ref)) {
        this.logger.warn(
          `Activation ignorée (déjà traitée) réf=${ref} tenant=${tenantSlug}`,
        );
        return licence;
      }
    }

    const isNew = !licence;
    if (!licence) {
      licence = this.licenceRepo.create({
        cle: this.generateCle(),
        tenantSlug,
        offreId: offre.id,
        offreCode: offre.code,
        dateDebut: now,
        maxUtilisateurs: offre.maxUtilisateurs,
        montantPaye: 0,
        joursEssai: 0,
        modulesActivesJson: offre.modulesInclus,
      });
    }

    const state = this.readState(licence);

    // ── Base du calcul : renouvellement anticipé DEPUIS la date de fin actuelle
    //    si la licence est encore active/essai/grâce/provisoire ; sinon aujourd'hui.
    const stillValid = [
      LicenceLifecycle.ACTIVE,
      LicenceLifecycle.TRIAL,
      LicenceLifecycle.GRACE,
      LicenceLifecycle.PROVISIONAL,
    ].includes(state.lc);
    const currentEnd = state.paidThrough
      ? new Date(state.paidThrough)
      : licence.dateExpiration ?? now;

    let base = stillValid && !isNew ? currentEnd : now;
    let newEnd =
      opts.addDays != null
        ? this.addDays(base, opts.addDays)
        : this.addMonths(base, opts.addMonths ?? 1);

    // Garde-fou : un renouvellement ne doit jamais aboutir dans le passé.
    if (newEnd.getTime() <= now.getTime()) {
      base = now;
      newEnd =
        opts.addDays != null
          ? this.addDays(now, opts.addDays)
          : this.addMonths(now, opts.addMonths ?? 1);
    }

    // ── Mise à jour de l'état ────────────────────────────────────────────────
    state.lc = LicenceLifecycle.ACTIVE;
    state.paidThrough = newEnd.toISOString();
    state.graceEndsAt = null;
    state.provisionalUntil = null;
    state.reminders = {}; // nouveau cycle → on ré-arme les rappels
    if (!state.processedRefs.includes(ref)) state.processedRefs.push(ref);

    licence.offreId = offre.id;
    licence.offreCode = offre.code;
    licence.statut = LicenceStatut.ACTIVE;
    licence.dateExpiration = newEnd;
    licence.dateDernierRenouvellement = now;
    licence.montantPaye = (licence.montantPaye ?? 0) + amount;
    licence.modePaiement = opts.modePaiement;
    licence.refTransaction = ref;
    licence.maxUtilisateurs = offre.maxUtilisateurs;
    this.writeState(licence, state);

    const saved = await this.licenceRepo.save(licence);
    this.logger.log(
      `Licence ${saved.cle} ${isNew ? 'ACTIVÉE' : 'RENOUVELÉE'} pour ${tenantSlug} ` +
        `→ ${newEnd.toISOString()} (base=${base.toISOString()}, réf=${ref})`,
    );
    await this.notifyActivated(saved, offre, isNew).catch((e) =>
      this.logger.error(`Notif activation ${tenantSlug} échouée: ${e.message}`),
    );
    return saved;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MAPPING LicenceLifecycle ↔ LicenceStatut (enum Postgres existant)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Projette le cycle de vie étendu sur l'enum `LicenceStatut` existant, sans
   * jamais altérer cet enum côté base. La valeur fine reste dans `notes`.
   */
  mapLifecycleToStatut(lc: LicenceLifecycle): LicenceStatut {
    switch (lc) {
      case LicenceLifecycle.TRIAL:
        return LicenceStatut.ESSAI;
      case LicenceLifecycle.ACTIVE:
      case LicenceLifecycle.PROVISIONAL: // accès accordé
      case LicenceLifecycle.GRACE: // accès maintenu pendant la grâce
        return LicenceStatut.ACTIVE;
      case LicenceLifecycle.EXPIRED:
        return LicenceStatut.EXPIREE;
      case LicenceLifecycle.AWAITING_PAYMENT:
      case LicenceLifecycle.SUSPENDED:
        return LicenceStatut.SUSPENDUE;
      case LicenceLifecycle.REVOKED:
        return LicenceStatut.ANNULEE;
      default:
        return LicenceStatut.SUSPENDUE;
    }
  }

  private inferLifecycleFromStatut(statut: LicenceStatut): LicenceLifecycle {
    switch (statut) {
      case LicenceStatut.ESSAI:
        return LicenceLifecycle.TRIAL;
      case LicenceStatut.ACTIVE:
        return LicenceLifecycle.ACTIVE;
      case LicenceStatut.EXPIREE:
        return LicenceLifecycle.EXPIRED;
      case LicenceStatut.SUSPENDUE:
        return LicenceLifecycle.SUSPENDED;
      case LicenceStatut.ANNULEE:
        return LicenceLifecycle.REVOKED;
      default:
        return LicenceLifecycle.ACTIVE;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CODEC d'état embarqué dans `notes`
  // ══════════════════════════════════════════════════════════════════════════

  private defaultState(): LifecycleState {
    return {
      lc: LicenceLifecycle.ACTIVE,
      paidThrough: null,
      graceEndsAt: null,
      provisionalUntil: null,
      trialConsumed: false,
      processedRefs: [],
      reminders: {},
    };
  }

  private readState(licence: Licence): LifecycleState {
    const base = this.defaultState();
    base.lc = this.inferLifecycleFromStatut(licence.statut);
    base.paidThrough = licence.dateExpiration
      ? new Date(licence.dateExpiration).toISOString()
      : null;

    const raw = licence.notes ?? '';
    const m = raw.match(LLC_RE);
    if (!m) return base;
    try {
      const parsed = JSON.parse(m[1].trim()) as Partial<LifecycleState>;
      return {
        ...base,
        ...parsed,
        processedRefs: parsed.processedRefs ?? [],
        reminders: parsed.reminders ?? {},
      };
    } catch (e) {
      this.logger.warn(
        `État lifecycle illisible pour ${licence.cle}: ${(e as Error).message}`,
      );
      return base;
    }
  }

  private writeState(licence: Licence, state: LifecycleState): void {
    const raw = licence.notes ?? '';
    const human = raw.replace(LLC_RE, '').trim();
    const block = `${LLC_START}${JSON.stringify(state)}${LLC_END}`;
    licence.notes = human ? `${human}\n${block}` : block;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Helpers
  // ══════════════════════════════════════════════════════════════════════════

  private async findLicence(
    tenantSlug: string,
    offreCode: string,
  ): Promise<Licence | null> {
    return this.licenceRepo.findOne({
      where: { tenantSlug, offreCode },
      order: { createdAt: 'DESC' },
    });
  }

  private async hasHadTrial(tenantSlug: string): Promise<boolean> {
    const licences = await this.licenceRepo.find({ where: { tenantSlug } });
    return licences.some((l) => {
      if (l.statut === LicenceStatut.ESSAI) return true;
      if ((l.joursEssai ?? 0) > 0 && l.montantPaye === 0) return true;
      const st = this.readState(l);
      return st.trialConsumed || st.lc === LicenceLifecycle.TRIAL;
    });
  }

  private monthsForCycle(cycle: OffreCycle): number {
    switch (cycle) {
      case OffreCycle.MENSUEL:
        return 1;
      case OffreCycle.TRIMESTRIEL:
        return 3;
      case OffreCycle.ANNUEL:
        return 12;
      case OffreCycle.UNIQUE:
        return 12; // achat unique → traité comme 12 mois d'accès
      default:
        return 1;
    }
  }

  private addMonths(d: Date, months: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + months);
    return r;
  }

  private addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  }

  private daysUntil(d: Date): number {
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private numEnv(key: string, def: number): number {
    const v = this.config.get<string | number>(key);
    const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : def;
  }

  private generateCle(): string {
    const part = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 5);
    return `SRX-${part()}-${part()}-${part()}`;
  }

  private fmtDate(d: Date | null | undefined): string {
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  }

  private async safeTenant(tenantSlug: string): Promise<Tenant | null> {
    try {
      return await this.tenantsService.findBySlug(tenantSlug);
    } catch {
      return null;
    }
  }

  private contact(tenant: Tenant): { to: string | null; prenom: string } {
    return {
      to: tenant.email ?? tenant.emailResponsable ?? null,
      prenom: tenant.nomResponsable ?? tenant.nom ?? 'Cher client',
    };
  }

  // ── Notifications & e-mails (best-effort, jamais bloquants) ────────────────

  private async notifyActivated(
    licence: Licence,
    offre: OffreSaas,
    isNew: boolean,
  ): Promise<void> {
    const tenant = await this.safeTenant(licence.tenantSlug);
    if (!tenant) return;
    const { to, prenom } = this.contact(tenant);

    await this.notificationsService.creer({
      tenantId: tenant.id,
      type: NotificationType.SUCCES,
      categorie: NotificationCategorie.PAIEMENT,
      titre: isNew ? 'Licence activée' : 'Licence renouvelée',
      message: `Votre licence ${offre.nom} est active jusqu'au ${this.fmtDate(
        licence.dateExpiration,
      )}.`,
    });

    if (!to) return;
    if (isNew) {
      await this.mailService.envoyerLicenceActivee({
        to,
        prenom,
        nomEtablissement: tenant.nom,
        cleLicence: licence.cle,
        offreNom: offre.nom,
        dateDebut: this.fmtDate(licence.dateDebut),
        dateExpiration: this.fmtDate(licence.dateExpiration),
        maxUtilisateurs: licence.maxUtilisateurs,
        montant: licence.montantPaye,
        urlConnexion: `${this.frontendUrl}/login`,
      });
    } else {
      await this.mailService.envoyerLicenceRenouvelee({
        to,
        prenom,
        nomEtablissement: tenant.nom,
        offreNom: offre.nom,
        dateExpiration: this.fmtDate(licence.dateExpiration),
        modePaiement: licence.modePaiement,
        refTransaction: licence.refTransaction ?? '—',
        montant: licence.montantPaye,
        urlConnexion: `${this.frontendUrl}/login`,
      });
    }
  }

  private async notifyTrialStarted(
    licence: Licence,
    offre: OffreSaas,
  ): Promise<void> {
    const tenant = await this.safeTenant(licence.tenantSlug);
    if (!tenant) return;
    const { to, prenom } = this.contact(tenant);

    await this.notificationsService.creer({
      tenantId: tenant.id,
      type: NotificationType.INFO,
      categorie: NotificationCategorie.PAIEMENT,
      titre: 'Période d\'essai démarrée',
      message: `Votre essai ${offre.nom} (${licence.joursEssai}j) est actif jusqu'au ${this.fmtDate(
        licence.dateExpiration,
      )}.`,
    });

    if (!to) return;
    await this.mailService.envoyerLicenceEssai({
      to,
      prenom,
      nomEtablissement: tenant.nom,
      offreNom: offre.nom,
      joursEssai: licence.joursEssai,
      dateExpiration: this.fmtDate(licence.dateExpiration),
      maxUtilisateurs: licence.maxUtilisateurs,
      urlConnexion: `${this.frontendUrl}/login`,
    });
  }

  private async notifyExpiring(
    licence: Licence,
    joursRestants: number,
    kind: 'reminder' | 'grace',
  ): Promise<void> {
    const tenant = await this.safeTenant(licence.tenantSlug);
    if (!tenant) return;
    const { to, prenom } = this.contact(tenant);

    await this.notificationsService.creer({
      tenantId: tenant.id,
      type: NotificationType.ALERTE,
      categorie: NotificationCategorie.PAIEMENT,
      titre:
        kind === 'grace'
          ? 'Licence en période de grâce'
          : `Licence expire dans ${joursRestants} jour(s)`,
      message:
        kind === 'grace'
          ? `Votre licence a expiré ; vous êtes en période de grâce. Renouvelez pour éviter la suspension.`
          : `Votre licence expire le ${this.fmtDate(
              licence.dateExpiration,
            )}. Pensez à renouveler.`,
    });

    if (!to) return;
    await this.mailService.envoyerExpirationProche({
      to,
      prenom,
      nomEtablissement: tenant.nom,
      offreNom: licence.offreCode,
      dateExpiration: this.fmtDate(licence.dateExpiration),
      joursRestants,
      urlRenouvellement: `${this.frontendUrl}/abonnement`,
    });
  }

  private async notifyExpired(licence: Licence, reason: string): Promise<void> {
    const tenant = await this.safeTenant(licence.tenantSlug);
    if (!tenant) return;
    const { to, prenom } = this.contact(tenant);

    await this.notificationsService.creer({
      tenantId: tenant.id,
      type: NotificationType.ERREUR,
      categorie: NotificationCategorie.PAIEMENT,
      titre: 'Accès suspendu',
      message: `Votre licence a expiré et l'accès est suspendu. Renouvelez pour réactiver.`,
    });

    if (!to) return;
    await this.mailService.envoyerLicenceExpiree({
      to,
      prenom,
      nomEtablissement: tenant.nom,
      dateExpiration: this.fmtDate(licence.dateExpiration),
      urlRenouvellement: `${this.frontendUrl}/abonnement`,
    });
    await this.mailService.envoyerCompteSuspendu({
      to,
      prenom,
      nomEtablissement: tenant.nom,
      raisonSuspension: reason,
    });
  }
}
