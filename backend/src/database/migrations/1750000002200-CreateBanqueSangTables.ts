import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Banque de sang (préfixe `bs_`) et leurs types
 * enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums créés
 * via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur
 * et compatible avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) donc entre guillemets
 * doubles. Noms des types enum = `{table}_{colonne}_enum` en minuscules, ce qui
 * reproduit la convention TypeORM afin d'éviter toute recréation.
 */
export class CreateBanqueSangTables1750000002200 implements MigrationInterface {
  name = 'CreateBanqueSangTables1750000002200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_poches_sang_groupe_enum') THEN
          CREATE TYPE "bs_poches_sang_groupe_enum" AS ENUM ('A','B','AB','O');
        END IF;
      END $$;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_poches_sang_rhesus_enum') THEN
          CREATE TYPE "bs_poches_sang_rhesus_enum" AS ENUM ('+','-');
        END IF;
      END $$;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_poches_sang_typeproduit_enum') THEN
          CREATE TYPE "bs_poches_sang_typeproduit_enum" AS ENUM ('sang_total','CGR','plasma','plaquettes');
        END IF;
      END $$;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_poches_sang_statut_enum') THEN
          CREATE TYPE "bs_poches_sang_statut_enum" AS ENUM ('disponible','reservee','transfusee','perimee','detruite');
        END IF;
      END $$;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_transfusions_grouppatient_enum') THEN
          CREATE TYPE "bs_transfusions_grouppatient_enum" AS ENUM ('A','B','AB','O');
        END IF;
      END $$;`);
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bs_transfusions_rhesuspatient_enum') THEN
          CREATE TYPE "bs_transfusions_rhesuspatient_enum" AS ENUM ('+','-');
        END IF;
      END $$;`);

    // ── bs_poches_sang ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bs_poches_sang" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"          character varying NOT NULL,
        "groupe"          "bs_poches_sang_groupe_enum" NOT NULL,
        "rhesus"          "bs_poches_sang_rhesus_enum" NOT NULL,
        "typeProduit"     "bs_poches_sang_typeproduit_enum" NOT NULL DEFAULT 'CGR',
        "volumeMl"        integer NOT NULL DEFAULT 0,
        "datePrelevement" date NOT NULL,
        "datePeremption"  date NOT NULL,
        "statut"          "bs_poches_sang_statut_enum" NOT NULL DEFAULT 'disponible',
        "donneurRef"      character varying,
        "provenance"      character varying,
        "localisation"    character varying,
        "tenantId"        character varying NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bs_poches_sang" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_poches_numero" ON "bs_poches_sang" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_poches_statut" ON "bs_poches_sang" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_poches_tenantId" ON "bs_poches_sang" ("tenantId")`,
    );

    // ── bs_transfusions ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bs_transfusions" (
        "id"                        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"                 character varying NOT NULL,
        "pocheId"                   character varying NOT NULL,
        "pocheNumero"               character varying,
        "date"                      TIMESTAMP NOT NULL DEFAULT now(),
        "groupePatient"             "bs_transfusions_grouppatient_enum" NOT NULL,
        "rhesusPatient"             "bs_transfusions_rhesuspatient_enum" NOT NULL,
        "compatibiliteVerifiee"     boolean NOT NULL DEFAULT false,
        "medecin"                   character varying,
        "indication"                character varying,
        "reactionTransfusionnelle"  character varying,
        "observations"              text,
        "tenantId"                  character varying NOT NULL,
        "createdAt"                 TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bs_transfusions" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_transfusions_patientId" ON "bs_transfusions" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_transfusions_pocheId" ON "bs_transfusions" ("pocheId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bs_transfusions_tenantId" ON "bs_transfusions" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bs_transfusions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bs_poches_sang"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "bs_transfusions_rhesuspatient_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bs_transfusions_grouppatient_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bs_poches_sang_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bs_poches_sang_typeproduit_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bs_poches_sang_rhesus_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bs_poches_sang_groupe_enum"`);
  }
}
