import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import {
  DossierGrossesse,
  StatutGrossesse,
} from './entities/dossier-grossesse.entity';
import { ConsultationPrenatale } from './entities/consultation-prenatale.entity';
import { Accouchement } from './entities/accouchement.entity';
import { SurveillanceTravail } from './entities/surveillance-travail.entity';
import { SuiviPostNatal } from './entities/suivi-postnatal.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateDossierGrossesseDto } from './dto/create-dossier-grossesse.dto';
import { UpdateDossierGrossesseDto } from './dto/update-dossier-grossesse.dto';
import { CreateCpnDto } from './dto/create-cpn.dto';
import { CreateAccouchementDto } from './dto/create-accouchement.dto';
import { CreateSurveillanceTravailDto } from './dto/create-surveillance-travail.dto';
import { CreateSuiviPostNatalDto } from './dto/create-suivi-postnatal.dto';

@Injectable()
export class MaterniteService {
  constructor(
    @InjectRepository(DossierGrossesse)
    private readonly dossierRepo: Repository<DossierGrossesse>,
    @InjectRepository(ConsultationPrenatale)
    private readonly cpnRepo: Repository<ConsultationPrenatale>,
    @InjectRepository(Accouchement)
    private readonly accouchementRepo: Repository<Accouchement>,
    @InjectRepository(SurveillanceTravail)
    private readonly surveillanceRepo: Repository<SurveillanceTravail>,
    @InjectRepository(SuiviPostNatal)
    private readonly postnatalRepo: Repository<SuiviPostNatal>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.dossierRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `MAT-${annee}-${seq}`;
  }

  /** DPA = DDR + 280 jours (règle de Naegele simplifiée). */
  private calculerDpa(ddr: string): string {
    const d = new Date(ddr);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
  }

