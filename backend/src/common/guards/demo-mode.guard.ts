import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * DemoModeGuard — ferme les surfaces sensibles en mode DÉMONSTRATION PUBLIQUE.
 * Cahier IBIG v1.1, §4.5.
 *
 * Comportement :
 *  - `process.env.DEMO_MODE === 'true'` → REFUSE (403 « Action désactivée en
 *    démonstration publique. ») ;
 *  - sinon (production / dev normal) → laisse TOUJOURS passer.
 *
 * PRODUCTION-SAFE : ce garde ne lève JAMAIS d'exception autre que le 403
 * volontaire ci-dessus. Il ne dépend d'aucun provider (lit uniquement
 * process.env), il peut donc être appliqué en le référençant simplement dans
 * `@UseGuards(...)` — Nest l'instancie sans injection.
 *
 * Ordre : à placer APRÈS les gardes d'auth/rôle/licence sur les surfaces à
 * fermer (exports, superadmin, tenants mutations, paiements). Comme il ne lit
 * pas `req.user`, sa position exacte est indifférente ; on le met en dernier
 * par convention.
 */
@Injectable()
export class DemoModeGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (process.env.DEMO_MODE === 'true') {
      throw new ForbiddenException(
        'Action désactivée en démonstration publique.',
      );
    }
    return true;
  }
}
