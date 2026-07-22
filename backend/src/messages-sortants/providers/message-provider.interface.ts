import { CanalMessage } from '../entities/modele-message.entity';

/** Résultat normalisé retourné par un provider d'envoi. */
export interface ResultatEnvoi {
  /** true si le message a réellement été remis au fournisseur. */
  succes: boolean;
  /** true si l'envoi est simulé (aucun appel réseau réel). */
  simule: boolean;
  /** Identifiant du provider (log/simule, twilio, orange…). */
  provider: string;
  /** Message d'erreur éventuel. */
  erreur?: string;
}

export interface EnvoiOptions {
  destinataire: string;
  contenu: string;
  canal: CanalMessage;
}

/**
 * Contrat commun à tous les fournisseurs d'envoi SMS/WhatsApp. Pour brancher un
 * vrai fournisseur (Twilio, Orange SMS, WhatsApp Business…), implémenter cette
 * interface dans un nouveau provider et le sélectionner via la variable d'env
 * `MESSAGES_PROVIDER`. Voir `simule.provider.ts` pour l'implémentation par défaut.
 */
export interface MessageProvider {
  readonly nom: string;
  /** true si le provider n'effectue aucun envoi réseau réel. */
  readonly estSimule: boolean;
  envoyer(options: EnvoiOptions): Promise<ResultatEnvoi>;
}

/** Jeton d'injection Nest pour le provider actif. */
export const MESSAGE_PROVIDER = Symbol('MESSAGE_PROVIDER');
