import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import {
  RendezVous,
  StatutRendezVous,
} from './entities/rendez-vous.entity';
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
  ) {}

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

    return { data, total, page, limit };
  }

  async findByMedecin(medecinId: string, date: string, tenantId: string) {
    const dateDebut = new Date(date);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(date);
    dateFin.setHours(23, 59, 59, 999);

    return this.rdvRepository.find({
      where: {
        medecinId,
        tenantId,
        dateHeure: Between(dateDebut, dateFin),
      },
      order: { dateHeure: 'ASC' },
    });
  }

  async findByPatient(patientId: string, tenantId: string) {
    return this.rdvRepository.find({
      where: { patientId, tenantId },
      order: { dateHeure: 'DESC' },
    });
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
