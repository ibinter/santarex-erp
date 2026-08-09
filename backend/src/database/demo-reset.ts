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

async function seedPatients(ds: DataSource, adminId: string): Promise<string[]> {
  log('Reseed des patients fictifs...');
  const ids: string[] = [];
  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const ippVal = ipp(i + 1);
    const result = await ds.query(
      `INSERT INTO patients (ipp, nom, prenom, "dateNaissance", sexe, telephone, ville, pays, "groupeSanguin", statut, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'CI', $8, 'actif', $9, $10, NOW(), NOW()) RETURNING id`,
      [ippVal, p.nom, p.prenom, p.dateNaissance, p.sexe, p.tel, p.ville, p.gs, TENANT_ID, adminId],
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

async function seedMedicaments(ds: DataSource): Promise<void> {
  log('Reseed du catalogue pharmacie...');
  for (let i = 0; i < MEDS.length; i++) {
    const m = MEDS[i];
    const code = medCode(i + 1);
    await ds.query(
      `INSERT INTO medicaments (code, nom, forme, dosage, unite, categorie, "stockActuel", "stockMinimum", "stockMaximum", "prixUnitaire", "prixVente", devise, "prescriptionRequise", "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 'XOF', false, true, $11, NOW(), NOW())`,
      [code, m.nom, m.forme, m.dosage, m.unite, m.categorie, m.stock, m.seuil, m.seuil * 20, m.prix, TENANT_ID],
    );
  }
  log(`  ✓ ${MEDS.length} médicaments`);
}

// ─── 2d. Lits ─────────────────────────────────────────────────────────────────

async function seedLits(ds: DataSource): Promise<Record<string, string>> {
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
      [l.numero, l.service, l.salle, l.statut, TENANT_ID],
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
      [s.numero, patientIds[s.patientIdx], litId, medecinId, s.service, s.type, dateAdmission.toISOString(), s.diagnostic, TENANT_ID, medecinId],
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
): Promise<void> {
  log('Reseed de consultations et factures de démonstration...');

  const consultations = [
    { patientIdx: 2, type: 'consultation_generale', motif: 'Fièvre et céphalées depuis 3 jours', diagnostic: 'Paludisme simple', ta: '120/80', fc: 88, temp: 38.6, montant: 15000, daysAgo: 2 },
    { patientIdx: 4, type: 'suivi', motif: 'Suivi hypertension artérielle', diagnostic: 'HTA équilibrée sous traitement', ta: '135/85', fc: 76, temp: 36.8, montant: 10000, daysAgo: 4 },
    { patientIdx: 6, type: 'specialite', motif: 'Douleurs abdominales chroniques', diagnostic: 'Gastrite chronique', ta: '118/78', fc: 72, temp: 37.0, montant: 20000, daysAgo: 1 },
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
      [patientId, medecinId, dateHeure.toISOString(), c.type, c.motif, c.ta, c.fc, c.temp, c.diagnostic, 'Traitement prescrit, contrôle si aggravation.', TENANT_ID],
    );
    const consultationId = consult[0].id;

    const numero = `FACT-2025-${String(factureSeq++).padStart(5, '0')}`;
    const ttc = c.montant;
    const facture = await ds.query(
      `INSERT INTO factures (numero, "patientId", "consultationId", "dateEmission", statut, "montantHT", "tauxTVA", "montantTVA", "montantTTC", "montantPaye", "montantRestant", "partPatient", devise, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'payee', $5, 0, 0, $5, $5, 0, $5, 'XOF', $6, $7, NOW(), NOW()) RETURNING id`,
      [numero, patientId, consultationId, dateHeure.toISOString(), ttc, TENANT_ID, medecinId],
    );

    // Ligne de facture (best-effort : le schéma peut varier).
    try {
      await ds.query(
        `INSERT INTO lignes_facture ("factureId", type, libelle, quantite, "prixUnitaire", "remisePourcent", "montantTotal", "tenantId")
         VALUES ($1, 'consultation', $2, 1, $3, 0, $3, $4)`,
        [facture[0].id, `Consultation — ${c.diagnostic}`, ttc, TENANT_ID],
      );
    } catch (err) {
      log(`  - ligne_facture ignorée (${numero}) : ${(err as Error)?.message ?? err}`);
    }
  }
  log(`  ✓ ${consultations.length} consultations + factures`);
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
