import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module GESTION MULTI-SITES : `sites` et `site_affectations`.
 * Le SITE est une dimension supplémentaire À L'INTÉRIEUR du multi-tenant existant
 * (chaque table porte un `tenantId` indexé).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums créés via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible avec `synchronize:true` en développement. Noms de colonnes en
 * camelCase (stratégie TypeORM par défaut) entre guillemets doubles ; noms de
 * types enum reproduisant la convention `{table}_{colonne}_enum`.
 */
export class CreateSitesTables1750000004300 implements MigrationInterface {
  name = 'CreateSitesTables1750000004300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sites_type_enum') THEN
          CREATE TYPE "sites_type_enum" AS ENUM ('siege','antenne','clinique','pharmacie','laboratoire');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sites_statut_enum') THEN
          CREATE TYPE "sites_statut_enum" AS ENUM ('actif','inactif');
        END IF;
      END $$;`);

    // ── sites ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sites" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code"           character varying NOT NULL,
        "nom"            character varying NOT NULL,
        "type"           "sites_type_enum" NOT NULL DEFAULT 'antenne',
        "adresse"        text,
        "ville"          character varying,
        "telephone"      character varying,
        "responsableRef" character varying,
        "capaciteLits"   integer NOT NULL DEFAULT 0,
        "statut"         "sites_statut_enum" NOT NULL DEFAULT 'actif',
        "estPrincipal"   boolean NOT NULL DEFAULT false,
        "tenantId"       character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sites" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sites_tenantId" ON "sites" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sites_tenant_code" ON "sites" ("tenantId","code")`,
    );

    // ── site_affectations ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_affectations" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "siteId"    uuid NOT NULL,
        "userId"    character varying NOT NULL,
        "fonction"  character varying,
        "dateDebut" date NOT NULL,
        "dateFin"   date,
        "tenantId"  character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_affectations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_site_affectations_site" FOREIGN KEY ("siteId")
          REFERENCES "sites"("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_site_affectations_tenant_site" ON "site_affectations" ("tenantId","siteId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_site_affectations_tenant_user" ON "site_affectations" ("tenantId","userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_site_affectations_tenantId" ON "site_affectations" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_affectations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sites"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sites_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sites_type_enum"`);
  }
}
