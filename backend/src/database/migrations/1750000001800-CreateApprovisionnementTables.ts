import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module Approvisionnement / Commandes fournisseurs
 * (`appro_fournisseurs`, `appro_bons_commande`, `appro_lignes_commande`) et
 * leurs types enum Postgres (préfixe `appro_`).
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreateCrmTables1750000000700.
 */
export class CreateApprovisionnementTables1750000001800 implements MigrationInterface {
  name = 'CreateApprovisionnementTables1750000001800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appro_fournisseurs_type_enum') THEN
          CREATE TYPE "appro_fournisseurs_type_enum" AS ENUM (
            'grossiste','laboratoire','consommables','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appro_bons_commande_statut_enum') THEN
          CREATE TYPE "appro_bons_commande_statut_enum" AS ENUM (
            'brouillon','envoyee','partiellement_recue','recue','annulee'
          );
        END IF;
      END $$;`);

    // ── appro_fournisseurs ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appro_fournisseurs" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"       character varying NOT NULL,
        "type"      "appro_fournisseurs_type_enum" NOT NULL DEFAULT 'grossiste',
        "contact"   character varying,
        "telephone" character varying,
        "email"     character varying,
        "adresse"   text,
        "ville"     character varying,
        "actif"     boolean NOT NULL DEFAULT true,
        "tenantId"  character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appro_fournisseurs" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_fournisseurs_tenantId" ON "appro_fournisseurs" ("tenantId")`,
    );

    // ── appro_bons_commande ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appro_bons_commande" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "fournisseurId"       uuid NOT NULL,
        "dateCommande"        TIMESTAMP WITH TIME ZONE NOT NULL,
        "dateLivraisonPrevue" TIMESTAMP WITH TIME ZONE,
        "statut"              "appro_bons_commande_statut_enum" NOT NULL DEFAULT 'brouillon',
        "montantTotal"        numeric(12,2) NOT NULL DEFAULT 0,
        "devise"              character varying NOT NULL DEFAULT 'XOF',
        "notes"               text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appro_bons_commande" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_bons_commande_numero" ON "appro_bons_commande" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_bons_commande_fournisseurId" ON "appro_bons_commande" ("fournisseurId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_bons_commande_tenantId" ON "appro_bons_commande" ("tenantId")`,
    );

    // ── appro_lignes_commande ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appro_lignes_commande" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bonCommandeId"     uuid NOT NULL,
        "designation"       character varying NOT NULL,
        "medicamentId"      uuid,
        "quantiteCommandee" integer NOT NULL DEFAULT 0,
        "quantiteRecue"     integer NOT NULL DEFAULT 0,
        "prixUnitaire"      numeric(12,2) NOT NULL DEFAULT 0,
        "montantLigne"      numeric(12,2) NOT NULL DEFAULT 0,
        "tenantId"          character varying NOT NULL,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appro_lignes_commande" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_lignes_commande_bonCommandeId" ON "appro_lignes_commande" ("bonCommandeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_lignes_commande_medicamentId" ON "appro_lignes_commande" ("medicamentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_appro_lignes_commande_tenantId" ON "appro_lignes_commande" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appro_lignes_commande"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appro_bons_commande"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appro_fournisseurs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appro_bons_commande_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appro_fournisseurs_type_enum"`);
  }
}
