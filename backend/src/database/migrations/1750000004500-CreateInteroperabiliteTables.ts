import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module Interopérabilité / API publique :
 *   • interop_cles_api          — clés API par tenant (hash bcrypt, scopes)
 *   • interop_webhooks          — abonnements webhooks sortants (secret HMAC)
 *   • interop_config_interfaces — configs d'interfaçage HL7 labo / DICOM PACS
 *   • interop_messages          — journal des messages entrants/sortants
 *
 * 100 % idempotente (CREATE ... IF NOT EXISTS + enums gardés par bloc DO) :
 * rejouable sans erreur et compatible avec `synchronize:true` en développement.
 */
export class CreateInteroperabiliteTables1750000004500 implements MigrationInterface {
  name = 'CreateInteroperabiliteTables1750000004500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums (créés seulement s'ils n'existent pas) ──────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interop_type_interface_enum" AS ENUM ('hl7_labo', 'dicom_pacs');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interop_statut_connexion_enum" AS ENUM ('non_configure', 'connecte', 'deconnecte', 'erreur');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interop_sens_enum" AS ENUM ('entrant', 'sortant');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interop_protocole_enum" AS ENUM ('hl7', 'dicom', 'rest');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "interop_statut_message_enum" AS ENUM ('recu', 'traite', 'erreur');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── Clés API ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interop_cles_api" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "nom" character varying NOT NULL,
        "cleHashee" character varying NOT NULL,
        "prefixe" character varying NOT NULL,
        "scopes" jsonb NOT NULL DEFAULT '[]',
        "actif" boolean NOT NULL DEFAULT true,
        "dateDernierUsage" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interop_cles_api" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_cles_tenant" ON "interop_cles_api" ("tenantId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_cles_prefixe" ON "interop_cles_api" ("prefixe");`,
    );

    // ── Webhooks ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interop_webhooks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "url" character varying NOT NULL,
        "evenements" jsonb NOT NULL DEFAULT '[]',
        "secret" character varying NOT NULL,
        "actif" boolean NOT NULL DEFAULT true,
        "dernierStatut" character varying,
        "dateDernierEnvoi" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interop_webhooks" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_webhooks_tenant" ON "interop_webhooks" ("tenantId");`,
    );

    // ── Configs d'interface ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interop_config_interfaces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "type" "interop_type_interface_enum" NOT NULL,
        "nom" character varying NOT NULL,
        "hote" character varying,
        "port" integer,
        "parametresJson" jsonb NOT NULL DEFAULT '{}',
        "statutConnexion" "interop_statut_connexion_enum" NOT NULL DEFAULT 'non_configure',
        "actif" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interop_config_interfaces" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_configs_tenant" ON "interop_config_interfaces" ("tenantId");`,
    );

    // ── Messages ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interop_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "sens" "interop_sens_enum" NOT NULL,
        "protocole" "interop_protocole_enum" NOT NULL,
        "type" character varying,
        "contenu" text NOT NULL,
        "statut" "interop_statut_message_enum" NOT NULL DEFAULT 'recu',
        "erreur" text,
        "donneesJson" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interop_messages" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_messages_tenant" ON "interop_messages" ("tenantId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interop_messages_created" ON "interop_messages" ("createdAt");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "interop_messages";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interop_config_interfaces";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interop_webhooks";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interop_cles_api";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interop_statut_message_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interop_protocole_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interop_sens_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interop_statut_connexion_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interop_type_interface_enum";`);
  }
}
