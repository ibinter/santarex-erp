import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  TypeExamenImagerie,
  ModaliteImagerie,
} from './entities/type-examen-imagerie.entity';
import { DemandeImagerie, StatutImagerie } from './entities/demande-imagerie.entity';
import { ResultatImagerie } from './entities/resultat-imagerie.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { CreateDemandeImagerieDto } from './dto/create-demande-imagerie.dto';
import { SaisirResultatImagerieDto } from './dto/saisir-resultat-imagerie.dto';
import { EXAMENS_IMAGERIE_CATALOGUE } from './data/examens-catalogue';

/** Forme d'examen consommée par le frontend (imagerie/page.tsx). */
export interface ExamenView {
  id: string;
  numero: string;
  patient: { id: string; nom: string; prenom: string } | null;
  medecin: { id: string; nom: string; prenom: string } | null;
  typeExamen: string;
  modalite: ModaliteImagerie;
  regionAnatomique: string;
  statut: string; // EN_ATTENTE | EN_COURS | TERMINE | VALIDE | ANNULE
  dateExamen: string | null;
  urgence: boolean;
  resultat: string | null;
}

@Injectable()
export class ImagerieService {
  constructor(
    @InjectRepository(TypeExamenImagerie)
    private readonly typeRepo: Repository<TypeExamenImagerie>,
    @InjectRepository(DemandeImagerie)
    private readonly demandeRepo: Repository<DemandeImagerie>,
    @InjectRepository(ResultatImagerie)
    private readonly resultatRepo: Repository<ResultatImagerie>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Numéro auto
  // ────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.demandeRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `IMG-${annee}-${seq}`;
  }

  // ────────────────────────────────────────────────────────────────
  // Catalogue de types d'examen (semé automatiquement par tenant)
  // ────────────────────────────────────────────────────────────────
  async ensureCatalogue(tenantId: string): Promise<void> {
    const existing = await this.typeRepo.count({ where: { tenantId } });
    if (existing > 0) return;
    const rows = EXAMENS_IMAGERIE_CATALOGUE.map((e) =>
      this.typeRepo.create({ ...e, tenantId }),
    );
    await this.typeRepo.save(rows);
  }

  async findAllTypes(tenantId: string): Promise<TypeExamenImagerie[]> {
    await this.ensureCatalogue(tenantId);
    return this.typeRepo.find({
      where: { tenantId, estActif: true },
      order: { modalite: 'ASC', nom: 'ASC' },
    });
  }

  async createType(
    dto: Partial<TypeExamenImagerie>,
    tenantId: string,
  ): Promise<TypeExamenImagerie> {
    const type = this.typeRepo.create({ ...dto, tenantId });
    return this.typeRepo.save(type);
  }

  // ────────────────────────────────────────────────────────────────
  // Demandes d'examen
  // ────────────────────────────────────────────────────────────────
  async creerDemande(
    dto: CreateDemandeImagerieDto,
    tenantId: string,
    userId: string,
  ): Promise<DemandeImagerie> {
    await this.ensureCatalogue(tenantId);

    const type = await this.typeRepo.findOne({
      where: { id: dto.typeExamenId, tenantId },
    });
    if (!type) {
      throw new BadRequestException("Type d'examen introuvable");
    }

    const numero = await this.genererNumero(tenantId);
    const demande = this.demandeRepo.create({
      numero,
      patientId: dto.patientId,
      medecinPrescripteurId: dto.medecinPrescripteurId,
      typeExamenId: dto.typeExamenId,
      modalite: type.modalite,
      regionAnatomique: dto.regionAnatomique ?? type.regionAnatomique,
      urgence: dto.urgence ?? false,
      statut: StatutImagerie.EN_ATTENTE,
      dateHeureDemande: new Date(),
      indicationClinique: dto.indicationClinique,
      notes: dto.notes,
      tenantId,
      createdById: userId,
    });
    return this.demandeRepo.save(demande);
  }

