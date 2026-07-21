import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du CRM éditeur IBIG SOFT (`crm_prospects`,
 * `crm_demandes_demo`) et leurs types enum Postgres (préfixe `crm_`).
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums via
 * `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`.
 *
 * Noms de colonnes en camelCase (stratégie TypeORM par défaut), entre
 * guillemets doubles. Modèle : CreatePaymentsTables1750000000000 /
 * CreateDocVerifications1750000000600.
 */
export class CreateCrmTables1750000000700 implements MigrationInterface {
  name = 'CreateCrmTables1750000000700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_prospects_origine_enum') THEN
          CREATE TYPE "crm_prospects_origine_enum" AS ENUM (
            'landing','manuel','referencement','salon','recommandation','autre'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_prospects_statut_enum') THEN
          CREATE TYPE "crm_prospects_statut_enum" AS ENUM (
            'nouveau','a_contacter','contacte','qualifie','demo_prevue',
            'demo_realisee','offre_envoyee','negociation','gagne','perdu'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_demandes_demo_statut_enum') THEN
          CREATE TYPE "crm_demandes_demo_statut_enum" AS ENUM (
            'demandee','planifiee','realisee','annulee'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_demandes_demo_modedemo_enum') THEN
          CREATE TYPE "crm_demandes_demo_modedemo_enum" AS ENUM (
            'visio','presentiel','telephone'
          );
        END IF;
      END $$;`);

    // ── crm_prospects ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_prospects" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nom"             character varying NOT NULL,
        "prenom"          character varying,
        "entreprise"      character varying,
        "fonction"        character varying,
        "email"           character varying NOT NULL,
        "telephone"       character varying,
        "whatsapp"        character varying,
        "pays"            character varying,
        "secteur"         character varying,
        "taille"          character varying,
        "logiciel"        character varying,
        "besoin"          text,
        "budgetIndicatif" character varying,
        "origine"         "crm_prospects_origine_enum" NOT NULL DEFAULT 'manuel',
        "statut"          "crm_prospects_statut_enum" NOT NULL DEFAULT 'nouveau',
        "score"           integer NOT NULL DEFAULT 0,
        "consentement"    boolean NOT NULL DEFAULT false,
        "notes"           text,
        "prochaineAction" character varying,
        "dateRelance"     TIMESTAMP WITH TIME ZONE,
        "agentAssigne"    character varying,
        "tenantId"        character varying,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crm_prospects" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_prospects_email" ON "crm_prospects" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_prospects_origine" ON "crm_prospects" ("origine")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_prospects_statut" ON "crm_prospects" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_prospects_tenantId" ON "crm_prospects" ("tenantId")`,
    );

    // ── crm_demandes_demo ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "crm_demandes_demo" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prospectId"    uuid NOT NULL,
        "dateSouhaitee" TIMESTAMP WITH TIME ZONE,
        "modeDemo"      "crm_demandes_demo_modedemo_enum" NOT NULL DEFAULT 'visio',
        "statut"        "crm_demandes_demo_statut_enum" NOT NULL DEFAULT 'demandee',
        "agentAssigne"  character varying,
        "lienVisio"     text,
        "compteRendu"   text,
        "tenantCree"    character varying,
        "tenantId"      character varying,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_crm_demandes_demo" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_demandes_demo_prospectId" ON "crm_demandes_demo" ("prospectId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_demandes_demo_statut" ON "crm_demandes_demo" ("statut")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_crm_demandes_demo_tenantId" ON "crm_demandes_demo" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_demandes_demo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "crm_prospects"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_demandes_demo_modedemo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_demandes_demo_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_prospects_statut_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "crm_prospects_origine_enum"`);
  }
}
