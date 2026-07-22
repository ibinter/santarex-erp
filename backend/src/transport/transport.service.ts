import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Vehicule,
  StatutVehicule,
  TypeVehicule,
} from './entities/vehicule.entity';
import {
  MissionTransport,
  StatutMission,
} from './entities/mission-transport.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto, TerminerMissionDto } from './dto/update-mission.dto';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(Vehicule)
    private vehiculeRepo: Repository<Vehicule>,
    @InjectRepository(MissionTransport)
    private missionRepo: Repository<MissionTransport>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  // ─────────────────────────────── VÉHICULES ────────────────────────────────

  /** Indique si un véhicule nécessite un entretien (km ou date dépassés). */
  private evaluerEntretien(v: Vehicule): boolean {
    const parKm =
      v.seuilEntretienKm != null &&
      Number(v.kilometrage) >= Number(v.seuilEntretienKm);
    const parDate =
      !!v.dateProchainEntretien &&
      new Date(v.dateProchainEntretien).getTime() <= Date.now();
    return parKm || parDate;
  }

  private decoreVehicule(v: Vehicule) {
    return { ...v, entretienRequis: this.evaluerEntretien(v) };
  }

  async createVehicule(
    dto: CreateVehiculeDto,
    tenantId: string,
    userId: string,
  ): Promise<Vehicule> {
    const existant = await this.vehiculeRepo.findOne({
      where: { immatriculation: dto.immatriculation, tenantId },
    });
    if (existant) {
      throw new BadRequestException(
        `Un véhicule avec l'immatriculation ${dto.immatriculation} existe déjà`,
      );
    }
    const vehicule = this.vehiculeRepo.create({
      ...dto,
      tenantId,
      createdById: userId,
    });
    return this.vehiculeRepo.save(vehicule);
  }

  async findAllVehicules(
    tenantId: string,
    filters: { statut?: StatutVehicule; type?: TypeVehicule } = {},
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.statut) where.statut = filters.statut;
    if (filters.type) where.type = filters.type;
    const vehicules = await this.vehiculeRepo.find({
      where,
      order: { immatriculation: 'ASC' },
    });
    return vehicules.map((v) => this.decoreVehicule(v));
  }

  async findOneVehicule(id: string, tenantId: string): Promise<Vehicule> {
    const vehicule = await this.vehiculeRepo.findOne({ where: { id, tenantId } });
    if (!vehicule) throw new NotFoundException(`Véhicule ${id} non trouvé`);
    return vehicule;
  }

  async updateVehicule(
    id: string,
    dto: UpdateVehiculeDto,
    tenantId: string,
  ): Promise<Vehicule> {
    await this.findOneVehicule(id, tenantId);
    await this.vehiculeRepo.update({ id, tenantId }, dto);
    return this.decoreVehicule(await this.findOneVehicule(id, tenantId));
  }

  async removeVehicule(id: string, tenantId: string): Promise<{ deleted: boolean }> {
    const vehicule = await this.findOneVehicule(id, tenantId);
    if (vehicule.statut === StatutVehicule.EN_MISSION) {
      throw new BadRequestException(
        'Impossible de supprimer un véhicule actuellement en mission',
      );
    }
    await this.vehiculeRepo.delete({ id, tenantId });
    return { deleted: true };
  }

  // ─────────────────────────────── MISSIONS ─────────────────────────────────

  private async genererNumero(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MIS-${year}-`;
    const dernier = await this.missionRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('m.numero', 'DESC')
      .getOne();

    let sequence = 1;
    if (dernier) {
      const parts = dernier.numero.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /** Hydrate le patient (nom/prénom/ipp) et le véhicule en bulk, sans N+1. */
  private async enrichirMissions(missions: MissionTransport[], tenantId: string) {
    if (missions.length === 0) return [];

    const patientIds = [
      ...new Set(missions.map((m) => m.patientId).filter(Boolean)),
    ] as string[];
    const vehiculeIds = [
      ...new Set(missions.map((m) => m.vehiculeId).filter(Boolean)),
    ] as string[];

    const [patients, vehicules] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      vehiculeIds.length
        ? this.vehiculeRepo.find({ where: { id: In(vehiculeIds), tenantId } })
        : Promise.resolve([] as Vehicule[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const vMap = new Map(vehicules.map((v) => [v.id, v]));

    return missions.map((m) => {
      const p = m.patientId ? pMap.get(m.patientId) : undefined;
      const v = vMap.get(m.vehiculeId);
      return {
        ...m,
        patient: p
          ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp }
          : null,
        vehicule: v
          ? { id: v.id, immatriculation: v.immatriculation, type: v.type }
          : null,
      };
    });
  }

  /** Planifie une mission : réserve le véhicule (→ en_mission). */
  async createMission(
    dto: CreateMissionDto,
    tenantId: string,
    userId: string,
  ): Promise<MissionTransport> {
    const vehicule = await this.findOneVehicule(dto.vehiculeId, tenantId);
    if (vehicule.statut !== StatutVehicule.DISPONIBLE) {
      throw new BadRequestException(
        `Le véhicule ${vehicule.immatriculation} n'est pas disponible (statut: ${vehicule.statut})`,
      );
    }

    const numero = await this.genererNumero(tenantId);
    const mission = this.missionRepo.create({
      numero,
      vehiculeId: dto.vehiculeId,
      type: dto.type,
      patientId: dto.patientId,
      origine: dto.origine,
      destination: dto.destination,
      dateDepart: dto.dateDepart ? new Date(dto.dateDepart) : new Date(),
      chauffeurRef: dto.chauffeurRef,
      accompagnantMedical: dto.accompagnantMedical ?? false,
      distanceKm: dto.distanceKm,
      cout: dto.cout,
      notes: dto.notes,
      statut: StatutMission.PLANIFIEE,
      tenantId,
      createdById: userId,
    });
    const saved = await this.missionRepo.save(mission);

    // Réservation du véhicule.
    await this.vehiculeRepo.update(
      { id: vehicule.id, tenantId },
      { statut: StatutVehicule.EN_MISSION },
    );

    return saved;
  }

  async findAllMissions(
    tenantId: string,
    filters: { statut?: StatutMission; vehiculeId?: string; date?: string } = {},
  ) {
    const qb = this.missionRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });

    if (filters.statut)
      qb.andWhere('m.statut = :statut', { statut: filters.statut });
    if (filters.vehiculeId)
      qb.andWhere('m.vehiculeId = :vehiculeId', {
        vehiculeId: filters.vehiculeId,
      });
    if (filters.date) {
      const d = new Date(filters.date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      qb.andWhere('m.dateDepart BETWEEN :debut AND :fin', {
        debut: d,
        fin: dEnd,
      });
    }

    const missions = await qb.orderBy('m.dateDepart', 'DESC').getMany();
    return this.enrichirMissions(missions, tenantId);
  }

  async findOneMission(id: string, tenantId: string): Promise<MissionTransport> {
    const mission = await this.missionRepo.findOne({ where: { id, tenantId } });
    if (!mission) throw new NotFoundException(`Mission ${id} non trouvée`);
    return mission;
  }

  async updateMission(
    id: string,
    dto: UpdateMissionDto,
    tenantId: string,
  ): Promise<MissionTransport> {
    const mission = await this.findOneMission(id, tenantId);
    if (
      mission.statut === StatutMission.TERMINEE ||
      mission.statut === StatutMission.ANNULEE
    ) {
      throw new BadRequestException(
        'Impossible de modifier une mission terminée ou annulée',
      );
    }
    const { dateDepart, ...rest } = dto;
    const patch: Partial<MissionTransport> = { ...(rest as Partial<MissionTransport>) };
    if (dateDepart) patch.dateDepart = new Date(dateDepart);
    await this.missionRepo.update({ id, tenantId }, patch);
    return this.findOneMission(id, tenantId);
  }

  /** Démarre une mission planifiée (→ en_cours). */
  async demarrerMission(id: string, tenantId: string): Promise<MissionTransport> {
    const mission = await this.findOneMission(id, tenantId);
    if (mission.statut !== StatutMission.PLANIFIEE) {
      throw new BadRequestException(
        'Seule une mission planifiée peut être démarrée',
      );
    }
    await this.missionRepo.update(
      { id, tenantId },
      { statut: StatutMission.EN_COURS, dateDepart: new Date() },
    );
    return this.findOneMission(id, tenantId);
  }

  /**
   * Clôture une mission : libère le véhicule, enregistre durée et km parcourus,
   * met à jour le kilométrage du véhicule.
   */
  async terminerMission(
    id: string,
    dto: TerminerMissionDto,
    tenantId: string,
  ): Promise<MissionTransport> {
    const mission = await this.findOneMission(id, tenantId);
    if (
      mission.statut !== StatutMission.EN_COURS &&
      mission.statut !== StatutMission.PLANIFIEE
    ) {
      throw new BadRequestException(
        'Seule une mission en cours ou planifiée peut être clôturée',
      );
    }

    const dateArrivee = dto.dateArrivee ? new Date(dto.dateArrivee) : new Date();
    const dureeMinutes = Math.max(
      0,
      Math.round(
        (dateArrivee.getTime() - new Date(mission.dateDepart).getTime()) / 60000,
      ),
    );

    await this.missionRepo.update(
      { id, tenantId },
      {
        statut: StatutMission.TERMINEE,
        dateArrivee,
        dureeMinutes,
        distanceKm: dto.distanceKm ?? mission.distanceKm,
        cout: dto.cout ?? mission.cout,
      },
    );

    // Libération du véhicule + mise à jour du kilométrage.
    const vehicule = await this.vehiculeRepo.findOne({
      where: { id: mission.vehiculeId, tenantId },
    });
    if (vehicule) {
      const patch: Partial<Vehicule> = { statut: StatutVehicule.DISPONIBLE };
      if (dto.kilometrageArrivee != null) {
        patch.kilometrage = dto.kilometrageArrivee;
      } else if (dto.distanceKm != null) {
        patch.kilometrage = Number(vehicule.kilometrage) + Math.round(dto.distanceKm);
      }
      await this.vehiculeRepo.update({ id: vehicule.id, tenantId }, patch);
    }

    return this.findOneMission(id, tenantId);
  }

  /** Annule une mission et libère le véhicule s'il était réservé. */
  async annulerMission(id: string, tenantId: string): Promise<MissionTransport> {
    const mission = await this.findOneMission(id, tenantId);
    if (mission.statut === StatutMission.TERMINEE) {
      throw new BadRequestException('Impossible d\'annuler une mission terminée');
    }
    await this.missionRepo.update(
      { id, tenantId },
      { statut: StatutMission.ANNULEE },
    );
    const vehicule = await this.vehiculeRepo.findOne({
      where: { id: mission.vehiculeId, tenantId },
    });
    if (vehicule && vehicule.statut === StatutVehicule.EN_MISSION) {
      await this.vehiculeRepo.update(
        { id: vehicule.id, tenantId },
        { statut: StatutVehicule.DISPONIBLE },
      );
    }
    return this.findOneMission(id, tenantId);
  }

  // ──────────────────────────────── STATS ───────────────────────────────────

  async getStats(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const vehicules = await this.vehiculeRepo.find({ where: { tenantId } });
    const parcParStatut = vehicules.reduce(
      (acc, v) => {
        acc[v.statut] = (acc[v.statut] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const entretienRequis = vehicules.filter((v) =>
      this.evaluerEntretien(v),
    ).length;

    const missionsDuJour = await this.missionRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.dateDepart BETWEEN :debut AND :fin', {
        debut: today,
        fin: todayEnd,
      })
      .getCount();

    const missionsEnCours = await this.missionRepo.count({
      where: { tenantId, statut: StatutMission.EN_COURS },
    });

    const kmMoisRaw = await this.missionRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.distanceKm), 0)', 'total')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.statut = :statut', { statut: StatutMission.TERMINEE })
      .andWhere('m.dateArrivee >= :debutMois', { debutMois })
      .getRawOne();

    return {
      totalVehicules: vehicules.length,
      vehiculesDisponibles: parcParStatut[StatutVehicule.DISPONIBLE] ?? 0,
      parcParStatut,
      entretienRequis,
      missionsDuJour,
      missionsEnCours,
      kmParcourusMois: Number(kmMoisRaw?.total ?? 0),
    };
  }
}
