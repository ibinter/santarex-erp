import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module « Déclarations sanitaires (MDO) » — préfixe
 * `decl_san_` — et leurs types enum Postgres. 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ ... IF NOT EXISTS`, index
 * `IF NOT EXISTS`. Rejouable sans erreur et compatible avec `synchronize:true`.
 *
 * Colonnes en camelCase (stratégie de nommage TypeORM par défaut) donc entre
 * guillemets doubles. Types reproduisent les entités
 * `maladie-declarable.entity.ts` et `declaration-sanitaire.entity.ts`.
 */
export class CreateDeclarationsSanitairesTables1750000004200
  implements MigrationInterface
{
  name = 'CreateDeclarationsSanitairesTables1750000004200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decl_san_maladies_categorie_enum') THEN
          CREATE TYPE "decl_san_maladies_categorie_enum" AS ENUM ('epidemique','endemique','autre');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decl_san_declarations_statut_enum') THEN
          CREATE TYPE "decl_san_declarations_statut_enum" AS ENUM ('a_declarer','declaree','transmise','confirmee','classee');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decl_san_declarations_gravite_enum') THEN
          CREATE TYPE "decl_san_declarations_gravite_enum" AS ENUM ('benin','modere','severe','critique');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decl_san_declarations_evolution_enum') THEN
          CREATE TYPE "decl_san_declarations_evolution_enum" AS ENUM ('en_cours','gueri','deces');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decl_san_declarations_sexe_enum') THEN
          CREATE TYPE "decl_san_declarations_sexe_enum" AS ENUM ('m','f','inconnu');
        END IF;
      END $$;`);

    // ── Référentiel MDO ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "decl_san_maladies" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"               character varying,
        "nom"                    character varying NOT NULL,
        "codeCIM10"              character varying,
        "categorie"              "decl_san_maladies_categorie_enum" NOT NULL DEFAULT 'autre',
        "delaiDeclarationHeures" integer NOT NULL DEFAULT 24,
        "description"            text,
        "actif"                  boolean NOT NULL DEFAULT true,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_decl_san_maladies" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_maladies_tenant" ON "decl_san_maladies" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_maladies_nom" ON "decl_san_maladies" ("nom")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_maladies_categorie" ON "decl_san_maladies" ("categorie")`,
    );

    // ── Déclarations ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "decl_san_declarations" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"                 character varying NOT NULL,
        "tenantId"               character varying NOT NULL,
        "maladieId"              character varying NOT NULL,
        "maladieNom"             character varying NOT NULL,
        "codeCIM10"              character varying,
        "patientId"              character varying,
        "patientNom"             character varying,
        "patientAge"             integer,
        "patientSexe"            "decl_san_declarations_sexe_enum" NOT NULL DEFAULT 'inconnu',
        "localite"               character varying,
        "dateDiagnostic"         TIMESTAMP WITH TIME ZONE NOT NULL,
        "dateDeclaration"        TIMESTAMP WITH TIME ZONE,
        "medecinDeclarantRef"    character varying NOT NULL,
        "statut"                 "decl_san_declarations_statut_enum" NOT NULL DEFAULT 'a_declarer',
        "gravite"                "decl_san_declarations_gravite_enum" NOT NULL DEFAULT 'modere',
        "evolution"              "decl_san_declarations_evolution_enum" NOT NULL DEFAULT 'en_cours',
        "mesuresPrises"          text,
        "autoriteDestinataire"   character varying,
        "referenceTransmission"  character varying,
        "dateTransmission"       TIMESTAMP WITH TIME ZONE,
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_decl_san_declarations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_decl_san_declarations_numero" UNIQUE ("numero")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_numero" ON "decl_san_declarations" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_tenant" ON "decl_san_declarations" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_maladie" ON "decl_san_declarations" ("maladieId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_statut" ON "decl_san_declarations" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_patient" ON "decl_san_declarations" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_decl_san_declarations_localite" ON "decl_san_declarations" ("localite")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "decl_san_declarations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "decl_san_maladies"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "decl_san_declarations_sexe_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "decl_san_declarations_evolution_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "decl_san_declarations_gravite_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "decl_san_declarations_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "decl_san_maladies_categorie_enum"`);
  }
}
