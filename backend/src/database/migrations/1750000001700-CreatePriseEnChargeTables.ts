import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module Bons de prise en charge (BPC) assureurs :
 * `assureurs` et `bons_prise_en_charge`, ainsi que leurs types enum Postgres.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreateAcademieTables1750000001100.
 */
export class CreatePriseEnChargeTables1750000001700 implements MigrationInterface {
  name = 'CreatePriseEnChargeTables1750000001700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assureurs_type_enum') THEN
          CREATE TYPE "assureurs_type_enum" AS ENUM (
            'mutuelle','assurance_privee','cmu','cnam'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bons_prise_en_charge_statut_enum') THEN
          CREATE TYPE "bons_prise_en_charge_statut_enum" AS ENUM (
            'brouillon','demande_envoyee','accepte','refuse','expire'
          );
        END IF;
      END $$;`);

    // ── assureurs ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assureurs" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"                   character varying NOT NULL,
        "type"                  "assureurs_type_enum" NOT NULL DEFAULT 'assurance_privee',
        "contactNom"            character varying,
        "contactTelephone"      character varying,
        "contactEmail"          character varying,
        "adresse"               text,
        "tauxCouvertureDefaut"  numeric(5,2) NOT NULL DEFAULT 80,
        "plafond"               numeric(12,2),
        "notes"                 text,
        "actif"                 boolean NOT NULL DEFAULT true,
        "tenantId"              character varying NOT NULL,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assureurs" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assureurs_nom" ON "assureurs" ("nom")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_assureurs_tenantId" ON "assureurs" ("tenantId")`,
    );

    // ── bons_prise_en_charge ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bons_prise_en_charge" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "patientId"           character varying NOT NULL,
        "assureurId"          character varying NOT NULL,
        "numeroAssure"        character varying,
        "prestation"          character varying NOT NULL,
        "description"         text,
        "montantEstime"       numeric(12,2) NOT NULL DEFAULT 0,
        "tauxCouverture"      numeric(5,2) NOT NULL DEFAULT 0,
        "montantCouvert"      numeric(12,2) NOT NULL DEFAULT 0,
        "statut"              "bons_prise_en_charge_statut_enum" NOT NULL DEFAULT 'brouillon',
        "numeroAutorisation"  character varying,
        "dateValidite"        TIMESTAMP WITH TIME ZONE,
        "motifRefus"          text,
        "dateEnvoi"           TIMESTAMP WITH TIME ZONE,
        "dateReponse"         TIMESTAMP WITH TIME ZONE,
        "notes"               text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying NOT NULL,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bons_prise_en_charge" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bons_pec_numero" ON "bons_prise_en_charge" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bons_pec_patientId" ON "bons_prise_en_charge" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bons_pec_assureurId" ON "bons_prise_en_charge" ("assureurId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bons_pec_tenantId" ON "bons_prise_en_charge" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bons_prise_en_charge"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assureurs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bons_prise_en_charge_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "assureurs_type_enum"`);
  }
}
