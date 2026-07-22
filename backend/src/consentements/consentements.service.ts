import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ModeleConsentement,
  TypeConsentement,
} from './entities/modele-consentement.entity';
import {
  Consentement,
  StatutConsentement,
  LienSignataire,
} from './entities/consentement.entity';
import {
  CreateModeleConsentementDto,
  UpdateModeleConsentementDto,
  CreateConsentementDto,
  SignerConsentementDto,
  RefuserConsentementDto,
  RevoquerConsentementDto,
} from './dto/consentement.dto';

/**
 * Modèles de consentement réels pré-remplis pour tout nouvel établissement.
 * Semés paresseusement (par tenant) au premier accès au référentiel.
 */
const MODELES_PAR_DEFAUT: Array<
  Pick<ModeleConsentement, 'type' | 'titre' | 'description' | 'texteModele'>
> = [
  {
    type: TypeConsentement.CHIRURGIE,
    titre: 'Consentement à une intervention chirurgicale',
    description: 'Formulaire de consentement éclairé pour tout acte chirurgical.',
    texteModele:
      "Je soussigné(e), reconnais avoir reçu de la part du médecin une information " +
      "claire, loyale et adaptée sur l'intervention chirurgicale proposée, sur ses " +
      "bénéfices attendus, ses risques et complications possibles, ainsi que sur les " +
      "alternatives thérapeutiques et les conséquences d'une absence de traitement. " +
      "J'ai pu poser toutes les questions utiles et obtenir des réponses satisfaisantes. " +
      "En conséquence, je consens librement à la réalisation de cette intervention.",
  },
  {
    type: TypeConsentement.ANESTHESIE,
    titre: "Consentement à l'anesthésie",
    description: 'Consentement éclairé relatif à la technique anesthésique.',
    texteModele:
      "Je reconnais avoir bénéficié d'une consultation pré-anesthésique au cours de " +
      "laquelle le médecin anesthésiste-réanimateur m'a informé(e) de la technique " +
      "d'anesthésie envisagée (générale, loco-régionale ou locale), de son déroulement, " +
      "de ses risques et des mesures de surveillance. J'ai communiqué mes antécédents, " +
      "traitements et allergies. Je consens à l'anesthésie proposée et j'autorise, en cas " +
      "de nécessité constatée pendant l'acte, toute modification jugée indispensable.",
  },
  {
    type: TypeConsentement.TRANSFUSION,
    titre: 'Consentement à une transfusion sanguine',
    description: 'Consentement éclairé pour la transfusion de produits sanguins.',
    texteModele:
      "J'ai été informé(e) de la nécessité éventuelle d'une transfusion de produits " +
      "sanguins labiles (globules rouges, plaquettes, plasma), de ses bénéfices, de ses " +
      "risques infectieux et immunologiques, ainsi que du suivi post-transfusionnel. " +
      "J'ai pris connaissance de mon droit d'accepter ou de refuser. Je consens à recevoir " +
      "une transfusion si mon état de santé le requiert.",
  },
  {
    type: TypeConsentement.ACTE_INVASIF,
    titre: 'Consentement à un acte invasif / examen à risque',
    description: 'Endoscopie, ponction, pose de cathéter, biopsie, etc.',
    texteModele:
      "Le médecin m'a informé(e) de la nature de l'acte invasif proposé, de son intérêt " +
      "diagnostique ou thérapeutique, de son déroulement, des risques encourus et des " +
      "alternatives possibles. Ayant reçu une information complète et pu poser mes " +
      "questions, je donne mon consentement libre et éclairé à la réalisation de cet acte.",
  },
  {
    type: TypeConsentement.SOINS,
    titre: 'Consentement aux soins',
    description: 'Consentement général à la prise en charge et aux soins.',
    texteModele:
      "Je consens aux soins et à la prise en charge médicale proposés par l'équipe " +
      "soignante, dont l'objet et les modalités m'ont été expliqués. Je pourrai à tout " +
      "moment demander des précisions complémentaires ou revenir sur mon consentement.",
  },
  {
    type: TypeConsentement.RECHERCHE,
    titre: 'Consentement à participer à une recherche',
    description: 'Consentement éclairé pour une recherche impliquant la personne humaine.',
    texteModele:
      "J'ai reçu une note d'information détaillant l'objectif de la recherche, sa " +
      "méthodologie, sa durée, les bénéfices attendus et les contraintes ou risques " +
      "prévisibles. J'ai été informé(e) de mon droit de refuser d'y participer et de " +
      "retirer mon consentement à tout moment sans conséquence sur ma prise en charge. " +
      "Je consens librement à participer à cette recherche.",
  },
];

@Injectable()
export class ConsentementsService {
  private readonly logger = new Logger(ConsentementsService.name);

