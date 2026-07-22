import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Vaccination (préfixe `vacc_`) et leurs types
 * enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * cohabite avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) → guillemets doubles.
 * Types reproduisent exactement `src/vaccination/entities/*.ts`.
 */
export class CreateVaccinationTables1750000002600 implements MigrationInterface {
  name = 'CreateVaccinationTables1750000002600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacc_vaccins_cible_enum') THEN
          CREATE TYPE "vacc_vaccins_cible_enum" AS ENUM ('enfant','adulte','tous');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacc_vaccinations_statut_enum') THEN
          CREATE TYPE "vacc_vaccinations_statut_enum" AS ENUM ('administre','rappel_du','en_retard');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacc_vaccinations_voie_enum') THEN
          CREATE TYPE "vacc_vaccinations_voie_enum" AS ENUM (
            'intramusculaire','sous_cutanee','intradermique','orale','nasale'
          );
        END IF;
      END $$;`);

    // ── vacc_vaccins (référentiel) ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vacc_vaccins" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code"            character varying NOT NULL,
        "nom"             character varying NOT NULL,
        "maladieCible"    character varying NOT NULL,
        "nbDoses"         integer NOT NULL DEFAULT 1,
        "intervalleJours" integer NOT NULL DEFAULT 0,
        "cible"           "vacc_vaccins_cible_enum" NOT NULL DEFAULT 'tous',
        "ageRecommande"   character varying,
        "estActif"        boolean NOT NULL DEFAULT true,
        "tenantId"        character varying NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vacc_vaccins" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccins_code" ON "vacc_vaccins" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccins_tenantId" ON "vacc_vaccins" ("tenantId")`,
    );

    // ── vacc_vaccinations (registre / carnet) ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vacc_vaccinations" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"          character varying NOT NULL,
        "vaccinId"           character varying NOT NULL,
        "doseNumero"         integer NOT NULL DEFAULT 1,
        "dateAdministration" TIMESTAMP WITH TIME ZONE NOT NULL,
        "lot"                character varying,
        "voie"               "vacc_vaccinations_voie_enum",
        "siteInjection"      character varying,
        "vaccinateurRef"     character varying,
        "dateRappelPrevue"   TIMESTAMP WITH TIME ZONE,
        "statut"             "vacc_vaccinations_statut_enum" NOT NULL DEFAULT 'administre',
        "aDeclarer"          boolean NOT NULL DEFAULT false,
        "notes"              text,
        "tenantId"           character varying NOT NULL,
        "createdById"        character varying,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vacc_vaccinations" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccinations_patientId" ON "vacc_vaccinations" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccinations_vaccinId" ON "vacc_vaccinations" ("vaccinId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccinations_tenantId" ON "vacc_vaccinations" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccinations_rappel" ON "vacc_vaccinations" ("dateRappelPrevue")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vacc_vaccinations_vaccinateur" ON "vacc_vaccinations" ("vaccinateurRef")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vacc_vaccinations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vacc_vaccins"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "vacc_vaccinations_voie_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vacc_vaccinations_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vacc_vaccins_cible_enum"`);
  }
}
