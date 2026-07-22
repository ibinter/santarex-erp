import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module Satisfaction Patient :
 *  - `satisfaction_questionnaires` (enquêtes + questions en jsonb) ;
 *  - `satisfaction_reponses` (réponses collectées, score global, NPS).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enum via `DO $$ IF NOT EXISTS`,
 * index `IF NOT EXISTS`. Rejouable sans erreur et compatible `synchronize:true`.
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets doubles.
 * Modèle : CreateIncidentsQualiteTables1750000002000.
 */
export class CreateSatisfactionTables1750000003800
  implements MigrationInterface
{
  name = 'CreateSatisfactionTables1750000003800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── satisfaction_questionnaires ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "satisfaction_questionnaires" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"    character varying NOT NULL,
        "titre"       character varying NOT NULL,
        "description" text,
        "questions"   jsonb NOT NULL DEFAULT '[]',
        "echelleMax"  integer NOT NULL DEFAULT 5,
        "actif"       boolean NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_satisfaction_questionnaires" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_questionnaires_tenantId" ON "satisfaction_questionnaires" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_questionnaires_actif" ON "satisfaction_questionnaires" ("actif")`,
    );

    // ── satisfaction_reponses ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "satisfaction_reponses" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"         character varying NOT NULL,
        "questionnaireId"  uuid NOT NULL,
        "patientId"        character varying,
        "serviceConcerne"  character varying,
        "dateReponse"      TIMESTAMP WITH TIME ZONE NOT NULL,
        "reponses"         jsonb NOT NULL DEFAULT '[]',
        "scoreGlobal"      numeric(5,2),
        "commentaireLibre" text,
        "recommande"       boolean,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_satisfaction_reponses" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_reponses_tenantId" ON "satisfaction_reponses" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_reponses_questionnaireId" ON "satisfaction_reponses" ("questionnaireId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_reponses_patientId" ON "satisfaction_reponses" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_reponses_serviceConcerne" ON "satisfaction_reponses" ("serviceConcerne")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_satisfaction_reponses_createdAt" ON "satisfaction_reponses" ("createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "satisfaction_reponses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "satisfaction_questionnaires"`);
  }
}
