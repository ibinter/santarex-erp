// ════════════════════════════════════════════════════════════════════════════
//  Service de configuration des moyens de paiement (admin).
//  - Les secrets sont chiffrés au repos (AES-256-GCM) et ne sortent JAMAIS en
//    clair via l'API : `list` et `getClientMethods` masquent / omettent.
//  - Seul `getForGateway` déchiffre, côté serveur, pour l'adaptateur passerelle.
//  - Toute mutation est journalisée (audit-logs) : acteur, action, cible, when.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodConfig } from './entities/payment-method-config.entity';
import { PaymentMethodType, PaymentGateway } from './payments.enums';
import { UpsertPaymentConfigDto } from './dto/config.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';
import { encrypt, decrypt, mask, isMasked } from './util/secret-crypto';

/** Vue publique d'un moyen de paiement (page client) — sans secret. */
export interface ClientPaymentMethod {
  key: string;
  type: PaymentMethodType;
  label: string;
  gateway: PaymentGateway | null;
  publicConfig: Record<string, unknown>;
  instructions: string | null;
  sandbox: boolean;
  currencies: string[];
  displayOrder: number;
}

/** Config admin sérialisée avec secrets masqués. */
export type MaskedPaymentConfig = Omit<PaymentMethodConfig, 'secretConfig'> & {
  secretConfig: Record<string, string>;
};

