import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { CleApi } from './entities/cle-api.entity';
import { Webhook, EvenementWebhook } from './entities/webhook.entity';
import {
  ConfigInterface,
  TypeInterface,
  StatutConnexion,
} from './entities/config-interface.entity';
import {
  MessageInterop,
  SensMessage,
  ProtocoleMessage,
  StatutMessage,
} from './entities/message-interop.entity';
import {
  CreateCleApiDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateConfigInterfaceDto,
  UpdateConfigInterfaceDto,
} from './dto/interop.dto';
import { parseHl7 } from './hl7/hl7-parser';

/** Contexte résolu à partir d'une clé API valide. */
export interface ApiKeyContext {
  cleId: string;
  tenantId: string;
  scopes: string[];
}

const KEY_PREFIX = 'sx_live_';

@Injectable()
export class InteroperabiliteService {
  private readonly logger = new Logger(InteroperabiliteService.name);

  constructor(
    @InjectRepository(CleApi)
    private readonly cleRepo: Repository<CleApi>,
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    @InjectRepository(ConfigInterface)
    private readonly configRepo: Repository<ConfigInterface>,
    @InjectRepository(MessageInterop)
    private readonly messageRepo: Repository<MessageInterop>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  CLÉS API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Génère une clé API. La valeur EN CLAIR n'est renvoyée qu'ICI, une seule
   * fois ; seul le hash bcrypt est stocké.
   */
  async creerCleApi(
    dto: CreateCleApiDto,
    tenantId: string,
  ): Promise<{ cle: CleApi; cleEnClair: string }> {
    const random = crypto.randomBytes(24).toString('hex');
    const cleEnClair = `${KEY_PREFIX}${random}`;
    const prefixe = cleEnClair.slice(0, KEY_PREFIX.length + 8);
    const cleHashee = await bcrypt.hash(cleEnClair, 10);

    const entity = this.cleRepo.create({
      tenantId,
      nom: dto.nom,
      scopes: dto.scopes ?? [],
      prefixe,
      cleHashee,
      actif: true,
    });
    const cle = await this.cleRepo.save(entity);
    // On ne renvoie jamais le hash.
    delete (cle as Partial<CleApi>).cleHashee;
    return { cle, cleEnClair };
  }

  findClesApi(tenantId: string): Promise<CleApi[]> {
    return this.cleRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async revoquerCleApi(id: string, tenantId: string): Promise<CleApi> {
    const cle = await this.cleRepo.findOne({ where: { id, tenantId } });
    if (!cle) throw new NotFoundException('Clé API introuvable');
    cle.actif = false;
    return this.cleRepo.save(cle);
  }

  /**
   * Valide une clé API en clair et retourne son contexte (tenant + scopes),
   * ou null si invalide/révoquée. Compare via bcrypt sur les candidats
   * partageant le préfixe visible.
   */
  async validerCleApi(cleEnClair: string): Promise<ApiKeyContext | null> {
    if (!cleEnClair.startsWith(KEY_PREFIX)) return null;
    const prefixe = cleEnClair.slice(0, KEY_PREFIX.length + 8);

    const candidats = await this.cleRepo.find({
      where: { prefixe, actif: true },
      select: ['id', 'tenantId', 'scopes', 'cleHashee'],
    });

    for (const c of candidats) {
      const match = await bcrypt.compare(cleEnClair, c.cleHashee);
      if (match) {
        // Mise à jour best-effort de la date de dernier usage.
        this.cleRepo
          .update(c.id, { dateDernierUsage: new Date() })
          .catch((e) => this.logger.warn(`MàJ dateDernierUsage échouée: ${e}`));
        return { cleId: c.id, tenantId: c.tenantId, scopes: c.scopes ?? [] };
      }
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  WEBHOOKS SORTANTS
  // ══════════════════════════════════════════════════════════════════════════

  async creerWebhook(
    dto: CreateWebhookDto,
    tenantId: string,
  ): Promise<{ webhook: Webhook; secret: string }> {
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const entity = this.webhookRepo.create({
      tenantId,
      url: dto.url,
      evenements: dto.evenements,
      secret,
      actif: true,
    });
    const webhook = await this.webhookRepo.save(entity);
    delete (webhook as Partial<Webhook>).secret;
    return { webhook, secret };
  }

  findWebhooks(tenantId: string): Promise<Webhook[]> {
    return this.webhookRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateWebhook(
    id: string,
    dto: UpdateWebhookDto,
    tenantId: string,
  ): Promise<Webhook> {
    const webhook = await this.webhookRepo.findOne({ where: { id, tenantId } });
    if (!webhook) throw new NotFoundException('Webhook introuvable');
    Object.assign(webhook, dto);
    return this.webhookRepo.save(webhook);
  }

  async supprimerWebhook(id: string, tenantId: string): Promise<{ message: string }> {
    const res = await this.webhookRepo.delete({ id, tenantId });
    if (!res.affected) throw new NotFoundException('Webhook introuvable');
    return { message: 'Webhook supprimé' };
  }

  /** Signe un payload JSON avec le secret du webhook (HMAC-SHA256). */
  private signerPayload(secret: string, corps: string): string {
    return crypto.createHmac('sha256', secret).update(corps).digest('hex');
  }

  /**
   * Déclenche un événement : POST best-effort du payload signé vers tous les
   * webhooks du tenant abonnés à cet événement. Ne lève jamais — journalise
   * les statuts. Idéal à appeler depuis les modules métier.
   */
  async declencher(
    tenantId: string,
    event: EvenementWebhook,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const abonnes = await this.webhookRepo.find({
      where: { tenantId, actif: true },
      select: ['id', 'url', 'evenements', 'secret'],
    });
    const cibles = abonnes.filter((w) => (w.evenements ?? []).includes(event));
    if (cibles.length === 0) return;

    const corps = JSON.stringify({ event, tenantId, data: payload, envoyeLe: new Date().toISOString() });

    await Promise.all(
      cibles.map(async (w) => {
        const signature = this.signerPayload(w.secret, corps);
        let statut = 'erreur';
        try {
          // fetch global (Node 18+). Best-effort avec timeout court.
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(w.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Santarex-Event': event,
              'X-Santarex-Signature': signature,
            },
            body: corps,
            signal: controller.signal,
          });
          clearTimeout(timer);
          statut = String(res.status);
        } catch (e) {
          statut = `erreur: ${(e as Error).message}`.slice(0, 200);
        }
        await this.webhookRepo
          .update(w.id, { dernierStatut: statut, dateDernierEnvoi: new Date() })
          .catch(() => undefined);
      }),
    );

    // Trace le déclenchement dans le journal interop.
    await this.messageRepo.save(
      this.messageRepo.create({
        tenantId,
        sens: SensMessage.SORTANT,
        protocole: ProtocoleMessage.REST,
        type: event,
        contenu: corps,
        statut: StatutMessage.TRAITE,
      }),
    );
  }

  /** Envoi de test : POSTe un payload factice vers un webhook donné. */
  async testerWebhook(id: string, tenantId: string): Promise<{ statut: string }> {
    const webhook = await this.webhookRepo.findOne({
      where: { id, tenantId },
      select: ['id', 'url', 'secret'],
    });
    if (!webhook) throw new NotFoundException('Webhook introuvable');

    const corps = JSON.stringify({
      event: 'ping.test',
      tenantId,
      data: { message: 'Test de connexion webhook SANTAREX' },
      envoyeLe: new Date().toISOString(),
    });
    const signature = this.signerPayload(webhook.secret, corps);
    let statut = 'erreur';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Santarex-Event': 'ping.test',
          'X-Santarex-Signature': signature,
        },
        body: corps,
        signal: controller.signal,
      });
      clearTimeout(timer);
      statut = String(res.status);
    } catch (e) {
      statut = `erreur: ${(e as Error).message}`.slice(0, 200);
    }
    await this.webhookRepo
      .update(webhook.id, { dernierStatut: statut, dateDernierEnvoi: new Date() })
      .catch(() => undefined);
    return { statut };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CONFIGS D'INTERFACE (HL7 / DICOM)
  // ══════════════════════════════════════════════════════════════════════════

