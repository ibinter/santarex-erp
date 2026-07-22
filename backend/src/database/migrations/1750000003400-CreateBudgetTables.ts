import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 3 tables du module Budget / Contrôle de gestion :
 *   - budgets          : budgets prévisionnels par exercice/service/poste
 *   - budget_lignes     : lignes prévisionnelles (prévu, réalisé, écart, taux)
 *   - budget_suivis     : réalisé mensuel par ligne (agrégation)
 *
 * 100 % idempotente : CREATE TABLE / INDEX IF NOT EXISTS, enums créés via
 * DO $$ ... IF NOT EXISTS. Colonnes en camelCase (stratégie de nommage TypeORM
 * par défaut), donc entre guillemets doubles. Rejouable sans erreur.
 */
export class CreateBudgetTables1750000003400 implements MigrationInterface {
  name = 'CreateBudgetTables1750000003400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets_type_enum') THEN
          CREATE TYPE "budgets_type_enum" AS ENUM ('recettes','depenses');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'budgets_statut_enum') THEN
          CREATE TYPE "budgets_statut_enum" AS ENUM ('brouillon','valide','cloture');
        END IF;
      END $$;`);

    // ── budgets ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budgets" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "libelle"     character varying NOT NULL,
        "exercice"    integer NOT NULL,
        "type"        "budgets_type_enum" NOT NULL DEFAULT 'depenses',
        "service"     character varying,
        "poste"       character varying,
        "statut"      "budgets_statut_enum" NOT NULL DEFAULT 'brouillon',
        "devise"      character varying NOT NULL DEFAULT 'XOF',
        "notes"       text,
        "tenantId"    character varying NOT NULL,
        "createdById" character varying,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budgets_tenantId" ON "budgets" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budgets_exercice" ON "budgets" ("exercice")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budgets_tenant_exercice" ON "budgets" ("tenantId", "exercice")`,
    );

    // ── budget_lignes ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_lignes" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "budgetId"         uuid NOT NULL,
        "poste"            character varying NOT NULL,
        "categorie"        character varying,
        "montantPrevu"     numeric(14,2) NOT NULL DEFAULT 0,
        "montantRealise"   numeric(14,2) NOT NULL DEFAULT 0,
        "ecart"            numeric(14,2) NOT NULL DEFAULT 0,
        "tauxRealisation"  numeric(6,2) NOT NULL DEFAULT 0,
        "notes"            text,
        "tenantId"         character varying NOT NULL,
        CONSTRAINT "PK_budget_lignes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_lignes_budget" FOREIGN KEY ("budgetId")
          REFERENCES "budgets" ("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budget_lignes_budgetId" ON "budget_lignes" ("budgetId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budget_lignes_tenantId" ON "budget_lignes" ("tenantId")`,
    );

    // ── budget_suivis ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "budget_suivis" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ligneBudgetId"      uuid NOT NULL,
        "mois"               integer NOT NULL,
        "montantRealiseMois" numeric(14,2) NOT NULL DEFAULT 0,
        "commentaire"        text,
        "tenantId"           character varying NOT NULL,
        CONSTRAINT "PK_budget_suivis" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_suivis_ligne" FOREIGN KEY ("ligneBudgetId")
          REFERENCES "budget_lignes" ("id") ON DELETE CASCADE
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budget_suivis_ligneBudgetId" ON "budget_suivis" ("ligneBudgetId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_budget_suivis_tenantId" ON "budget_suivis" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_budget_suivis_tenant_ligne_mois" ON "budget_suivis" ("tenantId", "ligneBudgetId", "mois")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_suivis"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budget_lignes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "budgets_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "budgets_type_enum"`);
  }
}
