import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Sessions de caisse & Reçus (préfixe `caisse_`)
 * et leurs types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`,
 * enums via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans
 * erreur et compatible avec `synchronize:true` en développement.
 *
 * Colonnes camelCase (stratégie TypeORM par défaut) → guillemets doubles.
 * Types et DEFAULT reproduisent `src/caisse-sessions/entities/*.ts`.
 */
export class CreateCaisseSessionsTables1750000003200 implements MigrationInterface {
  name = 'CreateCaisseSessionsTables1750000003200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caisse_sessions_statut_enum') THEN
          CREATE TYPE "caisse_sessions_statut_enum" AS ENUM ('ouverte','cloturee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caisse_recus_modepaiement_enum') THEN
          CREATE TYPE "caisse_recus_modepaiement_enum" AS ENUM (
            'especes','carte_bancaire','mobile_money','virement','cheque','assurance','autre'
          );
        END IF;
      END $$;`);

    // ── caisse_sessions ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "caisse_sessions" (
        "id"                       uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"                   character varying NOT NULL,
        "caissierRef"              character varying NOT NULL,
        "dateOuverture"            TIMESTAMP NOT NULL DEFAULT now(),
        "dateCloture"              TIMESTAMP,
        "fondCaisseInitial"        numeric(14,2) NOT NULL DEFAULT 0,
        "montantTheoriqueEspeces"  numeric(14,2) NOT NULL DEFAULT 0,
        "montantCompteEspeces"     numeric(14,2),
        "ecart"                    numeric(14,2) NOT NULL DEFAULT 0,
        "totalEncaisse"            numeric(14,2) NOT NULL DEFAULT 0,
        "totauxParMode"            jsonb NOT NULL DEFAULT '{}'::jsonb,
        "statut"                   "caisse_sessions_statut_enum" NOT NULL DEFAULT 'ouverte',
        "notes"                    text,
        "tenantId"                 character varying NOT NULL,
        "createdById"              character varying,
        "createdAt"                TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"                TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caisse_sessions" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_sessions_numero" ON "caisse_sessions" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_sessions_caissierRef" ON "caisse_sessions" ("caissierRef")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_sessions_tenantId" ON "caisse_sessions" ("tenantId")`,
    );

    // ── caisse_recus ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "caisse_recus" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"        character varying NOT NULL,
        "sessionId"     character varying,
        "patientId"     character varying,
        "factureRef"    character varying,
        "paiementRef"   character varying,
        "montant"       numeric(14,2) NOT NULL DEFAULT 0,
        "devise"        character varying NOT NULL DEFAULT 'XOF',
        "modePaiement"  "caisse_recus_modepaiement_enum" NOT NULL DEFAULT 'especes',
        "date"          TIMESTAMP NOT NULL DEFAULT now(),
        "objet"         character varying,
        "emisParRef"    character varying,
        "notes"         text,
        "tenantId"      character varying NOT NULL,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_caisse_recus" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_recus_numero" ON "caisse_recus" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_recus_sessionId" ON "caisse_recus" ("sessionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_recus_patientId" ON "caisse_recus" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_caisse_recus_tenantId" ON "caisse_recus" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "caisse_recus"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "caisse_sessions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "caisse_recus_modepaiement_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "caisse_sessions_statut_enum"`);
  }
}
