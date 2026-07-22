import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `incidents_qualite` (déclaration & analyse des événements
 * indésirables — enjeu médico-légal) et ses types enum Postgres.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets
 * doubles. Modèle : CreateAcademieTables1750000001100.
 */
export class CreateIncidentsQualiteTables1750000002000
  implements MigrationInterface
{
  name = 'CreateIncidentsQualiteTables1750000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incidents_qualite_type_enum') THEN
          CREATE TYPE "incidents_qualite_type_enum" AS ENUM (
            'erreur_medicamenteuse','chute','infection_nosocomiale','erreur_identite','materiel_defectueux','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incidents_qualite_gravite_enum') THEN
          CREATE TYPE "incidents_qualite_gravite_enum" AS ENUM (
            'mineure','moderee','grave','critique'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incidents_qualite_statut_enum') THEN
          CREATE TYPE "incidents_qualite_statut_enum" AS ENUM (
            'declare','en_analyse','action_en_cours','cloture'
          );
        END IF;
      END $$;`);

    // ── incidents_qualite ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "incidents_qualite" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"             character varying NOT NULL,
        "tenantId"           character varying NOT NULL,
        "type"               "incidents_qualite_type_enum" NOT NULL DEFAULT 'autre',
        "gravite"            "incidents_qualite_gravite_enum" NOT NULL DEFAULT 'mineure',
        "statut"             "incidents_qualite_statut_enum" NOT NULL DEFAULT 'declare',
        "dateSurvenue"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "serviceConcerne"    character varying NOT NULL,
        "patientId"          character varying,
        "description"        text NOT NULL,
        "causesIdentifiees"  text,
        "mesuresCorrectives" text,
        "declarantId"        character varying NOT NULL,
        "analyseJson"        jsonb,
        "actions"            jsonb NOT NULL DEFAULT '[]',
        "dateCloture"        TIMESTAMP WITH TIME ZONE,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_incidents_qualite" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_incidents_qualite_numero" UNIQUE ("numero")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incidents_qualite_tenantId" ON "incidents_qualite" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incidents_qualite_statut" ON "incidents_qualite" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incidents_qualite_patientId" ON "incidents_qualite" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_incidents_qualite_declarantId" ON "incidents_qualite" ("declarantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "incidents_qualite"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "incidents_qualite_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "incidents_qualite_gravite_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "incidents_qualite_type_enum"`);
  }
}
