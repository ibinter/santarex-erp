import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les tables du module « tiers-payant / bordereaux assurances » :
 *  - `tp_bordereaux`        (bordereaux de remboursement par assureur)
 *  - `tp_lignes_bordereau`  (lignes = actes couverts)
 * et le type enum Postgres du statut. 100 % idempotente : `CREATE TABLE IF NOT
 * EXISTS`, enum créé via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`.
 * Rejouable sans erreur et compatible avec `synchronize:true` en développement.
 *
 * Colonnes en camelCase (stratégie de nommage TypeORM par défaut), donc entre
 * guillemets doubles. `assureurId` référence `assureurs` (module prise-en-charge)
 * sans FK dure — modules découplés.
 */
export class CreateTiersPayantTables1750000003300
  implements MigrationInterface
{
  name = 'CreateTiersPayantTables1750000003300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tp_bordereaux_statut_enum') THEN
          CREATE TYPE "tp_bordereaux_statut_enum" AS ENUM (
            'brouillon','emis','envoye','paye_partiel','paye','rejete'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tp_bordereaux" (
        "id"                  uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero"              character varying NOT NULL,
        "assureurId"          character varying NOT NULL,
        "periodeDebut"        TIMESTAMP WITH TIME ZONE NOT NULL,
        "periodeFin"          TIMESTAMP WITH TIME ZONE NOT NULL,
        "montantTotalCouvert" numeric(14,2) NOT NULL DEFAULT 0,
        "nbActes"             integer NOT NULL DEFAULT 0,
        "statut"              "tp_bordereaux_statut_enum" NOT NULL DEFAULT 'brouillon',
        "dateEmission"        TIMESTAMP WITH TIME ZONE,
        "dateEnvoi"           TIMESTAMP WITH TIME ZONE,
        "montantPaye"         numeric(14,2) NOT NULL DEFAULT 0,
        "datePaiement"        TIMESTAMP WITH TIME ZONE,
        "reference"           character varying,
        "motifRejet"          text,
        "notes"               text,
        "tenantId"            character varying NOT NULL,
        "createdById"         character varying NOT NULL,
        "createdAt"           TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tp_bordereaux" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tp_bordereaux_tenant_numero" ON "tp_bordereaux" ("tenantId","numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tp_bordereaux_numero" ON "tp_bordereaux" ("numero")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tp_bordereaux_assureur" ON "tp_bordereaux" ("assureurId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tp_bordereaux_tenant" ON "tp_bordereaux" ("tenantId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tp_lignes_bordereau" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "bordereauId"    uuid NOT NULL,
        "factureRef"     character varying,
        "patientNom"     character varying NOT NULL,
        "acte"           character varying NOT NULL,
        "dateActe"       TIMESTAMP WITH TIME ZONE NOT NULL,
        "montantTotal"   numeric(14,2) NOT NULL DEFAULT 0,
        "tauxCouverture" numeric(5,2) NOT NULL DEFAULT 0,
        "montantCouvert" numeric(14,2) NOT NULL DEFAULT 0,
        "numeroBPC"      character varying,
        "tenantId"       character varying NOT NULL,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tp_lignes_bordereau" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tp_lignes_bordereau_bordereau" FOREIGN KEY ("bordereauId")
          REFERENCES "tp_bordereaux"("id") ON DELETE CASCADE
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tp_lignes_bordereau" ON "tp_lignes_bordereau" ("bordereauId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tp_lignes_tenant" ON "tp_lignes_bordereau" ("tenantId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tp_lignes_bordereau"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tp_bordereaux"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tp_bordereaux_statut_enum"`);
  }
}
