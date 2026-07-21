import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute les colonnes de réinitialisation de mot de passe à la table `users` :
 *  - `resetToken`       : hash bcrypt du token de réinitialisation (jamais le token en clair) ;
 *  - `resetTokenExpiry` : date d'expiration du token (now + 1h à la génération).
 *
 * 100 % idempotente (`ADD COLUMN IF NOT EXISTS`) : rejouable sans erreur et
 * compatible avec `synchronize:true` en développement.
 */
export class AddUserResetToken1750000001300 implements MigrationInterface {
  name = 'AddUserResetToken1750000001300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "resetTokenExpiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "resetToken"`,
    );
  }
}
