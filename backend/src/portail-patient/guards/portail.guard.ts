import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Payload du JWT « portail patient ». Volontairement distinct du JWT staff :
 * il porte `scope: 'portail'` et n'expose que patientId + tenantSlug.
 */
export interface PortailJwtPayload {
  patientId: string;
  tenantSlug: string;
  scope: 'portail';
  iat?: number;
  exp?: number;
}

/**
 * Garde d'authentification patient, TOTALEMENT isolée de l'auth staff.
 *
 * - Vérifie la signature du JWT avec le `JWT_SECRET` existant.
 * - REFUSE tout token dont `scope !== 'portail'` : un access token staff ne
 *   peut donc jamais accéder aux routes patient (et inversement le token
 *   portail est inutilisable sur les routes staff qui utilisent JwtStrategy).
 * - Attache `{ patientId, tenantSlug }` à `req.portail`, seule source de vérité
 *   pour le scoping des données (jamais un paramètre fourni par le client).
 */
@Injectable()
export class PortailGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentification portail requise');
    }

    const token = authHeader.slice(7).trim();

    let payload: PortailJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<PortailJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Session portail invalide ou expirée');
    }

    if (
      !payload ||
      payload.scope !== 'portail' ||
      !payload.patientId ||
      !payload.tenantSlug
    ) {
      throw new UnauthorizedException('Session portail invalide');
    }

    req.portail = {
      patientId: payload.patientId,
      tenantSlug: payload.tenantSlug,
    };

    return true;
  }
}
