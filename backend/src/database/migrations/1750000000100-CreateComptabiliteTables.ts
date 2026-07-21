import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 3 tables du module de comptabilité SYSCOHADA (préfixe `compta_`)
 * et leurs types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT
 * EXISTS`, enums via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut
 * être rejouée sans erreur et cohabite avec `synchronize:true` en dev.
 *
 * Colonnes en camelCase (stratégie de nommage TypeORM par défaut), donc entre
 * guillemets doubles. Reproduit les entités `src/comptabilite/entities/*.ts`.
 */
export class CreateComptabiliteTables1750000000100
  implements MigrationInterface
{
  name = 'CreateComptabiliteTables1750000000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compta_comptes_type_enum') THEN
          CREATE TYPE "compta_comptes_type_enum" AS ENUM (
            'actif','passif','charge','produit','tresorerie'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compta_ecritures_statut_enum') THEN
          CREATE TYPE "compta_ecritures_statut_enum" AS ENUM (
            'brouillon','validee'
          );
        END IF;
      END $$;`);

    // ── compta_comptes ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compta_comptes" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"    character varying NOT NULL,
        "libelle"   character varying NOT NULL,
        "classe"    integer NOT NULL,
        "type"      "compta_comptes_type_enum" NOT NULL,
        "tenantId"  character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compta_comptes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_compta_comptes_tenant_numero" UNIQUE ("tenantId", "numero")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compta_comptes_tenantId" ON "compta_comptes" ("tenantId")`,
    );

    // ── compta_ecritures ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compta_ecritures" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"      character varying NOT NULL,
        "date"        TIMESTAMP NOT NULL DEFAULT now(),
        "journal"     character varying NOT NULL DEFAULT 'OD',
        "libelle"     character varying NOT NULL,
        "reference"   character varying,
        "statut"      "compta_ecritures_statut_enum" NOT NULL DEFAULT 'brouillon',
        "tenantId"    character varying NOT NULL,
        "createdById" character varying,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_compta_ecritures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_compta_ecritures_tenant_numero" UNIQUE ("tenantId", "numero")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compta_ecritures_tenantId" ON "compta_ecritures" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compta_ecritures_journal" ON "compta_ecritures" ("journal")`,
    );

    // ── compta_lignes ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "compta_lignes" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ecritureId"   uuid NOT NULL,
        "compteNumero" character varying NOT NULL,
        "libelle"      character varying NOT NULL,
        "debit"        numeric(14,2) NOT NULL DEFAULT 0,
        "credit"       numeric(14,2) NOT NULL DEFAULT 0,
        "tenantId"     character varying NOT NULL,
        CONSTRAINT "PK_compta_lignes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_compta_lignes_ecriture" FOREIGN KEY ("ecritureId")
          REFERENCES "compta_ecritures" ("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compta_lignes_ecritureId" ON "compta_lignes" ("ecritureId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_compta_lignes_compteNumero" ON "compta_lignes" ("compteNumero")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "compta_lignes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compta_ecritures"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "compta_comptes"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "compta_ecritures_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "compta_comptes_type_enum"`);
  }
}
