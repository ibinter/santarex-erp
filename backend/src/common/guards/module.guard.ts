import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementService } from '../entitlement.service';
import { SKIP_LICENCE_KEY } from '../decorators/skip-licence.decorator';
import { isExemptPath, normalisePath } from './licence.guard';

const IS_PUBLIC_KEY = 'isPublic';

/**
 * Carte préfixe de chemin → code de module métier (INTERNE au garde, aucun
 * décorateur requis sur les contrôleurs). Les codes correspondent à ceux
 * stockés dans `Licence.modulesActivesJson` (dérivé de `OffreSaas.modulesInclus`).
 *
 * Ordre important : préfixes les plus longs / spécifiques d'abord, pour qu'un
 * chemin corresponde au module le plus précis.
 */
const PREFIX_TO_MODULE: ReadonlyArray<readonly [string, string]> = [
  ['/laboratoire', 'laboratoire'],
  ['/pharmacie', 'pharmacie'],
  ['/hospitalisation', 'hospitalisation'],
  // Modules premium (offre « hôpital » uniquement) — les contrôleurs portent
  // déjà `@UseGuards(… ModuleGuard)` ; sans mapping ici, le garde restait inerte
  // et n'importe quel tenant pouvait y accéder hors formule. Les préfixes
  // correspondent 1:1 aux codes stockés dans `OffreSaas.modulesInclus`.
  ['/bloc-operatoire', 'bloc-operatoire'],
  ['/imagerie', 'imagerie'],
  ['/comptabilite', 'comptabilite'],
  ['/rh', 'rh'],
  ['/facturation', 'facturation'],
  ['/consultations', 'consultations'],
  ['/urgences', 'urgences'],
  ['/rendez-vous', 'rendez-vous'],
  ['/dme', 'dme'],
  ['/patients', 'patients'],
  ['/paiements', 'paiements'],
  // ── Modules hospitaliers premium (câblés avec ModuleGuard sur leurs
  //    contrôleurs). Codes 1:1 avec `OffreSaas.modulesInclus`. Préfixes longs
  //    d'abord (ex. caisse-sessions avant un éventuel /caisse).
  ['/interactions-medicamenteuses', 'interactions-medicamenteuses'],
  ['/declarations-sanitaires', 'declarations-sanitaires'],
  ['/services-personnalises', 'services-personnalises'],
  ['/indicateurs-qualite', 'indicateurs-qualite'],
  ['/messages-sortants', 'messages-sortants'],
  ['/soins-infirmiers', 'soins-infirmiers'],
  ['/dechets-medicaux', 'dechets-medicaux'],
  ['/incidents-qualite', 'incidents-qualite'],
  ['/prise-en-charge', 'prise-en-charge'],
  ['/plannings-gardes', 'plannings-gardes'],
  ['/approvisionnement', 'approvisionnement'],
  ['/caisse-sessions', 'caisse-sessions'],
  ['/consentements', 'consentements'],
  ['/tiers-payant', 'tiers-payant'],
  ['/banque-sang', 'banque-sang'],
  ['/sterilisation', 'sterilisation'],
  ['/satisfaction', 'satisfaction'],
  ['/vaccination', 'vaccination'],
  ['/equipements', 'equipements'],
  ['/maternite', 'maternite'],
  ['/pediatrie', 'pediatrie'],
  ['/transport', 'transport'],
  ['/morgue', 'morgue'],
  ['/budget', 'budget'],
  ['/devis', 'devis'],
  ['/sites', 'sites'],
  ['/had', 'had'],
];

/** Résout le code de module métier d'un chemin normalisé, ou null. */
export function moduleForPath(path: string): string | null {
  for (const [prefix, mod] of PREFIX_TO_MODULE) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return mod;
  }
  return null;
}

/**
 * ModuleGuard — applique l'entitlement MODULE de la formule souscrite.
 *
 * PRÉ-REQUIS : s'exécute APRÈS le JwtAuthGuard (pose `req.user`). Recommandé
 * après LicenceGuard : `@UseGuards(JwtAuthGuard, LicenceGuard, ModuleGuard)`.
 *
 * PRODUCTION-SAFE :
 *  - pas d'utilisateur, route exemptée, `@Public()`/`@SkipLicence()` → OK ;
 *  - chemin non mappé à un module → OK (rien à restreindre) ;
 *  - `modules === null` (aucune restriction déclarée) → OK (tout autorisé) ;
 *  - module du chemin absent de la liste autorisée → 403 ;
 *  - toute erreur interne → fail-open (log + OK).
 */
@Injectable()
export class ModuleGuard implements CanActivate {
  private readonly logger = new Logger(ModuleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly entitlement: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const user = req?.user;
    if (!user) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_LICENCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip || isPublic) return true;

    const path = normalisePath(req?.route?.path ?? req?.originalUrl ?? req?.url);
    if (isExemptPath(path)) return true;

    // Le chemin cible-t-il un module métier restreignable ?
    const mod = moduleForPath(path);
    if (!mod) return true; // route hors périmètre module → rien à faire respecter

    const tenantSlug: string | undefined = user.tenantId ?? user.tenantSlug;
    try {
      const access = await this.entitlement.getTenantAccess(tenantSlug ?? '');
      // modules === null → aucune restriction (tout autorisé). Fail-open.
      if (access.modules === null) return true;
      if (access.modules.includes(mod)) return true;
      throw new ForbiddenException(
        `Module ${mod} non inclus dans votre formule`,
      );
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.warn(
        `ModuleGuard fail-open (tenant=${tenantSlug ?? '?'}, module=${mod}, path=${path}): ${
          (err as Error)?.message ?? err
        }`,
      );
      return true;
    }
  }
}
