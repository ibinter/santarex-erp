/**
 * ════════════════════════════════════════════════════════════════════════════
 *  SANTAREX ERP — Reset & reseed de la DÉMONSTRATION PUBLIQUE (cahier IBIG §4)
 *
 *  Ce script est destiné à la stack de DÉMO ISOLÉE (base « postgres-demo »,
 *  jamais la production). Il :
 *    1. purge les données transactionnelles (patients fictifs, consultations,
 *       factures, séjours, mouvements de stock, etc.) ;
 *    2. RESEED un jeu 100 % FICTIF mais crédible, en français, cohérent avec un
 *       établissement de démonstration.
 *
 *  Idempotent : peut être relancé autant de fois que voulu (purge puis reseed) —
 *  conçu pour un cron nocturne (02:00) installé par l'orchestrateur.
 *
 *  Exécution (dans le conteneur backend-demo, après build) :
 *      node dist/database/demo-reset.js
 *
 *  SÉCURITÉ : le script REFUSE de s'exécuter si `DEMO_MODE !== 'true'`. Cela
 *  garantit qu'il ne peut JAMAIS purger une base de production par erreur.
 *  Pour un usage exceptionnel hors démo, positionner ALLOW_DEMO_RESET=force.
 * ════════════════════════════════════════════════════════════════════════════
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { FORMULES } from '../licences/formules';
import * as path from 'path';

// Charge un éventuel .env (require paresseux : absent en prod conteneurisée).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* variables déjà injectées par l'orchestrateur */
}

// ─── Garde-fou anti-production ────────────────────────────────────────────────

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const FORCE = process.env.ALLOW_DEMO_RESET === 'force';

if (!DEMO_MODE && !FORCE) {
  console.error(
    '[DEMO-RESET] REFUS : DEMO_MODE !== "true". Ce script ne s\'exécute que sur '
      + 'la base de démonstration. (Contournement volontaire : ALLOW_DEMO_RESET=force.)',
  );
  process.exit(1);
}

// ─── DataSource (mêmes variables que l'app / le seed) ─────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'santarex',
  password: process.env.DB_PASSWORD ?? 'santarex_secure_password',
  database: process.env.DB_NAME ?? 'santarex_demo',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
});

const TENANT_ID = 'clinique-saint-joseph';
const SALT_ROUNDS = 10;

function log(msg: string): void {
  console.log(`[DEMO-RESET] ${msg}`);
}

function ipp(n: number): string {
  return `2025-${String(n).padStart(5, '0')}`;
}

function medCode(n: number): string {
  return `MED-${String(n).padStart(5, '0')}`;
}

// ─── 1. Purge des données transactionnelles ───────────────────────────────────
//
// Liste curée des tables transactionnelles / patient-liées. On TRUNCATE chaque
// table indépendamment (RESTART IDENTITY CASCADE) : une table absente du schéma
// est simplement ignorée. Les tables de RÉFÉRENTIEL (offres_saas, tenants,
// version_erp, licences…) ne sont PAS purgées.

const TABLES_A_PURGER: string[] = [
  // Cœur clinique
  'notes_evolution',
  'soins_infirmiers',
  'sejours',
  'resultats_analyse',
  'demandes_analyse',
  'types_analyse', // re-seedés avec la démo (laboratoire)
  'ordonnances',
  'consultations',
  'rendez_vous',
  // Facturation / caisse / paiements patients
  'lignes_facture',
  'factures',
  'paiements',
  'caisse_recus',
  'caisse_sessions',
  // Pharmacie (mouvements — on conserve le catalogue medicaments, re-seedé)
  'mouvements_stock',
  'stock_medicaments',
  // Documents & DME
  'documents_medicaux',
  'antecedents',
  'allergies',
  // Données à re-seeder intégralement
  'lits',
  'medicaments',
  'patients',
];

async function purger(ds: DataSource): Promise<void> {
  log('Purge des données transactionnelles...');
  for (const table of TABLES_A_PURGER) {
    try {
      await ds.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
      log(`  ✓ purgé : ${table}`);
    } catch (err) {
      // Table absente du schéma de cette instance → on ignore proprement.
      log(`  - ignoré (${table}) : ${(err as Error)?.message ?? err}`);
    }
  }
}

// ─── 2a. Utilisateurs de démonstration ────────────────────────────────────────

