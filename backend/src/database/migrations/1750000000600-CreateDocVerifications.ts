import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `doc_verifications` (vérification publique de documents par QR
 * + SHA-256) et ses types enum Postgres (préfixe `doc_`). 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ ... IF NOT EXISTS`, index
 * `IF NOT EXISTS`. Rejouable sans erreur et compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreatePaymentsTables1750000000000.
 */
export class CreateDocVerifications1750000000600 implements MigrationInterface {
  name = 'CreateDocVerifications1750000000600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_verifications_typedocument_enum') THEN
          CREATE TYPE "doc_verifications_typedocument_enum" AS ENUM (
            'facture','recu','ordonnance','attestation'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doc_verifications_statut_enum') THEN
          CREATE TYPE "doc_verifications_statut_enum" AS ENUM (
            'authentique','annule','remplace','revoque'
          );
        END IF;
      END $$;`);

    // ── doc_verifications ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "doc_verifications" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token"        character varying NOT NULL,
        "typeDocument" "doc_verifications_typedocument_enum" NOT NULL,
        "reference"    character varying NOT NULL,
        "tenantId"     character varying NOT NULL,
        "tenantNom"    character varying NOT NULL,
        "hash"         character varying(64) NOT NULL,
        "statut"       "doc_verifications_statut_enum" NOT NULL DEFAULT 'authentique',
        "emisLe"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdById"  character varying,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doc_verifications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doc_verifications_token" UNIQUE ("token")
      )`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_doc_verifications_token" ON "doc_verifications" ("token")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_doc_verifications_tenantId" ON "doc_verifications" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_doc_verifications_hash" ON "doc_verifications" ("hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_doc_verifications_statut" ON "doc_verifications" ("statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "doc_verifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "doc_verifications_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "doc_verifications_typedocument_enum"`);
  }
}
