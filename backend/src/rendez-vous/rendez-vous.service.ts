import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import {
  RendezVous,
  StatutRendezVous,
} from './entities/rendez-vous.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateRdvDto } from './dto/create-rdv.dto';
import { UpdateRdvDto } from './dto/update-rdv.dto';

export interface RdvFilters {
  medecinId?: string;
  patientId?: string;
  date?: string;
  statut?: StatutRendezVous;
}

export interface Pagination {
  page?: number;
  limit?: number;
}

@Injectable()
export class RendezVousService {
  constructor(
    @InjectRepository(RendezVous)
    private rdvRepository: Repository<RendezVous>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Hydrate en bulk (aucune boucle N+1) les objets `patient` et `medecin`,
   * en conservant `patientId`/`medecinId` (rétro-compat frontend).
   */
  private async enrichir<T extends { patientId?: string; medecinId?: string }>(
    records: T[],
    tenantId: string,
  ): Promise<(T & {
    patient: { id: string; nom: string; prenom: string; ipp: string } | null;
    medecin: { id: string; nom: string; prenom: string } | null;
  })[]> {
    if (records.length === 0) return [];

    const patientIds = [...new Set(records.map((r) => r.patientId).filter(Boolean))] as string[];
    const medecinIds = [...new Set(records.map((r) => r.medecinId).filter(Boolean))] as string[];

    const [patients, medecins] = await Promise.all([
      patientIds.length
        ? this.patientRepository.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      medecinIds.length
        ? this.userRepository.find({ where: { id: In(medecinIds), tenantId } })
        : Promise.resolve([] as User[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const mMap = new Map(medecins.map((m) => [m.id, m]));

    return records.map((r) => {
      const p = r.patientId ? pMap.get(r.patientId) : undefined;
      const m = r.medecinId ? mMap.get(r.medecinId) : undefined;
      return {
        ...r,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        medecin: m ? { id: m.id, nom: m.lastName, prenom: m.firstName } : null,
      };
    });
  }

  async create(dto: CreateRdvDto, tenantId: string, userId: string) {
    await this.checkDisponibilite(
      dto.medecinId,
      new Date(dto.dateHeure),
      dto.dureeMinutes ?? 30,
      tenantId,
    );

    const rdv = this.rdvRepository.create({
      ...dto,
      dateHeure: new Date(dto.dateHeure),
      dureeMinutes: dto.dureeMinutes ?? 30,
      tenantId,
      createdById: userId,
    });
    return this.rdvRepository.save(rdv);
  }

  async findAll(tenantId: string, filters: RdvFilters = {}, pagination: Pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const where: any = { tenantId };

    if (filters.medecinId) where.medecinId = filters.medecinId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.statut) where.statut = filters.statut;

    if (filters.date) {
      const dateDebut = new Date(filters.date);
      dateDebut.setHours(0, 0, 0, 0);
      const dateFin = new Date(filters.date);
      dateFin.setHours(23, 59, 59, 999);
      where.dateHeure = Between(dateDebut, dateFin);
    }

    const [data, total] = await this.rdvRepository.findAndCount({
      where,
      order: { dateHeure: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findByMedecin(medecinId: string, date: string, tenantId: string) {
    const dateDebut = new Date(date);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(date);
    dateFin.setHours(23, 59, 59, 999);

    const data = await this.rdvRepository.find({
      where: {
        medecinId,
        tenantId,
        dateHeure: Between(dateDebut, dateFin),
      },
      order: { dateHeure: 'ASC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findByPatient(patientId: string, tenantId: string) {
    const data = await this.rdvRepository.find({
      where: { patientId, tenantId },
      order: { dateHeure: 'DESC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findOne(id: string, tenantId: string) {
    const rdv = await this.rdvRepository.findOne({ where: { id, tenantId } });
    if (!rdv) throw new NotFoundException(`Rendez-vous ${id} introuvable`);
    return rdv;
  }

  async update(id: string, dto: UpdateRdvDto, tenantId: string) {
    const rdv = await this.findOne(id, tenantId);
    Object.assign(rdv, dto);
    if (dto.dateHeure) rdv.dateHeure = new Date(dto.dateHeure);
    return this.rdvRepository.save(rdv);
  }

  async annuler(id: string, tenantId: string) {
    const rdv = await this.findOne(id, tenantId);
    rdv.statut = StatutRendezVous.ANNULE;
    return this.rdvRepository.save(rdv);
  }

  async confirmer(id: string, tenantId: string) {
    const rdv = await this.findOne(id, tenantId);
    rdv.statut = StatutRendezVous.CONFIRME;
    return this.rdvRepository.save(rdv);
  }

  async checkDisponibilite(
    medecinId: string,
    dateHeure: Date,
    dureeMinutes: number,
    tenantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const fin = new Date(dateHeure.getTime() + dureeMinutes * 60 * 1000);

    const conflits = await this.rdvRepository
      .createQueryBuilder('rdv')
      .where('rdv.medecinId = :medecinId', { medecinId })
      .andWhere('rdv.tenantId = :tenantId', { tenantId })
      .andWhere('rdv.statut NOT IN (:...statuts)', {
        statuts: [StatutRendezVous.ANNULE, StatutRendezVous.ABSENT],
      })
      .andWhere('rdv.dateHeure < :fin', { fin })
      .andWhere(
        `rdv.dateHeure + rdv."dureeMinutes" * interval '1 minute' > :debut`,
        { debut: dateHeure },
      )
      .andWhere(excludeId ? 'rdv.id != :excludeId' : '1=1', { excludeId })
      .getCount();

    if (conflits > 0) {
      throw new ConflictException(
        'Le médecin a déjà un rendez-vous sur ce créneau.',
      );
    }
    return true;
  }

  async getCreneauxDisponibles(
    medecinId: string,
    date: string,
    tenantId: string,
  ) {
    const rdvDuJour = await this.findByMedecin(medecinId, date, tenantId);

    // Créneaux de 8h à 18h, toutes les 30 minutes
    const creneaux: { heure: string; disponible: boolean }[] = [];
    const baseDate = new Date(date);

    for (let h = 8; h < 18; h++) {
      for (const m of [0, 30]) {
        const debut = new Date(baseDate);
        debut.setHours(h, m, 0, 0);
        const fin = new Date(debut.getTime() + 30 * 60 * 1000);

        const conflit = rdvDuJour.some((rdv) => {
          if ([StatutRendezVous.ANNULE, StatutRendezVous.ABSENT].includes(rdv.statut)) return false;
          const rdvFin = new Date(rdv.dateHeure.getTime() + rdv.dureeMinutes * 60 * 1000);
          return rdv.dateHeure < fin && rdvFin > debut;
        });

        creneaux.push({
          heure: debut.toISOString(),
          disponible: !conflit,
        });
      }
    }

    return creneaux;
  }
}
