import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CleActivation } from './entities/cle-activation.entity';
import { ClesActivationController } from './cles-activation.controller';
import { PaiementConfigController } from './paiement-config.controller';
import { ClesActivationService } from './cles-activation.service';
import { LicencesModule } from '../licences/licences.module';
import { OffresSaasModule } from '../offres-saas/offres-saas.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Module « Activation assistée » (sections 19.5 & 19.6).
 *
 *  • Clés d'activation : génération en lot, listing, révocation, export CSV et
 *    saisie client (redeem) qui active RÉELLEMENT la licence via LicencesService.
 *  • Paiement Mobile Money direct : endpoint public des coordonnées officielles.
 *
 * SÉCURITÉ : une clé ne débloque jamais côté client ; l'activation est faite
 * côté serveur. Anti-brute-force applicatif (compteur tenant|IP) dans le service.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CleActivation]),
    LicencesModule,
    OffresSaasModule,
    AuditLogsModule,
  ],
  controllers: [ClesActivationController, PaiementConfigController],
  providers: [ClesActivationService],
  exports: [ClesActivationService],
})
export class ClesActivationModule {}
