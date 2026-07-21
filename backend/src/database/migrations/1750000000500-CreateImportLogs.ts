import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `import_logs` (journal des imports de masse). 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, index `IF NOT EXISTS`. Peut être rejouée sans
 * erreur et cohabite avec `synchronize:true` en développement.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut) donc entre
 * guillemets doubles. Reproduit exactement `src/imports/entities/import-log.entity.ts`.
 */
export class CreateImportLogs1750000000500 implements MigrationInterface {
  name = 'CreateImportLogs1750000000500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "import_logs" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type"        character varying NOT NULL,
        "fichier"     character varying,
        "lignesTotal" integer NOT NULL DEFAULT 0,
        "crees"       integer NOT NULL DEFAULT 0,
        "ignores"     integer NOT NULL DEFAULT 0,
        "erreurs"     integer NOT NULL DEFAULT 0,
        "tenantId"    character varying NOT NULL,
        "createdById" uuid NOT NULL,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_import_logs" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_import_logs_tenantId" ON "import_logs" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "import_logs"`);
  }
}
