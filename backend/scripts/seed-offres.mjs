/**
 * Seed des offres SaaS (page de vente / tarifs de la landing).
 *
 * Insère (idempotent, UPSERT sur `code`) un catalogue réaliste d'offres dans la
 * table `offres_saas`, lue publiquement par la landing via GET /offres-saas/public.
 *
 * Exécution (depuis backend/) :  node scripts/seed-offres.mjs
 * Variables lues : DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 * (mêmes valeurs par défaut que src/database/seed.ts).
 *
 * Prix en FCFA (entiers). `cycle` = 'mensuel' (le tarif annuel est dérivé côté
 * front à partir du prix mensuel + remiseAnnuelle). `modulesInclus` et
 * `fonctionnalites` sont stockés en JSON (colonnes text).
 */
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'santarex',
  password: process.env.DB_PASSWORD ?? 'santarex_secure_password',
  database: process.env.DB_NAME ?? 'santarex_db',
});

/** @type {Array<Record<string, any>>} */
const OFFRES = [
  {
    code: 'pharmacie',
    nom: 'Pharmacie',
    description: 'Pharmacie autonome : stocks, dispensation et facturation.',
    prix: 12000,
    cycle: 'mensuel',
    remiseAnnuelle: 17,
    maxUtilisateurs: 3,
    modulesInclus: ['pharmacie', 'facturation', 'paiements'],
    fonctionnalites: [
      'Gestion des stocks complète',
      'Dispensation sur ordonnance',
      'Alertes péremption & rupture',
      'Gestion des lots & traçabilité',
      'Facturation & Mobile Money',
      'Support WhatsApp 5j/7',
    ],
    estVisible: true,
    estMisEnAvant: false,
    ordre: 1,
  },
  {
    code: 'cabinet',
    nom: 'Cabinet',
    description: 'Cabinet médical : agenda, DME, consultations et facturation.',
    prix: 18000,
    cycle: 'mensuel',
    remiseAnnuelle: 17,
    maxUtilisateurs: 5,
    modulesInclus: ['patients', 'rendez-vous', 'consultations', 'facturation', 'paiements'],
    fonctionnalites: [
      "Jusqu'à 5 utilisateurs",
      'Patients & DME illimités',
      'Consultations & ordonnances CIM-10',
      'Rendez-vous & agenda médecin',
      'Facturation & Mobile Money',
      'Support WhatsApp 5j/7',
    ],
    estVisible: true,
    estMisEnAvant: false,
    ordre: 2,
  },
  {
    code: 'centre',
    nom: 'Centre',
    description: 'Centre de santé : patients, consultations, pharmacie et labo basique.',
    prix: 35000,
    cycle: 'mensuel',
    remiseAnnuelle: 17,
    maxUtilisateurs: 15,
    modulesInclus: ['patients', 'consultations', 'pharmacie', 'laboratoire', 'facturation'],
    fonctionnalites: [
      "Jusqu'à 15 utilisateurs",
      'Patients, DME & consultations',
      'Pharmacie de dispensation',
      'Laboratoire basique',
      'Facturation & reporting',
      'Déploiement en 48h · Support 6j/7',
    ],
    estVisible: true,
    estMisEnAvant: false,
    ordre: 3,
  },
  {
    code: 'clinique',
    nom: 'Clinique',
    description: 'Clinique & polyclinique : parcours de soins complet avec BI.',
    prix: 75000,
    cycle: 'mensuel',
    remiseAnnuelle: 17,
    maxUtilisateurs: 30,
    modulesInclus: [
      'patients', 'consultations', 'pharmacie', 'laboratoire',
      'hospitalisation', 'facturation', 'reporting',
    ],
    fonctionnalites: [
      "Jusqu'à 30 utilisateurs",
      'Patients, DME & consultations',
      'Pharmacie & gestion stocks',
      'Laboratoire & résultats',
      'Hospitalisation & plan des lits',
      'Dashboard BI & reporting',
      'Support 7j/7 prioritaire',
    ],
    estVisible: true,
    estMisEnAvant: true,
    ordre: 4,
  },
  {
    code: 'hopital',
    nom: 'Hôpital',
    description: 'Hôpital & groupe : les 12 modules, multi-sites, SLA 99,9%.',
    prix: 150000,
    cycle: 'mensuel',
    remiseAnnuelle: 17,
    maxUtilisateurs: 9999,
    modulesInclus: [
      'patients', 'consultations', 'pharmacie', 'laboratoire', 'hospitalisation',
      'urgences', 'bloc-operatoire', 'imagerie', 'rh', 'facturation',
      'reporting', 'comptabilite',
    ],
    fonctionnalites: [
      'Utilisateurs illimités',
      'Tous les 12 modules',
      'Urgences & bloc opératoire',
      'Imagerie médicale (PACS)',
      'Ressources humaines & paie',
      'Multi-sites & consolidation',
      'SLA 99,9% · Support 24/7',
      'Account manager dédié',
    ],
    estVisible: true,
    estMisEnAvant: false,
    ordre: 5,
  },
];

async function main() {
  await client.connect();
  console.log('→ Connexion PostgreSQL OK. Seed des offres SaaS…');

  let created = 0;
  let updated = 0;

  for (const o of OFFRES) {
    const res = await client.query(
      `INSERT INTO offres_saas
         ("code","nom","description","prix","cycle","remiseAnnuelle","maxUtilisateurs",
          "modulesInclus","fonctionnalites","estVisible","estMisEnAvant","ordre","estActif")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)
       ON CONFLICT ("code") DO UPDATE SET
         "nom" = EXCLUDED."nom",
         "description" = EXCLUDED."description",
         "prix" = EXCLUDED."prix",
         "cycle" = EXCLUDED."cycle",
         "remiseAnnuelle" = EXCLUDED."remiseAnnuelle",
         "maxUtilisateurs" = EXCLUDED."maxUtilisateurs",
         "modulesInclus" = EXCLUDED."modulesInclus",
         "fonctionnalites" = EXCLUDED."fonctionnalites",
         "estVisible" = EXCLUDED."estVisible",
         "estMisEnAvant" = EXCLUDED."estMisEnAvant",
         "ordre" = EXCLUDED."ordre",
         "estActif" = true,
         "updatedAt" = now()
       RETURNING (xmax = 0) AS inserted`,
      [
        o.code,
        o.nom,
        o.description,
        o.prix,
        o.cycle,
        o.remiseAnnuelle,
        o.maxUtilisateurs,
        JSON.stringify(o.modulesInclus),
        JSON.stringify(o.fonctionnalites),
        o.estVisible,
        o.estMisEnAvant,
        o.ordre,
      ],
    );
    if (res.rows[0]?.inserted) {
      created += 1;
      console.log(`  ✓ créé : ${o.code}`);
    } else {
      updated += 1;
      console.log(`  ↻ mis à jour : ${o.code}`);
    }
  }

  console.log(`✔ Terminé — ${created} créée(s), ${updated} mise(s) à jour.`);
}

main()
  .catch((err) => {
    console.error('x Echec du seed des offres :', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
