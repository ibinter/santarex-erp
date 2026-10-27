#!/usr/bin/env node
/**
 * Parcours de bout en bout contre un serveur RÉEL (et une base jetable).
 * Lancé par la CI après le démarrage du backend :
 *   BASE=http://localhost:3001/api/v1 node test/journey.js
 * Sort avec le code 1 à la moindre vérification en échec.
 * Sans dépendance : Node 18+ (fetch intégré).
 */
const crypto = require('crypto');

const BASE = (process.env.BASE || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const suffixe = Date.now().toString(36);
const MDP = 'Parcours2026x';

let echecs = 0;
let total = 0;
function verifier(nom, ok, detail = '') {
  total += 1;
  if (ok) console.log(`  ✓ ${nom}`);
  else { echecs += 1; console.log(`  ✗ ${nom} ${detail}`); }
}

async function appel(methode, chemin, { corps, jeton } = {}) {
  const res = await fetch(`${BASE}${chemin}`, {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
    },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* corps vide */ }
  // L'API enveloppe les succès dans { success, data } ; on rend la donnée utile.
  return { statut: res.status, data: json && json.data !== undefined ? json.data : json, brut: json };
}

// ── TOTP (RFC 6238) pour piloter la double authentification comme le ferait un téléphone ──
function base32Decode(s) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of s.replace(/=+$/, '').toUpperCase()) bits += alpha.indexOf(c).toString(2).padStart(5, '0');
  const octets = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) octets.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(octets);
}
function totp(secretBase32, decalagePas = 0) {
  const pas = Math.floor(Date.now() / 1000 / 30) + decalagePas;
  const compteur = Buffer.alloc(8);
  compteur.writeBigUInt64BE(BigInt(pas));
  const h = crypto.createHmac('sha1', base32Decode(secretBase32)).update(compteur).digest();
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, '0');
}

async function inscrire(nom) {
  const email = `${nom}.${suffixe}@parcours.test`;
  const r = await appel('POST', '/auth/register', {
    corps: {
      nomEtablissement: `Clinique ${nom} ${suffixe}`,
      adminNom: 'Test', adminPrenom: nom, adminEmail: email, password: MDP, telephone: '+22507000000', pays: 'CI',
    },
  });
  return { email, ...r };
}

