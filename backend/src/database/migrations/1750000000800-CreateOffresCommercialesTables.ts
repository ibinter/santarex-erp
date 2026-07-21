import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table du module « offres commerciales » (DEVIS) — préfixe `offre_com_`
 * — et son type enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`,
 * enum créé via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Rejouable sans
 * erreur et compatible avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie de nommage TypeORM par défaut), donc entre
 * guillemets doubles. Types (jsonb, timestamptz, int) reproduisent l'entité
 * `src/offres-commerciales/entities/offre-commerciale.entity.ts`.
 */
export class CreateOffresCommercialesTables1750000000800
  implements MigrationInterface
{
  name = 'CreateOffresCommercialesTables1750000000800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offre_com_offres_statut_enum') THEN
          CREATE TYPE "offre_com_offres_statut_enum" AS ENUM (
            'brouillon','envoyee','acceptee','refusee','expiree'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offre_com_offres" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"           character varying NOT NULL,
        "prospectId"       character varying,
        "clientNom"        character varying NOT NULL,
        "clientEmail"      character varying NOT NULL,
        "logiciel"         character varying NOT NULL DEFAULT 'SANTAREX ERP',
        "formule"          character varying,
        "modules"          jsonb NOT NULL DEFAULT '[]',
        "nbUtilisateurs"   integer NOT NULL DEFAULT 1,
        "nbSites"          integer NOT NULL DEFAULT 1,
        "duree"            character varying,
        "devise"           character varying NOT NULL DEFAULT 'XOF',
        "prixHT"           integer NOT NULL DEFAULT 0,
        "remise"           integer NOT NULL DEFAULT 0,
        "taxes"            integer NOT NULL DEFAULT 0,
        "prixTTC"          integer NOT NULL DEFAULT 0,
        "options"          jsonb NOT NULL DEFAULT '[]',
        "formation"        text,
        "migration"        text,
        "accompagnement"   text,
        "echeancier"       jsonb NOT NULL DEFAULT '[]',
        "dateValidite"     TIMESTAMP WITH TIME ZONE,
        "conditions"       text,
        "notes"            text,
        "statut"           "offre_com_offres_statut_enum" NOT NULL DEFAULT 'brouillon',
        "tokenAcceptation" character varying NOT NULL,
        "acceptedAt"       TIMESTAMP WITH TIME ZONE,
        "createdById"      character varying,
        "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offre_com_offres" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_offre_com_offres_numero" UNIQUE ("numero"),
        CONSTRAINT "UQ_offre_com_offres_token" UNIQUE ("tokenAcceptation")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_offre_com_offres_numero" ON "offre_com_offres" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_offre_com_offres_token" ON "offre_com_offres" ("tokenAcceptation")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_offre_com_offres_statut" ON "offre_com_offres" ("statut")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "offre_com_offres"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "offre_com_offres_statut_enum"`,
    );
  }
}
