import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module MORGUE / GESTION DES DÉCÈS.
 * Crée 3 tables : registre des décès (`morgue_deces`), référentiel des
 * emplacements de chambre froide (`morgue_casiers`) et séjours en chambre
 * froide avec remise de corps (`morgue_sejours`).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 */
export class CreateMorgueTables1750000002800 implements MigrationInterface {
  name = 'CreateMorgueTables1750000002800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'morgue_deces_defuntsexe_enum') THEN
          CREATE TYPE "morgue_deces_defuntsexe_enum" AS ENUM ('M','F','indetermine');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'morgue_deces_lieudeces_enum') THEN
          CREATE TYPE "morgue_deces_lieudeces_enum" AS ENUM ('service','domicile','arrivee','autre');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'morgue_casiers_statut_enum') THEN
          CREATE TYPE "morgue_casiers_statut_enum" AS ENUM ('libre','occupe','maintenance');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'morgue_sejours_statut_enum') THEN
          CREATE TYPE "morgue_sejours_statut_enum" AS ENUM ('en_chambre','remis');
        END IF;
      END $$;`);

    // ── morgue_deces ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "morgue_deces" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"               character varying NOT NULL,
        "patientId"            character varying,
        "defuntNom"            character varying NOT NULL,
        "defuntPrenom"         character varying NOT NULL,
        "defuntSexe"           "morgue_deces_defuntsexe_enum" NOT NULL DEFAULT 'indetermine',
        "defuntAge"            integer,
        "dateHeureDeces"       TIMESTAMP NOT NULL,
        "lieuDeces"            "morgue_deces_lieudeces_enum" NOT NULL DEFAULT 'service',
        "causeDeces"           text,
        "medecinConstatantRef" character varying,
        "certificatEmis"       boolean NOT NULL DEFAULT false,
        "numeroCertificat"     character varying,
        "tenantId"             character varying NOT NULL,
        "createdById"          character varying,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_morgue_deces" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_deces_tenantId" ON "morgue_deces" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_deces_patientId" ON "morgue_deces" ("patientId")`,
    );

    // ── morgue_casiers ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "morgue_casiers" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"          character varying NOT NULL,
        "description"     character varying,
        "statut"          "morgue_casiers_statut_enum" NOT NULL DEFAULT 'libre',
        "sejourActuelId"  character varying,
        "estActif"        boolean NOT NULL DEFAULT true,
        "tenantId"        character varying NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_morgue_casiers" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_casiers_tenantId" ON "morgue_casiers" ("tenantId")`,
    );

    // ── morgue_sejours ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "morgue_sejours" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "decesId"              character varying NOT NULL,
        "casierId"             character varying NOT NULL,
        "dateEntree"           TIMESTAMP NOT NULL,
        "dateSortie"           TIMESTAMP,
        "statut"               "morgue_sejours_statut_enum" NOT NULL DEFAULT 'en_chambre',
        "tarifJournalier"      numeric(12,2) NOT NULL DEFAULT 0,
        "fraisConservation"    numeric(12,2),
        "personneRemiseNom"    character varying,
        "personneRemiseLien"   character varying,
        "personneRemisePiece"  character varying,
        "agentRef"             character varying,
        "tenantId"             character varying NOT NULL,
        "createdById"          character varying,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_morgue_sejours" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_sejours_tenantId" ON "morgue_sejours" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_sejours_decesId" ON "morgue_sejours" ("decesId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_morgue_sejours_casierId" ON "morgue_sejours" ("casierId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "morgue_sejours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "morgue_casiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "morgue_deces"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "morgue_sejours_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "morgue_casiers_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "morgue_deces_lieudeces_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "morgue_deces_defuntsexe_enum"`);
  }
}
