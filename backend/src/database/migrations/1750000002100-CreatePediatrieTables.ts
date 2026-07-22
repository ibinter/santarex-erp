import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 3 tables du module Pédiatrie (préfixe `ped_`) et leur type enum
 * Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enum créé via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut être rejouée sans
 * erreur et cohabite avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) → guillemets doubles.
 * Types (numeric, date, timestamptz, uuid_generate_v4) reproduisent
 * exactement `src/pediatrie/entities/*.ts`.
 */
export class CreatePediatrieTables1750000002100 implements MigrationInterface {
  name = 'CreatePediatrieTables1750000002100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Type enum (idempotent) ────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ped_vaccinations_statut_enum') THEN
          CREATE TYPE "ped_vaccinations_statut_enum" AS ENUM (
            'a_faire','fait','en_retard'
          );
        END IF;
      END $$;`);

    // ── ped_mesures_croissance ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ped_mesures_croissance" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"           character varying NOT NULL,
        "dateMesure"          date NOT NULL,
        "ageMois"             integer,
        "poidsKg"             numeric(6,3),
        "tailleCm"            numeric(6,2),
        "perimetreCranienCm"  numeric(6,2),
        "imc"                 numeric(6,2),
        "observations"        text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ped_mesures_croissance" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ped_mesures_patientId" ON "ped_mesures_croissance" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ped_mesures_tenantId" ON "ped_mesures_croissance" ("tenantId")`,
    );

    // ── ped_vaccinations ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ped_vaccinations" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"          character varying NOT NULL,
        "vaccin"             character varying NOT NULL,
        "dosePrevueAge"      character varying,
        "agePrevuSemaines"   integer,
        "datePrevue"         date,
        "dateAdministration" date,
        "lot"                character varying,
        "statut"             "ped_vaccinations_statut_enum" NOT NULL DEFAULT 'a_faire',
        "observations"       text,
        "tenantId"           character varying NOT NULL,
        "administrePar"      character varying,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ped_vaccinations" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ped_vaccinations_patientId" ON "ped_vaccinations" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ped_vaccinations_tenantId" ON "ped_vaccinations" ("tenantId")`,
    );

    // ── ped_calendrier_vaccinal ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ped_calendrier_vaccinal" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "vaccin"         character varying NOT NULL,
        "ageRecommande"  character varying NOT NULL,
        "ageSemaines"    integer NOT NULL DEFAULT 0,
        "maladieCible"   character varying,
        "ordre"          integer NOT NULL DEFAULT 0,
        "estActif"       boolean NOT NULL DEFAULT true,
        "tenantId"       character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ped_calendrier_vaccinal" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ped_calendrier_tenantId" ON "ped_calendrier_vaccinal" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ped_calendrier_vaccinal"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ped_vaccinations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ped_mesures_croissance"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "ped_vaccinations_statut_enum"`);
  }
}