async function seedUsers(ds: DataSource): Promise<Record<string, string>> {
  log('Reseed des utilisateurs de démonstration...');

  const usersData = [
    { email: 'admin@clinique-saint-joseph.ci', password: 'Admin2025!', firstName: 'Kouakou', lastName: 'Directeur', role: 'admin', key: 'admin' },
    { email: 'dr.amara@clinique-saint-joseph.ci', password: 'Medecin2025!', firstName: 'Amara', lastName: 'Diallo', role: 'medecin', key: 'medecinAmara' },
    { email: 'dr.koffi@clinique-saint-joseph.ci', password: 'Medecin2025!', firstName: 'Koffi', lastName: 'Mensah', role: 'medecin', key: 'medecinKoffi' },
    { email: 'fatoumata@clinique-saint-joseph.ci', password: 'Infirmiere2025!', firstName: 'Fatoumata', lastName: 'Koné', role: 'infirmier', key: 'infirmier' },
    { email: 'celestine@clinique-saint-joseph.ci', password: 'Caissiere2025!', firstName: 'Célestine', lastName: 'Bamba', role: 'caissier', key: 'caissier' },
    { email: 'ahmed@clinique-saint-joseph.ci', password: 'Pharmacien2025!', firstName: 'Ahmed', lastName: 'Ben Salah', role: 'pharmacien', key: 'pharmacien' },
    { email: 'jean@clinique-saint-joseph.ci', password: 'Labo2025!', firstName: 'Jean', lastName: 'Kouassi', role: 'laborantin', key: 'laborantin' },
  ];

  const ids: Record<string, string> = {};

  for (const u of usersData) {
    const exists = await ds.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exists.length > 0) {
      ids[u.key] = exists[0].id;
      continue;
    }
    const hashedPwd = await bcrypt.hash(u.password, SALT_ROUNDS);
    const result = await ds.query(
      `INSERT INTO users (email, password, "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING id`,
      [u.email, hashedPwd, u.firstName, u.lastName, u.role, TENANT_ID],
    );
    ids[u.key] = result[0].id;
    log(`  ✓ ${u.firstName} ${u.lastName} (${u.role})`);
  }

  return ids;
}

// ─── 2b. Patients FICTIFS ─────────────────────────────────────────────────────

const PATIENTS = [
  { nom: 'KONAN', prenom: 'Marie-Ange', sexe: 'F', dateNaissance: '1990-03-15', ville: 'Abidjan', tel: '0708123456', gs: 'B+' },
  { nom: 'TRAORÉ', prenom: 'Ibrahim', sexe: 'M', dateNaissance: '1979-07-22', ville: 'Bouaké', tel: '0709876543', gs: 'O+' },
  { nom: 'YAO', prenom: 'Emmanuel', sexe: 'M', dateNaissance: '1996-11-08', ville: 'Abidjan', tel: '0101234567', gs: 'A+' },
  { nom: "N'GUESSAN", prenom: 'Adjoua', sexe: 'F', dateNaissance: '1972-04-30', ville: 'San Pédro', tel: '0102345678', gs: 'AB+' },
  { nom: 'COULIBALY', prenom: 'Mamadou', sexe: 'M', dateNaissance: '1957-09-14', ville: 'Korhogo', tel: '0703456789', gs: 'O-' },
  { nom: 'BAMBA', prenom: 'Fatou', sexe: 'F', dateNaissance: '2001-12-01', ville: 'Abidjan', tel: '0104567890', gs: 'A-' },
  { nom: 'DIOMANDÉ', prenom: 'Seydou', sexe: 'M', dateNaissance: '1983-06-25', ville: 'Daloa', tel: '0705678901', gs: 'B-' },
  { nom: 'OUATTARA', prenom: 'Aminata', sexe: 'F', dateNaissance: '2009-02-18', ville: 'Abidjan', tel: '0106789012', gs: 'O+' },
  { nom: 'KONÉ', prenom: 'Drissa', sexe: 'M', dateNaissance: '1966-08-03', ville: 'Yamoussoukro', tel: '0707890123', gs: 'A+' },
  { nom: 'ADOU', prenom: 'Bernadette', sexe: 'F', dateNaissance: '1986-01-27', ville: 'Abidjan', tel: '0108901234', gs: 'B+' },
];

async function seedPatients(ds: DataSource, adminId: string, tenantId: string = TENANT_ID, pre = ''): Promise<string[]> {
  log('Reseed des patients fictifs...');
  const ids: string[] = [];
  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const ippVal = `${pre}${ipp(i + 1)}`;
    const result = await ds.query(
      `INSERT INTO patients (ipp, nom, prenom, "dateNaissance", sexe, telephone, ville, pays, "groupeSanguin", statut, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'CI', $8, 'actif', $9, $10, NOW(), NOW()) RETURNING id`,
      [ippVal, p.nom, p.prenom, p.dateNaissance, p.sexe, p.tel, p.ville, p.gs, tenantId, adminId],
    );
    ids.push(result[0].id);
    log(`  ✓ ${p.nom} ${p.prenom} (${ippVal})`);
  }
  return ids;
}

// ─── 2c. Médicaments ──────────────────────────────────────────────────────────

