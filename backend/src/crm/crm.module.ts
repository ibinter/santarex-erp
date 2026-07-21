import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmRelanceScheduler } from './crm-relance.scheduler';
import { RapportMensuelScheduler } from './rapport-mensuel.scheduler';
import { Prospect } from './entities/prospect.entity';
import { DemandeDemo } from './entities/demande-demo.entity';
import { OffreCommerciale } from '../offres-commerciales/entities/offre-commerciale.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Facture } from '../facturation/entities/facture.entity';

/**
 * CRM éditeur IBIG SOFT — prospects & pipeline de démonstrations.
 * MailModule est @Global : MailService est injectable sans import explicite.
 * NON ajouté à app.module.ts (câblage géré séparément).
 *
 * Ce module héberge également les tâches planifiées du cycle d'emails
 * commerciaux (relances prospects/devis + rapport KPI mensuel). Les entités
 * transverses (OffreCommerciale, Tenant, User, Patient, Facture) sont exposées
 * ici en `forFeature` uniquement pour fournir leurs repositories aux schedulers ;
 * elles restent gérées par leurs modules d'origine.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prospect,
      DemandeDemo,
      OffreCommerciale,
      Tenant,
      User,
      Patient,
      Facture,
    ]),
  ],
  controllers: [CrmController],
  providers: [CrmService, CrmRelanceScheduler, RapportMensuelScheduler],
  exports: [CrmService],
})
export class CrmModule {}
