import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables `sterilisation_lots` (cycles de stérilisation des
 * instruments/plateaux — traçabilité bloc opératoire) et
 * `sterilisation_instruments` (référentiel simple), ainsi que leurs types enum.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes en camelCase (stratégie TypeORM par
 * défaut), entre guillemets doubles. Modèle : CreateIncidentsQualiteTables1750000002000.
 */
export class CreateSterilisationTables1750000002300
  implements MigrationInterface
{
  name = 'CreateSterilisationTables1750000002300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sterilisation_lots_methode_enum') THEN
          CREATE TYPE "sterilisation_lots_methode_enum" AS ENUM (
            'autoclave','chaleur_seche','chimique'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sterilisation_lots_resultatindicateur_enum') THEN
          CREATE TYPE "sterilisation_lots_resultatindicateur_enum" AS ENUM (
            'conforme','non_conforme'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sterilisation_lots_statut_enum') THEN
          CREATE TYPE "sterilisation_lots_statut_enum" AS ENUM (
            'en_cours','valide','rejete','utilise'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sterilisation_instruments_type_enum') THEN
          CREATE TYPE "sterilisation_instruments_type_enum" AS ENUM (
            'instrument','plateau'
          );
        END IF;
      END $$;`);

    // ── sterilisation_lots ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sterilisation_lots" (
        "id"                      uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"                  character varying NOT NULL,
        "methode"                 "sterilisation_lots_methode_enum" NOT NULL DEFAULT 'autoclave',
        "contenu"                 text NOT NULL,
        "temperature"             numeric(6,2),
        "dureeMin"                integer,
        "dateCycle"               TIMESTAMP WITH TIME ZONE NOT NULL,
        "operateurRef"            character varying NOT NULL,
        "resultatIndicateur"      "sterilisation_lots_resultatindicateur_enum",
        "statut"                  "sterilisation_lots_statut_enum" NOT NULL DEFAULT 'en_cours',
        "datePeremptionSterilite" TIMESTAMP WITH TIME ZONE,
        "observations"            text,
        "utiliseParRef"           character varying,
        "dateUtilisation"         TIMESTAMP WITH TIME ZONE,
        "tenantId"                character varying NOT NULL,
        "createdById"             character varying NOT NULL,
        "createdAt"               TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"               TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sterilisation_lots" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sterilisation_lots_numero" UNIQUE ("numero")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sterilisation_lots_tenantId" ON "sterilisation_lots" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sterilisation_lots_statut" ON "sterilisation_lots" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sterilisation_lots_operateurRef" ON "sterilisation_lots" ("operateurRef")`,
    );

    // ── sterilisation_instruments ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sterilisation_instruments" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"        character varying NOT NULL,
        "type"       "sterilisation_instruments_type_enum" NOT NULL DEFAULT 'instrument',
        "quantite"   integer NOT NULL DEFAULT 1,
        "code"       character varying,
        "estActif"   boolean NOT NULL DEFAULT true,
        "tenantId"   character varying NOT NULL,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sterilisation_instruments" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sterilisation_instruments_tenantId" ON "sterilisation_instruments" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sterilisation_instruments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sterilisation_lots"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sterilisation_instruments_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sterilisation_lots_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sterilisation_lots_resultatindicateur_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sterilisation_lots_methode_enum"`);
  }
}
