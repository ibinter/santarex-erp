import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import {
  PriseEnChargeHAD,
  StatutHAD,
} from './entities/prise-en-charge-had.entity';
import {
  VisiteHAD,
  StatutVisiteHAD,
} from './entities/visite-had.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreatePriseEnChargeDto } from './dto/create-prise-en-charge.dto';
import { UpdatePriseEnChargeDto } from './dto/update-prise-en-charge.dto';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';

@Injectable()
export class HadService {
  constructor(
    @InjectRepository(PriseEnChargeHAD)
    private readonly hadRepo: Repository<PriseEnChargeHAD>,
    @InjectRepository(VisiteHAD)
    private readonly visiteRepo: Repository<VisiteHAD>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Hydrate en bulk `patient` et `medecin` (aucune boucle N+1).
   */
  private async enrichir<T extends { patientId?: string; medecinReferentRef?: string }>(
    records: T[],
    tenantId: string,
  ): Promise<(T & {
    patient: { id: string; nom: string; prenom: string; ipp: string } | null;
    medecin: { id: string; nom: string; prenom: string } | null;
  })[]> {
    if (records.length === 0) return [];

    const patientIds = [...new Set(records.map((r) => r.patientId).filter(Boolean))] as string[];
    const medecinIds = [...new Set(records.map((r) => r.medecinReferentRef).filter(Boolean))] as string[];

    const [patients, medecins] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      medecinIds.length
        ? this.userRepo.find({ where: { id: In(medecinIds), tenantId } })
        : Promise.resolve([] as User[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const mMap = new Map(medecins.map((m) => [m.id, m]));

    return records.map((r) => {
      const p = r.patientId ? pMap.get(r.patientId) : undefined;
      const m = r.medecinReferentRef ? mMap.get(r.medecinReferentRef) : undefined;
      return {
        ...r,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        medecin: m ? { id: m.id, nom: m.lastName, prenom: m.firstName } : null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Génération du numéro HAD-AAAA-NNNN
  // ─────────────────────────────────────────────────────────────────────────
  async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.hadRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(4, '0');
    return `HAD-${annee}-${seq}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Prises en charge — CRUD
  // ─────────────────────────────────────────────────────────────────────────
  async admettre(
    dto: CreatePriseEnChargeDto,
    tenantId: string,
    userId?: string,
  ): Promise<PriseEnChargeHAD> {
    // Empêcher deux prises en charge actives pour le même patient
    const active = await this.hadRepo.findOne({
      where: { patientId: dto.patientId, statut: StatutHAD.ACTIVE, tenantId },
    });
    if (active) {
      throw new BadRequestException(
        `Le patient a déjà une prise en charge HAD active (${active.numero})`,
      );
    }

    const numero = await this.genererNumero(tenantId);
    const had = this.hadRepo.create({
      ...dto,
      numero,
      statut: dto.statut ?? StatutHAD.ACTIVE,
      tenantId,
      createdById: userId,
    });
    return this.hadRepo.save(had);
  }

  async findAll(
    tenantId: string,
    filters: { statut?: StatutHAD; patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.hadRepo
      .createQueryBuilder('h')
      .where('h.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('h.statut = :statut', { statut: filters.statut });
    if (filters.patientId) qb.andWhere('h.patientId = :patientId', { patientId: filters.patientId });

    const [data, total] = await qb
      .orderBy('h.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const had = await this.hadRepo.findOne({ where: { id, tenantId } });
    if (!had) throw new NotFoundException(`Prise en charge HAD ${id} introuvable`);
    const [enriched] = await this.enrichir([had], tenantId);
    const visites = await this.visiteRepo.find({
      where: { hadId: id, tenantId },
      order: { dateVisite: 'ASC' },
    });
    return { ...enriched, visites };
  }

  async update(
    id: string,
    dto: UpdatePriseEnChargeDto,
    tenantId: string,
  ): Promise<PriseEnChargeHAD> {
    const had = await this.hadRepo.findOne({ where: { id, tenantId } });
    if (!had) throw new NotFoundException(`Prise en charge HAD ${id} introuvable`);
    Object.assign(had, dto);
    return this.hadRepo.save(had);
  }

  async changerStatut(
    id: string,
    statut: StatutHAD,
    tenantId: string,
    motif?: string,
  ): Promise<PriseEnChargeHAD> {
    const had = await this.hadRepo.findOne({ where: { id, tenantId } });
    if (!had) throw new NotFoundException(`Prise en charge HAD ${id} introuvable`);

    had.statut = statut;
    if (motif) had.motifCloture = motif;
    if (statut === StatutHAD.TERMINEE && !had.dateFinReelle) {
      had.dateFinReelle = new Date().toISOString().split('T')[0];
    }
    return this.hadRepo.save(had);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Visites
  // ─────────────────────────────────────────────────────────────────────────
  async findVisites(hadId: string, tenantId: string): Promise<VisiteHAD[]> {
    // Vérifie que la prise en charge existe dans ce tenant
    const had = await this.hadRepo.findOne({ where: { id: hadId, tenantId } });
    if (!had) throw new NotFoundException(`Prise en charge HAD ${hadId} introuvable`);
    return this.visiteRepo.find({
      where: { hadId, tenantId },
      order: { dateVisite: 'ASC' },
    });
  }

  async planifierVisite(
    hadId: string,
    dto: CreateVisiteDto,
    tenantId: string,
    userId?: string,
  ): Promise<VisiteHAD> {
    const had = await this.hadRepo.findOne({ where: { id: hadId, tenantId } });
    if (!had) throw new NotFoundException(`Prise en charge HAD ${hadId} introuvable`);
    if (had.statut === StatutHAD.TERMINEE) {
      throw new BadRequestException(
        'Impossible de planifier une visite : la prise en charge est terminée',
      );
    }

    const visite = this.visiteRepo.create({
      hadId,
      patientId: had.patientId,
      dateVisite: new Date(dto.dateVisite),
      type: dto.type,
      intervenantRef: dto.intervenantRef,
      statut: dto.statut ?? StatutVisiteHAD.PLANIFIEE,
      observations: dto.observations,
      actesRealises: dto.actesRealises,
      prochaineVisite: dto.prochaineVisite ? new Date(dto.prochaineVisite) : null,
      tenantId,
      createdById: userId,
    });
    return this.visiteRepo.save(visite);
  }

  async majVisite(
    hadId: string,
    visiteId: string,
    dto: UpdateVisiteDto,
    tenantId: string,
  ): Promise<VisiteHAD> {
    const visite = await this.visiteRepo.findOne({
      where: { id: visiteId, hadId, tenantId },
    });
    if (!visite) throw new NotFoundException(`Visite ${visiteId} introuvable`);

    if (dto.dateVisite !== undefined) visite.dateVisite = new Date(dto.dateVisite);
    if (dto.type !== undefined) visite.type = dto.type;
    if (dto.intervenantRef !== undefined) visite.intervenantRef = dto.intervenantRef;
    if (dto.observations !== undefined) visite.observations = dto.observations;
    if (dto.actesRealises !== undefined) visite.actesRealises = dto.actesRealises;
    if (dto.motifChangement !== undefined) visite.motifChangement = dto.motifChangement;
    if (dto.prochaineVisite !== undefined) {
      visite.prochaineVisite = dto.prochaineVisite ? new Date(dto.prochaineVisite) : null;
    }
    if (dto.dateRealisation !== undefined) {
      visite.dateRealisation = dto.dateRealisation ? new Date(dto.dateRealisation) : null;
    }
    if (dto.statut !== undefined) {
      visite.statut = dto.statut;
      // Marque automatiquement la date de réalisation si effectuée
      if (dto.statut === StatutVisiteHAD.EFFECTUEE && !visite.dateRealisation) {
        visite.dateRealisation = new Date();
      }
    }
    return this.visiteRepo.save(visite);
  }

  /**
   * Agenda des visites du jour (toutes prises en charge du tenant).
   */
  async visitesJour(tenantId: string): Promise<any[]> {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const visites = await this.visiteRepo
      .createQueryBuilder('v')
      .where('v.tenantId = :tenantId', { tenantId })
      .andWhere('v.dateVisite BETWEEN :debut AND :fin', { debut, fin })
      .orderBy('v.dateVisite', 'ASC')
      .getMany();

    return this.enrichir(visites, tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistiques
  // ─────────────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    const maintenant = new Date();

    const [actives, suspendues, terminees, total] = await Promise.all([
      this.hadRepo.count({ where: { tenantId, statut: StatutHAD.ACTIVE } }),
      this.hadRepo.count({ where: { tenantId, statut: StatutHAD.SUSPENDUE } }),
      this.hadRepo.count({ where: { tenantId, statut: StatutHAD.TERMINEE } }),
      this.hadRepo.count({ where: { tenantId } }),
    ]);

    const visitesJour = await this.visiteRepo
      .createQueryBuilder('v')
      .where('v.tenantId = :tenantId', { tenantId })
      .andWhere('v.dateVisite BETWEEN :debut AND :fin', { debut, fin })
      .getCount();

    // Visites planifiées dont la date est dépassée (en retard)
    const visitesEnRetard = await this.visiteRepo.count({
      where: {
        tenantId,
        statut: StatutVisiteHAD.PLANIFIEE,
        dateVisite: LessThan(maintenant),
      },
    });

    return {
      date: new Date().toISOString().split('T')[0],
      prisesEnCharge: { total, actives, suspendues, terminees },
      visites: { aujourdhui: visitesJour, enRetard: visitesEnRetard },
    };
  }
}