  /** Hydrate `patient` (nom/prénom/ipp) sur une liste de dossiers, sans N+1. */
  private async enrichirDossiers(
    dossiers: DossierGrossesse[],
    tenantId: string,
  ): Promise<any[]> {
    if (dossiers.length === 0) return [];
    const patientIds = [
      ...new Set(dossiers.map((d) => d.patientId).filter(Boolean)),
    ];
    const patients = patientIds.length
      ? await this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
      : [];
    const pMap = new Map(patients.map((p) => [p.id, p]));
    return dossiers.map((d) => {
      const p = pMap.get(d.patientId);
      return {
        ...d,
        patient: p
          ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp }
          : null,
      };
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Dossiers de grossesse
  // ────────────────────────────────────────────────────────────────
  async createDossier(
    dto: CreateDossierGrossesseDto,
    tenantId: string,
    userId: string,
  ): Promise<DossierGrossesse> {
    const numero = await this.genererNumero(tenantId);
    const dossier = this.dossierRepo.create({
      ...dto,
      numero,
      dpa: this.calculerDpa(dto.ddr),
      tenantId,
      createdById: userId,
    });
    return this.dossierRepo.save(dossier);
  }

  async findAllDossiers(
    tenantId: string,
    filters: { statut?: StatutGrossesse; risque?: boolean; patientId?: string; search?: string } = {},
  ): Promise<any[]> {
    const qb = this.dossierRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('d.statut = :statut', { statut: filters.statut });
    if (filters.risque !== undefined)
      qb.andWhere('d.grossesseARisque = :risque', { risque: filters.risque });
    if (filters.patientId)
      qb.andWhere('d.patientId = :patientId', { patientId: filters.patientId });
    if (filters.search)
      qb.andWhere('d.numero ILIKE :s', { s: `%${filters.search}%` });

    const dossiers = await qb
      .orderBy('d.grossesseARisque', 'DESC')
      .addOrderBy('d.createdAt', 'DESC')
      .getMany();

    return this.enrichirDossiers(dossiers, tenantId);
  }

  async findOneDossier(id: string, tenantId: string): Promise<DossierGrossesse> {
    const dossier = await this.dossierRepo.findOne({ where: { id, tenantId } });
    if (!dossier) throw new NotFoundException(`Dossier de grossesse ${id} introuvable`);
    return dossier;
  }

  /** Détail enrichi : patiente + toutes les sous-ressources. */
  async findDossierDetail(id: string, tenantId: string): Promise<any> {
    const dossier = await this.findOneDossier(id, tenantId);
    const [enriched] = await this.enrichirDossiers([dossier], tenantId);
    const [cpns, accouchements, partogramme, postnatal] = await Promise.all([
      this.cpnRepo.find({ where: { dossierId: id, tenantId }, order: { date: 'ASC' } }),
      this.accouchementRepo.find({ where: { dossierId: id, tenantId }, order: { dateHeure: 'DESC' } }),
      this.surveillanceRepo.find({ where: { dossierId: id, tenantId }, order: { heure: 'ASC' } }),
      this.postnatalRepo.find({ where: { dossierId: id, tenantId }, order: { date: 'ASC' } }),
    ]);
    return { ...enriched, cpns, accouchements, partogramme, postnatal };
  }

  async updateDossier(
    id: string,
    dto: UpdateDossierGrossesseDto,
    tenantId: string,
  ): Promise<DossierGrossesse> {
    const dossier = await this.findOneDossier(id, tenantId);
    Object.assign(dossier, dto);
    if (dto.ddr) dossier.dpa = this.calculerDpa(dto.ddr);
    return this.dossierRepo.save(dossier);
  }

  async removeDossier(id: string, tenantId: string): Promise<{ deleted: boolean }> {
    const dossier = await this.findOneDossier(id, tenantId);
    await this.dossierRepo.remove(dossier);
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // Consultations prénatales (CPN)
  // ────────────────────────────────────────────────────────────────
  async addCpn(
    dossierId: string,
    dto: CreateCpnDto,
    tenantId: string,
    userId: string,
  ): Promise<ConsultationPrenatale> {
    await this.findOneDossier(dossierId, tenantId); // garde-fou tenant + existence
    const cpn = this.cpnRepo.create({ ...dto, dossierId, tenantId, createdById: userId });
    return this.cpnRepo.save(cpn);
  }

  async findCpns(dossierId: string, tenantId: string): Promise<ConsultationPrenatale[]> {
    await this.findOneDossier(dossierId, tenantId);
    return this.cpnRepo.find({ where: { dossierId, tenantId }, order: { date: 'ASC' } });
  }

  // ────────────────────────────────────────────────────────────────
  // Accouchement
  // ────────────────────────────────────────────────────────────────
  async addAccouchement(
    dossierId: string,
    dto: CreateAccouchementDto,
    tenantId: string,
    userId: string,
  ): Promise<Accouchement> {
    const dossier = await this.findOneDossier(dossierId, tenantId);
    const accouchement = this.accouchementRepo.create({
      ...dto,
      dateHeure: new Date(dto.dateHeure),
      dossierId,
      tenantId,
      createdById: userId,
    });
    const saved = await this.accouchementRepo.save(accouchement);

    // L'accouchement clôt le dossier et incrémente la parité.
    dossier.statut = StatutGrossesse.TERMINEE;
    dossier.parite = (dossier.parite ?? 0) + 1;
    await this.dossierRepo.save(dossier);

    return saved;
  }

  async findAccouchements(dossierId: string, tenantId: string): Promise<Accouchement[]> {
    await this.findOneDossier(dossierId, tenantId);
    return this.accouchementRepo.find({
      where: { dossierId, tenantId },
      order: { dateHeure: 'DESC' },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Partogramme (surveillance du travail)
  // ────────────────────────────────────────────────────────────────
  async addSurveillance(
    dossierId: string,
    dto: CreateSurveillanceTravailDto,
    tenantId: string,
    userId: string,
  ): Promise<SurveillanceTravail> {
    await this.findOneDossier(dossierId, tenantId);
    const point = this.surveillanceRepo.create({
      ...dto,
      heure: new Date(dto.heure),
      dossierId,
      tenantId,
      createdById: userId,
    });
    return this.surveillanceRepo.save(point);
  }

  async findPartogramme(dossierId: string, tenantId: string): Promise<SurveillanceTravail[]> {
    await this.findOneDossier(dossierId, tenantId);
    return this.surveillanceRepo.find({
      where: { dossierId, tenantId },
      order: { heure: 'ASC' },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Suivi post-natal
  // ────────────────────────────────────────────────────────────────
  async addPostnatal(
    dossierId: string,
    dto: CreateSuiviPostNatalDto,
    tenantId: string,
    userId: string,
  ): Promise<SuiviPostNatal> {
    await this.findOneDossier(dossierId, tenantId);
    const suivi = this.postnatalRepo.create({ ...dto, dossierId, tenantId, createdById: userId });
    return this.postnatalRepo.save(suivi);
  }

  async findPostnatal(dossierId: string, tenantId: string): Promise<SuiviPostNatal[]> {
    await this.findOneDossier(dossierId, tenantId);
    return this.postnatalRepo.find({
      where: { dossierId, tenantId },
      order: { date: 'ASC' },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const finMois = new Date(debutMois);
    finMois.setMonth(finMois.getMonth() + 1);
    finMois.setMilliseconds(-1);

    const [enCours, aRisque, accouchementsMois, totalDossiers] = await Promise.all([
      this.dossierRepo.count({ where: { tenantId, statut: StatutGrossesse.EN_COURS } }),
      this.dossierRepo.count({ where: { tenantId, statut: StatutGrossesse.EN_COURS, grossesseARisque: true } }),
      this.accouchementRepo.count({ where: { tenantId, dateHeure: Between(debutMois, finMois) } }),
      this.dossierRepo.count({ where: { tenantId } }),
    ]);

    return {
      grossessesEnCours: enCours,
      grossessesARisque: aRisque,
      accouchementsMois,
      totalDossiers,
    };
  }
}
