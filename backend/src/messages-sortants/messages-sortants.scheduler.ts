import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessagesSortantsService } from './messages-sortants.service';

/**
 * Planificateur du module Messages sortants. Enregistré comme provider DANS ce
 * module (jamais dans app.module). Génère chaque jour les rappels de RDV du
 * lendemain pour tous les tenants. L'opération est idempotente : réexécutée, elle
 * ne recrée pas de rappel déjà émis.
 */
@Injectable()
export class MessagesSortantsScheduler {
  private readonly logger = new Logger(MessagesSortantsScheduler.name);

  constructor(private readonly service: MessagesSortantsService) {}

  /** Tous les jours à 08h00 : rappels des RDV du lendemain. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'rappels-rdv-quotidiens' })
  async genererRappelsQuotidiens(): Promise<void> {
    try {
      const total = await this.service.genererRappelsRdvTousTenants();
      this.logger.log(`Rappels RDV quotidiens : ${total} message(s) généré(s).`);
    } catch (err: any) {
      this.logger.error(`Échec génération rappels RDV : ${err?.message ?? err}`);
    }
  }
}
