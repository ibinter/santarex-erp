// ════════════════════════════════════════════════════════════════════════════
//  Contrat commun à toutes les passerelles électroniques (adaptateurs).
//
//  Chaque passerelle (Moneroo, CinetPay, Paystack, FedaPay, Stripe, PayPal)
//  implémente `PaymentGatewayAdapter`. Le `GatewayService` sélectionne
//  l'adaptateur selon la config en base et ne connaît que cette interface.
//
//  RÈGLES DE SÉCURITÉ portées par ce contrat :
//   - `verifyWebhook` DOIT vérifier la signature HMAC (ou RSA) sur le corps BRUT
//     du webhook. Il ne renvoie jamais `valid: true` sans preuve cryptographique.
//   - `eventId` sert de clé d'idempotence (couplé à la passerelle). Il doit être
//     stable et fourni par la passerelle (jamais généré côté serveur).
//   - `amount` est renvoyé dans la plus petite unité (centimes) pour être comparé
//     à `tx.amountExpected` sans flottant.
// ════════════════════════════════════════════════════════════════════════════

import { timingSafeEqual } from 'crypto';
import { PaymentGateway } from '../payments.enums';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

/** Secrets déchiffrés d'une passerelle (clé API, secret webhook, etc.). */
export type GatewaySecrets = Record<string, string>;

/** En-têtes HTTP bruts d'une requête webhook. */
export type WebhookHeaders = Record<string, string | string[] | undefined>;

/** Résultat de l'initiation d'un paiement auprès de la passerelle. */
export interface InitiateResult {
  /** Identifiant de transaction côté passerelle (à persister sur la tx). */
  gatewayTransactionId: string;
  /** URL de redirection / checkout à présenter au client. */
  paymentUrl: string;
}

/** Statut normalisé renvoyé par un webhook ou un contrôle de statut. */
export type NormalizedStatus = 'succeeded' | 'failed' | 'pending';

/** Résultat de la vérification d'un webhook. */
export interface WebhookVerification {
  /** true UNIQUEMENT si la signature cryptographique est valide. */
  valid: boolean;
  /** Identifiant unique de l'événement (clé d'idempotence). */
  eventId: string;
  /** Référence de la transaction (celle générée côté SANTAREX). */
  reference: string;
  /** Montant confirmé, dans la plus petite unité (centimes). */
  amount: number;
  /** Statut normalisé de l'événement. */
  status: NormalizedStatus;
}

/** Résultat d'un contrôle de statut actif (server-to-server). */
export interface StatusVerification {
  status: NormalizedStatus;
  amount: number;
  reference: string;
}

/** Adaptateur d'une passerelle de paiement. */
export interface PaymentGatewayAdapter {
  /** Passerelle gérée par cet adaptateur (clé de sélection). */
  readonly gateway: PaymentGateway;

  /**
   * Lance un paiement auprès de la passerelle.
   * @param tx      Transaction SANTAREX (montant, devise, référence, payeur…).
   * @param secrets Secrets déchiffrés de la passerelle.
   * @param sandbox true = environnement de test.
   */
  initiate(
    tx: PaymentTransaction,
    secrets: GatewaySecrets,
    sandbox: boolean,
  ): Promise<InitiateResult>;

  /**
   * Vérifie la signature d'un webhook et normalise son contenu.
   * SYNCHRONE (vérif purement cryptographique sur le corps brut).
   * @param rawBody Corps BRUT de la requête (Buffer/string) — indispensable au HMAC.
   * @param headers En-têtes de la requête (contiennent la signature).
   * @param secrets Secrets déchiffrés de la passerelle.
   */
  verifyWebhook(
    rawBody: Buffer | string,
    headers: WebhookHeaders,
    secrets: GatewaySecrets,
  ): WebhookVerification;

  /**
   * Contrôle actif du statut (server-to-server). Optionnel : utile pour les
   * passerelles dont le webhook ne porte pas de statut final fiable (ex. CinetPay).
   */
  verifyStatus?(
    gatewayTransactionId: string,
    secrets: GatewaySecrets,
    sandbox?: boolean,
  ): Promise<StatusVerification>;
}

// ════════════════════════════════════════════════════════════════════════════
//  Helpers partagés par les adaptateurs (petits utilitaires purs).
//  Regroupés ici pour rester dans le périmètre du module `gateways`.
// ════════════════════════════════════════════════════════════════════════════

/** Corps brut du webhook en string UTF-8 (indispensable au HMAC). */
export function rawBodyString(rawBody: Buffer | string): string {
  return Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
}

/** Lit un en-tête (insensible à la casse) et renvoie la 1re valeur en string. */
export function headerValue(headers: WebhookHeaders, name: string): string {
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const v = headers[key];
      return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
    }
  }
  return '';
}

/** Comparaison à temps constant de deux signatures hexadécimales. */
export function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b) return false;
  let bufA: Buffer;
  let bufB: Buffer;
  try {
    bufA = Buffer.from(a, 'hex');
    bufB = Buffer.from(b, 'hex');
  } catch {
    return false;
  }
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Comparaison à temps constant de deux chaînes arbitraires (utf8). */
export function safeEqualStr(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Découpe un nom complet en prénom / nom (pour les payloads passerelle). */
export function splitName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Client', lastName: 'SANTAREX' };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') || firstName };
}
