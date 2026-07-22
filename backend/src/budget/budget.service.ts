import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget, StatutBudget, TypeBudget } from './entities/budget.entity';
import { LigneBudget } from './entities/ligne-budget.entity';
import { SuiviBudgetaire } from './entities/suivi-budgetaire.entity';
import {
  CreateBudgetDto,
  CreateLigneBudgetDto,
} from './dto/create-budget.dto';
import {
  UpdateBudgetDto,
  UpdateLigneBudgetDto,
  SaisirRealiseDto,
} from './dto/update-budget.dto';

// Seuil de dépassement au-delà duquel une ligne est signalée en alerte.
const SEUIL_ALERTE = 100;

/** Convertit toute valeur en nombre sûr (jamais NaN). */
const num = (v: unknown): number => Number(v) || 0;
/** Arrondi monétaire à 2 décimales. */
const round2 = (v: number): number => Math.round(v * 100) / 100;

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(LigneBudget)
    private ligneRepo: Repository<LigneBudget>,
    @InjectRepository(SuiviBudgetaire)
    private suiviRepo: Repository<SuiviBudgetaire>,
  ) {}

  // ── Calculs dérivés d'une ligne ─────────────────────────────────────────
  private calculerLigne(prevu: number, realise: number) {
    const p = num(prevu);
    const r = num(realise);
    const ecart = round2(r - p);
    const tauxRealisation = p > 0 ? round2((r / p) * 100) : 0;
    return { ecart, tauxRealisation };
  }

  // ── CRUD Budget ─────────────────────────────────────────────────────────
  async createBudget(
    dto: CreateBudgetDto,
    tenantId: string,
    userId?: string,
  ): Promise<Budget> {
    const budget = this.budgetRepo.create({
      libelle: dto.libelle,
      exercice: num(dto.exercice),
      type: dto.type ?? TypeBudget.DEPENSES,
      service: dto.service,
      poste: dto.poste,
      devise: dto.devise ?? 'XOF',
      notes: dto.notes,
      statut: StatutBudget.BROUILLON,
      tenantId,
      createdById: userId,
    });
    const saved = await this.budgetRepo.save(budget);

    if (dto.lignes?.length) {
      for (const ligneDto of dto.lignes) {
        await this.addLigne(saved.id, ligneDto, tenantId);
      }
    }
    return this.findOne(saved.id, tenantId);
  }

  async findAll(
    tenantId: string,
    filters: { exercice?: number; type?: TypeBudget; statut?: StatutBudget; service?: string } = {},
  ): Promise<Budget[]> {
    const qb = this.budgetRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.lignes', 'lignes')
      .where('b.tenantId = :tenantId', { tenantId });

    if (filters.exercice) qb.andWhere('b.exercice = :exercice', { exercice: filters.exercice });
    if (filters.type) qb.andWhere('b.type = :type', { type: filters.type });
    if (filters.statut) qb.andWhere('b.statut = :statut', { statut: filters.statut });
    if (filters.service) qb.andWhere('b.service = :service', { service: filters.service });

    return qb.orderBy('b.exercice', 'DESC').addOrderBy('b.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, tenantId: string): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({
      where: { id, tenantId },
      relations: ['lignes'],
    });
    if (!budget) throw new NotFoundException(`Budget ${id} non trouvé`);
    return budget;
  }

  async updateBudget(id: string, dto: UpdateBudgetDto, tenantId: string): Promise<Budget> {
    const budget = await this.findOne(id, tenantId);
    if (budget.statut === StatutBudget.CLOTURE) {
      throw new BadRequestException('Un budget clôturé ne peut plus être modifié');
    }
    await this.budgetRepo.update({ id, tenantId }, { ...dto });
    return this.findOne(id, tenantId);
  }

  async valider(id: string, tenantId: string): Promise<Budget> {
    const budget = await this.findOne(id, tenantId);
    if (budget.statut !== StatutBudget.BROUILLON) {
      throw new BadRequestException('Seul un budget en brouillon peut être validé');
    }
    await this.budgetRepo.update({ id, tenantId }, { statut: StatutBudget.VALIDE });
    return this.findOne(id, tenantId);
  }

  async cloturer(id: string, tenantId: string): Promise<Budget> {
    const budget = await this.findOne(id, tenantId);
    if (budget.statut === StatutBudget.CLOTURE) {
      throw new BadRequestException('Budget déjà clôturé');
    }
    await this.budgetRepo.update({ id, tenantId }, { statut: StatutBudget.CLOTURE });
    return this.findOne(id, tenantId);
  }

  async removeBudget(id: string, tenantId: string): Promise<void> {
    const budget = await this.findOne(id, tenantId);
    if (budget.statut === StatutBudget.CLOTURE) {
      throw new BadRequestException('Impossible de supprimer un budget clôturé');
    }
    await this.budgetRepo.remove(budget);
  }

  // ── Lignes budgétaires ──────────────────────────────────────────────────
  async getLignes(budgetId: string, tenantId: string): Promise<LigneBudget[]> {
    await this.findOne(budgetId, tenantId); // garantit l'appartenance au tenant
    return this.ligneRepo.find({
      where: { budgetId, tenantId },
      order: { poste: 'ASC' },
    });
  }

  async addLigne(
    budgetId: string,
    dto: CreateLigneBudgetDto,
    tenantId: string,
  ): Promise<LigneBudget> {
    const budget = await this.findOne(budgetId, tenantId);
    if (budget.statut === StatutBudget.CLOTURE) {
      throw new BadRequestException('Budget clôturé : ajout de ligne impossible');
    }
    const prevu = num(dto.montantPrevu);
    const realise = num(dto.montantRealise);
    const { ecart, tauxRealisation } = this.calculerLigne(prevu, realise);

    const ligne = this.ligneRepo.create({
      budgetId,
      poste: dto.poste,
      categorie: dto.categorie,
      montantPrevu: prevu,
      montantRealise: realise,
      ecart,
      tauxRealisation,
      notes: dto.notes,
      tenantId,
    });
    return this.ligneRepo.save(ligne);
  }

  async updateLigne(
    budgetId: string,
    ligneId: string,
    dto: UpdateLigneBudgetDto,
    tenantId: string,
  ): Promise<LigneBudget> {
    const ligne = await this.ligneRepo.findOne({ where: { id: ligneId, budgetId, tenantId } });
    if (!ligne) throw new NotFoundException('Ligne budgétaire non trouvée');

    if (dto.poste !== undefined) ligne.poste = dto.poste;
    if (dto.categorie !== undefined) ligne.categorie = dto.categorie;
    if (dto.notes !== undefined) ligne.notes = dto.notes;
    if (dto.montantPrevu !== undefined) ligne.montantPrevu = num(dto.montantPrevu);
    if (dto.montantRealise !== undefined) ligne.montantRealise = num(dto.montantRealise);

    const { ecart, tauxRealisation } = this.calculerLigne(
      ligne.montantPrevu,
      ligne.montantRealise,
    );
    ligne.ecart = ecart;
    ligne.tauxRealisation = tauxRealisation;

    return this.ligneRepo.save(ligne);
  }

  async removeLigne(budgetId: string, ligneId: string, tenantId: string): Promise<void> {
    const ligne = await this.ligneRepo.findOne({ where: { id: ligneId, budgetId, tenantId } });
    if (!ligne) throw new NotFoundException('Ligne budgétaire non trouvée');
    await this.ligneRepo.remove(ligne);
  }

  // ── Saisie du réalisé (global ou mensuel) ───────────────────────────────
  async saisirRealise(
    budgetId: string,
    ligneId: string,
    dto: SaisirRealiseDto,
    tenantId: string,
  ): Promise<LigneBudget> {
    const ligne = await this.ligneRepo.findOne({ where: { id: ligneId, budgetId, tenantId } });
    if (!ligne) throw new NotFoundException('Ligne budgétaire non trouvée');

    // Cas 1 : saisie d'un réalisé mensuel → upsert du suivi puis agrégation.
    if (dto.mois !== undefined) {
      if (dto.mois < 1 || dto.mois > 12) {
        throw new BadRequestException('Le mois doit être compris entre 1 et 12');
      }
      let suivi = await this.suiviRepo.findOne({
        where: { ligneBudgetId: ligneId, mois: dto.mois, tenantId },
      });
      if (suivi) {
        suivi.montantRealiseMois = num(dto.montantRealiseMois);
        suivi.commentaire = dto.commentaire ?? suivi.commentaire;
      } else {
        suivi = this.suiviRepo.create({
          ligneBudgetId: ligneId,
          mois: dto.mois,
          montantRealiseMois: num(dto.montantRealiseMois),
          commentaire: dto.commentaire,
          tenantId,
        });
      }
      await this.suiviRepo.save(suivi);

      // Agrégation du réalisé = somme des 12 mois de suivi.
      const suivis = await this.suiviRepo.find({
        where: { ligneBudgetId: ligneId, tenantId },
      });
      ligne.montantRealise = round2(
        suivis.reduce((s, x) => s + num(x.montantRealiseMois), 0),
      );
    } else {
      // Cas 2 : réalisé global direct.
      ligne.montantRealise = num(dto.montantRealise);
    }

    const { ecart, tauxRealisation } = this.calculerLigne(
      ligne.montantPrevu,
      ligne.montantRealise,
    );
    ligne.ecart = ecart;
    ligne.tauxRealisation = tauxRealisation;
    return this.ligneRepo.save(ligne);
  }

  async getSuivis(ligneId: string, tenantId: string): Promise<SuiviBudgetaire[]> {
    return this.suiviRepo.find({
      where: { ligneBudgetId: ligneId, tenantId },
      order: { mois: 'ASC' },
    });
  }

  // ── Consolidation / synthèse d'un budget ────────────────────────────────
  async getSynthese(id: string, tenantId: string) {
    const budget = await this.findOne(id, tenantId);
    const lignes = budget.lignes ?? [];

    const totalPrevu = round2(lignes.reduce((s, l) => s + num(l.montantPrevu), 0));
    const totalRealise = round2(lignes.reduce((s, l) => s + num(l.montantRealise), 0));
    const ecart = round2(totalRealise - totalPrevu);
    const tauxGlobal = totalPrevu > 0 ? round2((totalRealise / totalPrevu) * 100) : 0;

    const depassements = lignes
      .filter((l) => num(l.tauxRealisation) > SEUIL_ALERTE)
      .map((l) => ({
        id: l.id,
        poste: l.poste,
        categorie: l.categorie,
        montantPrevu: num(l.montantPrevu),
        montantRealise: num(l.montantRealise),
        ecart: num(l.ecart),
        tauxRealisation: num(l.tauxRealisation),
      }));

    return {
      budget: {
        id: budget.id,
        libelle: budget.libelle,
        exercice: budget.exercice,
        type: budget.type,
        statut: budget.statut,
        devise: budget.devise,
      },
      totalPrevu,
      totalRealise,
      ecart,
      tauxGlobal,
      nbLignes: lignes.length,
      nbDepassements: depassements.length,
      depassements,
    };
  }

  // ── Tableau de bord (tous budgets d'un exercice) ────────────────────────
  async getTableauBord(tenantId: string, exercice?: number) {
    const anneeCourante = exercice ?? new Date().getFullYear();
    const budgets = await this.findAll(tenantId, { exercice: anneeCourante });

    let totalPrevuRecettes = 0;
    let totalRealiseRecettes = 0;
    let totalPrevuDepenses = 0;
    let totalRealiseDepenses = 0;

    const parService: Record<
      string,
      { service: string; prevu: number; realise: number }
    > = {};

    for (const b of budgets) {
      const lignes = b.lignes ?? [];
      const prevu = lignes.reduce((s, l) => s + num(l.montantPrevu), 0);
      const realise = lignes.reduce((s, l) => s + num(l.montantRealise), 0);

      if (b.type === TypeBudget.RECETTES) {
        totalPrevuRecettes += prevu;
        totalRealiseRecettes += realise;
      } else {
        totalPrevuDepenses += prevu;
        totalRealiseDepenses += realise;
      }

      const key = b.service || 'Général';
      if (!parService[key]) parService[key] = { service: key, prevu: 0, realise: 0 };
      parService[key].prevu += prevu;
      parService[key].realise += realise;
    }

    const tauxRecettes =
      totalPrevuRecettes > 0 ? round2((totalRealiseRecettes / totalPrevuRecettes) * 100) : 0;
    const tauxDepenses =
      totalPrevuDepenses > 0 ? round2((totalRealiseDepenses / totalPrevuDepenses) * 100) : 0;

    return {
      exercice: anneeCourante,
      nbBudgets: budgets.length,
      recettes: {
        prevu: round2(totalPrevuRecettes),
        realise: round2(totalRealiseRecettes),
        ecart: round2(totalRealiseRecettes - totalPrevuRecettes),
        taux: tauxRecettes,
      },
      depenses: {
        prevu: round2(totalPrevuDepenses),
        realise: round2(totalRealiseDepenses),
        ecart: round2(totalRealiseDepenses - totalPrevuDepenses),
        taux: tauxDepenses,
      },
      resultatPrevu: round2(totalPrevuRecettes - totalPrevuDepenses),
      resultatRealise: round2(totalRealiseRecettes - totalRealiseDepenses),
      parService: Object.values(parService).map((s) => ({
        service: s.service,
        prevu: round2(s.prevu),
        realise: round2(s.realise),
        ecart: round2(s.realise - s.prevu),
        taux: s.prevu > 0 ? round2((s.realise / s.prevu) * 100) : 0,
      })),
    };
  }

  // ── Statistiques transverses (top écarts) ───────────────────────────────
  async getStats(tenantId: string, exercice?: number) {
    const anneeCourante = exercice ?? new Date().getFullYear();
    const budgets = await this.findAll(tenantId, { exercice: anneeCourante });

    const lignes: LigneBudget[] = [];
    for (const b of budgets) lignes.push(...(b.lignes ?? []));

    const totalPrevu = round2(lignes.reduce((s, l) => s + num(l.montantPrevu), 0));
    const totalRealise = round2(lignes.reduce((s, l) => s + num(l.montantRealise), 0));
    const tauxGlobal = totalPrevu > 0 ? round2((totalRealise / totalPrevu) * 100) : 0;

    // Top 5 écarts en valeur absolue.
    const topEcarts = [...lignes]
      .sort((a, b) => Math.abs(num(b.ecart)) - Math.abs(num(a.ecart)))
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        poste: l.poste,
        categorie: l.categorie,
        montantPrevu: num(l.montantPrevu),
        montantRealise: num(l.montantRealise),
        ecart: num(l.ecart),
        tauxRealisation: num(l.tauxRealisation),
      }));

    return {
      exercice: anneeCourante,
      nbBudgets: budgets.length,
      nbLignes: lignes.length,
      totalPrevu,
      totalRealise,
      ecartGlobal: round2(totalRealise - totalPrevu),
      tauxGlobal,
      nbDepassements: lignes.filter((l) => num(l.tauxRealisation) > SEUIL_ALERTE).length,
      topEcarts,
    };
  }
}
