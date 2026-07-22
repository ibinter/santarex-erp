import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 5 tables du module Maternité / Obstétrique (préfixe `mat_`) et leurs
 * types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums
 * créés via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut donc être
 * rejouée sans erreur et cohabite avec `synchronize:true` en développement.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut) donc entre
 * guillemets doubles. Types (numeric, timestamptz, uuid_generate_v4) et DEFAULT
 * reproduisent exactement `src/maternite/entities/*.ts`.
 */
export class CreateMaterniteTables1750000001600 implements MigrationInterface {
  name = 'CreateMaterniteTables1750000001600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mat_dossiers_grossesse_rhesus_enum') THEN
          CREATE TYPE "mat_dossiers_grossesse_rhesus_enum" AS ENUM ('positif','negatif');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mat_dossiers_grossesse_statut_enum') THEN
          CREATE TYPE "mat_dossiers_grossesse_statut_enum" AS ENUM ('en_cours','terminee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mat_accouchements_mode_enum') THEN
          CREATE TYPE "mat_accouchements_mode_enum" AS ENUM ('voie_basse','cesarienne','instrumental');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mat_accouchements_sexenouveaune_enum') THEN
          CREATE TYPE "mat_accouchements_sexenouveaune_enum" AS ENUM ('masculin','feminin');
        END IF;
      END $$;`);

    // ── mat_dossiers_grossesse ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mat_dossiers_grossesse" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"           character varying NOT NULL,
        "patientId"        character varying NOT NULL,
        "ddr"              date NOT NULL,
        "dpa"              date,
        "gestite"          integer NOT NULL DEFAULT 1,
        "parite"           integer NOT NULL DEFAULT 0,
        "avortements"      integer NOT NULL DEFAULT 0,
        "groupeSanguin"    character varying,
        "rhesus"           "mat_dossiers_grossesse_rhesus_enum",
        "antecedents"      text,
        "grossesseARisque" boolean NOT NULL DEFAULT false,
        "motifRisque"      text,
        "statut"           "mat_dossiers_grossesse_statut_enum" NOT NULL DEFAULT 'en_cours',
        "notes"            text,
        "tenantId"         character varying NOT NULL,
        "createdById"      character varying NOT NULL,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mat_dossiers_grossesse" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_dossiers_numero" ON "mat_dossiers_grossesse" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_dossiers_patientId" ON "mat_dossiers_grossesse" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_dossiers_tenantId" ON "mat_dossiers_grossesse" ("tenantId")`,
    );

    // ── mat_consultations_prenatales ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mat_consultations_prenatales" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dossierId"         character varying NOT NULL,
        "date"              date NOT NULL,
        "termeSA"           integer,
        "poids"             numeric(5,2),
        "tensionArterielle" character varying,
        "hauteurUterine"    numeric(4,1),
        "bruitsCoeurFoetal" integer,
        "oedemes"           boolean NOT NULL DEFAULT false,
        "albuminurie"       character varying,
        "glycosurie"        character varying,
        "observations"      text,
        "tenantId"          character varying NOT NULL,
        "createdById"       character varying NOT NULL,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mat_consultations_prenatales" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_cpn_dossierId" ON "mat_consultations_prenatales" ("dossierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_cpn_tenantId" ON "mat_consultations_prenatales" ("tenantId")`,
    );

    // ── mat_accouchements ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mat_accouchements" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dossierId"      character varying NOT NULL,
        "dateHeure"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "mode"           "mat_accouchements_mode_enum" NOT NULL DEFAULT 'voie_basse',
        "presentation"   character varying,
        "delivrance"     character varying,
        "etatPerinee"    character varying,
        "sexeNouveauNe"  "mat_accouchements_sexenouveaune_enum",
        "poidsNouveauNe" integer,
        "apgar1"         integer,
        "apgar5"         integer,
        "complications"  text,
        "tenantId"       character varying NOT NULL,
        "createdById"    character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mat_accouchements" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_accouchements_dossierId" ON "mat_accouchements" ("dossierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_accouchements_tenantId" ON "mat_accouchements" ("tenantId")`,
    );

    // ── mat_surveillances_travail (partogramme) ───────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mat_surveillances_travail" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dossierId"              character varying NOT NULL,
        "accouchementId"         character varying,
        "heure"                  TIMESTAMP WITH TIME ZONE NOT NULL,
        "dilatationCol"          integer,
        "descentePresentation"   character varying,
        "frequenceContractions"  integer,
        "rythmeCardiaqueFoetal"  integer,
        "observations"           text,
        "tenantId"               character varying NOT NULL,
        "createdById"            character varying NOT NULL,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mat_surveillances_travail" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_surveillances_dossierId" ON "mat_surveillances_travail" ("dossierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_surveillances_accouchementId" ON "mat_surveillances_travail" ("accouchementId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_surveillances_tenantId" ON "mat_surveillances_travail" ("tenantId")`,
    );

    // ── mat_suivis_postnatal ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mat_suivis_postnatal" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dossierId"         character varying NOT NULL,
        "date"              date NOT NULL,
        "etatMere"          text,
        "involutionUterine" character varying,
        "allaitement"       character varying,
        "etatNouveauNe"     text,
        "vaccinationBCG"    boolean NOT NULL DEFAULT false,
        "vaccinationPolio"  boolean NOT NULL DEFAULT false,
        "observations"      text,
        "tenantId"          character varying NOT NULL,
        "createdById"       character varying NOT NULL,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mat_suivis_postnatal" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_postnatal_dossierId" ON "mat_suivis_postnatal" ("dossierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mat_postnatal_tenantId" ON "mat_suivis_postnatal" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mat_suivis_postnatal"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mat_surveillances_travail"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mat_accouchements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mat_consultations_prenatales"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mat_dossiers_grossesse"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "mat_accouchements_sexenouveaune_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mat_accouchements_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mat_dossiers_grossesse_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mat_dossiers_grossesse_rhesus_enum"`);
  }
}
