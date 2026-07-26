import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import {
  CleActivation,
  CleActivationStatut,
} from './entities/cle-activation.entity';
import {
  GenererLotDto,
  ListerClesDto,
  RevoquerLotDto,
} from './dto/cles-activation.dto';
import { LicencesService } from '../licences/licences.service';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { LicenceModePaiement } from '../licences/entities/licence.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';

/** Contexte de l'appelant lors de la saisie d'une clé. */
export interface RedeemContext {
  tenantSlug: string;
  userId?: string;
  ip?: string;
}

/**
 * Alphabet sans caractères ambigus (pas de 0/O/1/I) pour des codes lisibles
 * ET non prévisibles (source : crypto.randomBytes, jamais Math.random).
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class ClesActivationService {
  private readonly logger = new Logger(ClesActivationService.name);

  // ── Anti-brute-force : compteur d'échecs en mémoire par (tenant|IP) ──────────
  private readonly MAX_TENTATIVES = 5;
  private readonly FENETRE_MS = 15 * 60 * 1000; // 15 minutes
  private readonly tentatives = new Map<string, { count: number; premier: number }>();

  constructor(
    @InjectRepository(CleActivation)
    private readonly cleRepo: Repository<CleActivation>,
    private readonly licencesService: LicencesService,
    private readonly offresSaasService: OffresSaasService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Génération
  // ───────────────────────────────────────────────────────────────────────────

  private genererCode(): string {
    const bytes = randomBytes(15);
    let out = '';
    for (let i = 0; i < 15; i++) {
      out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
      if (i === 4 || i === 9) out += '-';
    }
    return `SRX-${out}`;
  }

  private async genererCodeUnique(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = this.genererCode();
      const existe = await this.cleRepo.findOne({ where: { code }, select: ['id'] });
      if (!existe) return code;
    }
    throw new ConflictException('Impossible de générer un code d\'activation unique.');
  }

  async genererLot(dto: GenererLotDto, creeParId?: string): Promise<{
    lot: string;
    nombre: number;
    cles: CleActivation[];
  }> {
    // La formule doit exister (cohérence offre/clé validée dès la génération).
    await this.offresSaasService.findByCode(dto.offreCode);

    const lot = (dto.lot?.trim())
      || `LOT-${new Date().toISOString().slice(0, 10)}-${randomBytes(3).toString('hex').toUpperCase()}`;

    const validiteJours = dto.validiteJours ?? 365;
    const dateExpiration = new Date(Date.now() + validiteJours * 86_400_000);

    const cles: CleActivation[] = [];
    for (let i = 0; i < dto.nombre; i++) {
      const code = await this.genererCodeUnique();
      cles.push(
        this.cleRepo.create({
          code,
          offreCode: dto.offreCode,
          dureeJours: dto.dureeJours,
          tenantSlug: dto.tenantSlug?.trim() || null,
          statut: CleActivationStatut.ACTIVE,
          dateExpiration,
          lot,
          creeParId: creeParId ?? null,
        }),
      );
    }
    const saved = await this.cleRepo.save(cles);

    this.auditLogs.log({
      action: AuditAction.CREATE,
      ressource: 'CleActivation',
      userId: creeParId,
      contexte: {
        operation: 'GENERATION_LOT',
        lot,
        nombre: saved.length,
        offreCode: dto.offreCode,
        dureeJours: dto.dureeJours,
        tenantSlug: dto.tenantSlug ?? null,
      },
    });
    this.logger.log(`Génération de ${saved.length} clé(s) — lot ${lot} (offre ${dto.offreCode}).`);

    return { lot, nombre: saved.length, cles: saved };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Consultation
  // ───────────────────────────────────────────────────────────────────────────

  async lister(dto: ListerClesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const qb = this.cleRepo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');

    if (dto.statut) qb.andWhere('c.statut = :statut', { statut: dto.statut });
    if (dto.lot) qb.andWhere('c.lot = :lot', { lot: dto.lot });
    if (dto.offreCode) qb.andWhere('c.offreCode = :offreCode', { offreCode: dto.offreCode });
    if (dto.tenantSlug) qb.andWhere('c.tenantSlug = :tenantSlug', { tenantSlug: dto.tenantSlug });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<CleActivation> {
    const cle = await this.cleRepo.findOne({ where: { id } });
    if (!cle) throw new NotFoundException('Clé d\'activation introuvable.');
    return cle;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Révocation
  // ───────────────────────────────────────────────────────────────────────────

  async revoquer(id: string, motif?: string, acteurId?: string): Promise<CleActivation> {
    const cle = await this.findOne(id);
    if (cle.statut === CleActivationStatut.UTILISEE) {
      throw new BadRequestException('Clé déjà utilisée : révocation impossible.');
    }
    if (cle.statut === CleActivationStatut.REVOQUEE) return cle;

    cle.statut = CleActivationStatut.REVOQUEE;
    cle.motifRevocation = motif ?? null;
    const saved = await this.cleRepo.save(cle);

    this.auditLogs.log({
      action: AuditAction.UPDATE,
      ressource: 'CleActivation',
      ressourceId: saved.id,
      userId: acteurId,
      contexte: { operation: 'REVOCATION', code: saved.code, lot: saved.lot, motif: motif ?? null },
    });
    this.logger.warn(`Clé ${saved.code} révoquée (lot ${saved.lot}).`);
    return saved;
  }

  async revoquerLot(dto: RevoquerLotDto, acteurId?: string): Promise<{ lot: string; revoquees: number }> {
    const res = await this.cleRepo
      .createQueryBuilder()
      .update(CleActivation)
      .set({ statut: CleActivationStatut.REVOQUEE, motifRevocation: dto.motif ?? null })
      .where('lot = :lot', { lot: dto.lot })
      .andWhere('statut = :active', { active: CleActivationStatut.ACTIVE })
      .execute();

    const revoquees = res.affected ?? 0;
    this.auditLogs.log({
      action: AuditAction.UPDATE,
      ressource: 'CleActivation',
      userId: acteurId,
      contexte: { operation: 'REVOCATION_LOT', lot: dto.lot, revoquees, motif: dto.motif ?? null },
    });
    this.logger.warn(`Lot ${dto.lot} : ${revoquees} clé(s) révoquée(s).`);
    return { lot: dto.lot, revoquees };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Export CSV
  // ───────────────────────────────────────────────────────────────────────────

  async exportCsv(dto: ListerClesDto): Promise<string> {
    const qb = this.cleRepo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
    if (dto.statut) qb.andWhere('c.statut = :statut', { statut: dto.statut });
    if (dto.lot) qb.andWhere('c.lot = :lot', { lot: dto.lot });
    if (dto.offreCode) qb.andWhere('c.offreCode = :offreCode', { offreCode: dto.offreCode });
    if (dto.tenantSlug) qb.andWhere('c.tenantSlug = :tenantSlug', { tenantSlug: dto.tenantSlug });

    const cles = await qb.getMany();
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      'code', 'offreCode', 'dureeJours', 'tenantSlug', 'statut',
      'dateExpiration', 'dateUtilisation', 'utiliseeParTenant', 'lot', 'createdAt',
    ];
    const lignes = cles.map((c) =>
      [
        c.code, c.offreCode, c.dureeJours, c.tenantSlug, c.statut,
        c.dateExpiration?.toISOString() ?? '', c.dateUtilisation?.toISOString() ?? '',
        c.utiliseeParTenant, c.lot, c.createdAt?.toISOString() ?? '',
      ].map(esc).join(';'),
    );

    this.auditLogs.log({
      action: AuditAction.EXPORT,
      ressource: 'CleActivation',
      contexte: { operation: 'EXPORT_CSV', nombre: cles.length, filtres: dto },
    });

    return [header.join(';'), ...lignes].join('\n');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Saisie / activation (redeem) — accessible au client connecté
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Vérifie l'absence de blocage anti-brute-force pour (tenant|IP), sinon lève.
   */
  private assertNonBloque(ctx: RedeemContext): void {
    const key = `${ctx.tenantSlug}|${ctx.ip ?? 'n/a'}`;
    const entree = this.tentatives.get(key);
    if (!entree) return;
    if (Date.now() - entree.premier > this.FENETRE_MS) {
      this.tentatives.delete(key);
      return;
    }
    if (entree.count >= this.MAX_TENTATIVES) {
      throw new ForbiddenException(
        'Trop de tentatives de saisie de clé. Réessayez dans quelques minutes.',
      );
    }
  }

  private enregistrerEchec(ctx: RedeemContext): void {
    const key = `${ctx.tenantSlug}|${ctx.ip ?? 'n/a'}`;
    const entree = this.tentatives.get(key);
    if (!entree || Date.now() - entree.premier > this.FENETRE_MS) {
      this.tentatives.set(key, { count: 1, premier: Date.now() });
    } else {
      entree.count += 1;
    }
  }

  private reinitialiserCompteur(ctx: RedeemContext): void {
    this.tentatives.delete(`${ctx.tenantSlug}|${ctx.ip ?? 'n/a'}`);
  }

  /**
   * Saisie d'une clé par un tenant. Vérifie validité + unicité + non-réutilisation
   * + non-expiration + cohérence formule/tenant, puis active la licence EN BASE
   * via `LicencesService`. La clé ne débloque jamais côté client : c'est cette
   * méthode serveur qui active réellement le droit.
   */
  async utiliser(codeSaisi: string, ctx: RedeemContext): Promise<{
    ok: true;
    offreCode: string;
    dureeJours: number;
    licenceId: string;
    dateExpiration: Date;
  }> {
    if (!ctx.tenantSlug) {
      throw new BadRequestException('Contexte tenant manquant.');
    }
    this.assertNonBloque(ctx);

    const code = (codeSaisi || '').trim().toUpperCase();
    if (!code) {
      this.enregistrerEchec(ctx);
      throw new BadRequestException('Code d\'activation vide.');
    }

    const cle = await this.cleRepo.findOne({ where: { code } });

    const echec = (motif: string, log: string): never => {
      this.enregistrerEchec(ctx);
      this.auditLogs.log({
        action: AuditAction.SUSPEND,
        ressource: 'CleActivation',
        ressourceId: cle?.id,
        contexte: {
          operation: 'SAISIE_ECHEC',
          motif: log,
          tenantSlug: ctx.tenantSlug,
          ip: ctx.ip,
        },
      });
      this.logger.warn(`Saisie clé échouée (${log}) tenant=${ctx.tenantSlug} ip=${ctx.ip ?? 'n/a'}.`);
      throw new BadRequestException(motif);
    };

    if (!cle) echec('Clé invalide.', 'CLE_INEXISTANTE');
    // TypeScript : `cle` est garanti non-null après `echec` (never).
    const c = cle as CleActivation;

    // Expiration temporelle : bascule le statut au passage (best-effort).
    if (
      c.statut === CleActivationStatut.ACTIVE &&
      c.dateExpiration &&
      c.dateExpiration.getTime() < Date.now()
    ) {
      c.statut = CleActivationStatut.EXPIREE;
      await this.cleRepo.save(c);
    }

    if (c.statut === CleActivationStatut.UTILISEE) echec('Clé déjà utilisée.', 'DEJA_UTILISEE');
    if (c.statut === CleActivationStatut.REVOQUEE) echec('Clé révoquée.', 'REVOQUEE');
    if (c.statut === CleActivationStatut.EXPIREE) echec('Clé expirée.', 'EXPIREE');

    // Cohérence : clé nominative → réservée à un seul tenant.
    if (c.tenantSlug && c.tenantSlug !== ctx.tenantSlug) {
      echec('Cette clé est réservée à un autre établissement.', 'TENANT_NON_AUTORISE');
    }

    // Cohérence formule : l'offre doit toujours exister.
    const offre = await this.offresSaasService.findByCode(c.offreCode).catch(() => null);
    if (!offre) echec('Formule liée à la clé introuvable.', 'OFFRE_INTROUVABLE');

    // ── Activation serveur de la licence (jamais côté client) ─────────────────
    const now = new Date();
    const dateExpiration = new Date(now.getTime() + c.dureeJours * 86_400_000);
    const licence = await this.licencesService.creer(
      {
        tenantSlug: ctx.tenantSlug,
        offreId: (offre as { id: string }).id,
        dateDebut: now.toISOString(),
        dateExpiration: dateExpiration.toISOString(),
        montantPaye: 0,
        modePaiement: LicenceModePaiement.MANUEL,
        joursEssai: 0,
        notes: `Activée par clé d'activation ${c.code} (lot ${c.lot}).`,
      },
      ctx.userId,
    );

    // Marque la clé consommée (usage unique).
    c.statut = CleActivationStatut.UTILISEE;
    c.dateUtilisation = now;
    c.utiliseeParTenant = ctx.tenantSlug;
    c.licenceId = licence.id;
    await this.cleRepo.save(c);

    this.reinitialiserCompteur(ctx);
    this.auditLogs.log({
      action: AuditAction.ACTIVATE,
      ressource: 'CleActivation',
      ressourceId: c.id,
      userId: ctx.userId,
      contexte: {
        operation: 'ACTIVATION_PAR_CLE',
        code: c.code,
        lot: c.lot,
        tenantSlug: ctx.tenantSlug,
        offreCode: c.offreCode,
        licenceId: licence.id,
      },
    });
    this.logger.log(
      `Clé ${c.code} activée pour ${ctx.tenantSlug} → licence ${licence.id} (offre ${c.offreCode}).`,
    );

    return {
      ok: true,
      offreCode: c.offreCode,
      dureeJours: c.dureeJours,
      licenceId: licence.id,
      dateExpiration,
    };
  }
}