  constructor(
    @InjectRepository(ModeleConsentement)
    private readonly modeleRepo: Repository<ModeleConsentement>,
    @InjectRepository(Consentement)
    private readonly consentementRepo: Repository<Consentement>,
  ) {}

  // ──────────────────────────────────────────────────────────────────
  // Seed paresseux des modèles par défaut (idempotent, par tenant)
  // ──────────────────────────────────────────────────────────────────
  private async ensureModelesSeed(tenantId: string): Promise<void> {
    const count = await this.modeleRepo.count({ where: { tenantId } });
    if (count > 0) return;
    const entities = MODELES_PAR_DEFAUT.map((m) =>
      this.modeleRepo.create({ ...m, actif: true, tenantId }),
    );
    await this.modeleRepo.save(entities);
    this.logger.log(
      `Modèles de consentement par défaut semés pour le tenant ${tenantId} (${entities.length}).`,
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Numéro auto CONS-AAAA-NNNN (séquence par tenant + année)
  // ──────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const debut = new Date(annee, 0, 1, 0, 0, 0, 0);
    const fin = new Date(annee, 11, 31, 23, 59, 59, 999);
    const count = await this.consentementRepo.count({
      where: { tenantId, createdAt: Between(debut, fin) },
    });
    return `CONS-${annee}-${String(count + 1).padStart(4, '0')}`;
  }

  // ──────────────────────────────────────────────────────────────────
  // Modèles — CRUD
  // ──────────────────────────────────────────────────────────────────
  async findAllModeles(
    tenantId: string,
    filters: { type?: TypeConsentement; actif?: boolean } = {},
  ): Promise<ModeleConsentement[]> {
    await this.ensureModelesSeed(tenantId);
    const qb = this.modeleRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });
    if (filters.type) qb.andWhere('m.type = :type', { type: filters.type });
    if (filters.actif !== undefined)
      qb.andWhere('m.actif = :actif', { actif: filters.actif });
    return qb.orderBy('m.type', 'ASC').addOrderBy('m.titre', 'ASC').getMany();
  }

  async findOneModele(id: string, tenantId: string): Promise<ModeleConsentement> {
    const m = await this.modeleRepo.findOne({ where: { id, tenantId } });
    if (!m) throw new NotFoundException(`Modèle de consentement ${id} introuvable`);
    return m;
  }

  async createModele(
    dto: CreateModeleConsentementDto,
    tenantId: string,
  ): Promise<ModeleConsentement> {
    const m = this.modeleRepo.create({
      ...dto,
      actif: dto.actif ?? true,
      tenantId,
    });
    return this.modeleRepo.save(m);
  }

  async updateModele(
    id: string,
    dto: UpdateModeleConsentementDto,
    tenantId: string,
  ): Promise<ModeleConsentement> {
    const m = await this.findOneModele(id, tenantId);
    Object.assign(m, dto);
    return this.modeleRepo.save(m);
  }

  async removeModele(id: string, tenantId: string): Promise<{ deleted: true }> {
    const m = await this.findOneModele(id, tenantId);
    await this.modeleRepo.remove(m);
    return { deleted: true };
  }

  // ──────────────────────────────────────────────────────────────────
  // Consentements — CRUD
  // ──────────────────────────────────────────────────────────────────
  async createConsentement(
    dto: CreateConsentementDto,
    tenantId: string,
    userId: string,
  ): Promise<Consentement> {
    let type = dto.type;
    let titre = dto.titre;
    let texte = dto.texteConsentement;

    // Depuis un modèle : on FIGE le texte au moment de la création.
    if (dto.modeleId) {
      const modele = await this.findOneModele(dto.modeleId, tenantId);
      type = type ?? modele.type;
      titre = titre ?? modele.titre;
      texte = texte ?? modele.texteModele;
    }

    if (!type) {
      throw new BadRequestException(
        'Fournir un "modeleId" ou un "type" de consentement.',
      );
    }
    if (!texte) {
      throw new BadRequestException(
        'Le texte du consentement est requis (via un modèle ou saisi directement).',
      );
    }

    const numero = await this.genererNumero(tenantId);
    const consentement = this.consentementRepo.create({
      numero,
      patientId: dto.patientId,
      modeleId: dto.modeleId ?? null,
      type,
      acteConcerne: dto.acteConcerne,
      titre: titre ?? dto.acteConcerne,
      texteConsentement: texte,
      medecinRef: dto.medecinRef,
      interventionId: dto.interventionId ?? null,
      statut: StatutConsentement.A_SIGNER,
      patientMineur: dto.patientMineur ?? false,
      observations: dto.observations,
      tenantId,
      createdById: userId,
    });
    return this.consentementRepo.save(consentement);
  }

  async findAllConsentements(
    tenantId: string,
    filters: {
      patientId?: string;
      statut?: StatutConsentement;
      type?: TypeConsentement;
      interventionId?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Consentement[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const qb = this.consentementRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('c.patientId = :patientId', { patientId: filters.patientId });
    if (filters.statut) qb.andWhere('c.statut = :statut', { statut: filters.statut });
    if (filters.type) qb.andWhere('c.type = :type', { type: filters.type });
    if (filters.interventionId)
      qb.andWhere('c.interventionId = :interventionId', {
        interventionId: filters.interventionId,
      });

    const [data, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async findOneConsentement(id: string, tenantId: string): Promise<Consentement> {
    const c = await this.consentementRepo.findOne({ where: { id, tenantId } });
    if (!c) throw new NotFoundException(`Consentement ${id} introuvable`);
    return c;
  }

  async removeConsentement(id: string, tenantId: string): Promise<{ deleted: true }> {
    const c = await this.findOneConsentement(id, tenantId);
    if (c.statut === StatutConsentement.SIGNE) {
      throw new BadRequestException(
        "Un consentement signé ne peut pas être supprimé (valeur médico-légale). Utilisez la révocation.",
      );
    }
    await this.consentementRepo.remove(c);
    return { deleted: true };
  }

  // ──────────────────────────────────────────────────────────────────
  // Transitions de statut
  // ──────────────────────────────────────────────────────────────────
  async signer(
    id: string,
    dto: SignerConsentementDto,
    tenantId: string,
  ): Promise<Consentement> {
    const c = await this.findOneConsentement(id, tenantId);
    if (c.statut !== StatutConsentement.A_SIGNER) {
      throw new BadRequestException(
        `Seul un consentement « à signer » peut être signé (statut actuel : ${c.statut}).`,
      );
    }
    const lien = dto.signataireLien ?? LienSignataire.PATIENT;
    if (c.patientMineur && lien === LienSignataire.PATIENT) {
      throw new BadRequestException(
        'Le patient étant mineur / protégé, la signature doit être celle du représentant légal (parent, tuteur…).',
      );
    }
    c.statut = StatutConsentement.SIGNE;
    c.dateSignature = new Date();
    c.signataireNom = dto.signataireNom;
    c.signataireLien = lien;
    if (dto.temoinNom !== undefined) c.temoinNom = dto.temoinNom;
    if (dto.observations !== undefined) c.observations = dto.observations;
    return this.consentementRepo.save(c);
  }

  async refuser(
    id: string,
    dto: RefuserConsentementDto,
    tenantId: string,
  ): Promise<Consentement> {
    const c = await this.findOneConsentement(id, tenantId);
    if (c.statut !== StatutConsentement.A_SIGNER) {
      throw new BadRequestException(
        `Seul un consentement « à signer » peut être refusé (statut actuel : ${c.statut}).`,
      );
    }
    c.statut = StatutConsentement.REFUSE;
    c.motif = dto.motif;
    if (dto.signataireNom !== undefined) c.signataireNom = dto.signataireNom;
    return this.consentementRepo.save(c);
  }

  async revoquer(
    id: string,
    dto: RevoquerConsentementDto,
    tenantId: string,
  ): Promise<Consentement> {
    const c = await this.findOneConsentement(id, tenantId);
    if (c.statut !== StatutConsentement.SIGNE) {
      throw new BadRequestException(
        `Seul un consentement signé peut être révoqué (statut actuel : ${c.statut}).`,
      );
    }
    c.statut = StatutConsentement.REVOQUE;
    c.dateRevocation = new Date();
    c.motif = dto.motif;
    return this.consentementRepo.save(c);
  }

  // ──────────────────────────────────────────────────────────────────
  // Statistiques
  // ──────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<{
    total: number;
    aSigner: number;
    signes: number;
    refuses: number;
    revoques: number;
    parType: Record<string, number>;
    tauxSignature: number;
  }> {
    const rows = await this.consentementRepo.find({
      where: { tenantId },
      select: ['id', 'statut', 'type'],
    });
    const total = rows.length;
    const parStatut = (s: StatutConsentement) =>
      rows.filter((r) => r.statut === s).length;

    const parType: Record<string, number> = {};
    for (const t of Object.values(TypeConsentement)) parType[t] = 0;
    for (const r of rows) parType[r.type] = (parType[r.type] ?? 0) + 1;

    const signes = parStatut(StatutConsentement.SIGNE);
    const tauxSignature = total > 0 ? Math.round((signes / total) * 100) : 0;

    return {
      total,
      aSigner: parStatut(StatutConsentement.A_SIGNER),
      signes,
      refuses: parStatut(StatutConsentement.REFUSE),
      revoques: parStatut(StatutConsentement.REVOQUE),
      parType,
      tauxSignature,
    };
  }
}
