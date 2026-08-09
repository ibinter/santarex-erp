import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Modèle à 6 états de licence (cahier IBIG-LICENCE-UNIVERSEL v1.1, §2/§5.6/§9).
 *
 * 1) Ajoute la valeur « grace » à l'énum Postgres `licences_statut_enum`
 *    (période de grâce après échéance d'une licence ACTIVE).
 * 2) Ajoute les colonnes `dateFinGrace` et `datePurge` à la table `licences`
 *    (jalons du recalcul quotidien : GRACE → EXPIREE → purge).
 *
 * Entièrement idempotente (ADD VALUE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
 * PostgreSQL 12+ autorise ADD VALUE dans une transaction tant que la nouvelle
 * valeur n'est pas utilisée dans la même transaction — ce qui est le cas ici.
 */
export class AddGraceLicenceStatut1750000005100 implements MigrationInterface {
  name = 'AddGraceLicenceStatut1750000005100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "licences_statut_enum" ADD VALUE IF NOT EXISTS 'grace'`,
    );
    await queryRunner.query(
      `ALTER TABLE "licences" ADD COLUMN IF NOT EXISTS "dateFinGrace" TIMESTAMP, ADD COLUMN IF NOT EXISTS "datePurge" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "licences" DROP COLUMN IF EXISTS "datePurge", DROP COLUMN IF EXISTS "dateFinGrace"`,
    );
    // PostgreSQL ne permet pas de retirer proprement une valeur d'énum ;
    // la valeur « grace » inutilisée reste sans effet.
  }
}
