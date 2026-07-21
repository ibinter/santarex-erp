import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 3 tables du module Imagerie (préfixe `img_`) et leurs types enum
 * Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums créés via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut donc être rejouée sans
 * erreur et cohabite avec `synchronize:true` en développement.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut) donc entre
 * guillemets doubles. Types (jsonb, timestamptz, uuid_generate_v4) et DEFAULT
 * reproduisent exactement `src/imagerie/entities/*.ts`.
 */
export class CreateImagerieTables1750000000400 implements MigrationInterface {
  name = 'CreateImagerieTables1750000000400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'img_types_examen_modalite_enum') THEN
          CREATE TYPE "img_types_examen_modalite_enum" AS ENUM (
            'radio','scanner','irm','echo','mammographie','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'img_demandes_modalite_enum') THEN
          CREATE TYPE "img_demandes_modalite_enum" AS ENUM (
            'radio','scanner','irm','echo','mammographie','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'img_demandes_statut_enum') THEN
          CREATE TYPE "img_demandes_statut_enum" AS ENUM (
            'en_attente','en_cours','termine','valide','annule'
          );
        END IF;
      END $$;`);

    // ── img_types_examen ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "img_types_examen" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code"                  character varying NOT NULL,
        "nom"                   character varying NOT NULL,
        "modalite"              "img_types_examen_modalite_enum" NOT NULL,
        "regionAnatomique"      character varying,
        "prixUnitaire"          numeric(10,2) NOT NULL DEFAULT 0,
        "delaiResultatsHeures"  integer NOT NULL DEFAULT 24,
        "instructions"          text,
        "estActif"              boolean NOT NULL DEFAULT true,
        "tenantId"              character varying NOT NULL,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_img_types_examen" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_types_examen_code" ON "img_types_examen" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_types_examen_tenantId" ON "img_types_examen" ("tenantId")`,
    );

    // ── img_demandes ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "img_demandes" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"                 character varying NOT NULL,
        "patientId"              character varying NOT NULL,
        "medecinPrescripteurId"  character varying NOT NULL,
        "typeExamenId"           character varying NOT NULL,
        "modalite"               "img_demandes_modalite_enum" NOT NULL,
        "regionAnatomique"       character varying,
        "urgence"                boolean NOT NULL DEFAULT false,
        "statut"                 "img_demandes_statut_enum" NOT NULL DEFAULT 'en_attente',
        "dateHeureDemande"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "indicationClinique"     text,
        "notes"                  text,
        "tenantId"               character varying NOT NULL,
        "createdById"            character varying NOT NULL,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_img_demandes" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_demandes_numero" ON "img_demandes" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_demandes_patientId" ON "img_demandes" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_demandes_medecinPrescripteurId" ON "img_demandes" ("medecinPrescripteurId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_demandes_typeExamenId" ON "img_demandes" ("typeExamenId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_demandes_tenantId" ON "img_demandes" ("tenantId")`,
    );

    // ── img_resultats ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "img_resultats" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "demandeId"      character varying NOT NULL,
        "patientId"      character varying NOT NULL,
        "compteRendu"    text,
        "conclusion"     text,
        "imagesUrls"     jsonb NOT NULL DEFAULT '[]',
        "radiologueId"   character varying,
        "dateValidation" TIMESTAMP WITH TIME ZONE,
        "tenantId"       character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_img_resultats" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_resultats_demandeId" ON "img_resultats" ("demandeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_resultats_patientId" ON "img_resultats" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_img_resultats_tenantId" ON "img_resultats" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "img_resultats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "img_demandes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "img_types_examen"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "img_demandes_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "img_demandes_modalite_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "img_types_examen_modalite_enum"`);
  }
}
