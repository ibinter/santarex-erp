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

/**
 * Clé de métadonnée `@Public()` — supportée de façon défensive même si le
 * décorateur n'existe pas (encore) dans ce codebase. Toute route marquée
 * publique est exemptée de l'application de licence.
 */
const IS_PUBLIC_KEY = 'isPublic';

/**
 * Préfixes de chemin TOUJOURS exemptés de l'application de licence.
 * Comparés après retrait du préfixe global (`/api/v1`). On y trouve les routes
 * d'authentification, d'administration SaaS, de facturation/abonnement (pour
 * permettre le renouvellement même licence expirée), de santé, les webhooks de
 * paiement (appelés par les passerelles, sans JWT), l'assistant IA et le
 * support (accessibles même en cas de suspension).
 */
export const LICENCE_EXEMPT_PREFIXES: readonly string[] = [
  '/auth',
  '/superadmin',
  '/licences',
  '/abonnement',
  '/health',
  '/payments', // tout le parcours de paiement/renouvellement (un tenant suspendu doit pouvoir payer)
  '/ai-assistant',
  '/support-tickets',
  '/notifications',
];

/**
 * Retire le préfixe global d'API (`/api/v1`, `/api`, …) et la query string,
 * puis normalise en minuscules. Renvoie un chemin commençant par `/`.
 */
export function normalisePath(raw: string | undefined): string {
  if (!raw) return '/';
  let p = raw.split('?')[0].split('#')[0].toLowerCase();
  if (!p.startsWith('/')) p = `/${p}`;
  // Retire un éventuel préfixe /api ou /api/vN.
  p = p.replace(/^\/api(?:\/v\d+)?/, '');
  if (!p.startsWith('/')) p = `/${p}`;
  return p;
}

/** Vrai si `path` tombe sous l'un des préfixes exemptés. */
export function isExemptPath(path: string): boolean {
  return LICENCE_EXEMPT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * LicenceGuard — applique le cycle de vie de la licence du tenant courant.
 *
 * PRÉ-REQUIS : doit s'exécuter APRÈS le JwtAuthGuard (qui pose `req.user`).
 * En usage par contrôleur : `@UseGuards(JwtAuthGuard, LicenceGuard)`.
 *
 * PRODUCTION-SAFE :
 *  - pas d'utilisateur authentifié → laisse passer (le JwtAuthGuard décide) ;
 *  - route exemptée (préfixe allowlist, `@Public()` ou `@SkipLicence()`) → OK ;
 *  - `getTenantAccess` accorde → OK ;
 *  - `getTenantAccess` refuse (SUSPENDED / REVOKED / EXPIRED) → 403 ;
 *  - toute erreur interne (DB indispo, table absente…) → fail-open (log + OK),
 *    afin de ne JAMAIS casser la production sur un incident du garde.
 */
@Injectable()
export class LicenceGuard implements CanActivate {
  private readonly logger = new Logger(LicenceGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly entitlement: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    // 1) Pas d'utilisateur → on ne bloque pas ici (auth gérée ailleurs).
    const user = req?.user;
    if (!user) return true;

    // 2) Décorateurs d'exemption sur le handler / la classe.
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_LICENCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip || isPublic) return true;

    // 3) Allowlist de préfixes.
    const path = normalisePath(req?.route?.path ?? req?.originalUrl ?? req?.url);
    if (isExemptPath(path)) return true;

    // 4) Décision d'entitlement — fail-open sur erreur interne.
    const tenantSlug: string | undefined = user.tenantId ?? user.tenantSlug;
    try {
      const access = await this.entitlement.getTenantAccess(tenantSlug ?? '');
      if (!access.allowed) {
        throw new ForbiddenException(
          `Licence ${access.reason}. Renouvelez votre abonnement.`,
        );
      }
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err; // refus métier volontaire
      this.logger.warn(
        `LicenceGuard fail-open (tenant=${tenantSlug ?? '?'}, path=${path}): ${
          (err as Error)?.message ?? err
        }`,
      );
      return true;
    }
  }
}
