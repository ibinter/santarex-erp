import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  ModeleMessage,
  CodeModeleMessage,
  CanalMessage,
} from './entities/modele-message.entity';
import {
  MessageSortant,
  StatutMessageSortant,
} from './entities/message-sortant.entity';
import { Patient } from '../patients/entities/patient.entity';
import { RendezVous } from '../rendez-vous/entities/rendez-vous.entity';
import { CreateModeleMessageDto, UpdateModeleMessageDto } from './dto/modele-message.dto';
import { EnvoiMessageDto } from './dto/envoi-message.dto';
import {
  MESSAGE_PROVIDER,
  MessageProvider,
} from './providers/message-provider.interface';

/** Modèles semés automatiquement au premier accès d'un tenant. */
const MODELES_DEFAUT: Array<Pick<ModeleMessage, 'code' | 'libelle' | 'canal' | 'contenu'>> = [
  {
    code: CodeModeleMessage.RAPPEL_RDV,
    libelle: 'Rappel de rendez-vous',
    canal: CanalMessage.SMS,
    contenu:
      'Bonjour {{nom}}, rappel de votre rendez-vous le {{date}} à {{heure}}. Merci de votre ponctualité.',
  },
  {
    code: CodeModeleMessage.RESULTAT_PRET,
    libelle: 'Résultat disponible',
    canal: CanalMessage.SMS,
    contenu:
      'Bonjour {{nom}}, vos résultats sont disponibles. Merci de vous présenter à l’accueil.',
  },
  {
    code: CodeModeleMessage.RELANCE,
    libelle: 'Relance',
    canal: CanalMessage.SMS,
    contenu:
      'Bonjour {{nom}}, nous vous rappelons votre échéance en attente. Contactez-nous pour toute information.',
  },
  {
    code: CodeModeleMessage.BIENVENUE,
    libelle: 'Message de bienvenue',
    canal: CanalMessage.WHATSAPP,
    contenu: 'Bienvenue {{nom}} ! Votre dossier a bien été créé. À bientôt.',
  },
];

@Injectable()
export class MessagesSortantsService {
  private readonly logger = new Logger(MessagesSortantsService.name);

  constructor(
    @InjectRepository(ModeleMessage)
    private readonly modeleRepo: Repository<ModeleMessage>,
    @InjectRepository(MessageSortant)
    private readonly messageRepo: Repository<MessageSortant>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(RendezVous)
    private readonly rdvRepo: Repository<RendezVous>,
    @Inject(MESSAGE_PROVIDER)
    private readonly provider: MessageProvider,
  ) {}

  // ─── Modèles ──────────────────────────────────────────────────────────────

  /** Sème les modèles par défaut si le tenant n'en a aucun. Idempotent. */
  async ensureModelesDefaut(tenantId: string): Promise<void> {
    const count = await this.modeleRepo.count({ where: { tenantId } });
    if (count > 0) return;
    const modeles = MODELES_DEFAUT.map((m) =>
      this.modeleRepo.create({ ...m, tenantId, actif: true }),
    );
    await this.modeleRepo.save(modeles);
    this.logger.log(`Modèles de messages semés pour le tenant ${tenantId}`);
  }

  async findModeles(tenantId: string): Promise<ModeleMessage[]> {
    await this.ensureModelesDefaut(tenantId);
    return this.modeleRepo.find({
      where: { tenantId },
      order: { code: 'ASC', createdAt: 'ASC' },
    });
  }

  async createModele(dto: CreateModeleMessageDto, tenantId: string): Promise<ModeleMessage> {
    const modele = this.modeleRepo.create({ ...dto, tenantId, actif: dto.actif ?? true });
    return this.modeleRepo.save(modele);
  }

  async updateModele(
    id: string,
    dto: UpdateModeleMessageDto,
    tenantId: string,
  ): Promise<ModeleMessage> {
    const modele = await this.modeleRepo.findOne({ where: { id, tenantId } });
    if (!modele) throw new NotFoundException(`Modèle ${id} introuvable`);
    Object.assign(modele, dto);
    return this.modeleRepo.save(modele);
  }

  async deleteModele(id: string, tenantId: string): Promise<void> {
    const res = await this.modeleRepo.delete({ id, tenantId });
    if (!res.affected) throw new NotFoundException(`Modèle ${id} introuvable`);
  }

  // ─── Composition ──────────────────────────────────────────────────────────

