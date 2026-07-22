import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module INDICATEURS QUALITÉ & ACCRÉDITATION :
 *  - `indicateurs_qualite`      : définition des KPIs (cible, seuil, sens…)
 *  - `mesures_indicateur`       : mesures périodiques + statut atteint/alerte/critique
 *  - `criteres_accreditation`   : suivi des exigences de certification/accréditation
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via `DO $$ … IF NOT EXISTS`,
 * index `IF NOT EXISTS`. Rejouable sans erreur et compatible `synchronize:true`.
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets doubles.
 */
export class CreateIndicateursQualiteTables1750000004000
  implements MigrationInterface
{
  name = 'CreateIndicateursQualiteTables1750000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indicateurs_qualite_domaine_enum') THEN
          CREATE TYPE "indicateurs_qualite_domaine_enum" AS ENUM (
            'hygiene','securite_patient','delais','satisfaction','mortalite','infections'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indicateurs_qualite_unite_enum') THEN
          CREATE TYPE "indicateurs_qualite_unite_enum" AS ENUM (
            'pourcentage','nombre','jours'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indicateurs_qualite_sens_enum') THEN
          CREATE TYPE "indicateurs_qualite_sens_enum" AS ENUM (
            'hausse_bonne','baisse_bonne'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mesures_indicateur_typeperiode_enum') THEN
          CREATE TYPE "mesures_indicateur_typeperiode_enum" AS ENUM (
            'mois','trimestre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mesures_indicateur_statut_enum') THEN
          CREATE TYPE "mesures_indicateur_statut_enum" AS ENUM (
            'atteint','alerte','critique'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'criteres_accreditation_statut_enum') THEN
          CREATE TYPE "criteres_accreditation_statut_enum" AS ENUM (
            'conforme','partiel','non_conforme','na'
          );
        END IF;
      END $$;`);

    // ── indicateurs_qualite ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "indicateurs_qualite" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"    character varying NOT NULL,
        "code"        character varying NOT NULL,
        "libelle"     character varying NOT NULL,
        "domaine"     "indicateurs_qualite_domaine_enum" NOT NULL DEFAULT 'securite_patient',
        "unite"       "indicateurs_qualite_unite_enum" NOT NULL DEFAULT 'pourcentage',
        "cible"       numeric(12,2) NOT NULL,
        "seuil"       numeric(12,2),
        "sens"        "indicateurs_qualite_sens_enum" NOT NULL DEFAULT 'hausse_bonne',
        "description" text,
        "actif"       boolean NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_indicateurs_qualite" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_indicateurs_qualite_tenantId" ON "indicateurs_qualite" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_indicateurs_qualite_domaine" ON "indicateurs_qualite" ("domaine")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_indicateurs_qualite_tenant_code" ON "indicateurs_qualite" ("tenantId","code")`,
    );

    // ── mesures_indicateur ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mesures_indicateur" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"     character varying NOT NULL,
        "indicateurId" uuid NOT NULL,
        "typePeriode"  "mesures_indicateur_typeperiode_enum" NOT NULL DEFAULT 'mois',
        "periode"      character varying NOT NULL,
        "valeur"       numeric(12,2) NOT NULL,
        "dateMesure"   date NOT NULL,
        "statut"       "mesures_indicateur_statut_enum" NOT NULL DEFAULT 'atteint',
        "commentaire"  text,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mesures_indicateur" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mesures_indicateur_tenantId" ON "mesures_indicateur" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mesures_indicateur_indicateurId" ON "mesures_indicateur" ("indicateurId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_mesures_indicateur_tenant_ind_periode" ON "mesures_indicateur" ("tenantId","indicateurId","periode")`,
    );

    // ── criteres_accreditation ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "criteres_accreditation" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId"       character varying NOT NULL,
        "referentiel"    character varying NOT NULL,
        "chapitre"       character varying,
        "exigence"       text NOT NULL,
        "statut"         "criteres_accreditation_statut_enum" NOT NULL DEFAULT 'non_conforme',
        "preuve"         text,
        "responsableRef" character varying,
        "echeance"       date,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_criteres_accreditation" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_criteres_accreditation_tenantId" ON "criteres_accreditation" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_criteres_accreditation_referentiel" ON "criteres_accreditation" ("referentiel")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_criteres_accreditation_statut" ON "criteres_accreditation" ("statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "criteres_accreditation"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mesures_indicateur"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "indicateurs_qualite"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "criteres_accreditation_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mesures_indicateur_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mesures_indicateur_typeperiode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "indicateurs_qualite_sens_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "indicateurs_qualite_unite_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "indicateurs_qualite_domaine_enum"`);
  }
}