  /** Liste des examens enrichis (patient, médecin, type, résultat) — forme frontend. */
  async findAllExamens(
    tenantId: string,
    filters: { statut?: string; patientId?: string; urgence?: boolean; date?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<ExamenView[]> {
    await this.ensureCatalogue(tenantId);

    const { page = 1, limit = 100 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.demandeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.statut) {
      const norm = this.normaliserStatut(filters.statut);
      if (norm) qb.andWhere('d.statut = :statut', { statut: norm });
    }
    if (filters.patientId) {
      qb.andWhere('d.patientId = :patientId', { patientId: filters.patientId });
    }
    if (filters.urgence !== undefined) {
      qb.andWhere('d.urgence = :urgence', { urgence: filters.urgence });
    }
    if (filters.date) {
      const debut = new Date(filters.date);
      debut.setHours(0, 0, 0, 0);
      const fin = new Date(filters.date);
      fin.setHours(23, 59, 59, 999);
      qb.andWhere('d.dateHeureDemande BETWEEN :debut AND :fin', { debut, fin });
    }

    const demandes = await qb
      .orderBy('d.urgence', 'DESC')
      .addOrderBy('d.dateHeureDemande', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return this.enrichir(demandes, tenantId);
  }

  async findOneDemande(id: string, tenantId: string): Promise<DemandeImagerie> {
    const demande = await this.demandeRepo.findOne({ where: { id, tenantId } });
    if (!demande) throw new NotFoundException(`Examen ${id} introuvable`);
    return demande;
  }

  async changerStatut(
    id: string,
    statutBrut: string,
    tenantId: string,
  ): Promise<DemandeImagerie> {
    const demande = await this.findOneDemande(id, tenantId);
    const statut = this.normaliserStatut(statutBrut);
    if (!statut) {
      throw new BadRequestException(`Statut « ${statutBrut} » invalide`);
    }
    demande.statut = statut;
    return this.demandeRepo.save(demande);
  }

  // ────────────────────────────────────────────────────────────────
  // Résultats / compte-rendu
  // ────────────────────────────────────────────────────────────────
  async saisirResultat(
    demandeId: string,
    dto: SaisirResultatImagerieDto,
    tenantId: string,
    radiologueId: string,
  ): Promise<{ demande: DemandeImagerie; resultat: ResultatImagerie }> {
    const demande = await this.findOneDemande(demandeId, tenantId);

    let resultat = await this.resultatRepo.findOne({
      where: { demandeId, tenantId },
    });

    const valider = dto.valider !== false; // par défaut on valide

    if (resultat) {
      if (dto.compteRendu !== undefined) resultat.compteRendu = dto.compteRendu;
      if (dto.conclusion !== undefined) resultat.conclusion = dto.conclusion;
      if (dto.imagesUrls !== undefined) resultat.imagesUrls = dto.imagesUrls;
      resultat.radiologueId = radiologueId;
    } else {
      resultat = this.resultatRepo.create({
        demandeId,
        patientId: demande.patientId,
        compteRendu: dto.compteRendu ?? null,
        conclusion: dto.conclusion ?? null,
        imagesUrls: dto.imagesUrls ?? [],
        radiologueId,
        tenantId,
      });
    }

    if (valider) {
      resultat.dateValidation = new Date();
      demande.statut = StatutImagerie.VALIDE;
    } else if (demande.statut === StatutImagerie.EN_ATTENTE) {
      demande.statut = StatutImagerie.EN_COURS;
    }

    await this.resultatRepo.save(resultat);
    await this.demandeRepo.save(demande);

    return { demande, resultat };
  }

  // ────────────────────────────────────────────────────────────────
  // Stats du jour
  // ────────────────────────────────────────────────────────────────
  async getStatsJour(
    tenantId: string,
  ): Promise<{ date: string; total: number; enAttente: number; enCours: number; termines: number }> {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const demandes = await this.demandeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.dateHeureDemande BETWEEN :debut AND :fin', { debut, fin })
      .getMany();

    return {
      date: new Date().toISOString().split('T')[0],
      total: demandes.length,
      enAttente: demandes.filter((d) => d.statut === StatutImagerie.EN_ATTENTE).length,
      enCours: demandes.filter((d) => d.statut === StatutImagerie.EN_COURS).length,
      termines: demandes.filter(
        (d) => d.statut === StatutImagerie.TERMINE || d.statut === StatutImagerie.VALIDE,
      ).length,
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────
  private normaliserStatut(brut: string): StatutImagerie | null {
    if (!brut) return null;
    const v = brut.toLowerCase();
    const found = Object.values(StatutImagerie).find((s) => s === v);
    return (found as StatutImagerie) ?? null;
  }

  private async enrichir(
    demandes: DemandeImagerie[],
    tenantId: string,
  ): Promise<ExamenView[]> {
    if (demandes.length === 0) return [];

    const patientIds = [...new Set(demandes.map((d) => d.patientId).filter(Boolean))];
    const medecinIds = [...new Set(demandes.map((d) => d.medecinPrescripteurId).filter(Boolean))];
    const typeIds = [...new Set(demandes.map((d) => d.typeExamenId).filter(Boolean))];
    const demandeIds = demandes.map((d) => d.id);

    const [patients, medecins, types, resultats] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      medecinIds.length
        ? this.userRepo.find({ where: { id: In(medecinIds), tenantId } })
        : Promise.resolve([] as User[]),
      typeIds.length
        ? this.typeRepo.find({ where: { id: In(typeIds), tenantId } })
        : Promise.resolve([] as TypeExamenImagerie[]),
      demandeIds.length
        ? this.resultatRepo.find({ where: { demandeId: In(demandeIds), tenantId } })
        : Promise.resolve([] as ResultatImagerie[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const mMap = new Map(medecins.map((m) => [m.id, m]));
    const tMap = new Map(types.map((t) => [t.id, t]));
    const rMap = new Map(resultats.map((r) => [r.demandeId, r]));

    return demandes.map((d) => {
      const p = pMap.get(d.patientId);
      const m = mMap.get(d.medecinPrescripteurId);
      const t = tMap.get(d.typeExamenId);
      const r = rMap.get(d.id);
      return {
        id: d.id,
        numero: d.numero,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom } : null,
        medecin: m ? { id: m.id, nom: m.lastName, prenom: m.firstName } : null,
        typeExamen: t ? t.nom : '—',
        modalite: d.modalite,
        regionAnatomique: d.regionAnatomique ?? '—',
        statut: d.statut.toUpperCase(),
        dateExamen: d.dateHeureDemande ? d.dateHeureDemande.toISOString() : null,
        urgence: d.urgence,
        resultat: r ? r.conclusion ?? r.compteRendu ?? null : null,
      };
    });
  }
}
