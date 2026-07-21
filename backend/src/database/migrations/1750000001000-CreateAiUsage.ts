import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `ai_usage` (compteur d'usage de l'assistant IA, agrégé par
 * tenant / utilisateur / jour) et ajoute la colonne `quotaMessagesJour` à
 * `ai_configs`. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, index
 * `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreateAnalyticsEvents1750000000900.
 */
export class CreateAiUsage1750000001000 implements MigrationInterface {
  name = 'CreateAiUsage1750000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_usage" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"        character varying NOT NULL,
        "userId"          character varying NOT NULL,
        "date"            date NOT NULL,
        "nbMessages"      integer NOT NULL DEFAULT 0,
        "nbTokensEstimes" integer NOT NULL DEFAULT 0,
        "dernierProvider" character varying,
        "dernierApercu"   character varying(160),
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_usage" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_usage_tenant_date" ON "ai_usage" ("tenantId", "date")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ai_usage_tenant_user_date" ON "ai_usage" ("tenantId", "userId", "date")`,
    );

    // Quota IA journalier par tenant (défaut 200 messages/jour).
    await queryRunner.query(
      `ALTER TABLE "ai_configs" ADD COLUMN IF NOT EXISTS "quotaMessagesJour" integer NOT NULL DEFAULT 200`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_configs" DROP COLUMN IF EXISTS "quotaMessagesJour"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_usage"`);
  }
}