async function main() {
  console.log(`Parcours SANTAREX sur ${BASE}\n`);

  console.log('Santé');
  const sante = await appel('GET', '/health');
  verifier('le serveur répond et la base est jointe', sante.statut === 200);

  console.log('\nInscription');
  const faible = await appel('POST', '/auth/register', {
    corps: { nomEtablissement: 'X', adminNom: 'A', adminPrenom: 'B', adminEmail: `faible.${suffixe}@parcours.test`, password: 'abcdefgh' },
  });
  verifier('un mot de passe sans chiffre est refusé', faible.statut === 400, `(statut ${faible.statut})`);

  const a = await inscrire('Alpha');
  verifier('l’inscription crée l’établissement et ouvre une session', a.statut === 201 && !!a.data?.access_token, `(statut ${a.statut})`);
  const doublon = await appel('POST', '/auth/register', {
    corps: { nomEtablissement: `Autre ${suffixe}`, adminNom: 'A', adminPrenom: 'B', adminEmail: a.email.toUpperCase(), password: MDP },
  });
  verifier('le même e-mail (même en majuscules) est refusé', doublon.statut === 409, `(statut ${doublon.statut})`);

  const b = await inscrire('Beta');
  verifier('un second établissement s’inscrit', b.statut === 201, `(statut ${b.statut})`);

  console.log('\nAccès');
  const sansJeton = await appel('GET', '/patients');
  verifier('sans connexion, les patients sont inaccessibles', sansJeton.statut === 401, `(statut ${sansJeton.statut})`);
  const mauvais = await appel('POST', '/auth/login', { corps: { email: a.email, password: 'FauxMotDePasse1', tenantId: a.data.user.tenantId } });
  verifier('un mauvais mot de passe est refusé', mauvais.statut === 401, `(statut ${mauvais.statut})`);

  const connexionA = await appel('POST', '/auth/login', { corps: { email: a.email, password: MDP, tenantId: a.data.user.tenantId } });
  verifier('la connexion réussit avec les bons identifiants', connexionA.statut === 200 && !!connexionA.data?.access_token, `(statut ${connexionA.statut})`);
  const jetonA = connexionA.data?.access_token;
  const tenantA = a.data.user.tenantId;
  const connexionB = await appel('POST', '/auth/login', { corps: { email: b.email, password: MDP, tenantId: b.data.user.tenantId } });
  const jetonB = connexionB.data?.access_token;

  console.log('\nPatient, facture, paiements');
  const patient = await appel('POST', '/patients', {
    jeton: jetonA,
    corps: { nom: 'KOUASSI', prenom: 'Jean', dateNaissance: '1985-03-15', sexe: 'M', telephone: '+22507070707' },
  });
  verifier('un patient se crée', patient.statut === 201 && !!patient.data?.id, `(statut ${patient.statut})`);
  const patientId = patient.data?.id;

  const facture = await appel('POST', '/facturation', {
    jeton: jetonA,
    corps: {
      patientId,
      lignes: [
        { type: 'consultation', libelle: 'Consultation', quantite: 1, prixUnitaire: 5000 },
        { type: 'medicament', libelle: 'Paracétamol', quantite: 2, prixUnitaire: 2500 },
      ],
    },
  });
  verifier('une facture se crée', facture.statut === 201 && !!facture.data?.id, `(statut ${facture.statut})`);
  verifier('le total est calculé par le serveur (10 000)', Number(facture.data?.montantTTC) === 10000, `(reçu ${facture.data?.montantTTC})`);
  const factureId = facture.data?.id;

  const emise = await appel('PATCH', `/facturation/${factureId}/emettre`, { jeton: jetonA });
  verifier('la facture s’émet', emise.statut === 200, `(statut ${emise.statut})`);

  const p1 = await appel('POST', '/paiements', { jeton: jetonA, corps: { factureId, montant: 4000, modePaiement: 'especes' } });
  verifier('un paiement partiel est accepté', p1.statut === 201, `(statut ${p1.statut})`);
  const apres1 = await appel('GET', `/facturation/${factureId}`, { jeton: jetonA });
  verifier('la facture devient partiellement payée, reste 6 000',
    apres1.data?.statut === 'partiellement_payee' && Number(apres1.data?.montantRestant) === 6000,
    `(statut ${apres1.data?.statut}, reste ${apres1.data?.montantRestant})`);

  const trop = await appel('POST', '/paiements', { jeton: jetonA, corps: { factureId, montant: 7000, modePaiement: 'especes' } });
  verifier('un paiement supérieur au reste à payer est refusé', trop.statut === 400, `(statut ${trop.statut})`);

  const p2 = await appel('POST', '/paiements', { jeton: jetonA, corps: { factureId, montant: 6000, modePaiement: 'mobile_money' } });
  verifier('le solde se paie', p2.statut === 201, `(statut ${p2.statut})`);
  const apres2 = await appel('GET', `/facturation/${factureId}`, { jeton: jetonA });
  verifier('la facture est soldée', apres2.data?.statut === 'payee' && Number(apres2.data?.montantRestant) === 0, `(statut ${apres2.data?.statut})`);
  const encore = await appel('POST', '/paiements', { jeton: jetonA, corps: { factureId, montant: 1, modePaiement: 'especes' } });
  verifier('une facture soldée n’accepte plus de paiement', encore.statut === 400, `(statut ${encore.statut})`);

  console.log('\nIsolation entre établissements');
  const volPatient = await appel('GET', `/patients/${patientId}`, { jeton: jetonB });
  verifier('l’établissement B ne voit pas le patient de A', volPatient.statut === 404 || volPatient.statut === 403, `(statut ${volPatient.statut})`);
  const volFacture = await appel('GET', `/facturation/${factureId}`, { jeton: jetonB });
  verifier('l’établissement B ne voit pas la facture de A', volFacture.statut === 404 || volFacture.statut === 403, `(statut ${volFacture.statut})`);
  const payerChezA = await appel('POST', '/paiements', { jeton: jetonB, corps: { factureId, montant: 1, modePaiement: 'especes' } });
  verifier('l’établissement B ne peut pas encaisser sur la facture de A', payerChezA.statut >= 400 && payerChezA.statut < 500, `(statut ${payerChezA.statut})`);

  console.log('\nDouble authentification');
  const setup = await appel('POST', '/auth/2fa/setup', { jeton: jetonA, corps: {} });
  verifier('l’activation fournit un secret et un QR code', setup.statut === 200 && !!setup.data?.secret && /^data:image\/png/.test(setup.data?.qrDataUrl || ''), `(statut ${setup.statut})`);
  const secret = setup.data?.secret;
  const mauvaisCode = await appel('POST', '/auth/2fa/enable', { jeton: jetonA, corps: { code: '000000' } });
  verifier('un mauvais code n’active pas la double authentification', mauvaisCode.statut === 400, `(statut ${mauvaisCode.statut})`);
  const enable = await appel('POST', '/auth/2fa/enable', { jeton: jetonA, corps: { code: totp(secret) } });
  verifier('le bon code l’active et donne 8 codes de secours', enable.statut === 200 && enable.data?.recoveryCodes?.length === 8, `(statut ${enable.statut})`);

  const etape1 = await appel('POST', '/auth/login', { corps: { email: a.email, password: MDP, tenantId: tenantA } });
  verifier('la connexion ne donne plus de session sans le code', etape1.data?.requires2fa === true && !etape1.data?.access_token, `(statut ${etape1.statut})`);
  const faux = await appel('POST', '/auth/2fa/verify', { corps: { challengeToken: etape1.data?.challengeToken, code: '000000' } });
  verifier('un mauvais code est refusé', faux.statut === 401, `(statut ${faux.statut})`);
  // Le pas courant a servi à l'activation (anti-rejeu) : on présente le pas suivant, accepté par la tolérance de ±1.
  const bon = await appel('POST', '/auth/2fa/verify', { corps: { challengeToken: etape1.data?.challengeToken, code: totp(secret, 1) } });
  verifier('le bon code ouvre la session', bon.statut === 200 && !!bon.data?.access_token, `(statut ${bon.statut})`);
  const secours = await appel('POST', '/auth/login', { corps: { email: a.email, password: MDP, tenantId: tenantA } });
  const parSecours = await appel('POST', '/auth/2fa/verify', { corps: { challengeToken: secours.data?.challengeToken, code: enable.data?.recoveryCodes?.[0] } });
  verifier('un code de secours ouvre la session', parSecours.statut === 200, `(statut ${parSecours.statut})`);
  const secours2 = await appel('POST', '/auth/login', { corps: { email: a.email, password: MDP, tenantId: tenantA } });
  const reutilise = await appel('POST', '/auth/2fa/verify', { corps: { challengeToken: secours2.data?.challengeToken, code: enable.data?.recoveryCodes?.[0] } });
  verifier('un code de secours ne sert qu’une fois', reutilise.statut === 401, `(statut ${reutilise.statut})`);

  console.log('\nConfirmation de l’e-mail');
  const statutEmail = await appel('GET', '/auth/email-status', { jeton: jetonA });
  verifier('une nouvelle inscription n’est pas encore confirmée', statutEmail.statut === 200 && statutEmail.data?.verified === false, `(statut ${statutEmail.statut})`);
  const lienFaux = await appel('POST', '/auth/verify-email', { corps: { token: 'pas.un.jeton' } });
  verifier('un faux lien de confirmation est refusé', lienFaux.statut === 400, `(statut ${lienFaux.statut})`);

  console.log(`\n${total - echecs}/${total} vérifications réussies`);
  process.exit(echecs === 0 ? 0 : 1);
}

main().catch((e) => { console.error('Erreur inattendue :', e); process.exit(1); });
