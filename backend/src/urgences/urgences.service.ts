import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import {
  PatientUrgence,
  StatutUrgence,
  CategorieUrgence,
  DispositionUrgence,
} from './entities/patient-urgence.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { AdmissionUrgenceDto } from './dto/admission-urgence.dto';
import { UpdateTriageDto } from './dto/update-triage.dto';

@Injectable()
export class UrgencesService {
  constructor(
    @InjectRepository(PatientUrgence)
    private urgenceRepo: Repository<PatientUrgence>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Hydrate en bulk (aucune boucle N+1) `patient` et `medecin` (responsable),
   * en conservant `patientId`/`medecinResponsableId` bruts (rétro-compat).
   * Le patient peut être absent (admission sur `nomProvisoire`) → `patient: null`.
   */
  private async enrichir<T extends { patientId?: string; medecinResponsableId?: string }>(
    records: T[],
    tenantId: string,
  ): Promise<(T & {
    patient: { id: string; nom: string; prenom: string; ipp: string } | null;
    medecin: { id: string; nom: string; prenom: string } | null;
  })[]> {
    if (records.length === 0) return [];

    const patientIds = [...new Set(records.map((r) => r.patientId).filter(Boolean))] as string[];
    const medecinIds = [...new Set(records.map((r) => r.medecinResponsableId).filter(Boolean))] as string[];

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
      const m = r.medecinResponsableId ? mMap.get(r.medecinResponsableId) : undefined;
      return {
        ...r,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        medecin: m ? { id: m.id, nom: m.lastName, prenom: m.firstName } : null,
      };
    });
  }

  private async genererNumero(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `URG-${year}-`;
    const dernier = await this.urgenceRepo
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('u.numero', 'DESC')
      .getOne();

    let sequence = 1;
    if (dernier) {
      const parts = dernier.numero.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  async admettrePatient(dto: AdmissionUrgenceDto, tenantId: string, userId: string): Promise<PatientUrgence> {
    if (!dto.patientId && !dto.nomProvisoire) {
      throw new BadRequestException('Fournir un patientId ou un nomProvisoire');
    }

    const numero = await this.genererNumero(tenantId);
    const urgence = this.urgenceRepo.create({
      numero,
      patientId: dto.patientId,
      nomProvisoire: dto.nomProvisoire,
      modeArrivee: dto.modeArrivee,
      motifConsultation: dto.motifConsultation,
      categorieUrgence: dto.categorieUrgence ?? CategorieUrgence.VERT,
      scoreGlasgow: dto.scoreGlasgow,
      tensionArterielle: dto.tensionArterielle,
      frequenceCardiaque: dto.frequenceCardiaque,
      temperature: dto.temperature,
      saturationO2: dto.saturationO2,
      frequenceRespiratoire: dto.frequenceRespiratoire,
      douleur: dto.douleur,
      infirmiereTriageId: dto.infirmiereTriageId,
      notes: dto.notes,
      statut: StatutUrgence.ATTENTE_TRIAGE,
      tenantId,
      createdById: userId,
    });

    return this.urgenceRepo.save(urgence);
  }

  async findAll(
    tenantId: string,
    filters: { statut?: StatutUrgence; categorie?: CategorieUrgence; date?: string },
    pagination: { page?: number; limit?: number },
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.urgenceRepo
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('u.statut = :statut', { statut: filters.statut });
    if (filters.categorie) qb.andWhere('u.categorieUrgence = :categorie', { categorie: filters.categorie });
    if (filters.date) {
      const d = new Date(filters.date);
      d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      qb.andWhere('u.dateHeureArrivee BETWEEN :debut AND :fin', { debut: d, fin: dEnd });
    }

    const [data, total] = await qb
      .orderBy('u.dateHeureArrivee', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findActifs(tenantId: string) {
    const data = await this.urgenceRepo.find({
      where: {
        tenantId,
        statut: Not(In([StatutUrgence.SORTI, StatutUrgence.TRANSFERE, StatutUrgence.DECEDE])),
      },
      order: { categorieUrgence: 'ASC', dateHeureArrivee: 'ASC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<PatientUrgence> {
    const urgence = await this.urgenceRepo.findOne({ where: { id, tenantId } });
    if (!urgence) throw new NotFoundException(`Dossier urgence ${id} non trouvé`);
    return urgence;
  }

  async mettreAJourTriage(id: string, dto: UpdateTriageDto, tenantId: string, userId: string): Promise<PatientUrgence> {
    const urgence = await this.findOne(id, tenantId);
    await this.urgenceRepo.update(id, {
      ...dto,
      statut: urgence.statut === StatutUrgence.ATTENTE_TRIAGE ? StatutUrgence.EN_TRIAGE : urgence.statut,
    });
    return this.findOne(id, tenantId);
  }

  async assignerMedecin(id: string, medecinId: string, tenantId: string): Promise<PatientUrgence> {
    await this.findOne(id, tenantId);
    await this.urgenceRepo.update(id, { medecinResponsableId: medecinId });
    return this.findOne(id, tenantId);
  }

  async mettreEnSoins(id: string, tenantId: string): Promise<PatientUrgence> {
    const urgence = await this.findOne(id, tenantId);
    const statutsValides = [StatutUrgence.ATTENTE_TRIAGE, StatutUrgence.EN_TRIAGE];
    if (!statutsValides.includes(urgence.statut)) {
      throw new BadRequestException('Statut incompatible pour passer en soins');
    }
    await this.urgenceRepo.update(id, { statut: StatutUrgence.EN_SOINS });
    return this.findOne(id, tenantId);
  }

  async hospitaliser(id: string, tenantId: string): Promise<PatientUrgence> {
    const urgence = await this.findOne(id, tenantId);
    if (urgence.statut === StatutUrgence.SORTI || urgence.statut === StatutUrgence.DECEDE) {
      throw new BadRequestException('Impossible d\'hospitaliser un patient sorti ou décédé');
    }
    await this.urgenceRepo.update(id, {
      statut: StatutUrgence.HOSPITALISE,
      disposition: DispositionUrgence.HOSPITALISATION,
    });
    return this.findOne(id, tenantId);
  }

  async sortirPatient(id: string, disposition: DispositionUrgence, tenantId: string): Promise<PatientUrgence> {
    const urgence = await this.findOne(id, tenantId);
    const dateHeureSortie = new Date();
    const dureePassageMinutes = Math.round(
      (dateHeureSortie.getTime() - new Date(urgence.dateHeureArrivee).getTime()) / 60000,
    );

    let statut = StatutUrgence.SORTI;
    if (disposition === DispositionUrgence.TRANSFERT) statut = StatutUrgence.TRANSFERE;
    if (disposition === DispositionUrgence.DECES) statut = StatutUrgence.DECEDE;

    await this.urgenceRepo.update(id, {
      statut,
      disposition,
      dateHeureSortie,
      dureePassageMinutes,
    });
    return this.findOne(id, tenantId);
  }

  async getStatsDuJour(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const total = await this.urgenceRepo
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.dateHeureArrivee BETWEEN :debut AND :fin', { debut: today, fin: todayEnd })
      .getCount();

    const parCategorie = await this.urgenceRepo
      .createQueryBuilder('u')
      .select('u.categorieUrgence', 'categorie')
      .addSelect('COUNT(u.id)', 'count')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.dateHeureArrivee BETWEEN :debut AND :fin', { debut: today, fin: todayEnd })
      .groupBy('u.categorieUrgence')
      .getRawMany();

    const tempsMoyen = await this.urgenceRepo
      .createQueryBuilder('u')
      .select('AVG(u.dureePassageMinutes)', 'moyenne')
      .where('u.tenantId = :tenantId', { tenantId })
      .andWhere('u.dateHeureArrivee BETWEEN :debut AND :fin', { debut: today, fin: todayEnd })
      .andWhere('u.dureePassageMinutes IS NOT NULL')
      .getRawOne();

    return {
      date: today,
      totalPatients: total,
      parCategorie,
      tempsMoyenPassageMinutes: tempsMoyen?.moyenne ? Math.round(Number(tempsMoyen.moyenne)) : null,
    };
  }

  async getDashboardUrgences(tenantId: string) {
    const actifs = await this.findActifs(tenantId);

    const parStatut = actifs.reduce((acc, u) => {
      acc[u.statut] = (acc[u.statut] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parCategorie = actifs.reduce((acc, u) => {
      acc[u.categorieUrgence] = (acc[u.categorieUrgence] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActifs: actifs.length,
      parStatut,
      parCategorie,
      patients: actifs,
    };
  }
}