const MEDS = [
  { nom: 'Amoxicilline', dosage: '500mg', forme: 'comprime', unite: 'comprimé', categorie: 'antibiotique', stock: 500, seuil: 50, prix: 150 },
  { nom: 'Paracétamol', dosage: '1000mg', forme: 'comprime', unite: 'comprimé', categorie: 'antalgique', stock: 1000, seuil: 100, prix: 50 },
  { nom: 'Artéméther+Luméfantrine', dosage: '80/480mg', forme: 'comprime', unite: 'comprimé', categorie: 'antipaludeen', stock: 300, seuil: 30, prix: 2500 },
  { nom: 'Metformine', dosage: '500mg', forme: 'comprime', unite: 'comprimé', categorie: 'antidiabetique', stock: 400, seuil: 40, prix: 100 },
  { nom: 'Amlodipine', dosage: '5mg', forme: 'comprime', unite: 'comprimé', categorie: 'antihypertenseur', stock: 350, seuil: 35, prix: 200 },
  { nom: 'Sérum physiologique', dosage: '500ml', forme: 'injectable', unite: 'flacon', categorie: 'autre', stock: 200, seuil: 20, prix: 800 },
  { nom: 'Ibuprofène', dosage: '400mg', forme: 'comprime', unite: 'comprimé', categorie: 'antalgique', stock: 600, seuil: 60, prix: 75 },
  { nom: 'Oméprazole', dosage: '20mg', forme: 'gelule', unite: 'gélule', categorie: 'autre', stock: 250, seuil: 25, prix: 300 },
  { nom: 'Doliprane sirop', dosage: '2.4%', forme: 'sirop', unite: 'flacon', categorie: 'antalgique', stock: 80, seuil: 20, prix: 1200 },
  { nom: 'Bétadine', dosage: '10%', forme: 'autre', unite: 'flacon', categorie: 'autre', stock: 50, seuil: 10, prix: 1500 },
  { nom: 'Flagyl', dosage: '500mg', forme: 'comprime', unite: 'comprimé', categorie: 'antibiotique', stock: 180, seuil: 30, prix: 250 },
  { nom: 'Fluconazole', dosage: '150mg', forme: 'gelule', unite: 'gélule', categorie: 'antibiotique', stock: 12, seuil: 15, prix: 800 },
  { nom: 'Furosémide', dosage: '40mg', forme: 'comprime', unite: 'comprimé', categorie: 'autre', stock: 200, seuil: 20, prix: 120 },
  { nom: 'Dexaméthasone', dosage: '4mg/ml', forme: 'injectable', unite: 'ampoule', categorie: 'autre', stock: 60, seuil: 10, prix: 450 },
];

async function seedMedicaments(ds: DataSource, tenantId: string = TENANT_ID, pre = ''): Promise<void> {
  log('Reseed du catalogue pharmacie...');
  for (let i = 0; i < MEDS.length; i++) {
    const m = MEDS[i];
    const code = `${pre}${medCode(i + 1)}`;
    await ds.query(
      `INSERT INTO medicaments (code, nom, forme, dosage, unite, categorie, "stockActuel", "stockMinimum", "stockMaximum", "prixUnitaire", "prixVente", devise, "prescriptionRequise", "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 'XOF', false, true, $11, NOW(), NOW())`,
      [code, m.nom, m.forme, m.dosage, m.unite, m.categorie, m.stock, m.seuil, m.seuil * 20, m.prix, tenantId],
    );
  }
  log(`  ✓ ${MEDS.length} médicaments`);
}

// ─── 2d. Lits ─────────────────────────────────────────────────────────────────

async function seedLits(ds: DataSource, tenantId: string = TENANT_ID, pre = ''): Promise<Record<string, string>> {
  log('Reseed des lits...');
  const litsDefs: Array<{ numero: string; service: string; salle: string; statut: string }> = [];
  const statutsMed = ['occupe', 'occupe', 'libre', 'libre', 'libre', 'libre', 'libre', 'libre', 'en_nettoyage', 'libre'];
  for (let i = 1; i <= 10; i++) {
    litsDefs.push({ numero: `MED-10${i}`, service: 'medecine_generale', salle: `Salle ${Math.ceil(i / 2)}`, statut: statutsMed[i - 1] });
  }
  const statutsChi = ['occupe', 'libre', 'libre', 'occupe', 'libre', 'en_nettoyage'];
  for (let i = 1; i <= 6; i++) {
    litsDefs.push({ numero: `CHI-20${i}`, service: 'chirurgie', salle: `Bloc ${Math.ceil(i / 2)}`, statut: statutsChi[i - 1] });
  }
  const statutsMat = ['occupe', 'libre', 'libre', 'occupe'];
  for (let i = 1; i <= 4; i++) {
    litsDefs.push({ numero: `MAT-30${i}`, service: 'maternite', salle: 'Salle Maternité', statut: statutsMat[i - 1] });
  }

  const litIds: Record<string, string> = {};
  for (const l of litsDefs) {
    const result = await ds.query(
      `INSERT INTO lits (numero, service, salle, statut, "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW()) RETURNING id`,
      [`${pre}${l.numero}`, l.service, l.salle, l.statut, tenantId],
    );
    litIds[l.numero] = result[0].id;
  }
  log(`  ✓ ${litsDefs.length} lits`);
  return litIds;
}

// ─── 2e. Séjours actifs ───────────────────────────────────────────────────────

