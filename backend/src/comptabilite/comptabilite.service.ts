import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CompteComptable, TypeCompte } from './entities/compte-comptable.entity';
import {
  EcritureComptable,
  StatutEcriture,
} from './entities/ecriture-comptable.entity';
import { LigneEcriture } from './entities/ligne-ecriture.entity';
import { CreateEcritureDto } from './dto/create-ecriture.dto';
import { PLAN_COMPTABLE_BASE } from './plan-comptable.constant';

const r2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class ComptabiliteService {
  constructor(
    @InjectRepository(CompteComptable)
    private compteRepo: Repository<CompteComptable>,
    @InjectRepository(EcritureComptable)
    private ecritureRepo: Repository<EcritureComptable>,
    @InjectRepository(LigneEcriture)
    private ligneRepo: Repository<LigneEcriture>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // ── Plan comptable ────────────────────────────────────────────────────

  /**
   * Sème le plan comptable SYSCOHADA de base pour le tenant s'il est vide.
   * Idempotent : n'insère que les comptes manquants. Renvoie tous les comptes.
   */
  async ensurePlanComptable(tenantId: string): Promise<CompteComptable[]> {
    const existants = await this.compteRepo.find({ where: { tenantId } });
    if (existants.length === 0) {
      const nouveaux = PLAN_COMPTABLE_BASE.map((c) =>
        this.compteRepo.create({ ...c, tenantId }),
      );
      await this.compteRepo.save(nouveaux);
      return this.compteRepo.find({
        where: { tenantId },
        order: { numero: 'ASC' },
      });
    }
    return this.compteRepo.find({
      where: { tenantId },
      order: { numero: 'ASC' },
    });
  }

  async getComptes(tenantId: string): Promise<CompteComptable[]> {
    return this.ensurePlanComptable(tenantId);
  }

  // ── Écritures ─────────────────────────────────────────────────────────

  async genererNumeroEcriture(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EC-${year}-`;
    const derniere = await this.ecritureRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('e.numero', 'DESC')
      .getOne();

    let sequence = 1;
    if (derniere) {
      const parts = derniere.numero.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  /**
   * Crée une écriture équilibrée (Σ débit = Σ crédit) en transaction.
   * Rejette (BadRequest) si déséquilibrée, si les comptes n'existent pas
   * dans le plan du tenant, ou si une ligne cumule débit ET crédit.
   */
  async createEcriture(
    dto: CreateEcritureDto,
    tenantId: string,
    userId?: string,
  ): Promise<EcritureComptable> {
    await this.ensurePlanComptable(tenantId);

    const lignes = (dto.lignes ?? []).map((l) => ({
      compteNumero: l.compteNumero,
      libelle: l.libelle,
      debit: r2(Number(l.debit ?? 0)),
      credit: r2(Number(l.credit ?? 0)),
    }));

    if (lignes.length < 2) {
      throw new BadRequestException(
        'Une écriture doit comporter au moins deux lignes',
      );
    }

    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of lignes) {
      if (l.debit < 0 || l.credit < 0) {
        throw new BadRequestException('Débit et crédit doivent être positifs');
      }
      if (l.debit > 0 && l.credit > 0) {
        throw new BadRequestException(
          `La ligne "${l.libelle}" ne peut pas porter à la fois un débit et un crédit`,
        );
      }
      if (l.debit === 0 && l.credit === 0) {
        throw new BadRequestException(
          `La ligne "${l.libelle}" doit porter un débit ou un crédit non nul`,
        );
      }
      totalDebit += l.debit;
      totalCredit += l.credit;
    }

    if (r2(totalDebit) !== r2(totalCredit)) {
      throw new BadRequestException(
        `Écriture déséquilibrée : total débit (${r2(totalDebit)}) ≠ total crédit (${r2(totalCredit)})`,
      );
    }

    // Contrôle d'existence des comptes imputés dans le plan du tenant.
    const comptes = await this.compteRepo.find({ where: { tenantId } });
    const numeros = new Set(comptes.map((c) => c.numero));
    for (const l of lignes) {
      if (!numeros.has(l.compteNumero)) {
        throw new BadRequestException(
          `Compte inconnu dans le plan comptable : ${l.compteNumero}`,
        );
      }
    }

    const numero = await this.genererNumeroEcriture(tenantId);
    const date = dto.date ? new Date(dto.date) : new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const ecriture = queryRunner.manager.create(EcritureComptable, {
        numero,
        date,
        journal: dto.journal ?? 'OD',
        libelle: dto.libelle,
        reference: dto.reference,
        statut: StatutEcriture.BROUILLON,
        tenantId,
        createdById: userId,
      });
      const saved = await queryRunner.manager.save(ecriture);

      const lignesEntities = lignes.map((l) =>
        queryRunner.manager.create(LigneEcriture, {
          ecritureId: saved.id,
          compteNumero: l.compteNumero,
          libelle: l.libelle,
          debit: l.debit,
          credit: l.credit,
          tenantId,
        }),
      );
      await queryRunner.manager.save(lignesEntities);

      await queryRunner.commitTransaction();
      return this.findOne(saved.id, tenantId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async validerEcriture(
    id: string,
    tenantId: string,
  ): Promise<EcritureComptable> {
    const ecriture = await this.findOne(id, tenantId);
    if (ecriture.statut === StatutEcriture.VALIDEE) {
      throw new BadRequestException('Écriture déjà validée');
    }
    // Re-contrôle d'équilibre par sécurité avant validation.
    const totalDebit = ecriture.lignes.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = ecriture.lignes.reduce(
      (s, l) => s + Number(l.credit),
      0,
    );
    if (r2(totalDebit) !== r2(totalCredit)) {
      throw new BadRequestException(
        'Impossible de valider une écriture déséquilibrée',
      );
    }
    await this.ecritureRepo.update(
      { id, tenantId },
      { statut: StatutEcriture.VALIDEE },
    );
    return this.findOne(id, tenantId);
  }

  async findAll(
    tenantId: string,
    filters: {
      journal?: string;
      statut?: StatutEcriture;
      dateDebut?: string;
      dateFin?: string;
    },
    pagination: { page?: number; limit?: number },
  ): Promise<{
    data: EcritureComptable[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const skip = (page - 1) * limit;

    const qb = this.ecritureRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.lignes', 'lignes')
      .where('e.tenantId = :tenantId', { tenantId });

    if (filters.journal)
      qb.andWhere('e.journal = :journal', { journal: filters.journal });
    if (filters.statut)
      qb.andWhere('e.statut = :statut', { statut: filters.statut });
    if (filters.dateDebut)
      qb.andWhere('e.date >= :dateDebut', { dateDebut: filters.dateDebut });
    if (filters.dateFin)
      qb.andWhere('e.date <= :dateFin', { dateFin: filters.dateFin });

    const [data, total] = await qb
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.numero', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<EcritureComptable> {
    const ecriture = await this.ecritureRepo.findOne({
      where: { id, tenantId },
      relations: ['lignes'],
    });
    if (!ecriture) throw new NotFoundException(`Écriture ${id} non trouvée`);
    return ecriture;
  }

  // ── Grand livre & balance ─────────────────────────────────────────────

  /**
   * Grand livre d'un compte : mouvements détaillés (uniquement écritures
   * validées) avec solde progressif.
   */
  async getGrandLivre(
    tenantId: string,
    compteNumero: string,
    filters: { dateDebut?: string; dateFin?: string } = {},
  ) {
    await this.ensurePlanComptable(tenantId);
    const compte = await this.compteRepo.findOne({
      where: { tenantId, numero: compteNumero },
    });
    if (!compte)
      throw new NotFoundException(`Compte ${compteNumero} non trouvé`);

    const qb = this.ligneRepo
      .createQueryBuilder('l')
      .innerJoin(EcritureComptable, 'e', 'e.id = l.ecritureId')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.compteNumero = :compteNumero', { compteNumero })
      .andWhere('e.statut = :statut', { statut: StatutEcriture.VALIDEE })
      .select([
        'l.id AS id',
        'l.libelle AS libelle',
        'l.debit AS debit',
        'l.credit AS credit',
        'e.numero AS "ecritureNumero"',
        'e.date AS date',
        'e.journal AS journal',
      ]);

    if (filters.dateDebut)
      qb.andWhere('e.date >= :dateDebut', { dateDebut: filters.dateDebut });
    if (filters.dateFin)
      qb.andWhere('e.date <= :dateFin', { dateFin: filters.dateFin });

    const rows = await qb
      .orderBy('e.date', 'ASC')
      .addOrderBy('e.numero', 'ASC')
      .getRawMany();

    let solde = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const mouvements = rows.map((row) => {
      const debit = Number(row.debit);
      const credit = Number(row.credit);
      totalDebit += debit;
      totalCredit += credit;
      solde += debit - credit;
      return {
        id: row.id,
        date: row.date,
        journal: row.journal,
        ecritureNumero: row.ecritureNumero,
        libelle: row.libelle,
        debit: r2(debit),
        credit: r2(credit),
        solde: r2(solde),
      };
    });

    return {
      compte: {
        numero: compte.numero,
        libelle: compte.libelle,
        classe: compte.classe,
        type: compte.type,
      },
      mouvements,
      totalDebit: r2(totalDebit),
      totalCredit: r2(totalCredit),
      solde: r2(totalDebit - totalCredit),
    };
  }

  /**
   * Balance générale : pour chaque compte du plan, total débit / crédit /
   * solde, calculé sur les écritures validées.
   */
  async getBalance(
    tenantId: string,
    filters: { dateDebut?: string; dateFin?: string } = {},
  ) {
    const comptes = await this.ensurePlanComptable(tenantId);

    const qb = this.ligneRepo
      .createQueryBuilder('l')
      .innerJoin(EcritureComptable, 'e', 'e.id = l.ecritureId')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('e.statut = :statut', { statut: StatutEcriture.VALIDEE })
      .select('l.compteNumero', 'compteNumero')
      .addSelect('COALESCE(SUM(l.debit), 0)', 'totalDebit')
      .addSelect('COALESCE(SUM(l.credit), 0)', 'totalCredit')
      .groupBy('l.compteNumero');

    if (filters.dateDebut)
      qb.andWhere('e.date >= :dateDebut', { dateDebut: filters.dateDebut });
    if (filters.dateFin)
      qb.andWhere('e.date <= :dateFin', { dateFin: filters.dateFin });

    const rows = await qb.getRawMany();
    const parCompte = new Map<string, { debit: number; credit: number }>();
    for (const row of rows) {
      parCompte.set(row.compteNumero, {
        debit: Number(row.totalDebit),
        credit: Number(row.totalCredit),
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const lignes = comptes
      .map((c) => {
        const agg = parCompte.get(c.numero) ?? { debit: 0, credit: 0 };
        const solde = agg.debit - agg.credit;
        totalDebit += agg.debit;
        totalCredit += agg.credit;
        return {
          numero: c.numero,
          libelle: c.libelle,
          classe: c.classe,
          type: c.type,
          debit: r2(agg.debit),
          credit: r2(agg.credit),
          solde: r2(solde),
          soldeDebiteur: solde > 0 ? r2(solde) : 0,
          soldeCrediteur: solde < 0 ? r2(-solde) : 0,
        };
      })
      // On ne renvoie que les comptes mouvementés pour alléger la balance.
      .filter((l) => l.debit !== 0 || l.credit !== 0);

    return {
      lignes,
      totalDebit: r2(totalDebit),
      totalCredit: r2(totalCredit),
      equilibre: r2(totalDebit) === r2(totalCredit),
    };
  }

  // ── Stats (compte de résultat simplifié) ──────────────────────────────

  async getStats(tenantId: string) {
    await this.ensurePlanComptable(tenantId);

    // Produits (classe 7) : solde créditeur = crédit - débit.
    // Charges (classe 6) : solde débiteur = débit - crédit.
    const agg = await this.ligneRepo
      .createQueryBuilder('l')
      .innerJoin(EcritureComptable, 'e', 'e.id = l.ecritureId')
      .innerJoin(
        CompteComptable,
        'c',
        'c.numero = l.compteNumero AND c.tenantId = l.tenantId',
      )
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('e.statut = :statut', { statut: StatutEcriture.VALIDEE })
      .select('c.classe', 'classe')
      .addSelect('COALESCE(SUM(l.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(l.credit), 0)', 'credit')
      .groupBy('c.classe')
      .getRawMany();

    let produits = 0;
    let charges = 0;
    for (const row of agg) {
      const classe = Number(row.classe);
      const debit = Number(row.debit);
      const credit = Number(row.credit);
      if (classe === 7) produits += credit - debit;
      if (classe === 6) charges += debit - credit;
    }

    const resultat = produits - charges;

    const [nbEcritures, nbBrouillons] = await Promise.all([
      this.ecritureRepo.count({ where: { tenantId } }),
      this.ecritureRepo.count({
        where: { tenantId, statut: StatutEcriture.BROUILLON },
      }),
    ]);

    return {
      produits: r2(produits),
      charges: r2(charges),
      resultat: r2(resultat),
      nbEcritures,
      nbBrouillons,
    };
  }

  /**
   * Bilan simplifié : postes d'actif et de passif regroupés par nature de
   * compte, sur écritures validées. Le résultat de l'exercice est intégré
   * au passif.
   */
  async getBilan(tenantId: string) {
    const balance = await this.getBalance(tenantId);
    const stats = await this.getStats(tenantId);

    const actif: { numero: string; libelle: string; valeur: number }[] = [];
    const passif: { numero: string; libelle: string; valeur: number }[] = [];

    for (const l of balance.lignes) {
      if (l.type === TypeCompte.ACTIF || l.type === TypeCompte.TRESORERIE) {
        if (l.solde !== 0)
          actif.push({ numero: l.numero, libelle: l.libelle, valeur: l.solde });
      } else if (l.type === TypeCompte.PASSIF) {
        // Passif : solde normalement créditeur → valeur = -solde.
        const valeur = -l.solde;
        if (valeur !== 0)
          passif.push({ numero: l.numero, libelle: l.libelle, valeur });
      }
    }

    // Résultat de l'exercice au passif.
    if (stats.resultat !== 0) {
      passif.push({
        numero: '120',
        libelle: "Résultat de l'exercice",
        valeur: r2(stats.resultat),
      });
    }

    const totalActif = r2(actif.reduce((s, p) => s + p.valeur, 0));
    const totalPassif = r2(passif.reduce((s, p) => s + p.valeur, 0));

    return {
      actif,
      passif,
      totalActif,
      totalPassif,
      equilibre: totalActif === totalPassif,
    };
  }
}
