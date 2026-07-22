import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module Interactions médicamenteuses & contre-indications
 * (`interactions_medicamenteuses`, `contre_indications`) et leurs types enum.
 *
 * Le CONTENU du référentiel (interactions cliniques réelles) est seedé au
 * démarrage par `InteractionsService.onModuleInit` (idempotent), sur le modèle
 * de l'Académie — cette migration ne crée que le schéma.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 */
export class CreateInteractionsTables1750000001900 implements MigrationInterface {
  name = 'CreateInteractionsTables1750000001900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interactions_medicamenteuses_severite_enum') THEN
          CREATE TYPE "interactions_medicamenteuses_severite_enum" AS ENUM (
            'contre_indication','majeure','moderee','mineure'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contre_indications_gravite_enum') THEN
          CREATE TYPE "contre_indications_gravite_enum" AS ENUM (
            'absolue','relative','precaution'
          );
        END IF;
      END $$;`);

    // ── interactions_medicamenteuses ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interactions_medicamenteuses" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dciA"            character varying NOT NULL,
        "dciB"            character varying NOT NULL,
        "severite"        "interactions_medicamenteuses_severite_enum" NOT NULL DEFAULT 'moderee',
        "mecanisme"       text,
        "effet"           text,
        "conduiteATenir"  text,
        "source"          character varying,
        "tenantId"        character varying,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_interactions_medicamenteuses" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interactions_dciA" ON "interactions_medicamenteuses" ("dciA")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interactions_dciB" ON "interactions_medicamenteuses" ("dciB")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interactions_severite" ON "interactions_medicamenteuses" ("severite")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interactions_tenantId" ON "interactions_medicamenteuses" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_interactions_paire" ON "interactions_medicamenteuses" ("dciA", "dciB")`,
    );

    // ── contre_indications ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contre_indications" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dci"         character varying NOT NULL,
        "condition"   character varying NOT NULL,
        "gravite"     "contre_indications_gravite_enum" NOT NULL DEFAULT 'relative',
        "description" text,
        "source"      character varying,
        "tenantId"    character varying,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contre_indications" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contre_indications_dci" ON "contre_indications" ("dci")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contre_indications_condition" ON "contre_indications" ("condition")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contre_indications_tenantId" ON "contre_indications" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_contre_indications_dci_condition" ON "contre_indications" ("dci", "condition")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "contre_indications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "interactions_medicamenteuses"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contre_indications_gravite_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interactions_medicamenteuses_severite_enum"`);
  }
}