  creerConfig(dto: CreateConfigInterfaceDto, tenantId: string): Promise<ConfigInterface> {
    const entity = this.configRepo.create({
      tenantId,
      ...dto,
      statutConnexion: StatutConnexion.NON_CONFIGURE,
      actif: true,
    });
    return this.configRepo.save(entity);
  }

  findConfigs(tenantId: string, type?: TypeInterface): Promise<ConfigInterface[]> {
    return this.configRepo.find({
      where: { tenantId, ...(type ? { type } : {}) },
      order: { createdAt: 'DESC' },
    });
  }

  async updateConfig(
    id: string,
    dto: UpdateConfigInterfaceDto,
    tenantId: string,
  ): Promise<ConfigInterface> {
    const config = await this.configRepo.findOne({ where: { id, tenantId } });
    if (!config) throw new NotFoundException('Configuration introuvable');
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  async supprimerConfig(id: string, tenantId: string): Promise<{ message: string }> {
    const res = await this.configRepo.delete({ id, tenantId });
    if (!res.affected) throw new NotFoundException('Configuration introuvable');
    return { message: 'Configuration supprimée' };
  }

  /**
   * Test de connexion SIMULÉ. Tant que le matériel n'est pas raccordé sur site,
   * on ne fait pas de vrai handshake réseau : on valide la présence des
   * paramètres et on marque un statut simulé.
   *
   * TODO (déploiement sur site) :
   *   - HL7 : ouvrir une socket MLLP (hôte/port) et envoyer un message de test.
   *   - DICOM : effectuer un C-ECHO (verification SOP class) vers l'AE title.
   */
  async testerConnexion(id: string, tenantId: string): Promise<ConfigInterface> {
    const config = await this.configRepo.findOne({ where: { id, tenantId } });
    if (!config) throw new NotFoundException('Configuration introuvable');
    config.statutConnexion =
      config.hote && config.port ? StatutConnexion.CONNECTE : StatutConnexion.NON_CONFIGURE;
    return this.configRepo.save(config);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  MESSAGES INTEROP
  // ══════════════════════════════════════════════════════════════════════════

  async findMessages(
    tenantId: string,
    filtres: { sens?: SensMessage; statut?: StatutMessage; protocole?: ProtocoleMessage } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: MessageInterop[]; total: number; page: number; limit: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [data, total] = await this.messageRepo.findAndCount({
      where: {
        tenantId,
        ...(filtres.sens ? { sens: filtres.sens } : {}),
        ...(filtres.statut ? { statut: filtres.statut } : {}),
        ...(filtres.protocole ? { protocole: filtres.protocole } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  /**
   * Ingestion d'un message HL7 v2 de résultats de laboratoire. Parse les
   * segments OBX et enregistre un MessageInterop (statut traite/erreur).
   *
   * TODO (rattachement laboratoire) : mapper les OBX vers des ResultatAnalyse
   * du module `laboratoire` — résoudre le patient via PID-3, retrouver la
   * demande d'analyse correspondante et créer/valider les résultats. Nécessite
   * une table de correspondance code-analyse (OBX-3) ↔ TypeAnalyse.
   */
  async ingererHl7Resultats(
    message: string,
    tenantId: string,
  ): Promise<MessageInterop> {
    try {
      const parsed = parseHl7(message);
      return this.messageRepo.save(
        this.messageRepo.create({
          tenantId,
          sens: SensMessage.ENTRANT,
          protocole: ProtocoleMessage.HL7,
          type: parsed.typeMessage || 'HL7',
          contenu: message,
          statut: StatutMessage.TRAITE,
          donneesJson: {
            controlId: parsed.controlId,
            version: parsed.version,
            patient: parsed.patient,
            observations: parsed.observations,
            // TODO: rattacher aux ResultatAnalyse du module laboratoire.
          },
        }),
      );
    } catch (e) {
      return this.messageRepo.save(
        this.messageRepo.create({
          tenantId,
          sens: SensMessage.ENTRANT,
          protocole: ProtocoleMessage.HL7,
          type: 'HL7',
          contenu: message,
          statut: StatutMessage.ERREUR,
          erreur: (e as Error).message,
        }),
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STATS
  // ══════════════════════════════════════════════════════════════════════════

  async getStats(tenantId: string): Promise<Record<string, number>> {
    const [cles, clesActives, webhooks, configs, messages, messagesErreur] =
      await Promise.all([
        this.cleRepo.count({ where: { tenantId } }),
        this.cleRepo.count({ where: { tenantId, actif: true } }),
        this.webhookRepo.count({ where: { tenantId, actif: true } }),
        this.configRepo.count({ where: { tenantId } }),
        this.messageRepo.count({ where: { tenantId } }),
        this.messageRepo.count({ where: { tenantId, statut: StatutMessage.ERREUR } }),
      ]);
    return { cles, clesActives, webhooks, configs, messages, messagesErreur };
  }
}
