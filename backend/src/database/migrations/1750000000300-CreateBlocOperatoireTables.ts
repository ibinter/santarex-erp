import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Bloc Opératoire (préfixe `bloc_`) et leurs types
 * enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums créés
 * via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut donc être rejouée
 * sans erreur et cohabite avec `synchronize:true` en développement.
 *
 * Les noms de colonnes sont en camelCase (stratégie de nommage TypeORM par
 * défaut) et donc systématiquement entre guillemets doubles. Les types et
 * DEFAULT reproduisent exactement les entités
 * `src/bloc-operatoire/entities/*.ts`.
 */
export class CreateBlocOperatoireTables1750000000300 implements MigrationInterface {
  name = 'CreateBlocOperatoireTables1750000000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension pour uuid_generate_v4() (default des colonnes @PrimaryGeneratedColumn('uuid')).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bloc_salles_statut_enum') THEN
          CREATE TYPE "bloc_salles_statut_enum" AS ENUM (
            'disponible','occupee','nettoyage','maintenance'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bloc_interventions_statut_enum') THEN
          CREATE TYPE "bloc_interventions_statut_enum" AS ENUM (
            'programmee','en_cours','terminee','annulee'
          );
        END IF;
      END $$;`);

    // ── bloc_salles ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bloc_salles" (
        "id"         uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"        character varying NOT NULL,
        "type"       character varying NOT NULL,
        "statut"     "bloc_salles_statut_enum" NOT NULL DEFAULT 'disponible',
        "estActive"  boolean NOT NULL DEFAULT true,
        "tenantId"   character varying NOT NULL,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bloc_salles" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloc_salles_tenantId" ON "bloc_salles" ("tenantId")`,
    );

    // ── bloc_interventions ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "bloc_interventions" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"            character varying NOT NULL,
        "patientId"         character varying NOT NULL,
        "chirurgienId"      character varying NOT NULL,
        "anesthesisteId"    character varying,
        "salleId"           character varying NOT NULL,
        "typeIntervention"  character varying NOT NULL,
        "dateHeurePrevue"   TIMESTAMP NOT NULL,
        "dureeEstimee"      integer NOT NULL,
        "urgence"           boolean NOT NULL DEFAULT false,
        "statut"            "bloc_interventions_statut_enum" NOT NULL DEFAULT 'programmee',
        "dateHeureDebut"    TIMESTAMP,
        "dateHeureFin"      TIMESTAMP,
        "compteRendu"       text,
        "tenantId"          character varying NOT NULL,
        "createdById"       character varying NOT NULL,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bloc_interventions" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloc_interventions_tenantId" ON "bloc_interventions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloc_interventions_patientId" ON "bloc_interventions" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloc_interventions_chirurgienId" ON "bloc_interventions" ("chirurgienId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_bloc_interventions_salleId" ON "bloc_interventions" ("salleId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "bloc_interventions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bloc_salles"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "bloc_interventions_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "bloc_salles_statut_enum"`);
  }
}
