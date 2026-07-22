import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables `dechets_collectes` (collectes de déchets d'activités de
 * soins par service producteur) et `dechets_enlevements` (regroupements /
 * bordereaux de suivi type BSDASRI jusqu'à destruction), ainsi que leurs
 * types enum Postgres.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 * Modèle : CreateConsentementsTables1750000002400.
 */
export class CreateDechetsTables1750000002700 implements MigrationInterface {
  name = 'CreateDechetsTables1750000002700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dechets_collectes_categorie_enum') THEN
          CREATE TYPE "dechets_collectes_categorie_enum" AS ENUM (
            'dasri','anatomique','chimique','pharmaceutique','radioactif','menager_assimile'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dechets_collectes_typeconditionnement_enum') THEN
          CREATE TYPE "dechets_collectes_typeconditionnement_enum" AS ENUM (
            'carton','fut','boite_opct'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dechets_collectes_statut_enum') THEN
          CREATE TYPE "dechets_collectes_statut_enum" AS ENUM (
            'collecte','en_stockage','enleve','incinere'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dechets_enlevements_modetraitement_enum') THEN
          CREATE TYPE "dechets_enlevements_modetraitement_enum" AS ENUM (
            'incineration','banalisation','enfouissement'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dechets_enlevements_statut_enum') THEN
          CREATE TYPE "dechets_enlevements_statut_enum" AS ENUM (
            'planifie','enleve','traite'
          );
        END IF;
      END $$;`);

    // ── dechets_enlevements ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dechets_enlevements" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bordereauNumero"       character varying NOT NULL,
        "prestataire"           character varying NOT NULL,
        "dateEnlevement"        TIMESTAMP WITH TIME ZONE NOT NULL,
        "poidsTotal"            numeric(10,3) NOT NULL DEFAULT 0,
        "modeTraitement"        "dechets_enlevements_modetraitement_enum" NOT NULL,
        "statut"                "dechets_enlevements_statut_enum" NOT NULL DEFAULT 'enleve',
        "certificatDestruction" character varying,
        "dateTraitement"        TIMESTAMP WITH TIME ZONE,
        "observations"          text,
        "tenantId"              character varying NOT NULL,
        "createdById"           character varying,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dechets_enlevements" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_enlevements_tenantId" ON "dechets_enlevements" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_enlevements_bordereauNumero" ON "dechets_enlevements" ("bordereauNumero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_enlevements_statut" ON "dechets_enlevements" ("statut")`,
    );

    // ── dechets_collectes ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dechets_collectes" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "categorie"           "dechets_collectes_categorie_enum" NOT NULL,
        "serviceProducteur"   character varying NOT NULL,
        "uniteProducteur"     character varying,
        "poidsKg"             numeric(10,3) NOT NULL DEFAULT 0,
        "typeConditionnement" "dechets_collectes_typeconditionnement_enum" NOT NULL,
        "dateCollecte"        TIMESTAMP WITH TIME ZONE NOT NULL,
        "agentRef"            character varying,
        "statut"              "dechets_collectes_statut_enum" NOT NULL DEFAULT 'collecte',
        "enlevementId"        uuid,
        "observations"        text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dechets_collectes" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_collectes_tenantId" ON "dechets_collectes" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_collectes_numero" ON "dechets_collectes" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_collectes_categorie" ON "dechets_collectes" ("categorie")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_collectes_statut" ON "dechets_collectes" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dechets_collectes_enlevementId" ON "dechets_collectes" ("enlevementId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dechets_collectes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dechets_enlevements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dechets_enlevements_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dechets_enlevements_modetraitement_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dechets_collectes_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dechets_collectes_typeconditionnement_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dechets_collectes_categorie_enum"`);
  }
}
