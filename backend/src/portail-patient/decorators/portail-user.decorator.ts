import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface PortailUser {
  patientId: string;
  tenantSlug: string;
}

/**
 * Récupère l'identité patient issue du JWT portail vérifié par `PortailGuard`.
 * C'est la SEULE source autorisée de patientId/tenant pour scoper les lectures.
 */
export const CurrentPortailUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PortailUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.portail as PortailUser;
  },
);
