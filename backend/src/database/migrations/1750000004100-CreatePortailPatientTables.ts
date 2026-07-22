import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée la table du module PORTAIL PATIENT :
 *  - `acces_portail` : identifiants de connexion patient (isolés de `users`),
 *    mot de passe haché bcrypt, activation, dernier accès, multi-tenant.
 *
 * 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, index `IF NOT EXISTS`.
 * Rejouable sans erreur et compatible `synchronize:true`.
 * Colonnes en camelCase (stratégie TypeORM par défaut), entre guillemets doubles.
 */
export class CreatePortailPatientTables1750000004100
  implements MigrationInterface
{
  name = 'CreatePortailPatientTables1750000004100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "acces_portail" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patientId"         character varying NOT NULL,
        "identifiant"       character varying NOT NULL,
        "motDePasseHash"    character varying NOT NULL,
        "actif"             boolean NOT NULL DEFAULT true,
        "dateDernierAcces"  TIMESTAMP WITH TIME ZONE,
        "tenantId"          character varying NOT NULL,
        "createdAt"         TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_acces_portail" PRIMARY KEY ("id")
      )`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_acces_portail_patientId" ON "acces_portail" ("patientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_acces_portail_tenantId" ON "acces_portail" ("tenantId")`,
    );
    // Unicité de l'identifiant de connexion par établissement.
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_acces_portail_tenant_identifiant" ON "acces_portail" ("tenantId","identifiant")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "acces_portail"`);
  }
}
