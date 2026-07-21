// ════════════════════════════════════════════════════════════════════════════
//  VoucherService — codes prépayés à usage unique (SaaS Côte d'Ivoire, XOF).
//
//  Garanties de sécurité :
//   • Codes IMPRÉVISIBLES : générés via crypto.randomBytes (jamais Math.random).
//   • UNICITÉ : alphabet sans caractères ambigus + contrainte UNIQUE + génération
//     transactionnelle d'un lot.
//   • USAGE UNIQUE atomique : la redemption passe le code à USED via un UPDATE
//     conditionnel (WHERE status = 'available'). Le premier gagne, les
//     redemptions concurrentes voient affected = 0 → refus. Pas de double
//     activation possible.
//   • Export CSV protégé contre l'injection de formules (préfixe `'`).
// ════════════════════════════════════════════════════════════════════════════
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  GoneException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';

import { Voucher } from './entities/voucher.entity';
import { VoucherStatus } from './payments.enums';
import { GenerateVouchersDto } from './dto/voucher.dto';
import { LicenceLifecycleService } from './licence-lifecycle.service';

/** Filtre de listing des codes prépayés (admin). */
export interface VoucherFilter {
  batchId?: string;
  status?: VoucherStatus;
  offerCode?: string;
  resellerRef?: string;
}

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  // Alphabet sans caractères ambigus : ni 0/O, ni 1/I. 32 symboles = 5 bits.
  private static readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  private static readonly GROUPS = 3; // XXXX-XXXX-XXXX
  private static readonly GROUP_LEN = 4;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Voucher) private readonly vouchers: Repository<Voucher>,
    private readonly licenceLifecycle: LicenceLifecycleService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  //  Génération de codes
  // ──────────────────────────────────────────────────────────────────────────

  /** Tire un caractère de l'alphabet sans biais modulo (rejection sampling). */
  private randomChar(): string {
    const alpha = VoucherService.ALPHABET;
    // 256 % 32 === 0 → aucun biais, mais on garde la garde pour tout alphabet.
    const max = 256 - (256 % alpha.length);
    let byte: number;
    do {
      byte = randomBytes(1)[0];
    } while (byte >= max);
    return alpha[byte % alpha.length];
  }

  /** Génère un code unique du type `SANT-XXXX-XXXX-XXXX`. */
  private generateCode(): string {
    const groups: string[] = [];
    for (let g = 0; g < VoucherService.GROUPS; g++) {
      let group = '';
      for (let c = 0; c < VoucherService.GROUP_LEN; c++) group += this.randomChar();
      groups.push(group);
    }
    return `SANT-${groups.join('-')}`;
  }

  /**
   * Génère un lot de `quantity` codes UNIQUES en une seule transaction.
   * Unicité garantie à trois niveaux : Set local, contrainte UNIQUE en base,
   * et re-tirage complet du lot en cas de collision improbable.
   */
  async generateBatch(
    dto: GenerateVouchersDto,
    adminId: string,
  ): Promise<{ batchId: string; count: number }> {
    const { quantity } = dto;
    const batchId = randomBytes(9).toString('base64url'); // identifiant de lot opaque
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Unicité intra-lot via Set avant tout accès base.
      const codes = new Set<string>();
      while (codes.size < quantity) codes.add(this.generateCode());

      const rows = Array.from(codes).map((code) =>
        this.vouchers.create({
          code,
          batchId,
          value: dto.value ?? 0,
          currency: 'XOF',
          offerCode: dto.offerCode ?? undefined,
          durationDays: dto.durationDays,
          status: VoucherStatus.AVAILABLE,
          expiresAt,
          resellerRef: dto.resellerRef ?? null,
          usedByTenantId: null,
          usedAt: null,
        }),
      );

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // Insert par tranches pour rester sous les limites de paramètres SQL.
        const CHUNK = 500;
        for (let i = 0; i < rows.length; i += CHUNK) {
          await queryRunner.manager.insert(Voucher, rows.slice(i, i + CHUNK));
        }
        await queryRunner.commitTransaction();

        this.logger.log(
          `[VOUCHER][GENERATE] admin=${adminId} batch=${batchId} count=${quantity} ` +
            `offer=${dto.offerCode ?? '-'} durationDays=${dto.durationDays} reseller=${dto.resellerRef ?? '-'}`,
        );
        return { batchId, count: quantity };
      } catch (err: unknown) {
        await queryRunner.rollbackTransaction();
        if (this.isUniqueViolation(err) && attempt < MAX_ATTEMPTS) {
          this.logger.warn(
            `[VOUCHER][GENERATE] collision de code (tentative ${attempt}/${MAX_ATTEMPTS}), nouveau tirage du lot`,
          );
          continue; // re-tirage complet du lot
        }
        throw err;
      } finally {
        await queryRunner.release();
      }
    }

    // Statistiquement inatteignable avec 32^12 combinaisons.
    throw new ConflictException('Impossible de générer un lot de codes uniques, réessayez.');
  }

  private isUniqueViolation(err: unknown): boolean {
    const e = err as { code?: string; driverError?: { code?: string } };
    // Postgres unique_violation = 23505 ; on garde une garde générique.
    return e?.code === '23505' || e?.driverError?.code === '23505';
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Redemption (activation client) — ATOMIQUE
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Active un code pour le tenant. La bascule AVAILABLE → USED est atomique :
   * un UPDATE conditionnel garantit qu'un seul appel concurrent réussit.
   * En cas d'échec d'octroi de licence, on restitue le code (compensation).
   */
  async redeem(code: string, tenant: string): Promise<{ licence: unknown }> {
    const normalized = (code ?? '').trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Code requis.');

    // Diagnostic préalable pour retourner une erreur précise au client.
    const existing = await this.vouchers.findOne({ where: { code: normalized } });
    if (!existing) throw new NotFoundException('Code introuvable.');
    if (existing.status === VoucherStatus.DISABLED) {
      throw new BadRequestException('Ce code a été désactivé.');
    }
    if (existing.status === VoucherStatus.USED) {
      throw new ConflictException('Ce code a déjà été utilisé.');
    }
    if (this.isExpired(existing)) {
      throw new GoneException('Ce code a expiré.');
    }

    const now = new Date();

    // Bascule ATOMIQUE anti-concurrence : seul le premier appel voit affected=1.
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Voucher)
      .set({ status: VoucherStatus.USED, usedByTenantId: tenant, usedAt: now })
      .where('code = :code', { code: normalized })
      .andWhere('status = :available', { available: VoucherStatus.AVAILABLE })
      .andWhere('("expiresAt" IS NULL OR "expiresAt" > :now)', { now })
      .execute();

    if (!result.affected) {
      // Un concurrent a gagné la course (ou expiration entre-temps).
      throw new ConflictException('Ce code vient d\'être utilisé ou n\'est plus valide.');
    }

    const voucher = await this.vouchers.findOneOrFail({ where: { code: normalized } });

    try {
      const licence = await this.licenceLifecycle.grantFromVoucher(voucher, tenant);
      this.logger.log(
        `[VOUCHER][REDEEM] code=${normalized} tenant=${tenant} batch=${voucher.batchId} ` +
          `durationDays=${voucher.durationDays} offer=${voucher.offerCode ?? '-'}`,
      );
      return { licence };
    } catch (err) {
      // Compensation : l'octroi a échoué, on rend le code réutilisable.
      await this.vouchers.update(
        { code: normalized, status: VoucherStatus.USED },
        { status: VoucherStatus.AVAILABLE, usedByTenantId: null, usedAt: null },
      );
      this.logger.error(
        `[VOUCHER][REDEEM] échec d'octroi pour code=${normalized} tenant=${tenant}, code restitué`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  private isExpired(v: Voucher): boolean {
    return !!v.expiresAt && v.expiresAt.getTime() <= Date.now();
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Listing & désactivation (admin)
  // ──────────────────────────────────────────────────────────────────────────

  async list(filter: VoucherFilter = {}): Promise<Voucher[]> {
    const where: Record<string, unknown> = {};
    if (filter.batchId) where.batchId = filter.batchId;
    if (filter.status) where.status = filter.status;
    if (filter.offerCode) where.offerCode = filter.offerCode;
    if (filter.resellerRef) where.resellerRef = filter.resellerRef;
    return this.vouchers.find({ where, order: { createdAt: 'DESC' } });
  }

  /** Désactive un code encore disponible (impossible sur un code déjà utilisé). */
  async disable(code: string, adminId: string): Promise<{ code: string; status: VoucherStatus }> {
    const normalized = (code ?? '').trim().toUpperCase();
    const voucher = await this.vouchers.findOne({ where: { code: normalized } });
    if (!voucher) throw new NotFoundException('Code introuvable.');

    if (voucher.status === VoucherStatus.USED) {
      throw new ConflictException('Impossible de désactiver un code déjà utilisé.');
    }
    if (voucher.status === VoucherStatus.DISABLED) {
      return { code: normalized, status: VoucherStatus.DISABLED };
    }

    await this.vouchers.update(
      { code: normalized, status: voucher.status },
      { status: VoucherStatus.DISABLED },
    );

    this.logger.log(`[VOUCHER][DISABLE] admin=${adminId} code=${normalized}`);
    return { code: normalized, status: VoucherStatus.DISABLED };
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  Export CSV (revendeurs) — protégé contre l'injection de formules
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Exporte les codes d'un lot au format CSV (`;`), UTF-8 avec BOM.
   * En-têtes : code;valeur;offre;durée;statut;expiration.
   */
  async exportCsv(batchId: string): Promise<string> {
    const rows = await this.vouchers.find({
      where: { batchId },
      order: { createdAt: 'ASC' },
    });

    const header = ['code', 'valeur', 'offre', 'durée', 'statut', 'expiration'];
    const lines = [header.map((h) => this.csvCell(h)).join(';')];

    for (const v of rows) {
      lines.push(
        [
          this.csvCell(v.code),
          this.csvCell(String(v.value ?? 0)),
          this.csvCell(v.offerCode ?? ''),
          this.csvCell(String(v.durationDays ?? 0)),
          this.csvCell(v.status),
          this.csvCell(v.expiresAt ? v.expiresAt.toISOString() : ''),
        ].join(';'),
      );
    }

    const BOM = '﻿';
    return BOM + lines.join('\r\n') + '\r\n';
  }

  /**
   * Neutralise l'injection de formules (CSV/Excel) puis échappe pour le CSV.
   * Une cellule débutant par = + - @ (ou tab / CR) est préfixée d'une apostrophe.
   */
  private csvCell(raw: string): string {
    let value = raw ?? '';
    if (/^[=+\-@\t\r]/.test(value)) {
      value = `'${value}`;
    }
    // Échappement CSV : encadrer de guillemets si séparateur/guillemet/saut de ligne.
    if (/[";\r\n]/.test(value)) {
      value = `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
