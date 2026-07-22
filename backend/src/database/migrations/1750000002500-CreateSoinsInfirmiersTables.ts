import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module SOINS INFIRMIERS / DOSSIER DE SOINS.
 * Crée 4 tables : transmissions ciblées (DAR), plans de soins, actes de soin
 * (feuille de soins) et évaluations de douleur (EVA/EN/CPOT/EVENDOL).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 */
export class CreateSoinsInfirmiersTables1750000002500
  implements MigrationInterface
{
  name = 'CreateSoinsInfirmiersTables1750000002500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'soins_plans_statut_enum') THEN
          CREATE TYPE "soins_plans_statut_enum" AS ENUM ('actif','atteint','arrete');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'soins_actes_type_enum') THEN
          CREATE TYPE "soins_actes_type_enum" AS ENUM (
            'pansement','injection','perfusion','toilette','prelevement','surveillance','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'soins_evaluations_douleur_echelle_enum') THEN
          CREATE TYPE "soins_evaluations_douleur_echelle_enum" AS ENUM ('EVA','EN','CPOT','EVENDOL');
        END IF;
      END $$;`);

    // ── soins_transmissions_ciblees ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soins_transmissions_ciblees" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"    character varying NOT NULL,
        "sejourId"     character varying,
        "date"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "cible"        text NOT NULL,
        "donnees"      text,
        "actions"      text,
        "resultats"    text,
        "infirmierRef" character varying NOT NULL,
        "tenantId"     character varying NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_soins_transmissions_ciblees" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_transmissions_tenantId" ON "soins_transmissions_ciblees" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_transmissions_patientId" ON "soins_transmissions_ciblees" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_transmissions_sejourId" ON "soins_transmissions_ciblees" ("sejourId")`,
    );

    // ── soins_plans ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soins_plans" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"     character varying NOT NULL,
        "sejourId"      character varying,
        "diagnostic"    text NOT NULL,
        "objectif"      text NOT NULL,
        "interventions" text,
        "echeance"      TIMESTAMP WITH TIME ZONE,
        "statut"        "soins_plans_statut_enum" NOT NULL DEFAULT 'actif',
        "infirmierRef"  character varying NOT NULL,
        "tenantId"      character varying NOT NULL,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_soins_plans" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_plans_tenantId" ON "soins_plans" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_plans_patientId" ON "soins_plans" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_plans_sejourId" ON "soins_plans" ("sejourId")`,
    );

    // ── soins_actes ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soins_actes" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"    character varying NOT NULL,
        "sejourId"     character varying,
        "date"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "type"         "soins_actes_type_enum" NOT NULL DEFAULT 'autre',
        "description"  text NOT NULL,
        "realise"      boolean NOT NULL DEFAULT false,
        "infirmierRef" character varying NOT NULL,
        "tenantId"     character varying NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_soins_actes" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_actes_tenantId" ON "soins_actes" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_actes_patientId" ON "soins_actes" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_actes_sejourId" ON "soins_actes" ("sejourId")`,
    );

    // ── soins_evaluations_douleur ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soins_evaluations_douleur" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"            character varying NOT NULL,
        "sejourId"             character varying,
        "date"                 TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "echelle"              "soins_evaluations_douleur_echelle_enum" NOT NULL DEFAULT 'EVA',
        "score"                integer NOT NULL,
        "localisation"         character varying,
        "traitementAdministre" text,
        "reevaluation"         TIMESTAMP WITH TIME ZONE,
        "infirmierRef"         character varying NOT NULL,
        "tenantId"             character varying NOT NULL,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_soins_evaluations_douleur" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_douleur_tenantId" ON "soins_evaluations_douleur" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_douleur_patientId" ON "soins_evaluations_douleur" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_soins_douleur_sejourId" ON "soins_evaluations_douleur" ("sejourId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "soins_evaluations_douleur"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "soins_actes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "soins_plans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "soins_transmissions_ciblees"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "soins_evaluations_douleur_echelle_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "soins_actes_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "soins_plans_statut_enum"`);
  }
}
