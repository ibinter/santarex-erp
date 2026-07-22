import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module HAD (Hospitalisation À Domicile) — préfixe `had_`
 * — et leurs types enum Postgres. 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ ... IF NOT EXISTS`, index
 * `IF NOT EXISTS`. Rejouable sans erreur ; cohabite avec `synchronize:true`.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut) → entre guillemets
 * doubles. Reproduit `src/had/entities/*.ts`.
 */
export class CreateHadTables1750000003500 implements MigrationInterface {
  name = 'CreateHadTables1750000003500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'had_prises_en_charge_statut_enum') THEN
          CREATE TYPE "had_prises_en_charge_statut_enum" AS ENUM (
            'active','suspendue','terminee'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'had_visites_type_enum') THEN
          CREATE TYPE "had_visites_type_enum" AS ENUM (
            'infirmier','medical','kine','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'had_visites_statut_enum') THEN
          CREATE TYPE "had_visites_statut_enum" AS ENUM (
            'planifiee','effectuee','annulee','reportee'
          );
        END IF;
      END $$;`);

    // ── had_prises_en_charge ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "had_prises_en_charge" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "patientId"           character varying NOT NULL,
        "adresseDomicile"     text NOT NULL,
        "ville"               character varying,
        "telephoneContact"    character varying,
        "motif"               text NOT NULL,
        "medecinReferentRef"  character varying NOT NULL,
        "dateDebut"           date NOT NULL,
        "dateFinPrevue"       date,
        "dateFinReelle"       date,
        "protocoleSoins"      text,
        "frequenceVisites"    character varying,
        "sejourOrigineRef"    character varying,
        "statut"              "had_prises_en_charge_statut_enum" NOT NULL DEFAULT 'active',
        "motifCloture"        text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_had_prises_en_charge" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_prises_patientId" ON "had_prises_en_charge" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_prises_medecinReferentRef" ON "had_prises_en_charge" ("medecinReferentRef")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_prises_tenantId" ON "had_prises_en_charge" ("tenantId")`,
    );

    // ── had_visites ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "had_visites" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "hadId"               character varying NOT NULL,
        "patientId"           character varying NOT NULL,
        "dateVisite"          TIMESTAMP NOT NULL,
        "type"                "had_visites_type_enum" NOT NULL DEFAULT 'infirmier',
        "intervenantRef"      character varying,
        "statut"              "had_visites_statut_enum" NOT NULL DEFAULT 'planifiee',
        "observations"        text,
        "actesRealises"       text,
        "dateRealisation"     TIMESTAMP,
        "prochaineVisite"     TIMESTAMP,
        "motifChangement"     text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_had_visites" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_visites_hadId" ON "had_visites" ("hadId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_visites_patientId" ON "had_visites" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_had_visites_tenantId" ON "had_visites" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "had_visites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "had_prises_en_charge"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "had_visites_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "had_visites_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "had_prises_en_charge_statut_enum"`);
  }
}
