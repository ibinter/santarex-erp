import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module SERVICES PERSONNALISÉS / MODULES SUR MESURE :
 *  - `services_personnalises`   : définition d'un service métier + schéma de champs (jsonb)
 *  - `enregistrements_service`  : enregistrements saisis via le formulaire dynamique
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ … IF NOT EXISTS`,
 * index `IF NOT EXISTS`. Rejouable sans erreur et compatible `synchronize:true`.
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets doubles.
 */
export class CreateServicesPersonnalisesTables1750000004400
  implements MigrationInterface
{
  name = 'CreateServicesPersonnalisesTables1750000004400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'services_personnalises_categorie_enum') THEN
          CREATE TYPE "services_personnalises_categorie_enum" AS ENUM (
            'clinique','administratif','technique','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enregistrements_service_statut_enum') THEN
          CREATE TYPE "enregistrements_service_statut_enum" AS ENUM (
            'brouillon','valide','archive'
          );
        END IF;
      END $$;`);

    // ── services_personnalises ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "services_personnalises" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"      character varying NOT NULL,
        "nom"           character varying NOT NULL,
        "description"   text,
        "categorie"     "services_personnalises_categorie_enum" NOT NULL DEFAULT 'autre',
        "icone"         character varying,
        "champsSchema"  jsonb NOT NULL DEFAULT '[]',
        "actif"         boolean NOT NULL DEFAULT true,
        "creePar"       character varying NOT NULL,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services_personnalises" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_services_personnalises_tenantId" ON "services_personnalises" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_services_personnalises_categorie" ON "services_personnalises" ("categorie")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_services_personnalises_actif" ON "services_personnalises" ("actif")`,
    );

    // ── enregistrements_service ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "enregistrements_service" (
        "id"                     uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"               character varying NOT NULL,
        "servicePersonnaliseId"  uuid NOT NULL,
        "patientId"              character varying,
        "valeurs"                jsonb NOT NULL DEFAULT '{}',
        "statut"                 "enregistrements_service_statut_enum" NOT NULL DEFAULT 'valide',
        "creePar"                character varying NOT NULL,
        "date"                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdAt"              TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enregistrements_service" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enregistrements_service_tenantId" ON "enregistrements_service" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enregistrements_service_serviceId" ON "enregistrements_service" ("servicePersonnaliseId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enregistrements_service_patientId" ON "enregistrements_service" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_enregistrements_service_statut" ON "enregistrements_service" ("statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "enregistrements_service"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services_personnalises"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "enregistrements_service_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "services_personnalises_categorie_enum"`);
  }
}
