import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Messages sortants (SMS / WhatsApp) — préfixe
 * `messages_sortants` — et leurs types enum Postgres. 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ ... IF NOT EXISTS`, index
 * `IF NOT EXISTS`. Rejouable sans erreur ; cohabite avec `synchronize:true`.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) → entre guillemets
 * doubles. Reproduit `src/messages-sortants/entities/*.ts`.
 */
export class CreateMessagesSortantsTables1750000003600 implements MigrationInterface {
  name = 'CreateMessagesSortantsTables1750000003600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messages_sortants_modeles_code_enum') THEN
          CREATE TYPE "messages_sortants_modeles_code_enum" AS ENUM (
            'rappel_rdv','resultat_pret','relance','bienvenue'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messages_sortants_canal_enum') THEN
          CREATE TYPE "messages_sortants_canal_enum" AS ENUM (
            'sms','whatsapp'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messages_sortants_statut_enum') THEN
          CREATE TYPE "messages_sortants_statut_enum" AS ENUM (
            'en_attente','envoye','echoue','simule'
          );
        END IF;
      END $$;`);

    // ── messages_sortants_modeles ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages_sortants_modeles" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"    character varying NOT NULL,
        "code"        "messages_sortants_modeles_code_enum" NOT NULL,
        "libelle"     character varying NOT NULL,
        "canal"       "messages_sortants_canal_enum" NOT NULL DEFAULT 'sms',
        "contenu"     text NOT NULL,
        "actif"       boolean NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_sortants_modeles" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_msg_sortants_modeles_tenantId" ON "messages_sortants_modeles" ("tenantId")`,
    );

    // ── messages_sortants ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages_sortants" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"        character varying NOT NULL,
        "patientId"       character varying,
        "destinataire"    character varying NOT NULL,
        "canal"           "messages_sortants_canal_enum" NOT NULL DEFAULT 'sms',
        "contenu"         text NOT NULL,
        "statut"          "messages_sortants_statut_enum" NOT NULL DEFAULT 'en_attente',
        "dateEnvoi"       TIMESTAMP WITH TIME ZONE,
        "erreur"          text,
        "modeleCode"      character varying,
        "referenceObjet"  character varying,
        "provider"        character varying,
        "createdById"     character varying,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages_sortants" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_msg_sortants_tenantId" ON "messages_sortants" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_msg_sortants_patientId" ON "messages_sortants" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_msg_sortants_modeleCode" ON "messages_sortants" ("modeleCode")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_msg_sortants_referenceObjet" ON "messages_sortants" ("referenceObjet")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "messages_sortants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages_sortants_modeles"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "messages_sortants_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "messages_sortants_canal_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "messages_sortants_modeles_code_enum"`);
  }
}
