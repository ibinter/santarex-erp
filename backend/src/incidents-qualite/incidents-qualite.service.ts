import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  IncidentQualite,
  StatutIncident,
  TypeIncident,
  GraviteIncident,
  TypeActionIncident,
  ActionIncident,
} from './entities/incident-qualite.entity';
import {
  CreateIncidentQualiteDto,
  UpdateIncidentQualiteDto,
  UpdateStatutIncidentDto,
  AjouterActionIncidentDto,
} from './dto/incident-qualite.dto';

/**
 * Transitions de statut autorisées (workflow qualité).
 * declare → en_analyse → action_en_cours → cloture.
 * On autorise aussi un retour en arrière contrôlé (réouverture d'un incident
 * clôturé à tort, ou retour en analyse depuis les actions) — utile en pratique.
 */
const TRANSITIONS: Record<StatutIncident, StatutIncident[]> = {
  [StatutIncident.DECLARE]: [StatutIncident.EN_ANALYSE, StatutIncident.CLOTURE],
  [StatutIncident.EN_ANALYSE]: [
    StatutIncident.ACTION_EN_COURS,
    StatutIncident.DECLARE,
    StatutIncident.CLOTURE,
  ],
  [StatutIncident.ACTION_EN_COURS]: [
    StatutIncident.CLOTURE,
    StatutIncident.EN_ANALYSE,
  ],
  [StatutIncident.CLOTURE]: [StatutIncident.ACTION_EN_COURS],
};

@Injectable()
export class IncidentsQualiteService {
  private readonly logger = new Logger(IncidentsQualiteService.name);

