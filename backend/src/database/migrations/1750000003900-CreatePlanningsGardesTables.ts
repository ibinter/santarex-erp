import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `plannings_gardes` (module Planning des gardes & astreintes)
 * et ses deux types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT
 * EXISTS`, enums créés via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`.
 * Peut donc être rejouée sans erreur et cohabite avec `synchronize:true`.
 *
 * Les noms de types enum reproduisent la convention TypeORM
 * `{table}_{colonne}_enum` pour rester compatibles avec `src/plannings-gardes`.
 * Multi-tenant strict : colonne `tenantId` indexée.
 */
export class CreatePlanningsGardesTables1750000003900
  implements MigrationInterface
{
  name = 'CreatePlanningsGardesTables1750000003900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plannings_gardes_typegarde_enum') THEN
          CREATE TYPE "plannings_gardes_typegarde_enum" AS ENUM ('garde_jour','garde_nuit','astreinte','24h');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plannings_gardes_statut_enum') THEN
          CREATE TYPE "plannings_gardes_statut_enum" AS ENUM ('planifiee','effectuee','absente','remplacee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plannings_gardes" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "personnelRef"  character varying NOT NULL,
        "service"       character varying NOT NULL,
        "typeGarde"     "plannings_gardes_typegarde_enum" NOT NULL DEFAULT 'garde_jour',
        "date"          date NOT NULL,
        "heureDebut"    time NOT NULL,
        "heureFin"      time NOT NULL,
        "statut"        "plannings_gardes_statut_enum" NOT NULL DEFAULT 'planifiee',
        "remplacantRef" character varying,
        "notes"         text,
        "tenantId"      character varying NOT NULL,
        "createdById"   character varying,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plannings_gardes" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_plannings_gardes_tenantId" ON "plannings_gardes" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_plannings_gardes_personnelRef" ON "plannings_gardes" ("personnelRef")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_plannings_gardes_service" ON "plannings_gardes" ("service")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_plannings_gardes_date" ON "plannings_gardes" ("date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_plannings_gardes_tenant_date" ON "plannings_gardes" ("tenantId","date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plannings_gardes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plannings_gardes_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plannings_gardes_typegarde_enum"`);
  }
}
