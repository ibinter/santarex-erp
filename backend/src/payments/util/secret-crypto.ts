// ════════════════════════════════════════════════════════════════════════════
//  Chiffrement au repos des secrets de paiement (AES-256-GCM).
//  Les secrets (API keys, secret keys, webhook secrets) ne sont JAMAIS stockés
//  ni transmis en clair. La clé provient de PAYMENTS_ENC_KEY ; à défaut, elle est
//  dérivée de JWT_SECRET (avec avertissement — à ne pas utiliser en production).
// ════════════════════════════════════════════════════════════════════════════

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  timingSafeEqual,
} from 'crypto';
import { Logger } from '@nestjs/common';

const logger = new Logger('PaymentsSecretCrypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits, recommandé pour GCM
const KEY_LENGTH = 32; // 256 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENC_PREFIX = 'enc:v1:'; // marqueur de version pour les valeurs chiffrées

// Masque appliqué aux secrets renvoyés par l'API. Toute valeur commençant par
// ce préfixe est considérée « masquée » et ne doit jamais réécraser un secret.
export const MASK_PREFIX = '••••';

let cachedKey: Buffer | null = null;

/**
 * Dérive une clé AES-256 (32 octets) déterministe à partir d'un secret texte
 * via SHA-256. Permet d'accepter des clés de longueur arbitraire (hex, base64,
 * passphrase) tout en garantissant la bonne taille pour l'algorithme.
 */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

/** Résout et met en cache la clé de chiffrement. */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const explicit = process.env.PAYMENTS_ENC_KEY;
  if (explicit && explicit.trim().length > 0) {
    cachedKey = deriveKey(explicit.trim());
    return cachedKey;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && jwtSecret.trim().length > 0) {
    logger.warn(
      'PAYMENTS_ENC_KEY absente : clé de chiffrement dérivée de JWT_SECRET. ' +
        'Définissez PAYMENTS_ENC_KEY en production pour isoler les secrets de paiement.',
    );
    cachedKey = deriveKey(`payments::${jwtSecret.trim()}`);
    return cachedKey;
  }

  throw new Error(
    'Impossible de chiffrer les secrets de paiement : ni PAYMENTS_ENC_KEY ni JWT_SECRET ne sont définis.',
  );
}

/** Réinitialise le cache de clé (utile pour les tests). */
export function resetKeyCache(): void {
  cachedKey = null;
}

/**
 * Chiffre une chaîne en clair. Le résultat est self-contained :
 * `enc:v1:<iv_b64>:<authTag_b64>:<ciphertext_b64>`.
 */
export function encrypt(plain: string): string {
  if (plain === null || plain === undefined) {
    throw new Error('encrypt(): valeur nulle');
  }
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const ciphertext = Buffer.concat([
    cipher.update(String(plain), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join(':')
  );
}

/** Indique si une valeur est déjà chiffrée par ce module. */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Déchiffre une valeur produite par `encrypt`. Usage INTERNE serveur uniquement.
 * Une valeur non chiffrée (legacy/clair) est renvoyée telle quelle par tolérance.
 */
export function decrypt(enc: string): string {
  if (!isEncrypted(enc)) {
    // Tolérance ascendante : donnée historique non chiffrée.
    return enc;
  }
  const key = getKey();
  const payload = enc.slice(ENC_PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('decrypt(): format de secret chiffré invalide');
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const ciphertext = Buffer.from(dataB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}

/**
 * Masque un secret pour l'affichage : "••••" + les 4 derniers caractères du
 * secret EN CLAIR. La valeur chiffrée est d'abord déchiffrée si nécessaire.
 * Les secrets très courts sont entièrement masqués.
 */
export function mask(value: string): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  let plain: string;
  try {
    plain = isEncrypted(value) ? decrypt(value) : value;
  } catch {
    // Si le déchiffrement échoue, ne jamais divulguer la donnée brute.
    return MASK_PREFIX;
  }
  if (plain.length <= 4) {
    return MASK_PREFIX;
  }
  return MASK_PREFIX + plain.slice(-4);
}

/** Indique si une valeur reçue via l'API est une valeur masquée (placeholder). */
export function isMasked(value: string): boolean {
  return typeof value === 'string' && value.startsWith(MASK_PREFIX);
}

/** Comparaison à temps constant de deux secrets (anti timing-attack). */
export function safeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a ?? '', 'utf8');
  const bb = Buffer.from(b ?? '', 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
