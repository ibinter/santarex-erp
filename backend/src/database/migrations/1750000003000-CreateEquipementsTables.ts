import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 2 tables du module Équipements / Maintenance biomédicale (préfixe
 * `equip_`) et leurs types enum Postgres. 100 % idempotente :
 * `CREATE TABLE IF NOT EXISTS`, enums créés via `DO $$ ... IF NOT EXISTS`,
 * index `IF NOT EXISTS`. Peut donc être rejouée sans erreur et cohabite avec
 * `synchronize:true` en développement.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut) donc entre
 * guillemets doubles. Types et DEFAULT reproduisent `src/equipements/entities/*.ts`.
 */
export class CreateEquipementsTables1750000003000 implements MigrationInterface {
  name = 'CreateEquipementsTables1750000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equip_equipements_categorie_enum') THEN
          CREATE TYPE "equip_equipements_categorie_enum" AS ENUM (
            'imagerie','laboratoire','monitoring','bloc','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equip_equipements_statut_enum') THEN
          CREATE TYPE "equip_equipements_statut_enum" AS ENUM (
            'en_service','en_panne','en_maintenance','reforme'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equip_interventions_type_enum') THEN
          CREATE TYPE "equip_interventions_type_enum" AS ENUM (
            'preventive','curative','etalonnage'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equip_interventions_statut_enum') THEN
          CREATE TYPE "equip_interventions_statut_enum" AS ENUM (
            'planifiee','en_cours','terminee'
          );
        END IF;
      END $$;`);

    // ── equip_equipements ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "equip_equipements" (
        "id"                          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code"                        character varying NOT NULL,
        "nom"                         character varying NOT NULL,
        "categorie"                   "equip_equipements_categorie_enum" NOT NULL DEFAULT 'autre',
        "marque"                      character varying,
        "modele"                      character varying,
        "numeroSerie"                 character varying,
        "localisation"                character varying,
        "dateAcquisition"             date,
        "valeurAcquisition"           numeric(14,2) NOT NULL DEFAULT 0,
        "devise"                      character varying NOT NULL DEFAULT 'XOF',
        "statut"                      "equip_equipements_statut_enum" NOT NULL DEFAULT 'en_service',
        "periodiciteMaintenanceJours" integer NOT NULL DEFAULT 0,
        "dateProchaineMaintenance"    date,
        "notes"                       text,
        "tenantId"                    character varying NOT NULL,
        "createdAt"                   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"                   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equip_equipements" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_equip_equipements_code" ON "equip_equipements" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_equip_equipements_tenantId" ON "equip_equipements" ("tenantId")`,
    );

    // ── equip_interventions ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "equip_interventions" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "equipementId"        character varying NOT NULL,
        "type"                "equip_interventions_type_enum" NOT NULL DEFAULT 'curative',
        "date"                date NOT NULL,
        "description"         text,
        "technicienRef"       character varying,
        "prestataire"         character varying,
        "cout"                numeric(14,2) NOT NULL DEFAULT 0,
        "devise"              character varying NOT NULL DEFAULT 'XOF',
        "resultat"            text,
        "dureeIndispoHeures"  numeric(8,2) NOT NULL DEFAULT 0,
        "statut"              "equip_interventions_statut_enum" NOT NULL DEFAULT 'planifiee',
        "prochaineDate"       date,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_equip_interventions" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_equip_interventions_equipementId" ON "equip_interventions" ("equipementId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_equip_interventions_tenantId" ON "equip_interventions" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "equip_interventions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "equip_equipements"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "equip_interventions_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "equip_interventions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "equip_equipements_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "equip_equipements_categorie_enum"`);
  }
}
