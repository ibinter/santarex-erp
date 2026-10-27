import { MigrationInterface, QueryRunner } from 'typeorm';
import { FORMULES } from '../../licences/formules';

/**
 * Recale le contenu de chaque formule sur la page de vente et la grille tarifaire
 * (voir licences/formules.ts). Avant : 12 des 15 modules « HÔPITAL+ » étaient
 * inclus dans des formules moins chères.
 *
 * Deux temps, dans cet ordre :
 *  1. Les LICENCES dont la liste de modules est encore celle d'origine de leur
 *     offre sont mises à jour. Une licence personnalisée à la main par le
 *     superadmin (liste différente) n'est PAS touchée.
 *  2. Les OFFRES reçoivent la nouvelle liste (les futures licences l'héritent).
 * Idempotente : rejouée, elle ne change plus rien.
 */
export class RealignOffresModules1750000005400 implements MigrationInterface {
  name = 'RealignOffresModules1750000005400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [code, modules] of Object.entries(FORMULES)) {
      const nouvelle = JSON.stringify(modules);

      // 1. Licences alignées sur l'ancienne liste de l'offre → nouvelle liste.
      await queryRunner.query(
        `UPDATE "licences" l
            SET "modulesActivesJson" = $2
          WHERE l."offreCode" = $1
            AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM "offres_saas" o WHERE o."code" = $1)
            AND l."modulesActivesJson" <> $2`,
        [code, nouvelle],
      );

      // 2. Offre.
      await queryRunner.query(
        `UPDATE "offres_saas" SET "modulesInclus" = $2, "updatedAt" = now() WHERE "code" = $1`,
        [code, nouvelle],
      );
    }

    // Descriptions commerciales cohérentes avec le nouveau contenu.
    const textes: Record<string, [string, string[]]> = {
      centre: [
        'Centre de santé : consultations, laboratoire, pharmacie et soins infirmiers.',
        ['Consultations, DME & laboratoire', 'Pharmacie de dispensation', 'Soins infirmiers & vaccination'],
      ],
      clinique: [
        'Clinique : hospitalisation, urgences, maternité, pédiatrie et assureurs.',
        ['Hospitalisation, urgences & plan des lits', 'Maternité, pédiatrie & soins infirmiers', 'Tiers-payant, prise en charge & gardes'],
      ],
      hopital: [
        'Établissement hospitalier complet : tous les modules inclus.',
        ['Bloc opératoire, imagerie & banque de sang', 'RH, comptabilité & multi-sites', 'Qualité, morgue, transport & déchets DASRI'],
      ],
    };
    for (const [code, [description, fonctionnalites]] of Object.entries(textes)) {
      await queryRunner.query(
        `UPDATE "offres_saas" SET "description" = $2, "fonctionnalites" = $3, "updatedAt" = now() WHERE "code" = $1`,
        [code, description, JSON.stringify(fonctionnalites)],
      );
    }
  }

  public async down(): Promise<void> {
    // Volontairement vide : l'ancien contenu des formules ne doit pas être rétabli.
  }
}
