import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { InteractionMedicamenteuse } from './entities/interaction-medicamenteuse.entity';
import { ContreIndication } from './entities/contre-indication.entity';

/**
 * Module Interactions médicamenteuses & contre-indications.
 *
 * Vérificateur de sécurité des prescriptions (référentiel médical GLOBAL,
 * `tenantId` NULL = partagé). NON ajouté à app.module.ts ici (câblage géré
 * séparément, comme les autres modules récents).
 *
 * `exports: [InteractionsService]` permet aux modules de prescription
 * (consultations / pharmacie / hospitalisation) d'appeler
 * `verifierInteractions(...)` sans réimplémenter la logique.
 */
@Module({
  imports: [TypeOrmModule.forFeature([InteractionMedicamenteuse, ContreIndication])],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
