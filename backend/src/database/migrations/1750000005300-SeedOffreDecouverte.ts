import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Offre technique « Découverte » (palier gratuit, cahier IBIG v1.1 §3).
 * NÉCESSAIRE car `licences.offreId/offreCode` sont NON NULL (FK vers
 * offres_saas) : une licence Découverte doit référencer une offre réelle.
 *
 * estVisible=false : n'apparaît PAS dans la grille tarifaire publique
 * (/offres-saas/public) — la carte Découverte de la vitrine est autonome.
 * modulesInclus = fonctions de base (= LICENCE_CONFIG.gratuit.modules).
 * Idempotente : ON CONFLICT (code) DO NOTHING.
 */
export class SeedOffreDecouverte1750000005300 implements MigrationInterface {
  name = 'SeedOffreDecouverte1750000005300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    const modules = JSON.stringify([
      'patients',
      'consultations',
      'dme',
      'rendez-vous',
      'facturation',
      'caisse-sessions',
      'pharmacie',
    ]);
    await queryRunner.query(
      `INSERT INTO "offres_saas"
         ("id","code","nom","description","prix","cycle","remiseAnnuelle",
          "maxUtilisateurs","modulesInclus","fonctionnalites","estVisible",
          "estMisEnAvant","ordre","estActif","createdAt","updatedAt")
       VALUES
         (uuid_generate_v4(), 'decouverte', 'Découverte',
          'Palier gratuit à vie, plafonné à 10 patients.', 0, 'mensuel', 0,
          1, $1, '["1 utilisateur","Fonctions de base","10 patients"]', false,
          false, 0, true, now(), now())
       ON CONFLICT ("code") DO NOTHING`,
      [modules],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "offres_saas" WHERE "code" = 'decouverte'`);
  }
}
