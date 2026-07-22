import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables `consentement_modeles` (référentiel des formulaires) et
 * `consentements` (consentements éclairés signés — enjeu médico-légal) ainsi
 * que leurs types enum Postgres.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Colonnes camelCase entre guillemets doubles.
 * Modèle : CreateIncidentsQualiteTables1750000002000.
 */
export class CreateConsentementsTables1750000002400
  implements MigrationInterface
{
  name = 'CreateConsentementsTables1750000002400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consentement_modeles_type_enum') THEN
          CREATE TYPE "consentement_modeles_type_enum" AS ENUM (
            'chirurgie','anesthesie','transfusion','acte_invasif','soins','recherche'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consentements_type_enum') THEN
          CREATE TYPE "consentements_type_enum" AS ENUM (
            'chirurgie','anesthesie','transfusion','acte_invasif','soins','recherche'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consentements_statut_enum') THEN
          CREATE TYPE "consentements_statut_enum" AS ENUM (
            'a_signer','signe','refuse','revoque'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consentements_signatairelien_enum') THEN
          CREATE TYPE "consentements_signatairelien_enum" AS ENUM (
            'patient','parent','tuteur','representant_legal','conjoint','autre'
          );
        END IF;
      END $$;`);

    // ── consentement_modeles ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consentement_modeles" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type"         "consentement_modeles_type_enum" NOT NULL,
        "titre"        character varying NOT NULL,
        "description"  text,
        "texteModele"  text NOT NULL,
        "actif"        boolean NOT NULL DEFAULT true,
        "tenantId"     character varying NOT NULL,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consentement_modeles" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentement_modeles_tenantId" ON "consentement_modeles" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentement_modeles_type" ON "consentement_modeles" ("type")`,
    );

    // ── consentements ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "consentements" (
        "id"                 uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"             character varying NOT NULL,
        "patientId"          character varying NOT NULL,
        "modeleId"           uuid,
        "type"               "consentements_type_enum" NOT NULL,
        "acteConcerne"       character varying NOT NULL,
        "titre"              character varying NOT NULL,
        "texteConsentement"  text NOT NULL,
        "medecinRef"         character varying,
        "interventionId"     uuid,
        "statut"             "consentements_statut_enum" NOT NULL DEFAULT 'a_signer',
        "dateSignature"      TIMESTAMP WITH TIME ZONE,
        "signataireNom"      character varying,
        "signataireLien"     "consentements_signatairelien_enum",
        "patientMineur"      boolean NOT NULL DEFAULT false,
        "temoinNom"          character varying,
        "motif"              text,
        "dateRevocation"     TIMESTAMP WITH TIME ZONE,
        "observations"       text,
        "tenantId"           character varying NOT NULL,
        "createdById"        character varying NOT NULL,
        "createdAt"          TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"          TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consentements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_consentements_numero" UNIQUE ("numero")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_tenantId" ON "consentements" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_patientId" ON "consentements" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_statut" ON "consentements" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_type" ON "consentements" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_modeleId" ON "consentements" ("modeleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_interventionId" ON "consentements" ("interventionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_consentements_medecinRef" ON "consentements" ("medecinRef")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "consentements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consentement_modeles"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consentements_signatairelien_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consentements_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consentements_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consentement_modeles_type_enum"`);
  }
}