async function seedSejours(
  ds: DataSource,
  patientIds: string[],
  litIds: Record<string, string>,
  medecinId: string,
  tenantId: string = TENANT_ID,
  pre = '',
): Promise<void> {
  log('Reseed des séjours actifs...');
  const sejoursActifs = [
    { numero: 'HSP-2025-00001', patientIdx: 0, litNum: 'MED-101', service: 'medecine_generale', type: 'urgente', diagnostic: 'Paludisme grave', daysAgo: 3 },
    { numero: 'HSP-2025-00002', patientIdx: 1, litNum: 'MED-102', service: 'medecine_generale', type: 'programme', diagnostic: 'Diabète décompensé avec complications rénales', daysAgo: 5 },
    { numero: 'HSP-2025-00003', patientIdx: 3, litNum: 'CHI-201', service: 'chirurgie', type: 'programme', diagnostic: 'Appendicite aiguë — post-opératoire J1', daysAgo: 1 },
    { numero: 'HSP-2025-00004', patientIdx: 5, litNum: 'CHI-204', service: 'chirurgie', type: 'urgente', diagnostic: 'Fracture ouverte membre inférieur droit', daysAgo: 2 },
    { numero: 'HSP-2025-00005', patientIdx: 7, litNum: 'MAT-301', service: 'maternite', type: 'programme', diagnostic: 'Grossesse à terme — travail en cours', daysAgo: 0 },
    { numero: 'HSP-2025-00006', patientIdx: 9, litNum: 'MAT-304', service: 'maternite', type: 'urgente', diagnostic: 'Pré-éclampsie sévère', daysAgo: 1 },
  ];

  for (const s of sejoursActifs) {
    const litId = litIds[s.litNum];
    if (!litId) continue;
    const dateAdmission = new Date();
    dateAdmission.setDate(dateAdmission.getDate() - s.daysAgo);
    dateAdmission.setHours(8, 30, 0, 0);

    const result = await ds.query(
      `INSERT INTO sejours (numero, "patientId", "litId", "medecinReferentId", service, type, "dateHeureAdmission", "diagnosticEntree", "typeSortie", statut, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_cours', 'actif', $9, $10, NOW(), NOW()) RETURNING id`,
      [`${pre}${s.numero}`, patientIds[s.patientIdx], litId, medecinId, s.service, s.type, dateAdmission.toISOString(), s.diagnostic, tenantId, medecinId],
    );
    await ds.query('UPDATE lits SET "sejourActuelId" = $1 WHERE id = $2', [result[0].id, litId]);
  }
  log(`  ✓ ${sejoursActifs.length} séjours actifs`);
}

// ─── 2f. Consultations + factures (crédibilité de la démo) ─────────────────────

async function seedConsultationsEtFactures(
  ds: DataSource,
  patientIds: string[],
  medecinId: string,
  tenantId: string = TENANT_ID,
  pre = '',
): Promise<void> {
  log('Reseed de consultations et factures de démonstration...');

  const consultations = [
    { patientIdx: 2, type: 'consultation_generale', motif: 'Fièvre et céphalées depuis 3 jours', diagnostic: 'Paludisme simple', ta: '120/80', fc: 88, temp: 38.6, montant: 15000, daysAgo: 0 },
    { patientIdx: 4, type: 'suivi', motif: 'Suivi hypertension artérielle', diagnostic: 'HTA équilibrée sous traitement', ta: '135/85', fc: 76, temp: 36.8, montant: 10000, daysAgo: 4 },
    { patientIdx: 6, type: 'specialite', motif: 'Douleurs abdominales chroniques', diagnostic: 'Gastrite chronique', ta: '118/78', fc: 72, temp: 37.0, montant: 20000, daysAgo: 0 },
    { patientIdx: 8, type: 'consultation_generale', motif: 'Toux productive et dyspnée', diagnostic: 'Bronchite aiguë', ta: '125/82', fc: 90, temp: 38.1, montant: 15000, daysAgo: 6 },
  ];

  let factureSeq = 1;
  for (const c of consultations) {
    const dateHeure = new Date();
    dateHeure.setDate(dateHeure.getDate() - c.daysAgo);
    dateHeure.setHours(10, 0, 0, 0);
    const patientId = patientIds[c.patientIdx];

    const consult = await ds.query(
      `INSERT INTO consultations ("patientId", "medecinId", "dateHeure", type, motif, "tensionArterielle", "frequenceCardiaque", temperature, diagnostic, conclusion, statut, "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'facturee', $11, NOW(), NOW()) RETURNING id`,
      [patientId, medecinId, dateHeure.toISOString(), c.type, c.motif, c.ta, c.fc, c.temp, c.diagnostic, 'Traitement prescrit, contrôle si aggravation.', tenantId],
    );
    const consultationId = consult[0].id;

    const numero = `${pre}FACT-2025-${String(factureSeq++).padStart(5, '0')}`;
    const ttc = c.montant;
    const facture = await ds.query(
      `INSERT INTO factures (numero, "patientId", "consultationId", "dateEmission", statut, "montantHT", "tauxTVA", "montantTVA", "montantTTC", "montantPaye", "montantRestant", "partPatient", devise, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'payee', $5, 0, 0, $5, $5, 0, $5, 'XOF', $6, $7, NOW(), NOW()) RETURNING id`,
      [numero, patientId, consultationId, dateHeure.toISOString(), ttc, tenantId, medecinId],
    );

    // Encaissement correspondant : sans lui, la caisse et « Encaissements du jour » restent à zéro.
    // Daté comme la consultation, donc les consultations d'aujourd'hui alimentent la caisse du jour.
    try {
      await ds.query(
        `INSERT INTO paiements (reference, "factureId", "patientId", montant, devise, "modePaiement", statut, "tenantId", "createdById", "createdAt", "validatedAt")
         VALUES ($1, $2, $3, $4, 'XOF', $5, 'valide', $6, $7, $8, $8)`,
        [`${pre}PAY-2025-${String(factureSeq - 1).padStart(5, '0')}`, facture[0].id, patientId, ttc, ['especes', 'especes', 'mobile_money', 'carte_bancaire'][(factureSeq - 2) % 4], tenantId, medecinId, dateHeure.toISOString()],
      );
    } catch (err) {
      log(`  - paiement ignoré (${numero}) : ${(err as Error)?.message ?? err}`);
    }

    // Ligne de facture (best-effort : le schéma peut varier).
    try {
      await ds.query(
        `INSERT INTO lignes_facture ("factureId", type, libelle, quantite, "prixUnitaire", "remisePourcent", "montantTotal", "tenantId")
         VALUES ($1, 'consultation', $2, 1, $3, 0, $3, $4)`,
        [facture[0].id, `Consultation — ${c.diagnostic}`, ttc, tenantId],
      );
    } catch (err) {
      log(`  - ligne_facture ignorée (${numero}) : ${(err as Error)?.message ?? err}`);
    }
  }
  log(`  ✓ ${consultations.length} consultations + factures`);
}