  /** Substitue les variables {{cle}} dans un gabarit. */
  private composer(gabarit: string, variables: Record<string, string | number> = {}): string {
    return gabarit.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, cle) => {
      const v = variables[cle];
      return v === undefined || v === null ? '' : String(v);
    });
  }

  // ─── Envoi ────────────────────────────────────────────────────────────────

  /**
   * Envoi unitaire. Compose le contenu (depuis un modèle ou texte libre),
   * enregistre le MessageSortant et le remet au provider actif.
   */
  async envoyer(
    dto: EnvoiMessageDto,
    tenantId: string,
    userId?: string,
  ): Promise<MessageSortant> {
    let destinataire = dto.destinataire;
    let patientId = dto.patientId;
    const variables: Record<string, string | number> = { ...(dto.variables ?? {}) };

    // Résolution du patient (numéro + variables nom/prenom)
    if (patientId) {
      const patient = await this.patientRepo.findOne({ where: { id: patientId, tenantId } });
      if (!patient) throw new NotFoundException(`Patient ${patientId} introuvable`);
      destinataire = destinataire || patient.telephone;
      if (variables.nom === undefined) variables.nom = patient.nom;
      if (variables.prenom === undefined) variables.prenom = patient.prenom;
    }

    if (!destinataire) {
      throw new BadRequestException('Aucun destinataire (numéro ou patient avec téléphone).');
    }

    // Résolution du contenu et du canal
    let contenu = dto.contenu;
    let canal = dto.canal ?? CanalMessage.SMS;
    if (dto.modeleCode) {
      await this.ensureModelesDefaut(tenantId);
      const modele = await this.modeleRepo.findOne({
        where: { code: dto.modeleCode, tenantId, actif: true },
      });
      if (!modele) {
        throw new NotFoundException(`Modèle actif « ${dto.modeleCode} » introuvable`);
      }
      contenu = this.composer(modele.contenu, variables);
      canal = dto.canal ?? modele.canal;
    } else if (contenu) {
      contenu = this.composer(contenu, variables);
    }

    if (!contenu) {
      throw new BadRequestException('Contenu vide : fournir un modeleCode ou un contenu.');
    }

    const message = this.messageRepo.create({
      tenantId,
      patientId: patientId ?? null,
      destinataire,
      canal,
      contenu,
      statut: StatutMessageSortant.EN_ATTENTE,
      modeleCode: dto.modeleCode ?? null,
      referenceObjet: dto.referenceObjet ?? null,
      createdById: userId ?? null,
    });
    await this.messageRepo.save(message);
    return this.remettreAuProvider(message);
  }

  /** Remet un message en attente au provider et met à jour son statut. */
  private async remettreAuProvider(message: MessageSortant): Promise<MessageSortant> {
    try {
      const res = await this.provider.envoyer({
        destinataire: message.destinataire,
        contenu: message.contenu,
        canal: message.canal,
      });
      message.provider = res.provider;
      message.dateEnvoi = new Date();
      if (!res.succes) {
        message.statut = StatutMessageSortant.ECHOUE;
        message.erreur = res.erreur ?? 'Échec inconnu';
      } else {
        message.statut = res.simule
          ? StatutMessageSortant.SIMULE
          : StatutMessageSortant.ENVOYE;
      }
    } catch (err: any) {
      message.statut = StatutMessageSortant.ECHOUE;
      message.erreur = err?.message ?? 'Exception provider';
    }
    return this.messageRepo.save(message);
  }

  async findMessages(
    tenantId: string,
    filters: { statut?: StatutMessageSortant; canal?: CanalMessage; patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: MessageSortant[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 30 } = pagination;
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });
    if (filters.statut) qb.andWhere('m.statut = :statut', { statut: filters.statut });
    if (filters.canal) qb.andWhere('m.canal = :canal', { canal: filters.canal });
    if (filters.patientId) qb.andWhere('m.patientId = :patientId', { patientId: filters.patientId });

    const [data, total] = await qb
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  // ─── Génération des rappels de RDV ─────────────────────────────────────────

  /**
   * Génère les MessageSortant de rappel pour les RDV d'une journée donnée
   * (par défaut : le lendemain) sur un tenant. Idempotent : ne recrée pas de
   * message pour un RDV déjà rappelé (référence = rdvId, modeleCode rappel_rdv).
   * Retourne le nombre de rappels créés.
   */
  async genererRappelsRdv(tenantId: string, jour?: Date): Promise<number> {
    const cible = jour ?? this.demain();
    const debut = new Date(cible);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(cible);
    fin.setHours(23, 59, 59, 999);

    const rdvs = await this.rdvRepo.find({
      where: { tenantId, dateHeure: Between(debut, fin) },
    });
    if (rdvs.length === 0) return 0;

    await this.ensureModelesDefaut(tenantId);
    const modele = await this.modeleRepo.findOne({
      where: { code: CodeModeleMessage.RAPPEL_RDV, tenantId, actif: true },
    });
    if (!modele) return 0;

    // Idempotence : RDV déjà rappelés
    const rdvIds = rdvs.map((r) => r.id);
    const dejaRappeles = await this.messageRepo.find({
      where: {
        tenantId,
        modeleCode: CodeModeleMessage.RAPPEL_RDV,
        referenceObjet: In(rdvIds),
      },
      select: ['referenceObjet'],
    });
    const setRappeles = new Set(dejaRappeles.map((m) => m.referenceObjet));

    // Hydrate les patients
    const patientIds = [...new Set(rdvs.map((r) => r.patientId).filter(Boolean))];
    const patients = patientIds.length
      ? await this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
      : [];
    const pMap = new Map(patients.map((p) => [p.id, p]));

    let crees = 0;
    for (const rdv of rdvs) {
      if (setRappeles.has(rdv.id)) continue;
      const patient = pMap.get(rdv.patientId);
      if (!patient || !patient.telephone) continue;

      const d = new Date(rdv.dateHeure);
      const contenu = this.composer(modele.contenu, {
        nom: patient.nom,
        prenom: patient.prenom,
        date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        motif: rdv.motif ?? '',
      });

      const message = this.messageRepo.create({
        tenantId,
        patientId: patient.id,
        destinataire: patient.telephone,
        canal: modele.canal,
        contenu,
        statut: StatutMessageSortant.EN_ATTENTE,
        modeleCode: CodeModeleMessage.RAPPEL_RDV,
        referenceObjet: rdv.id,
      });
      await this.messageRepo.save(message);
      await this.remettreAuProvider(message);
      crees++;
    }
    if (crees > 0) {
      this.logger.log(`${crees} rappel(s) RDV généré(s) pour le tenant ${tenantId}`);
    }
    return crees;
  }

  /**
   * Génère les rappels pour TOUS les tenants ayant des RDV le lendemain.
   * Appelé par le scheduler quotidien.
   */
  async genererRappelsRdvTousTenants(jour?: Date): Promise<number> {
    const cible = jour ?? this.demain();
    const debut = new Date(cible);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(cible);
    fin.setHours(23, 59, 59, 999);

    const rows = await this.rdvRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.tenantId', 'tenantId')
      .where('r.dateHeure BETWEEN :debut AND :fin', { debut, fin })
      .getRawMany<{ tenantId: string }>();

    let total = 0;
    for (const { tenantId } of rows) {
      total += await this.genererRappelsRdv(tenantId, cible);
    }
    return total;
  }

  private demain(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  // ─── Statistiques ───────────────────────────────────────────────────────────

  async getStats(tenantId: string): Promise<any> {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const [total, enAttente, envoyes, echoues, simules] = await Promise.all([
      this.messageRepo.count({ where: { tenantId } }),
      this.messageRepo.count({ where: { tenantId, statut: StatutMessageSortant.EN_ATTENTE } }),
      this.messageRepo.count({ where: { tenantId, statut: StatutMessageSortant.ENVOYE } }),
      this.messageRepo.count({ where: { tenantId, statut: StatutMessageSortant.ECHOUE } }),
      this.messageRepo.count({ where: { tenantId, statut: StatutMessageSortant.SIMULE } }),
    ]);

    const [envoyesJour, echouesJour, simulesJour] = await Promise.all([
      this.messageRepo.count({
        where: { tenantId, statut: StatutMessageSortant.ENVOYE, dateEnvoi: Between(debut, fin) },
      }),
      this.messageRepo.count({
        where: { tenantId, statut: StatutMessageSortant.ECHOUE, dateEnvoi: Between(debut, fin) },
      }),
      this.messageRepo.count({
        where: { tenantId, statut: StatutMessageSortant.SIMULE, dateEnvoi: Between(debut, fin) },
      }),
    ]);

    return {
      date: new Date().toISOString().split('T')[0],
      providerSimule: this.provider.estSimule,
      providerNom: this.provider.nom,
      global: { total, enAttente, envoyes, echoues, simules },
      jour: { envoyes: envoyesJour, echoues: echouesJour, simules: simulesJour },
    };
  }
}
