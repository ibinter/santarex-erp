import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { InteroperabiliteService } from '../interoperabilite.service';

/** Métadonnée posée par @ApiScopes(...) pour exiger des portées précises. */
export const API_SCOPES_KEY = 'api_scopes';

/**
 * Garde d'API publique. Valide la clé passée dans l'en-tête `X-API-Key`,
 * vérifie qu'elle est active, la rattache à son tenant et injecte dans la
 * requête un `apiKeyContext` { tenantId, scopes, cleId }.
 *
 * SÉCURITÉ : le scoping tenant est STRICT — la clé ne donne accès qu'aux
 * données de SON tenant (les contrôleurs publics doivent lire req.apiKeyContext
 * .tenantId, jamais un tenantId fourni par le client).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly interopService: InteroperabiliteService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { apiKeyContext?: unknown }>();
    const headerVal = req.headers['x-api-key'];
    const cle = Array.isArray(headerVal) ? headerVal[0] : headerVal;

    if (!cle || typeof cle !== 'string') {
      throw new UnauthorizedException('Clé API manquante (en-tête X-API-Key requis)');
    }

    const ctx = await this.interopService.validerCleApi(cle);
    if (!ctx) {
      throw new UnauthorizedException('Clé API invalide ou révoquée');
    }

    // Vérification des portées si le handler en exige.
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(API_SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredScopes && requiredScopes.length > 0) {
      const ok = requiredScopes.every((s) => ctx.scopes.includes(s));
      if (!ok) {
        throw new ForbiddenException(
          `Portée insuffisante : ${requiredScopes.join(', ')} requis`,
        );
      }
    }

    (req as any).apiKeyContext = ctx;
    return true;
  }
}
