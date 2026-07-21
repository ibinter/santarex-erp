import { Global, Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { LicenceGuard } from './guards/licence.guard';
import { ModuleGuard } from './guards/module.guard';

/**
 * EntitlementModule — rend `LicenceGuard` et `ModuleGuard` (fournis par
 * PaymentsModule) injectables dans TOUS les contrôleurs métier, sans que chaque
 * module ait à importer PaymentsModule.
 *
 * Usage par contrôleur (APRÈS le JwtAuthGuard qui pose `req.user`) :
 *   @UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
 *
 * @Global → une seule déclaration ici suffit ; production-safe (les guards
 * font fail-open sur "pas de licence" / erreur interne, cf. licence.guard.ts).
 */
@Global()
@Module({
  imports: [PaymentsModule],
  exports: [LicenceGuard, ModuleGuard],
})
export class EntitlementModule {}
