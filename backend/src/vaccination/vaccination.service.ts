import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, Between } from 'typeorm';
import { Vaccin, CibleVaccin } from './entities/vaccin.entity';
import {
  VaccinationPatient,
  StatutVaccination,
} from './entities/vaccination-patient.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateVaccinDto } from './dto/create-vaccin.dto';
import { EnregistrerVaccinationDto } from './dto/enregistrer-vaccination.dto';
import { CATALOGUE_VACCINS } from './data/vaccins-catalogue';

/** Ligne de vaccination enrichie (patient + vaccin résolus). */
type VaccinationEnrichie = VaccinationPatient & {
  patient: { id: string; nom: string; prenom: string; ipp: string } | null;
  vaccin: { id: string; code: string; nom: string; maladieCible: string } | null;
};

@Injectable()
export class VaccinationService {
  constructor(
    @InjectRepository(Vaccin)
    private readonly vaccinRepo: Repository<Vaccin>,
    @InjectRepository(VaccinationPatient)
    private readonly vaccinationRepo: Repository<VaccinationPatient>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Référentiel des vaccins (avec seed paresseux par tenant)
  // ────────────────────────────────────────────────────────────────

  /** Renvoie le référentiel du tenant, en le semant depuis le catalogue si vide. */
  async findAllVaccins(
    tenantId: string,
    filters: { cible?: CibleVaccin; search?: string } = {},
  ): Promise<Vaccin[]> {
    await this.seedIfEmpty(tenantId);

    const qb = this.vaccinRepo
      .createQueryBuilder('v')
      .where('v.tenantId = :tenantId', { tenantId })
      .andWhere('v.estActif = true');

    if (filters.cible) {
      // « tous » reste toujours visible quel que soit le filtre cible.
      qb.andWhere('(v.cible = :cible OR v.cible = :tous)', {
        cible: filters.cible,
        tous: CibleVaccin.TOUS,
      });
    }
    if (filters.search) {
      qb.andWhere('(v.nom ILIKE :s OR v.code ILIKE :s OR v.maladieCible ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('v.cible', 'ASC').addOrderBy('v.nom', 'ASC').getMany();
  }

  private async seedIfEmpty(tenantId: string): Promise<void> {
    const count = await this.vaccinRepo.count({ where: { tenantId } });
    if (count > 0) return;
    const seeds = CATALOGUE_VACCINS.map((c) =>
      this.vaccinRepo.create({ ...c, estActif: true, tenantId }),
    );
    await this.vaccinRepo.save(seeds);
  }

  async createVaccin(dto: CreateVaccinDto, tenantId: string): Promise<Vaccin> {
    const vaccin = this.vaccinRepo.create({ ...dto, tenantId });
    return this.vaccinRepo.save(vaccin);
  }

  async findOneVaccin(id: string, tenantId: string): Promise<Vaccin> {
    const vaccin = await this.vaccinRepo.findOne({ where: { id, tenantId } });
    if (!vaccin) throw new NotFoundException(`Vaccin ${id} introuvable`);
    return vaccin;
  }

  // ────────────────────────────────────────────────────────────────
  // Enregistrement d'une vaccination + calcul du rappel
  // ────────────────────────────────────────────────────────────────

  async enregistrerVaccination(
    dto: EnregistrerVaccinationDto,
    tenantId: string,
    userId: string,
  ): Promise<VaccinationPatient> {
    const vaccin = await this.findOneVaccin(dto.vaccinId, tenantId);

    const dateAdministration = dto.dateAdministration
      ? new Date(dto.dateAdministration)
      : new Date();
    const doseNumero = dto.doseNumero ?? 1;

    // Calcul de la date de rappel : uniquement s'il reste des doses au schéma
    // (ou vaccin périodique type grippe/tétanos avec intervalle > 0).
    let dateRappelPrevue: Date | null = null;
    const resteDoses = doseNumero < vaccin.nbDoses;
    if (vaccin.intervalleJours > 0 && (resteDoses || vaccin.nbDoses === 1)) {
      dateRappelPrevue = new Date(dateAdministration);
      dateRappelPrevue.setDate(dateRappelPrevue.getDate() + vaccin.intervalleJours);
    }

    const vaccination = this.vaccinationRepo.create({
      patientId: dto.patientId,
      vaccinId: dto.vaccinId,
      doseNumero,
      dateAdministration,
      lot: dto.lot,
      voie: dto.voie,
      siteInjection: dto.siteInjection,
      vaccinateurRef: dto.vaccinateurRef ?? userId,
      dateRappelPrevue: dateRappelPrevue ?? undefined,
      statut: StatutVaccination.ADMINISTRE,
      aDeclarer: dto.aDeclarer ?? false,
      notes: dto.notes,
      tenantId,
      createdById: userId,
    });

    return this.vaccinationRepo.save(vaccination);
  }

  // ────────────────────────────────────────────────────────────────
  // Carnet / registre par patient
  // ────────────────────────────────────────────────────────────────

  /** Carnet de vaccination d'un patient (toutes les doses, plus récentes d'abord). */
  async getCarnetPatient(
    patientId: string,
    tenantId: string,
  ): Promise<VaccinationEnrichie[]> {
    const lignes = await this.vaccinationRepo.find({
      where: { patientId, tenantId },
      order: { dateAdministration: 'DESC' },
    });
    return this.enrichir(lignes, tenantId);
  }

  private async enrichir(
    lignes: VaccinationPatient[],
    tenantId: string,
  ): Promise<VaccinationEnrichie[]> {
    if (lignes.length === 0) return [];

    const patientIds = [...new Set(lignes.map((l) => l.patientId).filter(Boolean))];
    const vaccinIds = [...new Set(lignes.map((l) => l.vaccinId).filter(Boolean))];

    const [patients, vaccins] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      vaccinIds.length
        ? this.vaccinRepo.find({ where: { id: In(vaccinIds), tenantId } })
        : Promise.resolve([] as Vaccin[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const vMap = new Map(vaccins.map((v) => [v.id, v]));

    return lignes.map((l) => {
      const p = pMap.get(l.patientId);
      const v = vMap.get(l.vaccinId);
      return {
        ...l,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        vaccin: v
          ? { id: v.id, code: v.code, nom: v.nom, maladieCible: v.maladieCible }
          : null,
      };
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Rappels dus / en retard (tous patients)
  // ────────────────────────────────────────────────────────────────

  /**
   * Rappels à venir (dans `joursAvenir`) et en retard (dateRappelPrevue passée).
   * Recalcule le statut à la volée : administre → rappel_du / en_retard.
   */
  async getRappels(
    tenantId: string,
    joursAvenir = 30,
  ): Promise<{ enRetard: VaccinationEnrichie[]; aVenir: VaccinationEnrichie[] }> {
    const maintenant = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + joursAvenir);

    // On ne considère que les lignes ayant un rappel prévu non encore soldé.
    const lignes = await this.vaccinationRepo
      .createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.dateRappelPrevue IS NOT NULL')
      .andWhere('l.dateRappelPrevue <= :limite', { limite })
      .orderBy('l.dateRappelPrevue', 'ASC')
      .getMany();

    const enrichies = await this.enrichir(lignes, tenantId);

    const enRetard: VaccinationEnrichie[] = [];
    const aVenir: VaccinationEnrichie[] = [];
    for (const l of enrichies) {
      const due = l.dateRappelPrevue ? new Date(l.dateRappelPrevue) : null;
      if (!due) continue;
      if (due < maintenant) {
        l.statut = StatutVaccination.EN_RETARD;
        enRetard.push(l);
      } else {
        l.statut = StatutVaccination.RAPPEL_DU;
        aVenir.push(l);
      }
    }

    return { enRetard, aVenir };
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────

  async getStats(tenantId: string): Promise<{
    vaccinationsMois: number;
    vaccinationsJour: number;
    rappelsEnRetard: number;
    rappelsAVenir7j: number;
    aDeclarer: number;
  }> {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);
    const dans7j = new Date();
    dans7j.setDate(dans7j.getDate() + 7);

    const [vaccinationsMois, vaccinationsJour, rappelsEnRetard, rappelsAVenir7j, aDeclarer] =
      await Promise.all([
        this.vaccinationRepo.count({
          where: { tenantId, dateAdministration: Between(debutMois, finMois) },
        }),
        this.vaccinationRepo.count({
          where: { tenantId, dateAdministration: Between(debutJour, finJour) },
        }),
        this.vaccinationRepo.count({
          where: { tenantId, dateRappelPrevue: LessThan(now) },
        }),
        this.vaccinationRepo.count({
          where: { tenantId, dateRappelPrevue: Between(now, dans7j) },
        }),
        this.vaccinationRepo.count({ where: { tenantId, aDeclarer: true } }),
      ]);

    return { vaccinationsMois, vaccinationsJour, rappelsEnRetard, rappelsAVenir7j, aDeclarer };
  }
}
