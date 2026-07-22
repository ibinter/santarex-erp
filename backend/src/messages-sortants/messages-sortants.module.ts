import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesSortantsController } from './messages-sortants.controller';
import { MessagesSortantsService } from './messages-sortants.service';
import { MessagesSortantsScheduler } from './messages-sortants.scheduler';
import { ModeleMessage } from './entities/modele-message.entity';
import { MessageSortant } from './entities/message-sortant.entity';
import { Patient } from '../patients/entities/patient.entity';
import { RendezVous } from '../rendez-vous/entities/rendez-vous.entity';
import { SimuleProvider } from './providers/simule.provider';
import { MESSAGE_PROVIDER } from './providers/message-provider.interface';

/**
 * Module Messages sortants (SMS / WhatsApp) + rappels automatiques.
 *
 * Le provider d'envoi est résolu via le token `MESSAGE_PROVIDER`. Par défaut, le
 * `SimuleProvider` (statut `simule`, aucun appel réseau) est utilisé. Pour
 * brancher un vrai fournisseur, ajouter une classe implémentant `MessageProvider`
 * puis étendre la factory ci-dessous selon `process.env.MESSAGES_PROVIDER`
 * (ex. 'twilio', 'orange') avec les identifiants correspondants en variables
 * d'environnement.
 *
 * Le scheduler @Cron est enregistré ICI comme provider (jamais dans app.module).
 * ScheduleModule.forRoot() est déjà appliqué globalement au niveau app.module.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ModeleMessage, MessageSortant, Patient, RendezVous]),
  ],
  controllers: [MessagesSortantsController],
  providers: [
    MessagesSortantsService,
    MessagesSortantsScheduler,
    SimuleProvider,
    {
      provide: MESSAGE_PROVIDER,
      // Factory de sélection du fournisseur. Étendre ce switch pour un vrai
      // provider : case 'twilio': return new TwilioProvider(configService); …
      useFactory: (simule: SimuleProvider) => {
        const choix = (process.env.MESSAGES_PROVIDER ?? 'simule').toLowerCase();
        switch (choix) {
          // case 'twilio': return new TwilioProvider();
          // case 'orange': return new OrangeSmsProvider();
          default:
            return simule;
        }
      },
      inject: [SimuleProvider],
    },
  ],
  exports: [MessagesSortantsService],
})
export class MessagesSortantsModule {}