// ─── 2g. Laboratoire : types d'analyses + demandes à tous les stades ───────────

async function seedLaboratoire(
  ds: DataSource,
  patientIds: string[],
  medecinId: string,
  tenantId: string = TENANT_ID,
  pre = '',
): Promise<void> {
  log('Reseed du laboratoire de démonstration...');
  const types = [
    { code: 'NFS', nom: 'Numération Formule Sanguine', cat: 'hematologie', prix: 8000, delai: 4,
      params: [{ nom: 'Hémoglobine', unite: 'g/dL', valeursNormalesMin: 12, valeursNormalesMax: 16 }, { nom: 'Globules blancs', unite: 'G/L', valeursNormalesMin: 4, valeursNormalesMax: 10 }, { nom: 'Plaquettes', unite: 'G/L', valeursNormalesMin: 150, valeursNormalesMax: 400 }] },
    { code: 'GLY', nom: 'Glycémie à jeun', cat: 'biochimie', prix: 3000, delai: 2,
      params: [{ nom: 'Glycémie', unite: 'g/L', valeursNormalesMin: 0.7, valeursNormalesMax: 1.1 }] },
    { code: 'GE', nom: 'Goutte épaisse (paludisme)', cat: 'parasitologie', prix: 3500, delai: 1,
      params: [{ nom: 'Plasmodium', unite: '', valeursNormalesTexte: 'Absent' }] },
    { code: 'CREA', nom: 'Créatinine', cat: 'biochimie', prix: 4000, delai: 4,
      params: [{ nom: 'Créatinine', unite: 'mg/L', valeursNormalesMin: 7, valeursNormalesMax: 13 }] },
    { code: 'WIDAL', nom: 'Sérodiagnostic de Widal', cat: 'serologie', prix: 5000, delai: 6,
      params: [{ nom: 'Anticorps anti-O', unite: '', valeursNormalesTexte: '< 1/80' }] },
  ];
  const typeId: Record<string, string> = {};
  for (const t of types) {
    const r = await ds.query(
      `INSERT INTO types_analyse (code, nom, categorie, "delaiResultatsHeures", "prixUnitaire", parametres, "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, NOW(), NOW()) RETURNING id`,
      [t.code, t.nom, t.cat, t.delai, t.prix, JSON.stringify(t.params), tenantId],
    );
    typeId[t.code] = r[0].id;
  }

  const heures = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  const demandes = [
    { patientIdx: 2, analyses: ['NFS', 'GE'], urgence: true, statut: 'en_analyse', h: 1, notes: 'Fièvre élevée, suspicion de paludisme grave' },
    { patientIdx: 4, analyses: ['GLY', 'CREA'], urgence: false, statut: 'termine', h: 6, notes: 'Contrôle diabète et fonction rénale',
      resultats: [{ code: 'GLY', valeurs: [{ paramNom: 'Glycémie', valeur: 1.42, unite: 'g/L', valeursNormalesMin: 0.7, valeursNormalesMax: 1.1, interpretation: 'eleve' }], commentaire: 'Hyperglycémie : adapter le traitement.' },
                    { code: 'CREA', valeurs: [{ paramNom: 'Créatinine', valeur: 10, unite: 'mg/L', valeursNormalesMin: 7, valeursNormalesMax: 13, interpretation: 'normal' }], commentaire: 'Fonction rénale normale.' }] },
    { patientIdx: 6, analyses: ['NFS'], urgence: false, statut: 'preleve', h: 2, notes: 'Bilan avant intervention' },
    { patientIdx: 8, analyses: ['WIDAL'], urgence: false, statut: 'attente_prelevement', h: 0.2, notes: 'Fièvre prolongée' },
    { patientIdx: 1, analyses: ['GE'], urgence: false, statut: 'termine', h: 26, notes: 'Contrôle après traitement',
      resultats: [{ code: 'GE', valeurs: [{ paramNom: 'Plasmodium', valeur: 'Absent', unite: '', interpretation: 'normal' }], commentaire: 'Goutte épaisse négative.' }] },
  ];

  let n = 1;
  for (const d of demandes) {
    const patientId = patientIds[d.patientIdx] ?? patientIds[0];
    const r = await ds.query(
      `INSERT INTO demandes_analyse (numero, "patientId", "medecinId", analyses, urgence, "statutPrelevement", "dateHeureDemande", "dateHeurePrelevement", "datePrevueResultats", notes, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $3, NOW(), NOW()) RETURNING id`,
      [
        `${pre}LAB-2025-${String(n++).padStart(5, '0')}`, patientId, medecinId,
        JSON.stringify(d.analyses.map((c) => typeId[c])), d.urgence, d.statut, heures(d.h),
        d.statut === 'attente_prelevement' ? null : heures(Math.max(d.h - 0.3, 0)),
        new Date(Date.now() + 4 * 3600_000).toISOString(), d.notes, tenantId,
      ],
    );
    for (const res of d.resultats ?? []) {
      await ds.query(
        `INSERT INTO resultats_analyse ("demandeAnalyseId", "patientId", "typeAnalyseId", resultats, interpretation, statut, "biologisteId", "dateValidation", "estCritique", "tenantId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'valide', $6, $7, false, $8, NOW(), NOW())`,
        [r[0].id, patientId, typeId[res.code], JSON.stringify(res.valeurs), res.commentaire, medecinId, heures(Math.max(d.h - 0.5, 0)), tenantId],
      );
    }
  }
  log(`  ✓ ${types.length} types d'analyses + ${demandes.length} demandes`);
}

