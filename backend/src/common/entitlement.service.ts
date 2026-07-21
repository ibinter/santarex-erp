import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licence, LicenceStatut } from '../licences/entities/licence.entity';

export interface TenantAccess {
  allowed: boolean;
  reason: string;
  modules: string[] | null; // null = tous modules autorisés
}

/**
 * EntitlementService — autonome (ne dépend QUE du repo Licence), donc
 * injectable dans les guards utilisés par n'importe quel contrôleur via le
 * module @Global. Décide l'accès à partir du `statut` de la licence (mis à jour
 * quotidiennement par le scheduler de cycle de vie).
 *
 * PRODUCTION-SAFE : biais fail-open — pas de licence / erreur / statut inconnu
 * → accès autorisé. Ne bloque QUE les états terminaux explicites
 * (suspendue / expiree / annulee).
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepo: Repository<Licence>,
  ) {}

  async getTenantAccess(tenantSlug: string): Promise<TenantAccess> {
    if (!tenantSlug) return { allowed: true, reason: 'no-tenant-fail-open', modules: null };

    let licences: Licence[];
    try {
      licences = await this.licenceRepo.find({
        where: { tenantSlug },
        order: { dateExpiration: 'DESC', createdAt: 'DESC' },
      });
    } catch (e) {
      this.logger.warn(`EntitlementService fail-open (tenant=${tenantSlug}): ${(e as Error).message}`);
      return { allowed: true, reason: 'error-fail-open', modules: null };
    }

    // Pas de licence → ne jamais bloquer (tenant historique sans licence).
    if (!licences.length) return { allowed: true, reason: 'no-licence-fail-open', modules: null };

    const GRANTING = new Set<string>([LicenceStatut.ACTIVE, LicenceStatut.ESSAI]);
    let blockingReason = LicenceStatut.SUSPENDUE as string;

    for (const lic of licences) {
      if (GRANTING.has(lic.statut)) {
        return { allowed: true, reason: lic.statut, modules: this.parseModules(lic.modulesActivesJson) };
      }
      blockingReason = lic.statut;
    }
    // Aucune licence accordante → bloqué (suspendue / expiree / annulee).
    return { allowed: false, reason: blockingReason, modules: null };
  }

  private parseModules(raw: string | null | undefined): string[] | null {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length) return parsed.map((m) => String(m).toLowerCase());
    } catch {
      // repli : liste séparée par virgules
      const list = trimmed.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (list.length) return list;
    }
    return null; // vide/illisible → tous modules autorisés (jamais [])
  }
}
