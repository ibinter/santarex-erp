import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la colonne `quizJson` (jsonb) à `academie_ressources` : elle stocke le
 * contenu réel des quiz de l'Académie (questions, options, bonnes réponses,
 * explications) pour les ressources de type `quiz`.
 *
 * 100 % idempotente : `ADD COLUMN IF NOT EXISTS`. Rejouable sans erreur et
 * compatible `synchronize:true`. Modèle : CreateAcademieTables1750000001100.
 */
export class AddAcademieQuizJson1750000001400 implements MigrationInterface {
  name = 'AddAcademieQuizJson1750000001400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academie_ressources" ADD COLUMN IF NOT EXISTS "quizJson" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "academie_ressources" DROP COLUMN IF EXISTS "quizJson"`,
    );
  }
}
