import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table du module « Activation assistée » (section 19.6) :
 *   • cles_activation — clés d'activation (code non prévisible, offre, durée,
 *     tenant réservataire nullable, statut, expiration, traçabilité de lot).
 *
 * 100 % idempotente (CREATE ... IF NOT EXISTS + enum gardé par bloc DO) :
 * rejouable sans erreur et compatible avec `synchronize:true` en développement.
 */
export class CreateClesActivationTables1750000004700 implements MigrationInterface {
  name = 'CreateClesActivationTables1750000004700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cles_activation_statut_enum" AS ENUM ('active', 'utilisee', 'revoquee', 'expiree');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cles_activation" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "offreCode" character varying NOT NULL,
        "dureeJours" integer NOT NULL DEFAULT 30,
        "tenantSlug" character varying,
        "statut" "cles_activation_statut_enum" NOT NULL DEFAULT 'active',
        "dateExpiration" TIMESTAMP WITH TIME ZONE,
        "dateUtilisation" TIMESTAMP WITH TIME ZONE,
        "utiliseeParTenant" character varying,
        "licenceId" uuid,
        "lot" character varying NOT NULL,
        "creeParId" uuid,
        "motifRevocation" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cles_activation" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cles_activation_code" UNIQUE ("code")
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cles_activation_code" ON "cles_activation" ("code");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cles_activation_lot" ON "cles_activation" ("lot");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cles_activation_statut" ON "cles_activation" ("statut");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cles_activation_tenant" ON "cles_activation" ("tenantSlug");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_cles_activation_offre" ON "cles_activation" ("offreCode");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cles_activation";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cles_activation_statut_enum";`);
  }
}
