import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModeleConsentement } from './entities/modele-consentement.entity';
import { Consentement } from './entities/consentement.entity';
import { ConsentementsController } from './consentements.controller';
import { ConsentementsService } from './consentements.service';

/**
 * ConsentementsModule — gestion des formulaires de consentement éclairé signés
 * (chirurgie, anesthésie, transfusion, actes invasifs). Valeur médico-légale :
 * texte figé à la création, traçabilité des signatures / refus / révocations.
 *
 * NE PAS ajouter à app.module.ts ici — l'intégration est faite manuellement.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ModeleConsentement, Consentement])],
  controllers: [ConsentementsController],
  providers: [ConsentementsService],
  exports: [ConsentementsService],
})
export class ConsentementsModule {}
