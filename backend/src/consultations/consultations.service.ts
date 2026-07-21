import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Consultation, StatutConsultation } from './entities/consultation.entity';
import { Ordonnance } from './entities/ordonnance.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { RendezVousService } from '../rendez-vous/rendez-vous.service';
import { StatutRendezVous } from '../rendez-vous/entities/rendez-vous.entity';

export interface ConsultationFilters {
  medecinId?: string;
  patientId?: string;
  statut?: StatutConsultation;
  dateDebut?: string;
  dateFin?: string;
}

export interface Pagination {
  page?: number;
  limit?: number;
}

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private consultationRepository: Repository<Consultation>,
    @InjectRepository(Ordonnance)
    private ordonnanceRepository: Repository<Ordonnance>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private rendezVousService: RendezVousService,
  ) {}

  /**
   * Hydrate en bulk (aucune boucle N+1) les objets `patient` et `medecin`
   * à partir des ids bruts, en conservant `patientId`/`medecinId` (rétro-compat).
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

  async create(dto: CreateConsultationDto, tenantId: string, userId: string) {
    const consultation = this.consultationRepository.create({
      ...dto,
      dateHeure: new Date(dto.dateHeure),
      tenantId,
    });
    const saved = await this.consultationRepository.save(consultation);

    // Mettre à jour le statut du RDV si lié
    if (dto.rendezVousId) {
      try {
        await this.rendezVousService.update(
          dto.rendezVousId,
          { statut: StatutRendezVous.HONORE },
          tenantId,
        );
      } catch {
        // Ne pas bloquer si le RDV n'est pas trouvé
      }
    }

    return saved;
  }

  async findAll(tenantId: string, filters: ConsultationFilters = {}, pagination: Pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const where: any = { tenantId };

    if (filters.medecinId) where.medecinId = filters.medecinId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.statut) where.statut = filters.statut;

    if (filters.dateDebut && filters.dateFin) {
      where.dateHeure = Between(new Date(filters.dateDebut), new Date(filters.dateFin));
    }

    const [data, total] = await this.consultationRepository.findAndCount({
      where,
      order: { dateHeure: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findByPatient(patientId: string, tenantId: string) {
    const data = await this.consultationRepository.find({
      where: { patientId, tenantId },
      order: { dateHeure: 'DESC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findOne(id: string, tenantId: string) {
    const consultation = await this.consultationRepository.findOne({ where: { id, tenantId } });
    if (!consultation) throw new NotFoundException(`Consultation ${id} introuvable`);
    return consultation;
  }

  async update(id: string, dto: Partial<CreateConsultationDto>, tenantId: string) {
    const consultation = await this.findOne(id, tenantId);
    Object.assign(consultation, dto);
    if (dto.dateHeure) consultation.dateHeure = new Date(dto.dateHeure);
    return this.consultationRepository.save(consultation);
  }

  async terminer(id: string, tenantId: string) {
    const consultation = await this.findOne(id, tenantId);
    consultation.statut = StatutConsultation.TERMINEE;
    return this.consultationRepository.save(consultation);
  }

  async createOrdonnance(
    consultationId: string,
    dto: CreateOrdonnanceDto,
    tenantId: string,
    userId: string,
  ) {
    const consultation = await this.findOne(consultationId, tenantId);

    const now = new Date();
    const dateExpiration = dto.dateExpiration
      ? new Date(dto.dateExpiration)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

    const ordonnance = this.ordonnanceRepository.create({
      consultationId,
      patientId: consultation.patientId,
      medecinId: consultation.medecinId,
      dateEmission: now,
      dateExpiration,
      lignes: dto.lignes,
      instructions: dto.instructions,
      tenantId,
    });

    return this.ordonnanceRepository.save(ordonnance);
  }

  async getOrdonnances(consultationId: string, tenantId: string) {
    return this.ordonnanceRepository.find({
      where: { consultationId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
