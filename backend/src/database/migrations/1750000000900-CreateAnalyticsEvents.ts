import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `analytics_events` (événements légers et anonymes émis par la
 * landing publique). 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, index
 * `IF NOT EXISTS`. Rejouable sans erreur et compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreateDocVerifications1750000000600.
 */
export class CreateAnalyticsEvents1750000000900 implements MigrationInterface {
  name = 'CreateAnalyticsEvents1750000000900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event"     character varying NOT NULL,
        "props"     jsonb,
        "path"      character varying,
        "referrer"  character varying,
        "userAgent" character varying(512),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_events" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_event" ON "analytics_events" ("event")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_analytics_events_createdAt" ON "analytics_events" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_events"`);
  }
}
