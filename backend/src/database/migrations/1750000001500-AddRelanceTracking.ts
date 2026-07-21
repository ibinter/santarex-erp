import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute le suivi d'idempotence des relances automatisées (cycle d'emails) :
 *   • crm_prospects  : `dateDerniereRelance`, `nbRelances`
 *   • offre_com_offres : `dateDerniereRelance`, `nbRelances`
 *
 * Ces colonnes permettent au scheduler CRM (CrmRelanceScheduler) de ne pas
 * renvoyer une relance en boucle : on mémorise la date du dernier envoi et un
 * compteur plafonné.
 *
 * 100 % idempotente (`ADD COLUMN IF NOT EXISTS`) : rejouable sans erreur et
 * compatible avec `synchronize:true` en développement.
 */
export class AddRelanceTracking1750000001500 implements MigrationInterface {
  name = 'AddRelanceTracking1750000001500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "crm_prospects" ADD COLUMN IF NOT EXISTS "dateDerniereRelance" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "crm_prospects" ADD COLUMN IF NOT EXISTS "nbRelances" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre_com_offres" ADD COLUMN IF NOT EXISTS "dateDerniereRelance" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre_com_offres" ADD COLUMN IF NOT EXISTS "nbRelances" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "offre_com_offres" DROP COLUMN IF EXISTS "nbRelances"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offre_com_offres" DROP COLUMN IF EXISTS "dateDerniereRelance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "crm_prospects" DROP COLUMN IF EXISTS "nbRelances"`,
    );
    await queryRunner.query(
      `ALTER TABLE "crm_prospects" DROP COLUMN IF EXISTS "dateDerniereRelance"`,
    );
  }
}