  constructor(
    @InjectRepository(IncidentQualite)
    private readonly repo: Repository<IncidentQualite>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Numéro auto INC-AAAA-NNNN (séquence par tenant + année)
  // ────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const debut = new Date(annee, 0, 1, 0, 0, 0, 0);
    const fin = new Date(annee, 11, 31, 23, 59, 59, 999);
    const count = await this.repo.count({
      where: { tenantId, createdAt: Between(debut, fin) },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `INC-${annee}-${seq}`;
  }

  private nouvelleAction(
    type: TypeActionIncident,
    auteurId: string,
    contenu: string,
    extra?: { ancienStatut?: StatutIncident; nouveauStatut?: StatutIncident },
  ): ActionIncident {
    return {
      id: uuidv4(),
      type,
      auteurId,
      contenu,
      ancienStatut: extra?.ancienStatut,
      nouveauStatut: extra?.nouveauStatut,
      createdAt: new Date().toISOString(),
    };
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────────────────────────
  async creer(
    dto: CreateIncidentQualiteDto,
    tenantId: string,
    declarantId: string,
  ): Promise<IncidentQualite> {
    const numero = await this.genererNumero(tenantId);
    const incident = this.repo.create({
      numero,
      tenantId,
      declarantId,
      type: dto.type,
      gravite: dto.gravite,
      statut: StatutIncident.DECLARE,
      dateSurvenue: new Date(dto.dateSurvenue),
      serviceConcerne: dto.serviceConcerne,
      patientId: dto.patientId ?? null,
      description: dto.description,
      causesIdentifiees: dto.causesIdentifiees ?? null,
      mesuresCorrectives: dto.mesuresCorrectives ?? null,
      analyseJson: dto.analyseJson ?? null,
      actions: [
        this.nouvelleAction(
          TypeActionIncident.CHANGEMENT_STATUT,
          declarantId,
          'Incident déclaré',
          { nouveauStatut: StatutIncident.DECLARE },
        ),
      ],
    });
    const saved = await this.repo.save(incident);
    this.logger.log(
      `Incident qualité ${saved.numero} déclaré (type=${saved.type}, gravité=${saved.gravite}, tenant=${tenantId})`,
    );
    return saved;
  }

  async findAll(
    tenantId: string,
    filters: {
      statut?: StatutIncident;
      type?: TypeIncident;
      gravite?: GraviteIncident;
      patientId?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: IncidentQualite[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('i.statut = :statut', { statut: filters.statut });
    if (filters.type) qb.andWhere('i.type = :type', { type: filters.type });
    if (filters.gravite) qb.andWhere('i.gravite = :gravite', { gravite: filters.gravite });
    if (filters.patientId) qb.andWhere('i.patientId = :patientId', { patientId: filters.patientId });
    if (filters.search) {
      qb.andWhere(
        '(i.numero ILIKE :s OR i.description ILIKE :s OR i.serviceConcerne ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('i.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<IncidentQualite> {
    const incident = await this.repo.findOne({ where: { id, tenantId } });
    if (!incident) throw new NotFoundException(`Incident qualité ${id} introuvable`);
    return incident;
  }

  async update(
    id: string,
    dto: UpdateIncidentQualiteDto,
    tenantId: string,
  ): Promise<IncidentQualite> {
    const incident = await this.findOne(id, tenantId);
    if (incident.statut === StatutIncident.CLOTURE) {
      throw new BadRequestException(
        'Un incident clôturé ne peut être modifié — rouvrez-le d\'abord.',
      );
    }
    if (dto.type !== undefined) incident.type = dto.type;
    if (dto.gravite !== undefined) incident.gravite = dto.gravite;
    if (dto.dateSurvenue !== undefined) incident.dateSurvenue = new Date(dto.dateSurvenue);
    if (dto.serviceConcerne !== undefined) incident.serviceConcerne = dto.serviceConcerne;
    if (dto.patientId !== undefined) incident.patientId = dto.patientId ?? null;
    if (dto.description !== undefined) incident.description = dto.description;
    if (dto.causesIdentifiees !== undefined) incident.causesIdentifiees = dto.causesIdentifiees ?? null;
    if (dto.mesuresCorrectives !== undefined) incident.mesuresCorrectives = dto.mesuresCorrectives ?? null;
    if (dto.analyseJson !== undefined) incident.analyseJson = dto.analyseJson ?? null;
    return this.repo.save(incident);
  }

  // ────────────────────────────────────────────────────────────────
  // Transition de statut
  // ────────────────────────────────────────────────────────────────
  async changerStatut(
    id: string,
    dto: UpdateStatutIncidentDto,
    tenantId: string,
    userId: string,
  ): Promise<IncidentQualite> {
    const incident = await this.findOne(id, tenantId);
    const ancien = incident.statut;
    const nouveau = dto.statut;

    if (ancien === nouveau) {
      throw new BadRequestException('L\'incident est déjà dans ce statut.');
    }
    const autorisees = TRANSITIONS[ancien] ?? [];
    if (!autorisees.includes(nouveau)) {
      throw new BadRequestException(
        `Transition non autorisée : ${ancien} → ${nouveau}.`,
      );
    }

    incident.statut = nouveau;
    if (nouveau === StatutIncident.CLOTURE) {
      incident.dateCloture = new Date();
    } else if (ancien === StatutIncident.CLOTURE) {
      // Réouverture — on efface la date de clôture.
      incident.dateCloture = null;
    }

    const contenu = dto.commentaire?.trim()
      ? dto.commentaire.trim()
      : `Statut changé : ${ancien} → ${nouveau}`;
    incident.actions = [
      ...(incident.actions ?? []),
      this.nouvelleAction(TypeActionIncident.CHANGEMENT_STATUT, userId, contenu, {
        ancienStatut: ancien,
        nouveauStatut: nouveau,
      }),
    ];

    return this.repo.save(incident);
  }

  // ────────────────────────────────────────────────────────────────
  // Ajout d'une action / commentaire au fil de suivi
  // ────────────────────────────────────────────────────────────────
  async ajouterAction(
    id: string,
    dto: AjouterActionIncidentDto,
    tenantId: string,
    userId: string,
  ): Promise<IncidentQualite> {
    const incident = await this.findOne(id, tenantId);
    if (!dto.contenu?.trim()) {
      throw new BadRequestException('Le contenu de l\'action est requis.');
    }
    incident.actions = [
      ...(incident.actions ?? []),
      this.nouvelleAction(
        dto.type ?? TypeActionIncident.COMMENTAIRE,
        userId,
        dto.contenu.trim(),
      ),
    ];
    return this.repo.save(incident);
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques — tableau de bord qualité
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<{
    total: number;
    parType: Record<string, number>;
    parGravite: Record<string, number>;
    parStatut: Record<string, number>;
    tauxCloture: number;
    incidentsDuMois: number;
    ouvertsCritiques: number;
  }> {
    const incidents = await this.repo.find({ where: { tenantId } });
    const total = incidents.length;

    const parType: Record<string, number> = {};
    for (const t of Object.values(TypeIncident)) parType[t] = 0;
    const parGravite: Record<string, number> = {};
    for (const g of Object.values(GraviteIncident)) parGravite[g] = 0;
    const parStatut: Record<string, number> = {};
    for (const s of Object.values(StatutIncident)) parStatut[s] = 0;

    for (const inc of incidents) {
      parType[inc.type] = (parType[inc.type] ?? 0) + 1;
      parGravite[inc.gravite] = (parGravite[inc.gravite] ?? 0) + 1;
      parStatut[inc.statut] = (parStatut[inc.statut] ?? 0) + 1;
    }

    const clotures = parStatut[StatutIncident.CLOTURE] ?? 0;
    const tauxCloture = total > 0 ? Math.round((clotures / total) * 100) : 0;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const incidentsDuMois = incidents.filter(
      (i) => new Date(i.createdAt) >= debutMois,
    ).length;

    const ouvertsCritiques = incidents.filter(
      (i) =>
        i.gravite === GraviteIncident.CRITIQUE &&
        i.statut !== StatutIncident.CLOTURE,
    ).length;

    return {
      total,
      parType,
      parGravite,
      parStatut,
      tauxCloture,
      incidentsDuMois,
      ouvertsCritiques,
    };
  }
}
