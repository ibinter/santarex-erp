/**
 * Script de seed — Clinique Saint-Joseph
 * tenantId: 'clinique-saint-joseph'
 *
 * Exécution : npm run seed
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';

// ─── DataSource Bootstrap ────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'santarex',
  password: process.env.DB_PASSWORD ?? 'santarex_secure_password',
  database: process.env.DB_NAME ?? 'santarex_db',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
});

const TENANT_ID = 'clinique-saint-joseph';
const SALT_ROUNDS = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[SEED] ${msg}`);
}

function ipp(n: number): string {
  return `2025-${String(n).padStart(5, '0')}`;
}

function medCode(n: number): string {
  return `MED-${String(n).padStart(5, '0')}`;
}

// ─── Seed Users ──────────────────────────────────────────────────────────────

async function seedUsers(ds: DataSource): Promise<Record<string, string>> {
  log('Insertion des utilisateurs...');

  const usersData = [
    {
      email: 'admin@clinique-saint-joseph.ci',
      password: 'Admin2025!',
      firstName: 'Kouakou',
      lastName: 'Directeur',
      role: 'admin',
    },
    {
      email: 'dr.amara@clinique-saint-joseph.ci',
      password: 'Medecin2025!',
      firstName: 'Amara',
      lastName: 'Diallo',
      role: 'medecin',
    },
    {
      email: 'dr.koffi@clinique-saint-joseph.ci',
      password: 'Medecin2025!',
      firstName: 'Koffi',
      lastName: 'Mensah',
      role: 'medecin',
    },
    {
      email: 'fatoumata@clinique-saint-joseph.ci',
      password: 'Infirmiere2025!',
      firstName: 'Fatoumata',
      lastName: 'Koné',
      role: 'infirmier',
    },
    {
      email: 'celestine@clinique-saint-joseph.ci',
      password: 'Caissiere2025!',
      firstName: 'Célestine',
      lastName: 'Bamba',
      role: 'caissier',
    },
    {
      email: 'ahmed@clinique-saint-joseph.ci',
      password: 'Pharmacien2025!',
      firstName: 'Ahmed',
      lastName: 'Ben Salah',
      role: 'pharmacien',
    },
    {
      email: 'jean@clinique-saint-joseph.ci',
      password: 'Labo2025!',
      firstName: 'Jean',
      lastName: 'Kouassi',
      role: 'laborantin',
    },
  ];

  const ids: Record<string, string> = {};

  for (const u of usersData) {
    // Vérifier si l'utilisateur existe déjà
    const exists = await ds.query(
      'SELECT id FROM users WHERE email = $1',
      [u.email],
    );

    if (exists.length > 0) {
      log(`  - Utilisateur ${u.email} existe déjà, ignoré.`);
      ids[u.role === 'medecin' ? (u.firstName === 'Amara' ? 'medecinAmara' : 'medecinKoffi') : u.role] =
        exists[0].id;
      continue;
    }

    const hashedPwd = await bcrypt.hash(u.password, SALT_ROUNDS);
    const result = await ds.query(
      `INSERT INTO users (email, password, "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING id`,
      [u.email, hashedPwd, u.firstName, u.lastName, u.role, TENANT_ID],
    );
    const key =
      u.role === 'medecin'
        ? u.firstName === 'Amara'
          ? 'medecinAmara'
          : 'medecinKoffi'
        : u.role;
    ids[key] = result[0].id;
    log(`  ✓ ${u.firstName} ${u.lastName} (${u.role})`);
  }

  return ids;
}

// ─── Seed Patients ───────────────────────────────────────────────────────────

async function seedPatients(ds: DataSource, adminId: string): Promise<string[]> {
  log('Insertion des patients...');

  const patientsData = [
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

  const patientIds: string[] = [];

  for (let i = 0; i < patientsData.length; i++) {
    const p = patientsData[i];
    const ippVal = ipp(i + 1);

    const exists = await ds.query('SELECT id FROM patients WHERE ipp = $1', [ippVal]);
    if (exists.length > 0) {
      log(`  - Patient ${ippVal} existe déjà, ignoré.`);
      patientIds.push(exists[0].id);
      continue;
    }

    const result = await ds.query(
      `INSERT INTO patients (ipp, nom, prenom, "dateNaissance", sexe, telephone, ville, pays, "groupeSanguin", statut, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'CI', $8, 'actif', $9, $10, NOW(), NOW())
       RETURNING id`,
      [ippVal, p.nom, p.prenom, p.dateNaissance, p.sexe, p.tel, p.ville, p.gs, TENANT_ID, adminId],
    );
    patientIds.push(result[0].id);
    log(`  ✓ ${p.nom} ${p.prenom} (${ippVal})`);
  }

  return patientIds;
}

// ─── Seed Médicaments ────────────────────────────────────────────────────────

async function seedMedicaments(ds: DataSource): Promise<void> {
  log('Insertion des médicaments...');

  const meds = [
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
    { nom: 'Tenofovir/Emtricitabine', dosage: '300/200mg', forme: 'comprime', unite: 'comprimé', categorie: 'antiretroviral', stock: 5, seuil: 10, prix: 3500 },
    { nom: 'Fluconazole', dosage: '150mg', forme: 'gelule', unite: 'gélule', categorie: 'antibiotique', stock: 12, seuil: 15, prix: 800 },
    { nom: 'Furosémide', dosage: '40mg', forme: 'comprime', unite: 'comprimé', categorie: 'autre', stock: 200, seuil: 20, prix: 120 },
    { nom: 'Dexaméthasone', dosage: '4mg/ml', forme: 'injectable', unite: 'ampoule', categorie: 'autre', stock: 60, seuil: 10, prix: 450 },
  ];

  for (let i = 0; i < meds.length; i++) {
    const m = meds[i];
    const code = medCode(i + 1);

    const exists = await ds.query(
      'SELECT id FROM medicaments WHERE code = $1 AND "tenantId" = $2',
      [code, TENANT_ID],
    );
    if (exists.length > 0) {
      log(`  - Médicament ${code} existe déjà, ignoré.`);
      continue;
    }

    await ds.query(
      `INSERT INTO medicaments (code, nom, forme, dosage, unite, categorie, "stockActuel", "stockMinimum", "stockMaximum", "prixUnitaire", "prixVente", devise, "prescriptionRequise", "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 'XOF', false, true, $11, NOW(), NOW())`,
      [code, m.nom, m.forme, m.dosage, m.unite, m.categorie, m.stock, m.seuil, m.seuil * 20, m.prix, TENANT_ID],
    );
    const alerte = m.stock <= m.seuil ? ' ⚠ RUPTURE/ALERTE' : '';
    log(`  ✓ ${code} ${m.nom} ${m.dosage}${alerte}`);
  }
}

// ─── Seed Lits ───────────────────────────────────────────────────────────────

async function seedLits(ds: DataSource): Promise<Record<string, string>> {
  log('Insertion des lits...');

  const litsDefs: Array<{ numero: string; service: string; salle: string; statut: string }> = [];

  // Médecine générale (10 lits)
  const statutsMed = ['occupe', 'occupe', 'libre', 'libre', 'libre', 'libre', 'libre', 'libre', 'en_nettoyage', 'libre'];
  for (let i = 1; i <= 10; i++) {
    litsDefs.push({
      numero: `MED-10${i}`,
      service: 'medecine_generale',
      salle: `Salle ${Math.ceil(i / 2)}`,
      statut: statutsMed[i - 1],
    });
  }

  // Chirurgie (6 lits)
  const statutsChi = ['occupe', 'libre', 'libre', 'occupe', 'libre', 'en_nettoyage'];
  for (let i = 1; i <= 6; i++) {
    litsDefs.push({
      numero: `CHI-20${i}`,
      service: 'chirurgie',
      salle: `Bloc ${Math.ceil(i / 2)}`,
      statut: statutsChi[i - 1],
    });
  }

  // Maternité (4 lits)
  const statutsMat = ['occupe', 'libre', 'libre', 'occupe'];
  for (let i = 1; i <= 4; i++) {
    litsDefs.push({
      numero: `MAT-30${i}`,
      service: 'maternite',
      salle: 'Salle Maternité',
      statut: statutsMat[i - 1],
    });
  }

  const litIds: Record<string, string> = {};

  for (const l of litsDefs) {
    const exists = await ds.query(
      'SELECT id FROM lits WHERE numero = $1 AND "tenantId" = $2',
      [l.numero, TENANT_ID],
    );
    if (exists.length > 0) {
      log(`  - Lit ${l.numero} existe déjà, ignoré.`);
      litIds[l.numero] = exists[0].id;
      continue;
    }

    const result = await ds.query(
      `INSERT INTO lits (numero, service, salle, statut, "estActif", "tenantId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, true, $5, NOW(), NOW())
       RETURNING id`,
      [l.numero, l.service, l.salle, l.statut, TENANT_ID],
    );
    litIds[l.numero] = result[0].id;
    log(`  ✓ ${l.numero} (${l.service}) — ${l.statut}`);
  }

  return litIds;
}

// ─── Seed Séjours actifs ─────────────────────────────────────────────────────

async function seedSejours(
  ds: DataSource,
  patientIds: string[],
  litIds: Record<string, string>,
  userIds: Record<string, string>,
): Promise<void> {
  log('Insertion des séjours actifs...');

  const sejoursActifs = [
    { numero: 'HSP-2025-00001', patientIdx: 0, litNum: 'MED-101', service: 'medecine_generale', type: 'urgente', diagnostic: 'Paludisme grave', daysAgo: 3 },
    { numero: 'HSP-2025-00002', patientIdx: 1, litNum: 'MED-102', service: 'medecine_generale', type: 'programme', diagnostic: 'Diabète décompensé avec complications rénales', daysAgo: 5 },
    { numero: 'HSP-2025-00003', patientIdx: 3, litNum: 'CHI-201', service: 'chirurgie', type: 'programme', diagnostic: 'Appendicite aiguë — post-opératoire J1', daysAgo: 1 },
    { numero: 'HSP-2025-00004', patientIdx: 5, litNum: 'CHI-204', service: 'chirurgie', type: 'urgente', diagnostic: 'Fracture ouverte membre inférieur droit', daysAgo: 2 },
    { numero: 'HSP-2025-00005', patientIdx: 7, litNum: 'MAT-301', service: 'maternite', type: 'programme', diagnostic: 'Grossesse à terme — travail en cours', daysAgo: 0 },
    { numero: 'HSP-2025-00006', patientIdx: 9, litNum: 'MAT-304', service: 'maternite', type: 'urgente', diagnostic: 'Pré-éclampsie sévère', daysAgo: 1 },
  ];

  const medecinId = userIds['medecinAmara'] ?? userIds['medecin'] ?? Object.values(userIds)[1];

  for (const s of sejoursActifs) {
    const exists = await ds.query(
      'SELECT id FROM sejours WHERE numero = $1',
      [s.numero],
    );
    if (exists.length > 0) {
      log(`  - Séjour ${s.numero} existe déjà, ignoré.`);
      continue;
    }

    const dateAdmission = new Date();
    dateAdmission.setDate(dateAdmission.getDate() - s.daysAgo);
    dateAdmission.setHours(8, 30, 0, 0);

    const litId = litIds[s.litNum];
    if (!litId) {
      log(`  ⚠ Lit ${s.litNum} introuvable, séjour ignoré.`);
      continue;
    }

    const result = await ds.query(
      `INSERT INTO sejours (numero, "patientId", "litId", "medecinReferentId", service, type, "dateHeureAdmission", "diagnosticEntree", "typeSortie", statut, "tenantId", "createdById", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_cours', 'actif', $9, $10, NOW(), NOW())
       RETURNING id`,
      [
        s.numero,
        patientIds[s.patientIdx],
        litId,
        medecinId,
        s.service,
        s.type,
        dateAdmission.toISOString(),
        s.diagnostic,
        TENANT_ID,
        medecinId,
      ],
    );

    // Mettre à jour le lit avec sejourActuelId
    await ds.query(
      'UPDATE lits SET "sejourActuelId" = $1 WHERE id = $2',
      [result[0].id, litId],
    );

    log(`  ✓ ${s.numero} — ${s.diagnostic.substring(0, 40)}...`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  SANTAREX ERP — Script de seed');
  console.log('  Établissement : Clinique Saint-Joseph');
  console.log('  Tenant : clinique-saint-joseph');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    log('Connexion à la base de données...');
    await AppDataSource.initialize();
    log('Connexion établie.\n');

    // 1. Utilisateurs
    const userIds = await seedUsers(AppDataSource);
    console.log('');

    // 2. Patients
    const adminId = userIds['admin'] ?? Object.values(userIds)[0];
    const patientIds = await seedPatients(AppDataSource, adminId);
    console.log('');

    // 3. Médicaments
    await seedMedicaments(AppDataSource);
    console.log('');

    // 4. Lits
    const litIds = await seedLits(AppDataSource);
    console.log('');

    // 5. Séjours actifs
    await seedSejours(AppDataSource, patientIds, litIds, userIds);
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('  Seed terminé avec succès !');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Comptes de connexion :');
    console.log('  Admin    : admin@clinique-saint-joseph.ci / Admin2025!');
    console.log('  Médecin  : dr.amara@clinique-saint-joseph.ci / Medecin2025!');
    console.log('  Infirmier: fatoumata@clinique-saint-joseph.ci / Infirmiere2025!');
    console.log('  Caissier : celestine@clinique-saint-joseph.ci / Caissiere2025!');
    console.log('  Pharmacie: ahmed@clinique-saint-joseph.ci / Pharmacien2025!\n');

  } catch (err) {
    console.error('[SEED] ERREUR :', err);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
