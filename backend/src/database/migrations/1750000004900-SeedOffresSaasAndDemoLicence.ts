import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed les 5 offres commerciales SaaS (Pharmacie ⊂ Cabinet ⊂ Centre ⊂ Clinique ⊂
 * Hôpital) avec leur `modulesInclus` (mapping formule → modules, CUMULATIF).
 *
 * POURQUOI c'est critique pour la mise en vente :
 *  - `AuthService.register()` démarre l'essai via `startTrial(slug, 'cabinet')`,
 *    qui fait `offresSaasService.findByCode('cabinet')`. Sans offre seedée,
 *    l'appel échoue → le tenant est créé SANS licence → l'entitlement tombe en
 *    fail-open « no-licence » → accès GRATUIT et ILLIMITÉ à tous les modules.
 *    Seeder les offres colmate cette fuite : chaque nouveau tenant reçoit une
 *    licence d'essai « cabinet » et `ModuleGuard` applique enfin la formule.
 *  - La page de vente (`GET /offres-saas/public`) et la console superadmin
 *    disposent enfin de données réelles (au lieu du fallback codé en dur).
 *
 * Les codes de `modulesInclus` correspondent 1:1 à `PREFIX_TO_MODULE`
 * (module.guard.ts) et à ce que `EntitlementService.parseModules` attend
 * (minuscules, tirets).
 *
 * 100 % idempotente : `INSERT … ON CONFLICT (code) DO NOTHING`. Ne réécrit PAS
 * une offre déjà personnalisée par l'admin. Met à jour la licence de la clinique
 * de démonstration pour lui accorder l'accès complet (client « hôpital »).
 */
export class SeedOffresSaasAndDemoLicence1750000004900
  implements MigrationInterface
{
  name = 'SeedOffresSaasAndDemoLicence1750000004900';

  // ── Mapping formule → modules (cumulatif) ────────────────────────────────
  private static readonly PHARMACIE = [
    'patients',
    'pharmacie',
    'approvisionnement',
    'facturation',
    'caisse-sessions',
    'paiements',
  ];

  private static readonly CABINET = [
    ...SeedOffresSaasAndDemoLicence1750000004900.PHARMACIE,
    'consultations',
    'dme',
    'rendez-vous',
    'laboratoire',
    'devis',
    'prise-en-charge',
    'tiers-payant',
    'messages-sortants',
    'satisfaction',
    'consentements',
  ];

  private static readonly CENTRE = [
    ...SeedOffresSaasAndDemoLicence1750000004900.CABINET,
    'hospitalisation',
    'urgences',
    'imagerie',
    'soins-infirmiers',
    'interactions-medicamenteuses',
    'vaccination',
    'equipements',
    'budget',
    'plannings-gardes',
    'incidents-qualite',
    'indicateurs-qualite',
    'declarations-sanitaires',
    'services-personnalises',
    'sites',
  ];

  private static readonly CLINIQUE = [
    ...SeedOffresSaasAndDemoLicence1750000004900.CENTRE,
    'bloc-operatoire',
    'maternite',
    'pediatrie',
    'comptabilite',
    'rh',
    'sterilisation',
    'banque-sang',
    'had',
  ];

  private static readonly HOPITAL = [
    ...SeedOffresSaasAndDemoLicence1750000004900.CLINIQUE,
    'morgue',
    'transport',
    'dechets-medicaux',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const J = (arr: string[]) => JSON.stringify(arr);

    const offres: Array<{
      code: string;
      nom: string;
      description: string;
      prix: number;
      maxUtilisateurs: number;
      modules: string[];
      fonctionnalites: string[];
      misEnAvant: boolean;
      ordre: number;
    }> = [
      {
        code: 'pharmacie',
        nom: 'Pharmacie',
        description: 'Officine et point de vente pharmaceutique.',
        prix: 12000,
        maxUtilisateurs: 3,
        modules: SeedOffresSaasAndDemoLicence1750000004900.PHARMACIE,
        fonctionnalites: [
          'Gestion de stock pharmaceutique',
          'Facturation & caisse',
          'Approvisionnement',
        ],
        misEnAvant: false,
        ordre: 1,
      },
      {
        code: 'cabinet',
        nom: 'Cabinet',
        description: 'Cabinet médical ou centre de consultation.',
        prix: 18000,
        maxUtilisateurs: 5,
        modules: SeedOffresSaasAndDemoLicence1750000004900.CABINET,
        fonctionnalites: [
          'Dossier patient & consultations',
          'Rendez-vous & ordonnances',
          'Laboratoire, devis & prise en charge',
        ],
        misEnAvant: false,
        ordre: 2,
      },
      {
        code: 'centre',
        nom: 'Centre de santé',
        description: "Centre de santé avec hospitalisation et plateau d'examens.",
        prix: 35000,
        maxUtilisateurs: 15,
        modules: SeedOffresSaasAndDemoLicence1750000004900.CENTRE,
        fonctionnalites: [
          'Hospitalisation & urgences',
          'Imagerie & soins infirmiers',
          'Qualité, budget & multi-site',
        ],
        misEnAvant: false,
        ordre: 3,
      },
      {
        code: 'clinique',
        nom: 'Clinique',
        description: 'Clinique polyvalente avec bloc opératoire et spécialités.',
        prix: 75000,
        maxUtilisateurs: 40,
        modules: SeedOffresSaasAndDemoLicence1750000004900.CLINIQUE,
        fonctionnalites: [
          'Bloc opératoire, maternité, pédiatrie',
          'Comptabilité SYSCOHADA & RH',
          'Stérilisation & banque de sang',
        ],
        misEnAvant: true,
        ordre: 4,
      },
      {
        code: 'hopital',
        nom: 'Hôpital',
        description: 'Établissement hospitalier complet, tous modules inclus.',
        prix: 150000,
        maxUtilisateurs: 999,
        modules: SeedOffresSaasAndDemoLicence1750000004900.HOPITAL,
        fonctionnalites: [
          'Tous les modules SANTAREX',
          'Morgue, transport & déchets DASRI',
          'Utilisateurs illimités',
        ],
        misEnAvant: false,
        ordre: 5,
      },
    ];

    for (const o of offres) {
      await queryRunner.query(
        `INSERT INTO "offres_saas"
           ("id","code","nom","description","prix","cycle","remiseAnnuelle",
            "maxUtilisateurs","modulesInclus","fonctionnalites","estVisible",
            "estMisEnAvant","ordre","estActif","createdAt","updatedAt")
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, 'mensuel', 17,
            $5, $6, $7, true, $8, $9, true, now(), now())
         ON CONFLICT ("code") DO NOTHING`,
        [
          o.code,
          o.nom,
          o.description,
          o.prix,
          o.maxUtilisateurs,
          J(o.modules),
          J(o.fonctionnalites),
          o.misEnAvant,
          o.ordre,
        ],
      );
    }

    // ── Clinique de démonstration = client « hôpital » : accès complet ───────
    // Évite que le nouvel enforcement ModuleGuard ne bloque la démo sur les
    // modules absents de son ancienne liste (14 modules).
    await queryRunner.query(
      `UPDATE "licences"
         SET "modulesActivesJson" = $1
       WHERE "tenantSlug" = 'clinique-saint-joseph'`,
      [J(SeedOffresSaasAndDemoLicence1750000004900.HOPITAL)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "offres_saas" WHERE "code" IN ('pharmacie','cabinet','centre','clinique','hopital')`,
    );
  }
}
