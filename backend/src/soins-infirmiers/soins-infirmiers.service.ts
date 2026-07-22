import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { TransmissionCiblee } from './entities/transmission-ciblee.entity';
import { PlanSoins, StatutPlanSoins } from './entities/plan-soins.entity';
import { ActeSoin } from './entities/acte-soin.entity';
import {
  EvaluationDouleur,
  EchelleDouleur,
} from './entities/evaluation-douleur.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateTransmissionDto } from './dto/create-transmission.dto';
import {
  CreatePlanSoinsDto,
  UpdatePlanSoinsDto,
} from './dto/create-plan-soins.dto';
import {
  CreateActeSoinDto,
  UpdateActeSoinDto,
} from './dto/create-acte-soin.dto';
import { CreateEvaluationDouleurDto } from './dto/create-evaluation-douleur.dto';

export type NiveauDouleur = 'aucune' | 'legere' | 'moderee' | 'intense';

@Injectable()
export class SoinsInfirmiersService {
  constructor(
    @InjectRepository(TransmissionCiblee)
    private readonly transmissionRepo: Repository<TransmissionCiblee>,
    @InjectRepository(PlanSoins)
    private readonly planRepo: Repository<PlanSoins>,
    @InjectRepository(ActeSoin)
    private readonly acteRepo: Repository<ActeSoin>,
    @InjectRepository(EvaluationDouleur)
    private readonly douleurRepo: Repository<EvaluationDouleur>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ───────────────────────────────────────────────────────────────────────
  // Enrichissement (bulk, sans N+1) : patient + infirmier
  // ───────────────────────────────────────────────────────────────────────
  private async enrichir<T extends { patientId?: string; infirmierRef?: string }>(
    records: T[],
    tenantId: string,
  ): Promise<(T & {
    patient: { id: string; nom: string; prenom: string; ipp: string } | null;
    infirmier: { id: string; nom: string; prenom: string } | null;
  })[]> {
    if (records.length === 0) return [];

    const patientIds = [
      ...new Set(records.map((r) => r.patientId).filter(Boolean)),
    ] as string[];
    const infIds = [
      ...new Set(records.map((r) => r.infirmierRef).filter(Boolean)),
    ] as string[];

    const [patients, infirmiers] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      infIds.length
        ? this.userRepo.find({ where: { id: In(infIds), tenantId } })
        : Promise.resolve([] as User[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const iMap = new Map(infirmiers.map((u) => [u.id, u]));

    return records.map((r) => {
      const p = r.patientId ? pMap.get(r.patientId) : undefined;
      const i = r.infirmierRef ? iMap.get(r.infirmierRef) : undefined;
      return {
        ...r,
        patient: p
          ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp }
          : null,
        infirmier: i
          ? { id: i.id, nom: i.lastName, prenom: i.firstName }
          : null,
      };
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // Interprétation du score de douleur selon l'échelle
  // ───────────────────────────────────────────────────────────────────────
  interpreterDouleur(
    echelle: EchelleDouleur,
    score: number,
  ): { niveau: NiveauDouleur; max: number } {
    // Bornes maximales par échelle
    const max =
      echelle === EchelleDouleur.CPOT
        ? 8
        : echelle === EchelleDouleur.EVENDOL
          ? 15
          : 10; // EVA / EN

    // Ramené sur une base 0-10 pour une interprétation homogène
    const normalized = max > 0 ? (score / max) * 10 : 0;

    let niveau: NiveauDouleur;
    if (normalized <= 0) niveau = 'aucune';
    else if (normalized < 4) niveau = 'legere';
    else if (normalized < 7) niveau = 'moderee';
    else niveau = 'intense';

    return { niveau, max };
  }

  // ───────────────────────────────────────────────────────────────────────
  // Transmissions ciblées (DAR)
  // ───────────────────────────────────────────────────────────────────────
  async createTransmission(
    dto: CreateTransmissionDto,
    tenantId: string,
    infirmierRef: string,
  ): Promise<TransmissionCiblee> {
    const t = this.transmissionRepo.create({
      patientId: dto.patientId,
      sejourId: dto.sejourId ?? null,
      date: dto.date ? new Date(dto.date) : new Date(),
      cible: dto.cible,
      donnees: dto.donnees,
      actions: dto.actions,
      resultats: dto.resultats,
      infirmierRef,
      tenantId,
    });
    return this.transmissionRepo.save(t);
  }

  async findTransmissions(
    tenantId: string,
    filters: { patientId?: string; sejourId?: string } = {},
  ) {
    const qb = this.transmissionRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('t.patientId = :patientId', { patientId: filters.patientId });
    if (filters.sejourId)
      qb.andWhere('t.sejourId = :sejourId', { sejourId: filters.sejourId });
    const data = await qb.orderBy('t.date', 'DESC').getMany();
    return this.enrichir(data, tenantId);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Plan de soins
  // ───────────────────────────────────────────────────────────────────────
  async createPlan(
    dto: CreatePlanSoinsDto,
    tenantId: string,
    infirmierRef: string,
  ): Promise<PlanSoins> {
    const plan = this.planRepo.create({
      patientId: dto.patientId,
      sejourId: dto.sejourId ?? null,
      diagnostic: dto.diagnostic,
      objectif: dto.objectif,
      interventions: dto.interventions,
      echeance: dto.echeance ? new Date(dto.echeance) : null,
      statut: dto.statut ?? StatutPlanSoins.ACTIF,
      infirmierRef,
      tenantId,
    });
    return this.planRepo.save(plan);
  }

  async findPlans(
    tenantId: string,
    filters: { patientId?: string; sejourId?: string; statut?: StatutPlanSoins } = {},
  ) {
    const qb = this.planRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('p.patientId = :patientId', { patientId: filters.patientId });
    if (filters.sejourId)
      qb.andWhere('p.sejourId = :sejourId', { sejourId: filters.sejourId });
    if (filters.statut)
      qb.andWhere('p.statut = :statut', { statut: filters.statut });
    const data = await qb.orderBy('p.createdAt', 'DESC').getMany();
    return this.enrichir(data, tenantId);
  }

  async updatePlan(
    id: string,
    dto: UpdatePlanSoinsDto,
    tenantId: string,
  ): Promise<PlanSoins> {
    const plan = await this.planRepo.findOne({ where: { id, tenantId } });
    if (!plan) throw new NotFoundException(`Plan de soins ${id} introuvable`);
    if (dto.diagnostic !== undefined) plan.diagnostic = dto.diagnostic;
    if (dto.objectif !== undefined) plan.objectif = dto.objectif;
    if (dto.interventions !== undefined) plan.interventions = dto.interventions;
    if (dto.echeance !== undefined)
      plan.echeance = dto.echeance ? new Date(dto.echeance) : null;
    if (dto.statut !== undefined) plan.statut = dto.statut;
    return this.planRepo.save(plan);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Actes de soin (feuille de soins)
  // ───────────────────────────────────────────────────────────────────────
  async createActe(
    dto: CreateActeSoinDto,
    tenantId: string,
    infirmierRef: string,
  ): Promise<ActeSoin> {
    const acte = this.acteRepo.create({
      patientId: dto.patientId,
      sejourId: dto.sejourId ?? null,
      date: dto.date ? new Date(dto.date) : new Date(),
      type: dto.type,
      description: dto.description,
      realise: dto.realise ?? false,
      infirmierRef,
      tenantId,
    });
    return this.acteRepo.save(acte);
  }

  async findActes(
    tenantId: string,
    filters: { patientId?: string; sejourId?: string } = {},
  ) {
    const qb = this.acteRepo
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('a.patientId = :patientId', { patientId: filters.patientId });
    if (filters.sejourId)
      qb.andWhere('a.sejourId = :sejourId', { sejourId: filters.sejourId });
    const data = await qb.orderBy('a.date', 'DESC').getMany();
    return this.enrichir(data, tenantId);
  }

  async updateActe(
    id: string,
    dto: UpdateActeSoinDto,
    tenantId: string,
  ): Promise<ActeSoin> {
    const acte = await this.acteRepo.findOne({ where: { id, tenantId } });
    if (!acte) throw new NotFoundException(`Acte de soin ${id} introuvable`);
    if (dto.type !== undefined) acte.type = dto.type;
    if (dto.description !== undefined) acte.description = dto.description;
    if (dto.realise !== undefined) acte.realise = dto.realise;
    return this.acteRepo.save(acte);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Évaluation de la douleur
  // ───────────────────────────────────────────────────────────────────────
  async createDouleur(
    dto: CreateEvaluationDouleurDto,
    tenantId: string,
    infirmierRef: string,
  ) {
    const evalD = this.douleurRepo.create({
      patientId: dto.patientId,
      sejourId: dto.sejourId ?? null,
      date: dto.date ? new Date(dto.date) : new Date(),
      echelle: dto.echelle,
      score: dto.score,
      localisation: dto.localisation,
      traitementAdministre: dto.traitementAdministre,
      reevaluation: dto.reevaluation ? new Date(dto.reevaluation) : null,
      infirmierRef,
      tenantId,
    });
    const saved = await this.douleurRepo.save(evalD);
    const interp = this.interpreterDouleur(saved.echelle, saved.score);
    return { ...saved, ...interp };
  }

  async findDouleurs(
    tenantId: string,
    filters: { patientId?: string; sejourId?: string } = {},
  ) {
    const qb = this.douleurRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('d.patientId = :patientId', { patientId: filters.patientId });
    if (filters.sejourId)
      qb.andWhere('d.sejourId = :sejourId', { sejourId: filters.sejourId });
    const data = await qb.orderBy('d.date', 'DESC').getMany();
    const enriched = await this.enrichir(data, tenantId);
    return enriched.map((d) => ({
      ...d,
      ...this.interpreterDouleur(d.echelle, d.score),
    }));
  }

  // ───────────────────────────────────────────────────────────────────────
  // Statistiques
  // ───────────────────────────────────────────────────────────────────────
  async getStats(tenantId: string) {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const transmissionsJour = await this.transmissionRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId })
      .andWhere('t.date >= :debutJour', { debutJour })
      .getCount();

    const plansActifs = await this.planRepo.count({
      where: { tenantId, statut: StatutPlanSoins.ACTIF },
    });

    const actesNonRealises = await this.acteRepo.count({
      where: { tenantId, realise: false },
    });

    // Douleurs élevées non réévaluées (score >= 4 et pas de réévaluation planifiée)
    const douleursOuvertes = await this.douleurRepo.find({
      where: { tenantId, reevaluation: IsNull() },
    });
    const douleursNonReevaluees = douleursOuvertes.filter(
      (d) => this.interpreterDouleur(d.echelle, d.score).niveau !== 'aucune',
    ).length;

    return {
      date: new Date().toISOString().split('T')[0],
      transmissionsJour,
      plansActifs,
      actesNonRealises,
      douleursNonReevaluees,
    };
  }
}
