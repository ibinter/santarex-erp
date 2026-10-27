import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Codes à usage unique basés sur le temps (TOTP, RFC 6238) — compatibles Google
 * Authenticator, Microsoft Authenticator, Authy, 1Password… Aucune dépendance.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error('Clé base32 invalide');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
    value &= (1 << bits) - 1;
  }
  return Buffer.from(out);
}

/** Nouveau secret aléatoire de 160 bits, en base32 (32 caractères). */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

function hotp(key: Buffer, counter: number, digits: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', key).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const bin =
    ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** Code TOTP à l'instant `nowMs` (30 s, 6 chiffres par défaut). */
export function totp(secretBase32: string, nowMs = Date.now(), step = 30, digits = 6): string {
  return hotp(base32Decode(secretBase32), Math.floor(nowMs / 1000 / step), digits);
}

/**
 * Vérifie un code saisi. Accepte ±`window` pas (dérive d'horloge du téléphone).
 * Renvoie le numéro du pas validé, ou null. `lastStep` empêche de rejouer un code
 * déjà utilisé (un code valable n'est accepté qu'une fois).
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  opts: { nowMs?: number; window?: number; lastStep?: number | null; step?: number; digits?: number } = {},
): number | null {
  const { nowMs = Date.now(), window = 1, lastStep = null, step = 30, digits = 6 } = opts;
  const saisi = String(code ?? '').replace(/\s+/g, '');
  if (!/^\d+$/.test(saisi) || saisi.length !== digits) return null;
  const key = base32Decode(secretBase32);
  const courant = Math.floor(nowMs / 1000 / step);
  for (let w = -window; w <= window; w++) {
    const counter = courant + w;
    if (lastStep != null && counter <= lastStep) continue;
    const attendu = hotp(key, counter, digits);
    if (timingSafeEqual(Buffer.from(attendu), Buffer.from(saisi))) return counter;
  }
  return null;
}

/** Adresse à encoder dans le QR code (otpauth://). */
export function otpauthUri(secretBase32: string, compte: string, emetteur = 'SANTAREX ERP'): string {
  const label = `${encodeURIComponent(emetteur)}:${encodeURIComponent(compte)}`;
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(emetteur)}&algorithm=SHA1&digits=6&period=30`;
}

/** Codes de secours (téléphone perdu) : 8 codes de la forme ABCDE-12345. */
export function generateRecoveryCodes(n = 8): string[] {
  return Array.from({ length: n }, () => {
    const h = randomBytes(5).toString('hex').toUpperCase();
    return `${h.slice(0, 5)}-${h.slice(5)}`;
  });
}

export function normaliserCodeSecours(code: string): string {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Empreinte stockée à la place du code : le code en clair n'est jamais conservé. */
export function hashCodeSecours(code: string): string {
  return createHash('sha256').update(normaliserCodeSecours(code)).digest('hex');
}
