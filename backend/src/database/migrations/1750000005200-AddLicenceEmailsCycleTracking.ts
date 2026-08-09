import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la colonne d'idempotence du cycle d'emails de licence
 * (cahier IBIG v1.1, §5.4 / §8.6 / §8.8).
 *
 *   licences.emailsCycleEnvoyesJson : jsonb NOT NULL DEFAULT '[]'
 *
 * Elle mémorise la liste des jalons du cycle déjà notifiés à l'admin du tenant
 * (ex. ['j1','j3','j1_final','j0','j7','j60','j83']) afin que le scheduler
 * `LicenceEmailsScheduler` ne renvoie JAMAIS deux fois le même e-mail.
 *
 * 100 % idempotente (`ADD COLUMN IF NOT EXISTS`) : rejouable sans erreur et
 * compatible avec `synchronize:true` en développement.
 */
export class AddLicenceEmailsCycleTracking1750000005200
  implements MigrationInterface
{
  name = 'AddLicenceEmailsCycleTracking1750000005200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "licences" ADD COLUMN IF NOT EXISTS "emailsCycleEnvoyesJson" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "licences" DROP COLUMN IF EXISTS "emailsCycleEnvoyesJson"`,
    );
  }
}
