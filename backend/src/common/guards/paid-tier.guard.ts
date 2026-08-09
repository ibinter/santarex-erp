import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EntitlementService } from '../entitlement.service';

/**
 * PaidTierGuard — ferme les leviers de conversion au palier Découverte (gratuit).
 * Cahier IBIG v1.1, §3.3 : export, API, SARA, multi-utilisateur, WhatsApp/SMS,
 * support prioritaire sont réservés aux formules payantes et à l'essai.
 *
 * S'exécute APRÈS JwtAuthGuard (req.user posé). Production-safe : pas
 * d'utilisateur ou erreur interne → laisse passer (la restriction n'est pas une
 * barrière de sécurité mais un levier commercial ; on ne casse jamais l'accès).
 */
@Injectable()
export class PaidTierGuard implements CanActivate {
  private readonly logger = new Logger(PaidTierGuard.name);

  constructor(private readonly entitlement: EntitlementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;
    if (!user) return true;

    const tenantSlug: string | undefined = user.tenantId ?? user.tenantSlug;
    try {
      const access = await this.entitlement.getTenantAccess(tenantSlug ?? '');
      if (access.gratuit) {
        throw new ForbiddenException(
          'Fonction réservée aux formules payantes. Passez à une formule pour '
            + "activer l'export, l'API, l'assistant SARA et le multi-utilisateur.",
        );
      }
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.warn(
        `PaidTierGuard fail-open (tenant=${tenantSlug ?? '?'}): ${(err as Error)?.message ?? err}`,
      );
      return true;
    }
  }
}
