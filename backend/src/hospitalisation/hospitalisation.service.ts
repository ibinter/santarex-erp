import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Lit, ServiceHospitalisation, StatutLit } from './entities/lit.entity';
import { Sejour, StatutSejour, TypeSortie } from './entities/sejour.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { NoteEvolution } from './entities/note-evolution.entity';
import { SoinInfirmier } from './entities/soin-infirmier.entity';
import { CreateLitDto } from './dto/create-lit.dto';
import { AdmissionHospitalisationDto } from './dto/admission-hospitalisation.dto';
import { CreateNoteEvolutionDto } from './dto/create-note-evolution.dto';
import { SortiePatientDto } from './dto/sortie-patient.dto';

@Injectable()
export class HospitalisationService {
  constructor(
    @InjectRepository(Lit)
    private readonly litRepo: Repository<Lit>,
    @InjectRepository(Sejour)
    private readonly sejourRepo: Repository<Sejour>,
    @InjectRepository(NoteEvolution)
    private readonly noteRepo: Repository<NoteEvolution>,
    @InjectRepository(SoinInfirmier)
    private readonly soinRepo: Repository<SoinInfirmier>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Hydrate en bulk (aucune boucle N+1) `patient` et `medecin` (référent),
   * en conservant `patientId`/`medecinReferentId` bruts (rétro-compat).
   */
  private async enrichir<T extends { patientId?: string; medecinReferentId?: string }>(
    records: T[],
    tenantId: string,
  ): Promise<(T & {
    patient: { id: string; nom: string; prenom: string; ipp: string } | null;
    medecin: { id: string; nom: string; prenom: string } | null;
  })[]> {
    if (records.length === 0) return [];

    const patientIds = [...new Set(records.map((r) => r.patientId).filter(Boolean))] as string[];
    const medecinIds = [...new Set(records.map((r) => r.medecinReferentId).filter(Boolean))] as string[];

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
      const m = r.medecinReferentId ? mMap.get(r.medecinReferentId) : undefined;
      return {
        ...r,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        medecin: m ? { id: m.id, nom: m.lastName, prenom: m.firstName } : null,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Génération de numéro de séjour
  // ─────────────────────────────────────────────────────────────────────────
  async genererNumeroSejour(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.sejourRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `HSP-${annee}-${seq}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gestion des lits
  // ─────────────────────────────────────────────────────────────────────────
  async createLit(dto: CreateLitDto, tenantId: string): Promise<Lit> {
    // Vérifier qu'un lit avec le même numéro n'existe pas déjà dans ce tenant
    const existing = await this.litRepo.findOne({
      where: { numero: dto.numero, tenantId },
    });
    if (existing) {
      throw new BadRequestException(`Un lit avec le numéro "${dto.numero}" existe déjà`);
    }
    const lit = this.litRepo.create({ ...dto, tenantId });
    return this.litRepo.save(lit);
  }

  async findAllLits(
    tenantId: string,
    filters: { service?: ServiceHospitalisation; statut?: StatutLit } = {},
  ): Promise<Lit[]> {
    const qb = this.litRepo
      .createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.estActif = true');

    if (filters.service) {
      qb.andWhere('l.service = :service', { service: filters.service });
    }
    if (filters.statut) {
      qb.andWhere('l.statut = :statut', { statut: filters.statut });
    }

    return qb.orderBy('l.service', 'ASC').addOrderBy('l.numero', 'ASC').getMany();
  }

  async findLitsLibres(tenantId: string, service?: ServiceHospitalisation): Promise<Lit[]> {
    return this.findAllLits(tenantId, {
      statut: StatutLit.LIBRE,
      service,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gestion des séjours
  // ─────────────────────────────────────────────────────────────────────────
  async admettre(
    dto: AdmissionHospitalisationDto,
    tenantId: string,
    userId: string,
  ): Promise<Sejour> {
    // Vérifier que le lit existe et est libre
    const lit = await this.litRepo.findOne({ where: { id: dto.litId, tenantId } });
    if (!lit) throw new NotFoundException(`Lit ${dto.litId} introuvable`);
    if (lit.statut !== StatutLit.LIBRE) {
      throw new BadRequestException(
        `Le lit "${lit.numero}" n'est pas disponible (statut: ${lit.statut})`,
      );
    }

    // Vérifier qu'il n'y a pas déjà un séjour actif pour ce patient
    const sejourActif = await this.sejourRepo.findOne({
      where: { patientId: dto.patientId, statut: StatutSejour.ACTIF, tenantId },
    });
    if (sejourActif) {
      throw new BadRequestException(
        `Le patient est déjà hospitalisé (séjour ${sejourActif.numero})`,
      );
    }

    const numero = await this.genererNumeroSejour(tenantId);
    const dateAdmission = dto.dateHeureAdmission
      ? new Date(dto.dateHeureAdmission)
      : new Date();

    const sejour = this.sejourRepo.create({
      numero,
      patientId: dto.patientId,
      litId: dto.litId,
      medecinReferentId: dto.medecinReferentId,
      service: dto.service,
      type: dto.type,
      dateHeureAdmission: dateAdmission,
      diagnosticEntree: dto.diagnosticEntree,
      statut: StatutSejour.ACTIF,
      tenantId,
      createdById: userId,
    });

    const sejourSave = await this.sejourRepo.save(sejour);

    // Mettre à jour le lit
    lit.statut = StatutLit.OCCUPE;
    lit.sejourActuelId = sejourSave.id;
    await this.litRepo.save(lit);

    return sejourSave;
  }

  async findAllSejours(
    tenantId: string,
    filters: { statut?: StatutSejour; service?: ServiceHospitalisation; patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Sejour[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.sejourRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId });

    if (filters.statut) {
      qb.andWhere('s.statut = :statut', { statut: filters.statut });
    }
    if (filters.service) {
      qb.andWhere('s.service = :service', { service: filters.service });
    }
    if (filters.patientId) {
      qb.andWhere('s.patientId = :patientId', { patientId: filters.patientId });
    }

    const [data, total] = await qb
      .orderBy('s.dateHeureAdmission', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findSejoursActifs(tenantId: string) {
    const data = await this.sejourRepo.find({
      where: { tenantId, statut: StatutSejour.ACTIF },
      order: { dateHeureAdmission: 'DESC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<Sejour> {
    const sejour = await this.sejourRepo.findOne({ where: { id, tenantId } });
    if (!sejour) throw new NotFoundException(`Séjour ${id} introuvable`);
    return sejour;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notes d'évolution
  // ─────────────────────────────────────────────────────────────────────────
  async addNoteEvolution(
    sejourId: string,
    dto: CreateNoteEvolutionDto,
    tenantId: string,
    userId: string,
  ): Promise<NoteEvolution> {
    const sejour = await this.findOne(sejourId, tenantId);

    const note = this.noteRepo.create({
      sejourId,
      patientId: sejour.patientId,
      auteurId: userId,
      type: dto.type,
      contenu: dto.contenu,
      tensionArterielle: dto.tensionArterielle,
      frequenceCardiaque: dto.frequenceCardiaque,
      temperature: dto.temperature,
      saturationO2: dto.saturationO2,
      poidsKg: dto.poidsKg,
      tenantId,
    });

    return this.noteRepo.save(note);
  }

  async getNoteEvolution(sejourId: string, tenantId: string): Promise<NoteEvolution[]> {
    return this.noteRepo.find({
      where: { sejourId, tenantId },
      order: { dateHeure: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sortie du patient
  // ─────────────────────────────────────────────────────────────────────────
  async sortirPatient(
    id: string,
    dto: SortiePatientDto,
    tenantId: string,
  ): Promise<Sejour> {
    const sejour = await this.findOne(id, tenantId);

    if (sejour.statut !== StatutSejour.ACTIF) {
      throw new BadRequestException(
        `Ce séjour n'est pas actif (statut: ${sejour.statut})`,
      );
    }

    const dateSortie = new Date();
    const diffMs = dateSortie.getTime() - new Date(sejour.dateHeureAdmission).getTime();
    const dureeJours = parseFloat((diffMs / (1000 * 60 * 60 * 24)).toFixed(1));

    sejour.dateHeureSortie = dateSortie;
    sejour.dureeJours = dureeJours;
    sejour.typeSortie = dto.typeSortie;
    sejour.diagnosticSortie = dto.diagnosticSortie;
    sejour.instructionsPostHospitalisation = dto.instructionsPostHospitalisation;
    sejour.statut =
      dto.typeSortie === TypeSortie.TRANSFERT
        ? StatutSejour.TRANSFERE
        : StatutSejour.SORTI;

    const sejourMaj = await this.sejourRepo.save(sejour);

    // Libérer le lit (passer en nettoyage)
    const lit = await this.litRepo.findOne({ where: { id: sejour.litId, tenantId } });
    if (lit) {
      lit.statut = StatutLit.EN_NETTOYAGE;
      lit.sejourActuelId = null;
      await this.litRepo.save(lit);
    }

    return sejourMaj;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tableau de bord / statistiques
  // ─────────────────────────────────────────────────────────────────────────
  async getStatsDashboard(tenantId: string): Promise<any> {
    const totalLits = await this.litRepo.count({ where: { tenantId, estActif: true } });

    const litsOccupes = await this.litRepo.count({
      where: { tenantId, statut: StatutLit.OCCUPE },
    });
    const litsLibres = await this.litRepo.count({
      where: { tenantId, statut: StatutLit.LIBRE },
    });
    const litsEnNettoyage = await this.litRepo.count({
      where: { tenantId, statut: StatutLit.EN_NETTOYAGE },
    });
    const litsEnMaintenance = await this.litRepo.count({
      where: { tenantId, statut: StatutLit.EN_MAINTENANCE },
    });

    const tauxOccupation =
      totalLits > 0 ? parseFloat(((litsOccupes / totalLits) * 100).toFixed(1)) : 0;

    // Séjours actifs
    const sejoursActifs = await this.sejourRepo.count({
      where: { tenantId, statut: StatutSejour.ACTIF },
    });

    // Sorties du jour
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const sortiesJour = await this.sejourRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.statut != :actif', { actif: StatutSejour.ACTIF })
      .andWhere('s.dateHeureSortie >= :debutJour', { debutJour })
      .getCount();

    // Admissions du jour
    const admissionsJour = await this.sejourRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.dateHeureAdmission >= :debutJour', { debutJour })
      .getCount();

    return {
      date: new Date().toISOString().split('T')[0],
      lits: {
        total: totalLits,
        occupes: litsOccupes,
        libres: litsLibres,
        enNettoyage: litsEnNettoyage,
        enMaintenance: litsEnMaintenance,
        tauxOccupationPct: tauxOccupation,
      },
      sejours: {
        actifs: sejoursActifs,
        admissionsJour,
        sortiesJour,
      },
    };
  }
}
