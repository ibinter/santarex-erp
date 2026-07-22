import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Module TRANSPORT / AMBULANCES.
 * Crée 2 tables : parc de véhicules (`transport_vehicules`) et missions
 * d'ambulance (`transport_missions` : transferts, évacuations, SMUR…).
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 */
export class CreateTransportTables1750000002900 implements MigrationInterface {
  name = 'CreateTransportTables1750000002900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_vehicules_type_enum') THEN
          CREATE TYPE "transport_vehicules_type_enum" AS ENUM ('ambulance','vsl','utilitaire');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_vehicules_statut_enum') THEN
          CREATE TYPE "transport_vehicules_statut_enum" AS ENUM ('disponible','en_mission','maintenance','hors_service');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_missions_type_enum') THEN
          CREATE TYPE "transport_missions_type_enum" AS ENUM ('transfert','evacuation','consultation','retour_domicile');
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_missions_statut_enum') THEN
          CREATE TYPE "transport_missions_statut_enum" AS ENUM ('planifiee','en_cours','terminee','annulee');
        END IF;
      END $$;`);

    // ── transport_vehicules ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transport_vehicules" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "immatriculation"       character varying NOT NULL,
        "type"                  "transport_vehicules_type_enum" NOT NULL DEFAULT 'ambulance',
        "marque"                character varying,
        "modele"                character varying,
        "statut"                "transport_vehicules_statut_enum" NOT NULL DEFAULT 'disponible',
        "kilometrage"           integer NOT NULL DEFAULT 0,
        "seuilEntretienKm"      integer,
        "dateProchainEntretien" date,
        "notes"                 text,
        "tenantId"              character varying NOT NULL,
        "createdById"           character varying,
        "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transport_vehicules" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transport_vehicules_tenantId" ON "transport_vehicules" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transport_vehicules_immatriculation" ON "transport_vehicules" ("immatriculation")`,
    );

    // ── transport_missions ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transport_missions" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "vehiculeId"          character varying NOT NULL,
        "type"                "transport_missions_type_enum" NOT NULL DEFAULT 'transfert',
        "patientId"           character varying,
        "origine"             character varying NOT NULL,
        "destination"         character varying NOT NULL,
        "dateDepart"          TIMESTAMP NOT NULL DEFAULT now(),
        "dateArrivee"         TIMESTAMP,
        "chauffeurRef"        character varying,
        "accompagnantMedical" boolean NOT NULL DEFAULT false,
        "distanceKm"          numeric(8,2),
        "cout"                numeric(12,2),
        "dureeMinutes"        integer,
        "statut"              "transport_missions_statut_enum" NOT NULL DEFAULT 'planifiee',
        "notes"               text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transport_missions" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transport_missions_tenantId" ON "transport_missions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transport_missions_vehiculeId" ON "transport_missions" ("vehiculeId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transport_missions_patientId" ON "transport_missions" ("patientId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "transport_missions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transport_vehicules"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transport_missions_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transport_missions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transport_vehicules_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transport_vehicules_type_enum"`);
  }
}