@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);

  constructor(
    @InjectRepository(PaymentMethodConfig)
    private readonly configRepo: Repository<PaymentMethodConfig>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────
  //  Lecture admin — secrets MASQUÉS (jamais en clair).
  // ────────────────────────────────────────────────────────────────────────
  async list(): Promise<MaskedPaymentConfig[]> {
    const configs = await this.configRepo.find({
      order: { displayOrder: 'ASC', key: 'ASC' },
    });
    return configs.map((c) => this.toMasked(c));
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Lecture publique (page client) — enabled uniquement, filtrée, SANS secret.
  // ────────────────────────────────────────────────────────────────────────
  async getClientMethods(
    country?: string,
    offerCode?: string,
  ): Promise<ClientPaymentMethod[]> {
    const configs = await this.configRepo.find({
      where: { enabled: true },
      order: { displayOrder: 'ASC', key: 'ASC' },
    });

    const wantedCountry = country?.trim().toUpperCase();
    const wantedOffer = offerCode?.trim();

    return configs
      .filter((c) => {
        // Restriction pays : vide = tous pays.
        if (wantedCountry && c.countries?.length) {
          const allowed = c.countries.map((x) => x.toUpperCase());
          if (!allowed.includes(wantedCountry)) return false;
        }
        // Restriction forfait : vide = tous forfaits.
        if (wantedOffer && c.offerCodes?.length) {
          if (!c.offerCodes.includes(wantedOffer)) return false;
        }
        return true;
      })
      .map((c) => this.toClient(c));
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Usage INTERNE serveur — déchiffre les secrets (gateway.service uniquement).
  // ────────────────────────────────────────────────────────────────────────
  async getForGateway(
    key: string,
  ): Promise<{ config: PaymentMethodConfig; secrets: Record<string, string> }> {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`Configuration de paiement introuvable : ${key}`);
    }
    const secrets: Record<string, string> = {};
    for (const [k, v] of Object.entries(config.secretConfig ?? {})) {
      secrets[k] = decrypt(v);
    }
    return { config, secrets };
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Création / mise à jour (upsert par `key`).
  // ────────────────────────────────────────────────────────────────────────
  async upsert(
    dto: UpsertPaymentConfigDto,
    adminId: string,
  ): Promise<MaskedPaymentConfig> {
    const existing = await this.configRepo.findOne({ where: { key: dto.key } });
    const isUpdate = !!existing;

    const entity = existing ?? this.configRepo.create({ key: dto.key });

    // Champs simples (n'écrase que si fourni).
    entity.type = dto.type ?? entity.type;
    if (dto.label !== undefined) entity.label = dto.label;
    if (dto.enabled !== undefined) entity.enabled = dto.enabled;
    if (dto.displayOrder !== undefined) entity.displayOrder = dto.displayOrder;
    if (dto.gateway !== undefined) entity.gateway = dto.gateway ?? null;
    if (dto.publicConfig !== undefined) entity.publicConfig = dto.publicConfig;
    if (dto.sandbox !== undefined) entity.sandbox = dto.sandbox;
    if (dto.instructions !== undefined) entity.instructions = dto.instructions;
    if (dto.countries !== undefined) entity.countries = dto.countries;
    if (dto.offerCodes !== undefined) entity.offerCodes = dto.offerCodes;
    if (dto.currencies !== undefined) entity.currencies = dto.currencies;

    // Secrets : chiffrer les nouvelles valeurs, préserver les masquées.
    if (dto.secretConfig !== undefined) {
      entity.secretConfig = this.mergeSecrets(
        existing?.secretConfig ?? {},
        dto.secretConfig,
      );
    } else if (!existing) {
      entity.secretConfig = {};
    }

    const saved = await this.configRepo.save(entity);

    // Journalisation — jamais de secret en clair (snapshots masqués).
    this.auditLogs.log({
      action: isUpdate ? AuditAction.UPDATE : AuditAction.CREATE,
      ressource: 'PaymentMethodConfig',
      ressourceId: saved.id,
      userId: adminId,
      avant: existing ? this.auditSnapshot(existing) : undefined,
      apres: this.auditSnapshot(saved),
      contexte: { key: saved.key, type: saved.type },
    });

    return this.toMasked(saved);
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Activation / désactivation.
  // ────────────────────────────────────────────────────────────────────────
  async toggle(
    key: string,
    enabled: boolean,
    adminId: string,
  ): Promise<MaskedPaymentConfig> {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`Configuration de paiement introuvable : ${key}`);
    }
    const previous = config.enabled;
    config.enabled = enabled;
    const saved = await this.configRepo.save(config);

    this.auditLogs.log({
      action: enabled ? AuditAction.ACTIVATE : AuditAction.SUSPEND,
      ressource: 'PaymentMethodConfig',
      ressourceId: saved.id,
      userId: adminId,
      avant: { enabled: previous },
      apres: { enabled },
      contexte: { key: saved.key },
    });

    return this.toMasked(saved);
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Suppression.
  // ────────────────────────────────────────────────────────────────────────
  async remove(key: string, adminId: string): Promise<{ deleted: boolean; key: string }> {
    const config = await this.configRepo.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`Configuration de paiement introuvable : ${key}`);
    }
    await this.configRepo.remove(config);

    this.auditLogs.log({
      action: AuditAction.DELETE,
      ressource: 'PaymentMethodConfig',
      ressourceId: config.id,
      userId: adminId,
      avant: this.auditSnapshot(config),
      contexte: { key },
    });

    return { deleted: true, key };
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Amorçage des moyens par défaut (tous désactivés). Idempotent.
  // ────────────────────────────────────────────────────────────────────────
  async seedDefaults(): Promise<{ created: string[]; skipped: string[] }> {
    const created: string[] = [];
    const skipped: string[] = [];

    for (const def of PaymentConfigService.DEFAULTS) {
      const exists = await this.configRepo.findOne({ where: { key: def.key } });
      if (exists) {
        skipped.push(def.key);
        continue;
      }
      const entity = this.configRepo.create({
        key: def.key,
        type: def.type,
        label: def.label,
        gateway: def.gateway ?? null,
        enabled: false,
        sandbox: true,
        displayOrder: def.displayOrder,
        publicConfig: {},
        secretConfig: {},
        instructions: def.instructions ?? null,
        countries: [],
        offerCodes: [],
        currencies: [],
      });
      await this.configRepo.save(entity);
      created.push(def.key);
    }

    if (created.length) {
      this.logger.log(`seedDefaults: ${created.length} configs créées, ${skipped.length} déjà présentes.`);
    }
    return { created, skipped };
  }

  // ────────────────────────────────────────────────────────────────────────
  //  Helpers internes.
  // ────────────────────────────────────────────────────────────────────────

  /** Fusionne les secrets : chiffre les nouveaux, préserve les valeurs masquées. */
  private mergeSecrets(
    current: Record<string, string>,
    incoming: Record<string, string>,
  ): Record<string, string> {
    const result: Record<string, string> = { ...current };
    for (const [k, v] of Object.entries(incoming)) {
      if (v === null || v === undefined) continue;
      if (isMasked(v)) {
        // Valeur masquée renvoyée par le front : ne jamais écraser le secret.
        continue;
      }
      if (v === '') {
        // Chaîne vide explicite = suppression du secret.
        delete result[k];
        continue;
      }
      result[k] = encrypt(v);
    }
    return result;
  }

  /** Sérialise une config admin avec secrets masqués. */
  private toMasked(c: PaymentMethodConfig): MaskedPaymentConfig {
    const maskedSecrets: Record<string, string> = {};
    for (const [k, v] of Object.entries(c.secretConfig ?? {})) {
      maskedSecrets[k] = mask(v);
    }
    return { ...c, secretConfig: maskedSecrets };
  }

  /** Vue publique client — sans aucun secret. */
  private toClient(c: PaymentMethodConfig): ClientPaymentMethod {
    return {
      key: c.key,
      type: c.type,
      label: c.label,
      gateway: c.gateway,
      publicConfig: c.publicConfig ?? {},
      instructions: c.instructions ?? null,
      sandbox: c.sandbox,
      currencies: c.currencies ?? [],
      displayOrder: c.displayOrder,
    };
  }

  /** Snapshot pour audit : jamais de secret en clair (clés masquées seulement). */
  private auditSnapshot(c: PaymentMethodConfig): Record<string, unknown> {
    return {
      key: c.key,
      type: c.type,
      label: c.label,
      enabled: c.enabled,
      gateway: c.gateway,
      sandbox: c.sandbox,
      displayOrder: c.displayOrder,
      publicConfig: c.publicConfig,
      secretKeys: Object.keys(c.secretConfig ?? {}), // noms seulement, pas de valeur
      countries: c.countries,
      offerCodes: c.offerCodes,
      currencies: c.currencies,
    };
  }

  // Définitions par défaut (toutes désactivées à la création).
  private static readonly DEFAULTS: Array<{
    key: string;
    type: PaymentMethodType;
    label: string;
    gateway?: PaymentGateway;
    displayOrder: number;
    instructions?: string;
  }> = [
    { key: 'mobile_money.orange', type: PaymentMethodType.MOBILE_MONEY, label: 'Orange Money', displayOrder: 10 },
    { key: 'mobile_money.mtn', type: PaymentMethodType.MOBILE_MONEY, label: 'MTN Mobile Money', displayOrder: 20 },
    { key: 'mobile_money.wave', type: PaymentMethodType.MOBILE_MONEY, label: 'Wave', displayOrder: 30 },
    { key: 'mobile_money.moov', type: PaymentMethodType.MOBILE_MONEY, label: 'Moov Money', displayOrder: 40 },
    { key: 'gateway.moneroo', type: PaymentMethodType.GATEWAY, label: 'Moneroo', gateway: PaymentGateway.MONEROO, displayOrder: 50 },
    { key: 'gateway.cinetpay', type: PaymentMethodType.GATEWAY, label: 'CinetPay', gateway: PaymentGateway.CINETPAY, displayOrder: 60 },
    { key: 'bank_transfer', type: PaymentMethodType.BANK_TRANSFER, label: 'Virement bancaire', displayOrder: 70 },
    { key: 'intl_transfer', type: PaymentMethodType.INTL_TRANSFER, label: 'Virement international (SWIFT/IBAN)', displayOrder: 80 },
    { key: 'money_transfer.wu', type: PaymentMethodType.MONEY_TRANSFER, label: 'Western Union', displayOrder: 90 },
    { key: 'cash_agency', type: PaymentMethodType.CASH_AGENCY, label: 'Espèces en agence', displayOrder: 100 },
    { key: 'cheque', type: PaymentMethodType.CHEQUE, label: 'Chèque bancaire', displayOrder: 110 },
    { key: 'crypto.usdt', type: PaymentMethodType.CRYPTO, label: 'USDT (crypto)', displayOrder: 120 },
    { key: 'voucher', type: PaymentMethodType.VOUCHER, label: 'Code prépayé / voucher', displayOrder: 130 },
    { key: 'cash_on_delivery', type: PaymentMethodType.CASH_ON_DELIVERY, label: 'Paiement à la livraison', displayOrder: 140 },
  ];
}