// ─── 2h. Ventes du comptoir (démo Pharmacie : pas de consultations) ────────────

async function seedVentesPharmacie(
  ds: DataSource,
  patientIds: string[],
  userId: string,
  tenantId: string,
  pre: string,
): Promise<void> {
  log('Reseed des ventes de pharmacie de démonstration...');
  const ventes = [
    { libelle: 'Amoxicilline 500mg × 10', ttc: 1500, mode: 'especes', h: 5 },
    { libelle: 'Artéméther+Luméfantrine × 1 cure', ttc: 2500, mode: 'mobile_money', h: 4 },
    { libelle: 'Doliprane sirop + Ibuprofène 400mg × 10', ttc: 1950, mode: 'especes', h: 3 },
    { libelle: 'Metformine 500mg × 30', ttc: 3000, mode: 'carte_bancaire', h: 2 },
    { libelle: 'Oméprazole 20mg × 14', ttc: 4200, mode: 'mobile_money', h: 1 },
  ];
  let n = 1;
  for (const v of ventes) {
    const quand = new Date(Date.now() - v.h * 3600_000).toISOString();
    const patientId = patientIds[(n - 1) % patientIds.length];
    const numero = `${pre}FACT-2025-${String(500 + n).padStart(5, '0')}`;
    const facture = await ds.query(
      `INSERT INTO factures (numero, "patientId", "dateEmission", statut, "montantHT", "tauxTVA", "montantTVA", "montantTTC", "montantPaye", "montantRestant", "partPatient", devise, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'payee', $4, 0, 0, $4, $4, 0, $4, 'XOF', $5, $6, $3, $3) RETURNING id`,
      [numero, patientId, quand, v.ttc, tenantId, userId],
    );
    try {
      await ds.query(
        `INSERT INTO lignes_facture ("factureId", type, libelle, quantite, "prixUnitaire", "remisePourcent", "montantTotal", "tenantId")
         VALUES ($1, 'medicament', $2, 1, $3, 0, $3, $4)`,
        [facture[0].id, v.libelle, v.ttc, tenantId],
      );
    } catch (err) {
      log(`  - ligne_facture ignorée (${numero}) : ${(err as Error)?.message ?? err}`);
    }
    await ds.query(
      `INSERT INTO paiements (reference, "factureId", "patientId", montant, devise, "modePaiement", statut, "tenantId", "createdById", "createdAt", "validatedAt")
       VALUES ($1, $2, $3, $4, 'XOF', $5, 'valide', $6, $7, $8, $8)`,
      [`${pre}PAY-2025-${String(n).padStart(5, '0')}`, facture[0].id, patientId, v.ttc, v.mode, tenantId, userId, quand],
    );
    n += 1;
  }
  log(`  ✓ ${ventes.length} ventes du jour`);
}

