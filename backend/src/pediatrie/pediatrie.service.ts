import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MesureCroissance } from './entities/mesure-croissance.entity';
import {
  VaccinationEnfant,
  StatutVaccination,
} from './entities/vaccination-enfant.entity';
import { CalendrierVaccinalPediatrique } from './entities/calendrier-vaccinal.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateMesureCroissanceDto } from './dto/create-mesure-croissance.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { PosologieDto } from './dto/posologie.dto';

/**
 * Calendrier vaccinal par défaut — Programme Élargi de Vaccination (PEV)
 * Côte d'Ivoire. Utilisé pour semer le référentiel du tenant au premier accès.
 */
const CALENDRIER_PEV_CI: Array<{
  vaccin: string;
  ageRecommande: string;
  ageSemaines: number;
  maladieCible: string;
}> = [
  { vaccin: 'BCG', ageRecommande: 'À la naissance', ageSemaines: 0, maladieCible: 'Tuberculose' },
  { vaccin: 'Polio 0 (VPO-0)', ageRecommande: 'À la naissance', ageSemaines: 0, maladieCible: 'Poliomyélite' },
  { vaccin: 'Penta 1 (DTC-HepB-Hib)', ageRecommande: '6 semaines', ageSemaines: 6, maladieCible: 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Hib' },
  { vaccin: 'Polio 1 (VPO-1)', ageRecommande: '6 semaines', ageSemaines: 6, maladieCible: 'Poliomyélite' },
  { vaccin: 'Pneumo 1 (VPC-13)', ageRecommande: '6 semaines', ageSemaines: 6, maladieCible: 'Pneumocoque' },
  { vaccin: 'Rota 1', ageRecommande: '6 semaines', ageSemaines: 6, maladieCible: 'Rotavirus' },
  { vaccin: 'Penta 2 (DTC-HepB-Hib)', ageRecommande: '10 semaines', ageSemaines: 10, maladieCible: 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Hib' },
  { vaccin: 'Polio 2 (VPO-2)', ageRecommande: '10 semaines', ageSemaines: 10, maladieCible: 'Poliomyélite' },
  { vaccin: 'Pneumo 2 (VPC-13)', ageRecommande: '10 semaines', ageSemaines: 10, maladieCible: 'Pneumocoque' },
  { vaccin: 'Rota 2', ageRecommande: '10 semaines', ageSemaines: 10, maladieCible: 'Rotavirus' },
  { vaccin: 'Penta 3 (DTC-HepB-Hib)', ageRecommande: '14 semaines', ageSemaines: 14, maladieCible: 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Hib' },
  { vaccin: 'Polio 3 (VPO-3)', ageRecommande: '14 semaines', ageSemaines: 14, maladieCible: 'Poliomyélite' },
  { vaccin: 'Pneumo 3 (VPC-13)', ageRecommande: '14 semaines', ageSemaines: 14, maladieCible: 'Pneumocoque' },
  { vaccin: 'VPI (Polio injectable)', ageRecommande: '14 semaines', ageSemaines: 14, maladieCible: 'Poliomyélite' },
  { vaccin: 'Rougeole-Rubéole (RR-1)', ageRecommande: '9 mois', ageSemaines: 39, maladieCible: 'Rougeole, Rubéole' },
  { vaccin: 'Fièvre jaune', ageRecommande: '9 mois', ageSemaines: 39, maladieCible: 'Fièvre jaune' },
  { vaccin: 'Rougeole-Rubéole (RR-2)', ageRecommande: '15 mois', ageSemaines: 65, maladieCible: 'Rougeole, Rubéole' },
];

@Injectable()
export class PediatrieService {
  constructor(
    @InjectRepository(MesureCroissance)
    private readonly mesureRepo: Repository<MesureCroissance>,
    @InjectRepository(VaccinationEnfant)
    private readonly vaccinRepo: Repository<VaccinationEnfant>,
    @InjectRepository(CalendrierVaccinalPediatrique)
    private readonly calendrierRepo: Repository<CalendrierVaccinalPediatrique>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Utilitaires
  // ────────────────────────────────────────────────────────────────

  /** Âge en mois entre la naissance et une date de référence. */
  private ageEnMois(dateNaissance: Date | string, reference: Date | string): number | null {
    if (!dateNaissance) return null;
    const n = new Date(dateNaissance);
    const r = new Date(reference);
    if (isNaN(n.getTime()) || isNaN(r.getTime())) return null;
    let mois = (r.getFullYear() - n.getFullYear()) * 12 + (r.getMonth() - n.getMonth());
    if (r.getDate() < n.getDate()) mois -= 1;
    return Math.max(0, mois);
  }

  /** IMC = poids(kg) / taille(m)². Arrondi à 2 décimales. */
  private calculerImc(poidsKg?: number, tailleCm?: number): number | null {
    if (!poidsKg || !tailleCm || tailleCm <= 0) return null;
    const m = tailleCm / 100;
    return Math.round((poidsKg / (m * m)) * 100) / 100;
  }

  /**
   * Hydrate en bulk (aucune boucle N+1) le patient de chaque enregistrement,
   * en conservant `patientId` brut (rétro-compat frontend).
   */
  private async enrichirPatients<T extends { patientId: string }>(
    rows: T[],
    tenantId: string,
  ): Promise<(T & { patient: { id: string; nom: string; prenom: string; ipp: string; dateNaissance: Date } | null })[]> {
    if (rows.length === 0) return [];
    const patientIds = [...new Set(rows.map((r) => r.patientId).filter(Boolean))];
    const patients = patientIds.length
      ? await this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
      : [];
    const pMap = new Map(patients.map((p) => [p.id, p]));
    return rows.map((r) => {
      const p = pMap.get(r.patientId);
      return {
        ...r,
        patient: p
          ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp, dateNaissance: p.dateNaissance }
          : null,
      };
    });
  }

  private async getPatientOrFail(patientId: string, tenantId: string): Promise<Patient> {
    const patient = await this.patientRepo.findOne({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException(`Patient ${patientId} introuvable`);
    return patient;
  }

  // ────────────────────────────────────────────────────────────────
  // Mesures de croissance
  // ────────────────────────────────────────────────────────────────

  async createMesure(
    dto: CreateMesureCroissanceDto,
    tenantId: string,
    userId?: string,
  ): Promise<MesureCroissance> {
    const patient = await this.getPatientOrFail(dto.patientId, tenantId);
    const dateMesure = dto.dateMesure ?? new Date().toISOString().slice(0, 10);

    const mesure = this.mesureRepo.create({
      patientId: dto.patientId,
      dateMesure,
      ageMois: this.ageEnMois(patient.dateNaissance, dateMesure) ?? undefined,
      poidsKg: dto.poidsKg,
      tailleCm: dto.tailleCm,
      perimetreCranienCm: dto.perimetreCranienCm,
      imc: this.calculerImc(dto.poidsKg, dto.tailleCm) ?? undefined,
      observations: dto.observations,
      tenantId,
      createdById: userId,
    });
    return this.mesureRepo.save(mesure);
  }

  async findMesuresByPatient(patientId: string, tenantId: string): Promise<MesureCroissance[]> {
    return this.mesureRepo.find({
      where: { patientId, tenantId },
      order: { dateMesure: 'DESC' },
    });
  }

  /**
   * Série de points triée par âge croissant, prête à tracer une courbe de
   * croissance (poids, taille, périmètre crânien, IMC).
   */
  async getCourbeCroissance(patientId: string, tenantId: string): Promise<{
    patient: { id: string; nom: string; prenom: string; ipp: string; dateNaissance: Date } | null;
    points: Array<{
      date: string;
      ageMois: number | null;
      poidsKg: number | null;
      tailleCm: number | null;
      perimetreCranienCm: number | null;
      imc: number | null;
    }>;
  }> {
    const patient = await this.patientRepo.findOne({ where: { id: patientId, tenantId } });
    const mesures = await this.mesureRepo.find({
      where: { patientId, tenantId },
      order: { dateMesure: 'ASC' },
    });
    const num = (v: any): number | null => (v === null || v === undefined ? null : Number(v));
    return {
      patient: patient
        ? { id: patient.id, nom: patient.nom, prenom: patient.prenom, ipp: patient.ipp, dateNaissance: patient.dateNaissance }
        : null,
      points: mesures
        .map((m) => ({
          date: m.dateMesure,
          ageMois: m.ageMois ?? null,
          poidsKg: num(m.poidsKg),
          tailleCm: num(m.tailleCm),
          perimetreCranienCm: num(m.perimetreCranienCm),
          imc: num(m.imc),
        }))
        .sort((a, b) => (a.ageMois ?? 0) - (b.ageMois ?? 0)),
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Calendrier vaccinal (référentiel)
  // ────────────────────────────────────────────────────────────────

  /** Renvoie le calendrier du tenant, en le semant depuis le PEV CI si vide. */
  async getCalendrier(tenantId: string): Promise<CalendrierVaccinalPediatrique[]> {
    let items = await this.calendrierRepo.find({
      where: { tenantId, estActif: true },
      order: { ordre: 'ASC' },
    });
    if (items.length === 0) {
      const seeds = CALENDRIER_PEV_CI.map((c, i) =>
        this.calendrierRepo.create({ ...c, ordre: i, estActif: true, tenantId }),
      );
      await this.calendrierRepo.save(seeds);
      items = await this.calendrierRepo.find({
        where: { tenantId, estActif: true },
        order: { ordre: 'ASC' },
      });
    }
    return items;
  }

  // ────────────────────────────────────────────────────────────────
  // Carnet vaccinal de l'enfant
  // ────────────────────────────────────────────────────────────────

  private recalcStatut(v: VaccinationEnfant): VaccinationEnfant {
    if (v.dateAdministration) {
      v.statut = StatutVaccination.FAIT;
    } else if (v.datePrevue && new Date(v.datePrevue) < new Date()) {
      v.statut = StatutVaccination.EN_RETARD;
    } else {
      v.statut = StatutVaccination.A_FAIRE;
    }
    return v;
  }

  /**
   * Renvoie le carnet vaccinal d'un enfant. Si aucun vaccin n'a encore été
   * généré, on le génère automatiquement à partir du calendrier PEV et de la
   * date de naissance de l'enfant (dates prévues calculées).
   */
  async getCarnetVaccinal(patientId: string, tenantId: string): Promise<VaccinationEnfant[]> {
    const patient = await this.getPatientOrFail(patientId, tenantId);
    let vaccins = await this.vaccinRepo.find({ where: { patientId, tenantId } });

    if (vaccins.length === 0) {
      vaccins = await this.genererCarnet(patient, tenantId);
    }

    // Recalcul du statut (en_retard) à chaque lecture, persisté si changé.
    const aMettreAJour: VaccinationEnfant[] = [];
    for (const v of vaccins) {
      const avant = v.statut;
      this.recalcStatut(v);
      if (v.statut !== avant) aMettreAJour.push(v);
    }
    if (aMettreAJour.length) await this.vaccinRepo.save(aMettreAJour);

    return vaccins.sort((a, b) => (a.agePrevuSemaines ?? 0) - (b.agePrevuSemaines ?? 0));
  }

  /** Génère les lignes du carnet à partir du calendrier et de la naissance. */
  private async genererCarnet(patient: Patient, tenantId: string): Promise<VaccinationEnfant[]> {
    const calendrier = await this.getCalendrier(tenantId);
    const naissance = patient.dateNaissance ? new Date(patient.dateNaissance) : null;

    const lignes = calendrier.map((c) => {
      let datePrevue: string | undefined;
      if (naissance && !isNaN(naissance.getTime())) {
        const d = new Date(naissance);
        d.setDate(d.getDate() + (c.ageSemaines ?? 0) * 7);
        datePrevue = d.toISOString().slice(0, 10);
      }
      const v = this.vaccinRepo.create({
        patientId: patient.id,
        vaccin: c.vaccin,
        dosePrevueAge: c.ageRecommande,
        agePrevuSemaines: c.ageSemaines,
        datePrevue,
        statut: StatutVaccination.A_FAIRE,
        tenantId,
      });
      return this.recalcStatut(v);
    });
    return this.vaccinRepo.save(lignes);
  }

  async createVaccination(
    dto: CreateVaccinationDto,
    tenantId: string,
  ): Promise<VaccinationEnfant> {
    await this.getPatientOrFail(dto.patientId, tenantId);
    const v = this.vaccinRepo.create({
      patientId: dto.patientId,
      vaccin: dto.vaccin,
      dosePrevueAge: dto.dosePrevueAge,
      agePrevuSemaines: dto.agePrevuSemaines,
      dateAdministration: dto.dateAdministration,
      lot: dto.lot,
      observations: dto.observations,
      tenantId,
    });
    this.recalcStatut(v);
    return this.vaccinRepo.save(v);
  }

  /** Met à jour une ligne du carnet — typiquement pour marquer un vaccin administré. */
  async updateVaccination(
    id: string,
    dto: UpdateVaccinationDto,
    tenantId: string,
  ): Promise<VaccinationEnfant> {
    const v = await this.vaccinRepo.findOne({ where: { id, tenantId } });
    if (!v) throw new NotFoundException(`Vaccination ${id} introuvable`);

    if (dto.dateAdministration !== undefined) v.dateAdministration = dto.dateAdministration;
    if (dto.lot !== undefined) v.lot = dto.lot;
    if (dto.administrePar !== undefined) v.administrePar = dto.administrePar;
    if (dto.observations !== undefined) v.observations = dto.observations;
    if (dto.statut !== undefined) v.statut = dto.statut;

    // Si une date d'administration est fournie sans statut explicite → "fait".
    if (dto.dateAdministration && dto.statut === undefined) {
      v.statut = StatutVaccination.FAIT;
    } else if (dto.statut === undefined) {
      this.recalcStatut(v);
    }
    return this.vaccinRepo.save(v);
  }

  // ────────────────────────────────────────────────────────────────
  // Calcul de posologie
  // ────────────────────────────────────────────────────────────────

  /**
   * Utilitaire de calcul de posologie pédiatrique selon le poids.
   * @returns dose journalière totale et dose par prise (mg).
   */
  calculerPosologie(poidsKg: number, mgParKgParJour: number, nbPrises: number, doseMaxJourMg?: number) {
    if (nbPrises <= 0) throw new BadRequestException('Le nombre de prises doit être supérieur à 0');
    let doseJourMg = poidsKg * mgParKgParJour;
    let plafonnee = false;
    if (doseMaxJourMg !== undefined && doseMaxJourMg !== null && doseJourMg > doseMaxJourMg) {
      doseJourMg = doseMaxJourMg;
      plafonnee = true;
    }
    const doseParPriseMg = doseJourMg / nbPrises;
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      doseJourMg: round(doseJourMg),
      doseParPriseMg: round(doseParPriseMg),
      nbPrises,
      plafonnee,
    };
  }

  calculerPosologieDto(dto: PosologieDto) {
    const res = this.calculerPosologie(
      dto.poidsKg,
      dto.mgParKgParJour,
      dto.nbPrises,
      dto.doseMaxJourMg,
    );
    return { medicament: dto.medicament ?? null, poidsKg: dto.poidsKg, mgParKgParJour: dto.mgParKgParJour, ...res };
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────

  async getStats(tenantId: string): Promise<{
    totalMesures: number;
    enfantsSuivis: number;
    vaccinsFaits: number;
    vaccinsAFaire: number;
    vaccinsEnRetard: number;
  }> {
    const [totalMesures, mesures, vaccins] = await Promise.all([
      this.mesureRepo.count({ where: { tenantId } }),
      this.mesureRepo.find({ where: { tenantId }, select: ['patientId'] }),
      this.vaccinRepo.find({ where: { tenantId }, select: ['statut'] }),
    ]);
    const enfantsSuivis = new Set(mesures.map((m) => m.patientId)).size;
    const vaccinsFaits = vaccins.filter((v) => v.statut === StatutVaccination.FAIT).length;
    const vaccinsAFaire = vaccins.filter((v) => v.statut === StatutVaccination.A_FAIRE).length;
    const vaccinsEnRetard = vaccins.filter((v) => v.statut === StatutVaccination.EN_RETARD).length;
    return { totalMesures, enfantsSuivis, vaccinsFaits, vaccinsAFaire, vaccinsEnRetard };
  }
}
