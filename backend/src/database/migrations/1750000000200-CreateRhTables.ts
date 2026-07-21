import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 3 tables du module RH / Paie (préfixe `rh_`) et leurs types enum
 * Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums créés via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut donc être rejouée sans
 * erreur et cohabite avec `synchronize:true` en développement.
 *
 * Les noms de colonnes sont en camelCase (stratégie de nommage TypeORM par
 * défaut), donc systématiquement entre guillemets doubles. Les noms de types
 * enum reproduisent la convention TypeORM `{table}_{colonne}_enum` en minuscules
 * pour rester compatibles avec les entités `src/rh/entities/*.ts`.
 *
 * Multi-tenant strict : chaque table porte une colonne `tenantId` indexée.
 */
export class CreateRhTables1750000000200 implements MigrationInterface {
  name = 'CreateRhTables1750000000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rh_employes_typecontrat_enum') THEN
          CREATE TYPE "rh_employes_typecontrat_enum" AS ENUM ('CDI','CDD','STAGE','CONSULTANT');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rh_employes_statut_enum') THEN
          CREATE TYPE "rh_employes_statut_enum" AS ENUM ('actif','suspendu','parti');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rh_conges_type_enum') THEN
          CREATE TYPE "rh_conges_type_enum" AS ENUM ('conge','maladie','maternite','formation','autre');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rh_conges_statut_enum') THEN
          CREATE TYPE "rh_conges_statut_enum" AS ENUM ('demande','approuve','refuse');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rh_bulletins_paie_statut_enum') THEN
          CREATE TYPE "rh_bulletins_paie_statut_enum" AS ENUM ('brouillon','valide','paye');
        END IF;
      END $$;`);

    // ── rh_employes ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rh_employes" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "matricule"    character varying NOT NULL,
        "nom"          character varying NOT NULL,
        "prenom"       character varying NOT NULL,
        "poste"        character varying NOT NULL,
        "departement"  character varying,
        "dateEmbauche" date,
        "typeContrat"  "rh_employes_typecontrat_enum" NOT NULL DEFAULT 'CDI',
        "salaireBase"  numeric(12,2) NOT NULL DEFAULT 0,
        "statut"       "rh_employes_statut_enum" NOT NULL DEFAULT 'actif',
        "email"        character varying,
        "telephone"    character varying,
        "adresse"      text,
        "tenantId"     character varying NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rh_employes" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rh_employes_tenantId" ON "rh_employes" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_rh_employes_tenant_matricule" ON "rh_employes" ("tenantId","matricule")`,
    );

    // ── rh_conges ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rh_conges" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeId"    uuid NOT NULL,
        "type"         "rh_conges_type_enum" NOT NULL DEFAULT 'conge',
        "dateDebut"    date NOT NULL,
        "dateFin"      date NOT NULL,
        "jours"        integer NOT NULL DEFAULT 0,
        "statut"       "rh_conges_statut_enum" NOT NULL DEFAULT 'demande',
        "motif"        text,
        "approuveById" character varying,
        "approuveAt"   TIMESTAMP,
        "tenantId"     character varying NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rh_conges" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rh_conges_employeId" ON "rh_conges" ("employeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rh_conges_tenantId" ON "rh_conges" ("tenantId")`,
    );

    // ── rh_bulletins_paie ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rh_bulletins_paie" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employeId"      uuid NOT NULL,
        "mois"           character varying NOT NULL,
        "salaireBase"    numeric(12,2) NOT NULL DEFAULT 0,
        "primes"         numeric(12,2) NOT NULL DEFAULT 0,
        "retenues"       numeric(12,2) NOT NULL DEFAULT 0,
        "cotisationCNPS" numeric(12,2) NOT NULL DEFAULT 0,
        "impotITS"       numeric(12,2) NOT NULL DEFAULT 0,
        "cotisations"    numeric(12,2) NOT NULL DEFAULT 0,
        "netAPayer"      numeric(12,2) NOT NULL DEFAULT 0,
        "statut"         "rh_bulletins_paie_statut_enum" NOT NULL DEFAULT 'brouillon',
        "tenantId"       character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rh_bulletins_paie" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rh_bulletins_paie_employeId" ON "rh_bulletins_paie" ("employeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rh_bulletins_paie_tenantId" ON "rh_bulletins_paie" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_rh_bulletins_tenant_employe_mois" ON "rh_bulletins_paie" ("tenantId","employeId","mois")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "rh_bulletins_paie"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rh_conges"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rh_employes"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "rh_bulletins_paie_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rh_conges_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rh_conges_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rh_employes_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rh_employes_typecontrat_enum"`);
  }
}