// ─── 3. Une démo par formule commerciale ──────────────────────────────────────
//
// Chaque formule (Pharmacie, Cabinet, Centre, Clinique) a son propre
// établissement de démonstration, avec SA licence (donc SON menu et SES modules)
// et des données adaptées. La formule Hôpital = la clinique historique
// « clinique-saint-joseph » ci-dessus (accès complet).
// Chaque démo est isolée : une erreur sur l'une n'arrête ni les autres ni la
// démo principale.

const DEMO_PASSWORD = 'Demo2025!';

interface DemoFormule {
  code: 'pharmacie' | 'cabinet' | 'centre' | 'clinique';
  nom: string;
  type: string;
  prefix: string;
  prix: number;
  maxUsers: number;
  users: Array<{ key: string; role: string; prenom: string; nom: string }>;
  consultations: boolean;
  hospitalisation: boolean;
}

const DEMOS: DemoFormule[] = [
  {
    code: 'pharmacie', nom: 'Pharmacie Démo — Officine du Plateau', type: 'pharmacie', prefix: 'P-', prix: 12000, maxUsers: 3,
    users: [
      { key: 'admin', role: 'admin', prenom: 'Awa', nom: 'Pharmacienne' },
      { key: 'pharmacien', role: 'pharmacien', prenom: 'Ahmed', nom: 'Ben Salah' },
      { key: 'caissier', role: 'caissier', prenom: 'Célestine', nom: 'Bamba' },
    ],
    consultations: false, hospitalisation: false,
  },
  {
    code: 'cabinet', nom: 'Cabinet Médical Démo — Dr Diallo', type: 'cabinet', prefix: 'C-', prix: 18000, maxUsers: 5,
    users: [
      { key: 'admin', role: 'admin', prenom: 'Amara', nom: 'Diallo' },
      { key: 'medecin', role: 'medecin', prenom: 'Koffi', nom: 'Mensah' },
      { key: 'caissier', role: 'caissier', prenom: 'Célestine', nom: 'Bamba' },
      { key: 'laborantin', role: 'laborantin', prenom: 'Jean', nom: 'Kouassi' },
    ],
    consultations: true, hospitalisation: false,
  },
  {
    code: 'centre', nom: 'Centre de Santé Démo — CSI du Plateau', type: 'clinique', prefix: 'S-', prix: 35000, maxUsers: 15,
    users: [
      { key: 'admin', role: 'admin', prenom: 'Kouakou', nom: 'Directeur' },
      { key: 'medecin', role: 'medecin', prenom: 'Amara', nom: 'Diallo' },
      { key: 'infirmier', role: 'infirmier', prenom: 'Fatoumata', nom: 'Koné' },
      { key: 'caissier', role: 'caissier', prenom: 'Célestine', nom: 'Bamba' },
      { key: 'pharmacien', role: 'pharmacien', prenom: 'Ahmed', nom: 'Ben Salah' },
      { key: 'laborantin', role: 'laborantin', prenom: 'Jean', nom: 'Kouassi' },
    ],
    consultations: true, hospitalisation: false,
  },
  {
    code: 'clinique', nom: 'Clinique Démo — Polyclinique Sainte-Marie', type: 'polyclinique', prefix: 'L-', prix: 75000, maxUsers: 30,
    users: [
      { key: 'admin', role: 'admin', prenom: 'Kouakou', nom: 'Directeur' },
      { key: 'medecin', role: 'medecin', prenom: 'Amara', nom: 'Diallo' },
      { key: 'medecin2', role: 'medecin', prenom: 'Koffi', nom: 'Mensah' },
      { key: 'infirmier', role: 'infirmier', prenom: 'Fatoumata', nom: 'Koné' },
      { key: 'caissier', role: 'caissier', prenom: 'Célestine', nom: 'Bamba' },
      { key: 'pharmacien', role: 'pharmacien', prenom: 'Ahmed', nom: 'Ben Salah' },
      { key: 'laborantin', role: 'laborantin', prenom: 'Jean', nom: 'Kouassi' },
    ],
    consultations: true, hospitalisation: true,
  },
];

