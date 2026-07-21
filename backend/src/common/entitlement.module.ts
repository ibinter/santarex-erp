import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licence } from '../licences/entities/licence.entity';
import { EntitlementService } from './entitlement.service';
import { LicenceGuard } from './guards/licence.guard';
import { ModuleGuard } from './guards/module.guard';

/**
 * EntitlementModule — AUTONOME et @Global. Fournit `LicenceGuard` et
 * `ModuleGuard` (application de la licence + entitlement module) injectables
 * dans TOUS les contrôleurs métier via `@UseGuards(JwtAuthGuard, RolesGuard,
 * LicenceGuard, ModuleGuard)` — sans dépendre de PaymentsModule.
 *
 * Ne dépend que du repo `Licence` (via EntitlementService). Production-safe :
 * fail-open sur pas-de-licence / erreur (cf. entitlement.service.ts).
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Licence])],
  providers: [EntitlementService, LicenceGuard, ModuleGuard],
  exports: [EntitlementService, LicenceGuard, ModuleGuard],
})
export class EntitlementModule {}
