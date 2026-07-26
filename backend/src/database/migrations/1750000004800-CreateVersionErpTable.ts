import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table `version_erp` (changelog produit + « Quoi de neuf ») et
 * insère 2-3 versions réelles reflétant le travail récent sur SANTAREX.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enum via `DO $$ … IF NOT EXISTS`,
 * index `IF NOT EXISTS`, seed via `ON CONFLICT (version) DO NOTHING`.
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets doubles.
 */
export class CreateVersionErpTable1750000004800 implements MigrationInterface {
  name = 'CreateVersionErpTable1750000004800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'version_erp_statut_enum') THEN
          CREATE TYPE "version_erp_statut_enum" AS ENUM ('brouillon','publiee');
        END IF;
      END $$;`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "version_erp" (
        "id"              uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version"         character varying NOT NULL,
        "datePublication" TIMESTAMP,
        "titre"           character varying NOT NULL,
        "nouveautesJson"  jsonb NOT NULL DEFAULT '[]',
        "statut"          "version_erp_statut_enum" NOT NULL DEFAULT 'brouillon',
        "estMajeure"      boolean NOT NULL DEFAULT false,
        "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_version_erp" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_version_erp_version" UNIQUE ("version")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_version_erp_version" ON "version_erp" ("version")`,
    );

    // ── Seed : versions réelles récentes ──────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "version_erp"
        ("version","titre","datePublication","statut","estMajeure","nouveautesJson")
      VALUES
      (
        '2.3.0',
        '28 nouveaux modules hospitaliers',
        '2026-07-24 09:00:00',
        'publiee',
        true,
        '[
          {"texte":"14 → 44 modules : bloc opératoire, maternité, pédiatrie, urgences, HAD, morgue, banque de sang et plus"},
          {"texte":"Nouveau tableau de bord réorganisé par pôles d''activité"},
          {"texte":"Page Abonnement bilingue FR/EN avec formules et modules par formule","formuleMin":"pro"},
          {"texte":"Devis : la conversion en facture crée réellement la facture liée"}
        ]'::jsonb
      ),
      (
        '2.2.0',
        'Recherche patient serveur & correctifs',
        '2026-06-30 09:00:00',
        'publiee',
        false,
        '[
          {"texte":"Recherche patient exécutée côté serveur : instantanée même sur gros volumes"},
          {"texte":"Correctifs de stabilité sur la facturation et la caisse"},
          {"texte":"Amélioration des performances de chargement des listes"}
        ]'::jsonb
      ),
      (
        '2.1.0',
        'CRM & offres commerciales',
        '2026-05-31 09:00:00',
        'publiee',
        false,
        '[
          {"texte":"Module CRM : suivi des prospects et des relances"},
          {"texte":"Offres commerciales et gestion des licences","formuleMin":"entreprise"},
          {"texte":"Exports comptables enrichis"}
        ]'::jsonb
      )
      ON CONFLICT ("version") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "version_erp"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "version_erp_statut_enum"`);
  }
}
