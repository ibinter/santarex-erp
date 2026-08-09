import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la valeur « decouverte » à l'énum Postgres `licences_statut_enum`,
 * requise pour persister une licence au palier gratuit « Découverte »
 * (cahier IBIG v1.1, §3). Idempotente via ADD VALUE IF NOT EXISTS.
 *
 * PostgreSQL 12+ autorise ADD VALUE dans une transaction tant que la nouvelle
 * valeur n'est pas utilisée dans la même transaction — ce qui est le cas ici.
 */
export class AddDecouverteLicenceStatut1750000005000
  implements MigrationInterface
{
  name = 'AddDecouverteLicenceStatut1750000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "licences_statut_enum" ADD VALUE IF NOT EXISTS 'decouverte'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL ne permet pas de retirer proprement une valeur d'énum ;
    // no-op volontaire (la valeur inutilisée reste sans effet).
  }
}
