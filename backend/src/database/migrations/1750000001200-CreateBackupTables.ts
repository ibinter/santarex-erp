import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table du module Sauvegardes (préfixe `backup_`) et ses types enum
 * Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) donc entre guillemets.
 * Reproduit exactement `src/sauvegardes/entities/sauvegarde.entity.ts`.
 */
export class CreateBackupTables1750000001200 implements MigrationInterface {
  name = 'CreateBackupTables1750000001200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_sauvegardes_type_enum') THEN
          CREATE TYPE "backup_sauvegardes_type_enum" AS ENUM ('manuelle','planifiee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'backup_sauvegardes_statut_enum') THEN
          CREATE TYPE "backup_sauvegardes_statut_enum" AS ENUM ('en_cours','reussie','echouee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "backup_sauvegardes" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"           character varying NOT NULL,
        "type"          "backup_sauvegardes_type_enum" NOT NULL DEFAULT 'manuelle',
        "statut"        "backup_sauvegardes_statut_enum" NOT NULL DEFAULT 'en_cours',
        "cheminFichier" text,
        "nomFichier"    character varying,
        "tailleOctets"  bigint,
        "checksum"      character varying(64),
        "initiateurId"  character varying,
        "erreur"        text,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "terminatedAt"  TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_backup_sauvegardes" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_backup_sauvegardes_statut" ON "backup_sauvegardes" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_backup_sauvegardes_initiateurId" ON "backup_sauvegardes" ("initiateurId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_backup_sauvegardes_createdAt" ON "backup_sauvegardes" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "backup_sauvegardes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "backup_sauvegardes_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "backup_sauvegardes_type_enum"`);
  }
}
