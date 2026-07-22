import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IndicateurQualite,
  SensIndicateur,
  DomaineIndicateur,
} from './entities/indicateur-qualite.entity';
import {
  MesureIndicateur,
  StatutMesure,
} from './entities/mesure-indicateur.entity';
import {
  CritereAccreditation,
  StatutConformite,
} from './entities/critere-accreditation.entity';
import {
  CreateIndicateurDto,
  UpdateIndicateurDto,
  CreateMesureDto,
  CreateCritereDto,
  UpdateCritereDto,
} from './dto/indicateur-qualite.dto';
import { SEED_INDICATEURS } from './indicateurs-qualite.seed';

@Injectable()
export class IndicateursQualiteService {
  private readonly logger = new Logger(IndicateursQualiteService.name);

  constructor(
    @InjectRepository(IndicateurQualite)
    private readonly indicateurRepo: Repository<IndicateurQualite>,
    @InjectRepository(MesureIndicateur)
    private readonly mesureRepo: Repository<MesureIndicateur>,
    @InjectRepository(CritereAccreditation)
    private readonly critereRepo: Repository<CritereAccreditation>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  //  Évaluation atteint / alerte / critique selon le sens & la cible
  // ────────────────────────────────────────────────────────────────
  private evaluer(indicateur: IndicateurQualite, valeur: number): StatutMesure {
    const cible = Number(indicateur.cible);
    const seuil = indicateur.seuil !== null ? Number(indicateur.seuil) : null;

    if (indicateur.sens === SensIndicateur.HAUSSE_BONNE) {
      // Plus c'est haut, mieux c'est. Seuil = plancher d'alerte (< cible).
      if (valeur >= cible) return StatutMesure.ATTEINT;
      if (seuil !== null && valeur >= seuil) return StatutMesure.ALERTE;
      if (seuil === null) return StatutMesure.ALERTE;
      return StatutMesure.CRITIQUE;
    } else {
      // Plus c'est bas, mieux c'est. Seuil = plafond d'alerte (> cible).
      if (valeur <= cible) return StatutMesure.ATTEINT;
      if (seuil !== null && valeur <= seuil) return StatutMesure.ALERTE;
      if (seuil === null) return StatutMesure.ALERTE;
      return StatutMesure.CRITIQUE;
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Seed à la volée des indicateurs types pour un tenant vierge
  // ────────────────────────────────────────────────────────────────
  private async ensureSeed(tenantId: string): Promise<void> {
    const count = await this.indicateurRepo.count({ where: { tenantId } });
    if (count > 0) return;
    try {
      for (const s of SEED_INDICATEURS) {
        const exists = await this.indicateurRepo.findOne({
          where: { tenantId, code: s.code },
        });
        if (exists) continue;
        await this.indicateurRepo.save(
          this.indicateurRepo.create({ ...s, tenantId, actif: true }),
        );
      }
      this.logger.log(
        `Indicateurs qualité types seedés pour le tenant ${tenantId}`,
      );
    } catch (e) {
      // Le seed ne doit jamais bloquer l'accès au module.
      this.logger.warn(`Seed indicateurs ignoré (${(e as Error).message})`);
    }
  }

  // ────────────────────────────────────────────────────────────────
  //  Indicateurs — CRUD
  // ────────────────────────────────────────────────────────────────
  async listerIndicateurs(
    tenantId: string,
    filters: { domaine?: DomaineIndicateur; actif?: boolean } = {},
  ): Promise<IndicateurQualite[]> {
    await this.ensureSeed(tenantId);
    const qb = this.indicateurRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId });
    if (filters.domaine) qb.andWhere('i.domaine = :d', { d: filters.domaine });
    if (filters.actif !== undefined)
      qb.andWhere('i.actif = :a', { a: filters.actif });
    return qb.orderBy('i.domaine', 'ASC').addOrderBy('i.libelle', 'ASC').getMany();
  }

  async creerIndicateur(
    dto: CreateIndicateurDto,
    tenantId: string,
  ): Promise<IndicateurQualite> {
    const code = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
    const exists = await this.indicateurRepo.findOne({
      where: { tenantId, code },
    });
    if (exists) {
      throw new ConflictException(
        `Un indicateur avec le code ${code} existe déjà.`,
      );
    }
    const indicateur = this.indicateurRepo.create({
      tenantId,
      code,
      libelle: dto.libelle,
      domaine: dto.domaine,
      unite: dto.unite,
      cible: dto.cible,
      seuil: dto.seuil ?? null,
      sens: dto.sens,
      description: dto.description ?? null,
      actif: dto.actif ?? true,
    });
    return this.indicateurRepo.save(indicateur);
  }

  async getIndicateur(id: string, tenantId: string): Promise<IndicateurQualite> {
    const ind = await this.indicateurRepo.findOne({ where: { id, tenantId } });
    if (!ind) throw new NotFoundException(`Indicateur ${id} introuvable`);
    return ind;
  }

  async modifierIndicateur(
    id: string,
    dto: UpdateIndicateurDto,
    tenantId: string,
  ): Promise<IndicateurQualite> {
    const ind = await this.getIndicateur(id, tenantId);
    Object.assign(ind, {
      libelle: dto.libelle ?? ind.libelle,
      domaine: dto.domaine ?? ind.domaine,
      unite: dto.unite ?? ind.unite,
      cible: dto.cible ?? ind.cible,
      seuil: dto.seuil !== undefined ? dto.seuil : ind.seuil,
      sens: dto.sens ?? ind.sens,
      description: dto.description !== undefined ? dto.description : ind.description,
      actif: dto.actif !== undefined ? dto.actif : ind.actif,
    });
    return this.indicateurRepo.save(ind);
  }

  async supprimerIndicateur(id: string, tenantId: string): Promise<void> {
    const ind = await this.getIndicateur(id, tenantId);
    await this.mesureRepo.delete({ tenantId, indicateurId: ind.id });
    await this.indicateurRepo.remove(ind);
  }

  // ────────────────────────────────────────────────────────────────
  //  Mesures
  // ────────────────────────────────────────────────────────────────
  async listerMesures(
    indicateurId: string,
    tenantId: string,
  ): Promise<MesureIndicateur[]> {
    await this.getIndicateur(indicateurId, tenantId);
    return this.mesureRepo.find({
      where: { tenantId, indicateurId },
      order: { periode: 'ASC' },
    });
  }

  async ajouterMesure(
    indicateurId: string,
    dto: CreateMesureDto,
    tenantId: string,
  ): Promise<MesureIndicateur> {
    const indicateur = await this.getIndicateur(indicateurId, tenantId);
    const existe = await this.mesureRepo.findOne({
      where: { tenantId, indicateurId, periode: dto.periode },
    });
    if (existe) {
      throw new ConflictException(
        `Une mesure existe déjà pour la période ${dto.periode}.`,
      );
    }
    const statut = this.evaluer(indicateur, dto.valeur);
    const mesure = this.mesureRepo.create({
      tenantId,
      indicateurId,
      typePeriode: dto.typePeriode,
      periode: dto.periode,
      valeur: dto.valeur,
      dateMesure: dto.dateMesure ?? new Date().toISOString().slice(0, 10),
      statut,
      commentaire: dto.commentaire ?? null,
    });
    return this.mesureRepo.save(mesure);
  }

  // ────────────────────────────────────────────────────────────────
  //  Critères d'accréditation — CRUD
  // ────────────────────────────────────────────────────────────────
  async listerCriteres(
    tenantId: string,
    referentiel?: string,
  ): Promise<CritereAccreditation[]> {
    const where: Record<string, unknown> = { tenantId };
    if (referentiel) where.referentiel = referentiel;
    return this.critereRepo.find({
      where,
      order: { referentiel: 'ASC', chapitre: 'ASC', createdAt: 'ASC' },
    });
  }

  async creerCritere(
    dto: CreateCritereDto,
    tenantId: string,
  ): Promise<CritereAccreditation> {
    const critere = this.critereRepo.create({
      tenantId,
      referentiel: dto.referentiel,
      chapitre: dto.chapitre ?? null,
      exigence: dto.exigence,
      statut: dto.statut ?? StatutConformite.NON_CONFORME,
      preuve: dto.preuve ?? null,
      responsableRef: dto.responsableRef ?? null,
      echeance: dto.echeance ?? null,
    });
    return this.critereRepo.save(critere);
  }

  async modifierCritere(
    id: string,
    dto: UpdateCritereDto,
    tenantId: string,
  ): Promise<CritereAccreditation> {
    const critere = await this.critereRepo.findOne({ where: { id, tenantId } });
    if (!critere) throw new NotFoundException(`Critère ${id} introuvable`);
    Object.assign(critere, {
      referentiel: dto.referentiel ?? critere.referentiel,
      chapitre: dto.chapitre !== undefined ? dto.chapitre : critere.chapitre,
      exigence: dto.exigence ?? critere.exigence,
      statut: dto.statut ?? critere.statut,
      preuve: dto.preuve !== undefined ? dto.preuve : critere.preuve,
      responsableRef:
        dto.responsableRef !== undefined
          ? dto.responsableRef
          : critere.responsableRef,
      echeance: dto.echeance !== undefined ? dto.echeance : critere.echeance,
    });
    return this.critereRepo.save(critere);
  }

  async supprimerCritere(id: string, tenantId: string): Promise<void> {
    const critere = await this.critereRepo.findOne({ where: { id, tenantId } });
    if (!critere) throw new NotFoundException(`Critère ${id} introuvable`);
    await this.critereRepo.remove(critere);
  }

  // ────────────────────────────────────────────────────────────────
  //  Tableau de bord — indicateurs + dernière mesure + tendance
  // ────────────────────────────────────────────────────────────────
  async tableauBord(tenantId: string): Promise<{
    indicateurs: Array<{
      indicateur: IndicateurQualite;
      derniere: MesureIndicateur | null;
      precedente: MesureIndicateur | null;
      tendance: 'hausse' | 'baisse' | 'stable' | null;
      historique: Array<{ periode: string; valeur: number }>;
    }>;
    resume: {
      totalIndicateurs: number;
      atteints: number;
      enAlerte: number;
      critiques: number;
      sansMesure: number;
    };
  }> {
    const indicateurs = await this.listerIndicateurs(tenantId, { actif: true });
    const mesures = await this.mesureRepo.find({
      where: { tenantId },
      order: { periode: 'ASC' },
    });

    const parIndicateur = new Map<string, MesureIndicateur[]>();
    for (const m of mesures) {
      const arr = parIndicateur.get(m.indicateurId) ?? [];
      arr.push(m);
      parIndicateur.set(m.indicateurId, arr);
    }

    let atteints = 0;
    let enAlerte = 0;
    let critiques = 0;
    let sansMesure = 0;

    const rows = indicateurs.map((indicateur) => {
      const hist = parIndicateur.get(indicateur.id) ?? [];
      const derniere = hist.length ? hist[hist.length - 1] : null;
      const precedente = hist.length > 1 ? hist[hist.length - 2] : null;

      let tendance: 'hausse' | 'baisse' | 'stable' | null = null;
      if (derniere && precedente) {
        const d = Number(derniere.valeur) - Number(precedente.valeur);
        tendance = d > 0 ? 'hausse' : d < 0 ? 'baisse' : 'stable';
      }

      if (!derniere) sansMesure++;
      else if (derniere.statut === StatutMesure.ATTEINT) atteints++;
      else if (derniere.statut === StatutMesure.ALERTE) enAlerte++;
      else if (derniere.statut === StatutMesure.CRITIQUE) critiques++;

      return {
        indicateur,
        derniere,
        precedente,
        tendance,
        historique: hist.map((m) => ({
          periode: m.periode,
          valeur: Number(m.valeur),
        })),
      };
    });

    return {
      indicateurs: rows,
      resume: {
        totalIndicateurs: indicateurs.length,
        atteints,
        enAlerte,
        critiques,
        sansMesure,
      },
    };
  }

  // ────────────────────────────────────────────────────────────────
  //  Stats globales (dashboard synthétique + conformité accréditation)
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<{
    indicateurs: {
      total: number;
      actifs: number;
      enAlerte: number;
      critiques: number;
      parDomaine: Record<string, number>;
    };
    accreditation: {
      totalCriteres: number;
      parStatut: Record<string, number>;
      tauxConformite: number;
      parReferentiel: Array<{
        referentiel: string;
        total: number;
        conformes: number;
        tauxConformite: number;
      }>;
    };
  }> {
    const indicateurs = await this.listerIndicateurs(tenantId);
    const bord = await this.tableauBord(tenantId);
    const parDomaine: Record<string, number> = {};
    for (const d of Object.values(DomaineIndicateur)) parDomaine[d] = 0;
    for (const i of indicateurs) parDomaine[i.domaine] = (parDomaine[i.domaine] ?? 0) + 1;

    const criteres = await this.critereRepo.find({ where: { tenantId } });
    const parStatut: Record<string, number> = {};
    for (const s of Object.values(StatutConformite)) parStatut[s] = 0;
    for (const c of criteres) parStatut[c.statut] = (parStatut[c.statut] ?? 0) + 1;

    // Taux de conformité : conformes / (total hors NA). Le partiel compte pour moitié.
    const tauxConf = (list: CritereAccreditation[]): number => {
      const applicables = list.filter((c) => c.statut !== StatutConformite.NA);
      if (applicables.length === 0) return 0;
      const score = applicables.reduce((acc, c) => {
        if (c.statut === StatutConformite.CONFORME) return acc + 1;
        if (c.statut === StatutConformite.PARTIEL) return acc + 0.5;
        return acc;
      }, 0);
      return Math.round((score / applicables.length) * 100);
    };

    const referentiels = [...new Set(criteres.map((c) => c.referentiel))];
    const parReferentiel = referentiels.map((referentiel) => {
      const list = criteres.filter((c) => c.referentiel === referentiel);
      const applicables = list.filter((c) => c.statut !== StatutConformite.NA);
      return {
        referentiel,
        total: list.length,
        conformes: list.filter((c) => c.statut === StatutConformite.CONFORME)
          .length,
        tauxConformite: tauxConf(applicables),
      };
    });

    return {
      indicateurs: {
        total: indicateurs.length,
        actifs: indicateurs.filter((i) => i.actif).length,
        enAlerte: bord.resume.enAlerte,
        critiques: bord.resume.critiques,
        parDomaine,
      },
      accreditation: {
        totalCriteres: criteres.length,
        parStatut,
        tauxConformite: tauxConf(criteres),
        parReferentiel,
      },
    };
  }
}
