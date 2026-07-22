import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Devis patient (`devis_patient`, `lignes_devis`)
 * et leurs types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`,
 * enums via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans
 * erreur et compatible avec `synchronize:true` en développement.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut) donc entre
 * guillemets doubles. Types et DEFAULT reproduisent `src/devis/entities/*.ts`.
 */
export class CreateDevisTables1750000003100 implements MigrationInterface {
  name = 'CreateDevisTables1750000003100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'devis_patient_statut_enum') THEN
          CREATE TYPE "devis_patient_statut_enum" AS ENUM (
            'brouillon','envoye','accepte','refuse','expire','facture'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lignes_devis_type_enum') THEN
          CREATE TYPE "lignes_devis_type_enum" AS ENUM (
            'consultation','acte','medicament','hospitalisation','autre'
          );
        END IF;
      END $$;`);

    // ── devis_patient ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "devis_patient" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"          character varying NOT NULL,
        "patientId"       character varying NOT NULL,
        "objet"           character varying NOT NULL,
        "dateEmission"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dateValidite"    TIMESTAMP,
        "statut"          "devis_patient_statut_enum" NOT NULL DEFAULT 'brouillon',
        "montantHT"       numeric(12,2) NOT NULL DEFAULT 0,
        "remisePourcent"  numeric(5,2) NOT NULL DEFAULT 0,
        "montantRemise"   numeric(12,2) NOT NULL DEFAULT 0,
        "montantTTC"      numeric(12,2) NOT NULL DEFAULT 0,
        "devise"          character varying NOT NULL DEFAULT 'XOF',
        "notes"           text,
        "motifRefus"      text,
        "factureId"       character varying,
        "tenantId"        character varying NOT NULL,
        "createdById"     character varying NOT NULL,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devis_patient" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_devis_patient_patientId" ON "devis_patient" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_devis_patient_tenantId" ON "devis_patient" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_devis_patient_tenant_numero" ON "devis_patient" ("tenantId", "numero")`,
    );

    // ── lignes_devis ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lignes_devis" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "devisId"       character varying NOT NULL,
        "type"          "lignes_devis_type_enum" NOT NULL DEFAULT 'autre',
        "designation"   character varying NOT NULL,
        "quantite"      numeric(10,2) NOT NULL DEFAULT 1,
        "prixUnitaire"  numeric(12,2) NOT NULL DEFAULT 0,
        "montantLigne"  numeric(12,2) NOT NULL DEFAULT 0,
        "tenantId"      character varying NOT NULL,
        CONSTRAINT "PK_lignes_devis" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_lignes_devis_devisId" ON "lignes_devis" ("devisId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lignes_devis"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "devis_patient"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "lignes_devis_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "devis_patient_statut_enum"`);
  }
}
