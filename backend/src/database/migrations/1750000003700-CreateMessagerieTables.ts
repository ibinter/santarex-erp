import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables de la Messagerie interne inter-services
 * (`messagerie_conversations`, `messagerie_messages`) et le type enum Postgres
 * `messagerie_conversations_type_enum`.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enum via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Noms de colonnes camelCase (stratégie TypeORM
 * par défaut), entre guillemets doubles. Modèle : CreateCrmTables1750000000700.
 */
export class CreateMessagerieTables1750000003700 implements MigrationInterface {
  name = 'CreateMessagerieTables1750000003700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Type enum (idempotent) ────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'messagerie_conversations_type_enum') THEN
          CREATE TYPE "messagerie_conversations_type_enum" AS ENUM ('direct','groupe');
        END IF;
      END $$;`);

    // ── messagerie_conversations ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messagerie_conversations" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"             character varying NOT NULL,
        "sujet"                character varying,
        "type"                 "messagerie_conversations_type_enum" NOT NULL DEFAULT 'direct',
        "participantsIds"      jsonb NOT NULL DEFAULT '[]',
        "creeParId"            character varying,
        "dateDernierMessage"   TIMESTAMP WITH TIME ZONE,
        "dernierMessageApercu" text,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messagerie_conversations" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messagerie_conversations_tenantId" ON "messagerie_conversations" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messagerie_conversations_participants" ON "messagerie_conversations" USING gin ("participantsIds")`,
    );

    // ── messagerie_messages ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messagerie_messages" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"       character varying NOT NULL,
        "conversationId" uuid NOT NULL,
        "auteurId"       character varying NOT NULL,
        "contenu"        text NOT NULL,
        "pieceJointeUrl" character varying,
        "luPar"          jsonb NOT NULL DEFAULT '[]',
        "dateEnvoi"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messagerie_messages" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messagerie_messages_tenantId" ON "messagerie_messages" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messagerie_messages_conversationId" ON "messagerie_messages" ("conversationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messagerie_messages_luPar" ON "messagerie_messages" USING gin ("luPar")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "messagerie_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messagerie_conversations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "messagerie_conversations_type_enum"`);
  }
}
