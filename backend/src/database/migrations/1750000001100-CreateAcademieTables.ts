import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables de l'Académie / Formation SANTAREX (`academie_parcours`,
 * `academie_ressources`, `academie_progressions`) et leurs types enum Postgres
 * (préfixe `academie_`).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreateCrmTables1750000000700.
 */
export class CreateAcademieTables1750000001100 implements MigrationInterface {
  name = 'CreateAcademieTables1750000001100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academie_parcours_categorie_enum') THEN
          CREATE TYPE "academie_parcours_categorie_enum" AS ENUM (
            'demarrage','administration','modules','finance','mobile','securite','nouveautes'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academie_parcours_niveau_enum') THEN
          CREATE TYPE "academie_parcours_niveau_enum" AS ENUM (
            'debutant','intermediaire','avance'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academie_ressources_type_enum') THEN
          CREATE TYPE "academie_ressources_type_enum" AS ENUM (
            'video','document','quiz'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'academie_progressions_statut_enum') THEN
          CREATE TYPE "academie_progressions_statut_enum" AS ENUM (
            'non_commence','en_cours','termine'
          );
        END IF;
      END $$;`);

    // ── academie_parcours ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academie_parcours" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titre"       character varying NOT NULL,
        "description" text,
        "categorie"   "academie_parcours_categorie_enum" NOT NULL DEFAULT 'demarrage',
        "niveau"      "academie_parcours_niveau_enum" NOT NULL DEFAULT 'debutant',
        "ordre"       integer NOT NULL DEFAULT 0,
        "estPublie"   boolean NOT NULL DEFAULT false,
        "iconeUrl"    character varying,
        "tenantId"    character varying,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academie_parcours" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_parcours_categorie" ON "academie_parcours" ("categorie")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_parcours_estPublie" ON "academie_parcours" ("estPublie")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_parcours_tenantId" ON "academie_parcours" ("tenantId")`,
    );

    // ── academie_ressources ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academie_ressources" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "parcoursId"         uuid NOT NULL,
        "type"               "academie_ressources_type_enum" NOT NULL DEFAULT 'document',
        "titre"              character varying NOT NULL,
        "description"        text,
        "duree"              integer,
        "url"                text,
        "miniatureUrl"       text,
        "moduleAssocie"      character varying,
        "langue"             character varying NOT NULL DEFAULT 'fr',
        "versionCompatible"  character varying,
        "ordre"              integer NOT NULL DEFAULT 0,
        "estPublie"          boolean NOT NULL DEFAULT false,
        "contenuDisponible"  boolean NOT NULL DEFAULT false,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academie_ressources" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_ressources_parcoursId" ON "academie_ressources" ("parcoursId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_ressources_estPublie" ON "academie_ressources" ("estPublie")`,
    );

    // ── academie_progressions ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academie_progressions" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      character varying NOT NULL,
        "tenantId"    character varying,
        "ressourceId" uuid NOT NULL,
        "statut"      "academie_progressions_statut_enum" NOT NULL DEFAULT 'non_commence',
        "consulteAt"  TIMESTAMP WITH TIME ZONE,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academie_progressions" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_progressions_userId" ON "academie_progressions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_progressions_tenantId" ON "academie_progressions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_academie_progressions_ressourceId" ON "academie_progressions" ("ressourceId")`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_academie_progression_user_ressource'
        ) THEN
          ALTER TABLE "academie_progressions"
            ADD CONSTRAINT "UQ_academie_progression_user_ressource" UNIQUE ("userId", "ressourceId");
        END IF;
      END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "academie_progressions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academie_ressources"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academie_parcours"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "academie_progressions_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "academie_ressources_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "academie_parcours_niveau_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "academie_parcours_categorie_enum"`);
  }
}