async function seedDemoFormule(ds: DataSource, d: DemoFormule): Promise<void> {
  const slug = `demo-${d.code}`;
  const modules = FORMULES[d.code];
  log(`── Démo ${d.code} (${slug}) : ${modules.length} modules`);

  // Établissement
  await ds.query(
    `INSERT INTO tenants (id, slug, nom, type, email, pays, statut, "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'CI', 'actif', NOW(), NOW())
     ON CONFLICT (slug) DO UPDATE SET nom = EXCLUDED.nom, statut = 'actif', "updatedAt" = NOW()`,
    [slug, d.nom, d.type, `contact@${slug}.santarex.ci`],
  );

  // Offre (la base de démo n'a pas forcément les offres) puis licence = modules de la formule
  await ds.query(
    `INSERT INTO offres_saas (id, code, nom, description, prix, cycle, "remiseAnnuelle", "maxUtilisateurs",
        "modulesInclus", fonctionnalites, "estVisible", "estMisEnAvant", ordre, "estActif", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'mensuel', 17, $5, $6, '[]', true, false, 1, true, NOW(), NOW())
     ON CONFLICT (code) DO UPDATE SET "modulesInclus" = EXCLUDED."modulesInclus", "updatedAt" = NOW()`,
    [d.code, d.code.charAt(0).toUpperCase() + d.code.slice(1), `Formule ${d.code}`, d.prix, d.maxUsers, JSON.stringify(modules)],
  );
  const offre = await ds.query('SELECT id FROM offres_saas WHERE code = $1', [d.code]);
  await ds.query('DELETE FROM licences WHERE "tenantSlug" = $1', [slug]);
  await ds.query(
    `INSERT INTO licences (id, cle, "tenantSlug", "offreId", "offreCode", statut, "dateDebut", "dateExpiration",
        "maxUtilisateurs", "modulesActivesJson", "montantPaye", "modePaiement", "joursEssai", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, 'active', NOW(), NOW() + INTERVAL '10 years',
        $5, $6, 0, 'gratuit', 30, NOW(), NOW())`,
    [`DEMO-${d.code.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`, slug, offre[0].id, d.code, d.maxUsers, JSON.stringify(modules)],
  );

  // Utilisateurs (mot de passe public de démonstration)
  const hash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const ids: Record<string, string> = {};
  for (const u of d.users) {
    const email = `${u.key}@${slug}.santarex.ci`;
    const ex = await ds.query('SELECT id FROM users WHERE email = $1', [email]);
    if (ex.length) {
      await ds.query('UPDATE users SET password = $2, "isActive" = true, "tenantId" = $3 WHERE id = $1', [ex[0].id, hash, slug]);
      ids[u.key] = ex[0].id;
      continue;
    }
    const r = await ds.query(
      `INSERT INTO users (email, password, "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) RETURNING id`,
      [email, hash, u.prenom, u.nom, u.role, slug],
    );
    ids[u.key] = r[0].id;
  }
  const adminId = ids['admin'];
  const medecinId = ids['medecin'] ?? ids['pharmacien'] ?? adminId;

  // Données adaptées aux modules de la formule
  const patientIds = await seedPatients(ds, adminId, slug, d.prefix);
  await seedMedicaments(ds, slug, d.prefix);
  if (d.consultations) {
    await seedConsultationsEtFactures(ds, patientIds, medecinId, slug, d.prefix);
    await seedLaboratoire(ds, patientIds, medecinId, slug, d.prefix).catch((e) => log(`  - laboratoire ignoré : ${e?.message ?? e}`));
  }
  if (!d.consultations) {
    await seedVentesPharmacie(ds, patientIds, adminId, slug, d.prefix).catch((e) => log(`  - ventes ignorées : ${e?.message ?? e}`));
  }
  if (d.hospitalisation) {
    const litIds = await seedLits(ds, slug, d.prefix);
    await seedSejours(ds, patientIds, litIds, medecinId, slug, d.prefix);
  }
  log(`  ✓ démo ${d.code} prête`);
}

async function seedDemosParFormule(ds: DataSource): Promise<void> {
  log('Génération des démos par formule...');
  for (const d of DEMOS) {
    try {
      await seedDemoFormule(ds, d);
    } catch (err) {
      log(`  ✗ démo ${d.code} ignorée : ${(err as Error)?.message ?? err}`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SANTAREX ERP — RESET démonstration publique');
  console.log(`  Base : ${process.env.DB_NAME ?? 'santarex_demo'}`);
  console.log(`  DEMO_MODE=${process.env.DEMO_MODE ?? '(non défini)'}`);
  console.log('═══════════════════════════════════════════════════\n');

  try {
    await AppDataSource.initialize();
    log('Connexion établie.\n');

    await purger(AppDataSource);
    console.log('');

    const userIds = await seedUsers(AppDataSource);
    const adminId = userIds['admin'] ?? Object.values(userIds)[0];
    const medecinId = userIds['medecinAmara'] ?? Object.values(userIds)[1] ?? adminId;

    const patientIds = await seedPatients(AppDataSource, adminId);
    await seedMedicaments(AppDataSource);
    const litIds = await seedLits(AppDataSource);
    await seedSejours(AppDataSource, patientIds, litIds, medecinId);
    await seedConsultationsEtFactures(AppDataSource, patientIds, medecinId);
    await seedLaboratoire(AppDataSource, patientIds, medecinId).catch((e) => log(`  - laboratoire ignoré : ${e?.message ?? e}`));
    await seedDemosParFormule(AppDataSource);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  Reset démo terminé avec succès.');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('Comptes de démonstration :');
    console.log('  Admin    : admin@clinique-saint-joseph.ci / Admin2025!');
    console.log('  Médecin  : dr.amara@clinique-saint-joseph.ci / Medecin2025!');
    console.log('  Caissier : celestine@clinique-saint-joseph.ci / Caissiere2025!\n');
  } catch (err) {
    console.error('[DEMO-RESET] ERREUR :', err);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void main();
