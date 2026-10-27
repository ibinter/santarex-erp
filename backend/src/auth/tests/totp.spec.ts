import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateSecret,
  hashCodeSecours,
  normaliserCodeSecours,
  otpauthUri,
  totp,
  verifyTotp,
} from '../totp';

// Vecteurs de test officiels de la RFC 6238 (SHA-1, clé « 12345678901234567890 », 8 chiffres).
const CLE_RFC = base32Encode(Buffer.from('12345678901234567890'));

describe('TOTP (RFC 6238)', () => {
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1111111111, '14050471'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
    [20000000000, '65353130'],
  ])('vecteur officiel : t=%i → %s', (secondes, attendu) => {
    expect(totp(CLE_RFC, secondes * 1000, 30, 8)).toBe(attendu);
  });

  it('base32 : encodage puis décodage redonne les mêmes octets', () => {
    const octets = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255, 128, 7]);
    expect(base32Decode(base32Encode(octets))).toEqual(octets);
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
  });

  it('un secret généré fait 32 caractères base32 et change à chaque fois', () => {
    const a = generateSecret();
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateSecret()).not.toBe(a);
  });

  it('accepte le code courant, et le pas précédent (dérive d’horloge)', () => {
    const s = generateSecret();
    const maintenant = 1_700_000_000_000;
    expect(verifyTotp(s, totp(s, maintenant), { nowMs: maintenant })).not.toBeNull();
    expect(verifyTotp(s, totp(s, maintenant - 30_000), { nowMs: maintenant })).not.toBeNull();
  });

  it('refuse un code trop ancien, faux, ou mal formé', () => {
    const s = generateSecret();
    const maintenant = 1_700_000_000_000;
    expect(verifyTotp(s, totp(s, maintenant - 120_000), { nowMs: maintenant })).toBeNull();
    expect(verifyTotp(s, '000000', { nowMs: maintenant })).toBeNull();
    expect(verifyTotp(s, 'abc123', { nowMs: maintenant })).toBeNull();
    expect(verifyTotp(s, '12345', { nowMs: maintenant })).toBeNull();
  });

  it('un code déjà utilisé ne peut pas être rejoué', () => {
    const s = generateSecret();
    const maintenant = 1_700_000_000_000;
    const code = totp(s, maintenant);
    const pas = verifyTotp(s, code, { nowMs: maintenant });
    expect(pas).not.toBeNull();
    expect(verifyTotp(s, code, { nowMs: maintenant, lastStep: pas })).toBeNull();
  });

  it('ignore les espaces saisis (« 123 456 »)', () => {
    const s = generateSecret();
    const t = 1_700_000_000_000;
    const code = totp(s, t);
    expect(verifyTotp(s, `${code.slice(0, 3)} ${code.slice(3)}`, { nowMs: t })).not.toBeNull();
  });

  it('l’adresse du QR code contient le secret et l’émetteur', () => {
    const uri = otpauthUri('ABCDEFGH', 'dr.amara@clinique.ci');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('secret=ABCDEFGH');
    expect(uri).toContain('issuer=SANTAREX%20ERP');
  });

  it('codes de secours : 8 codes distincts, empreinte insensible à la casse et aux tirets', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const c of codes) expect(c).toMatch(/^[0-9A-F]{5}-[0-9A-F]{5}$/);
    const c = codes[0];
    expect(hashCodeSecours(c.toLowerCase().replace('-', ' '))).toBe(hashCodeSecours(c));
    expect(hashCodeSecours(c)).not.toContain(normaliserCodeSecours(c));
  });
});
