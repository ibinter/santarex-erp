import { Injectable, Logger } from '@nestjs/common';
import {
  EnvoiOptions,
  MessageProvider,
  ResultatEnvoi,
} from './message-provider.interface';

/**
 * Provider par défaut « log / simulé ». N'effectue AUCUN appel réseau : il se
 * contente de tracer le message et de retourner un statut `simule`. Actif tant
 * qu'aucun fournisseur réel n'est configuré via les variables d'environnement.
 *
 * Pour brancher un vrai fournisseur :
 *   1. Créer un provider implémentant `MessageProvider` (ex. TwilioProvider).
 *   2. Le fournir via le token `MESSAGE_PROVIDER` dans `messages-sortants.module.ts`
 *      en fonction de `process.env.MESSAGES_PROVIDER` (ex. 'twilio' | 'orange').
 *   3. Renseigner les identifiants du fournisseur (ex. TWILIO_ACCOUNT_SID,
 *      TWILIO_AUTH_TOKEN, TWILIO_FROM) dans l'environnement.
 */
@Injectable()
export class SimuleProvider implements MessageProvider {
  readonly nom = 'log/simule';
  readonly estSimule = true;
  private readonly logger = new Logger(SimuleProvider.name);

  async envoyer(options: EnvoiOptions): Promise<ResultatEnvoi> {
    this.logger.log(
      `[SIMULE] ${options.canal.toUpperCase()} → ${options.destinataire} : ${options.contenu}`,
    );
    return {
      succes: true,
      simule: true,
      provider: this.nom,
    };
  }
}
