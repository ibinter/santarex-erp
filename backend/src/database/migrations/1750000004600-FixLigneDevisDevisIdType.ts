import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige un bug bloquant du module Devis : la colonne `lignes_devis.devisId`
 * avait été créée en `character varying` alors que `devis_patient.id` est `uuid`.
 * La jointure `leftJoinAndSelect('d.lignes')` de `GET /devis` échouait donc avec
 * « operator does not exist: character varying = uuid » (500 systématique).
 *
 * Idempotente : ne convertit que si la colonne n'est pas déjà `uuid`.
 */
export class FixLigneDevisDevisIdType1750000004600 implements MigrationInterface {
  name = 'FixLigneDevisDevisIdType1750000004600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'lignes_devis' AND column_name = 'devisId'
            AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "lignes_devis"
            ALTER COLUMN "devisId" TYPE uuid USING NULLIF("devisId", '')::uuid;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lignes_devis"
        ALTER COLUMN "devisId" TYPE character varying USING "devisId"::text;
    `);
  }
}
