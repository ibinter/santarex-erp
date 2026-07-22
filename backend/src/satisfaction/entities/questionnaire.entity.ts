import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Type de question dans un questionnaire de satisfaction.
 * - note_5 / note_10 : échelle numérique (entre dans le calcul du score global) ;
 * - oui_non : booléen ;
 * - texte : réponse libre ;
 * - choix : liste d'options (`options`).
 */
export enum TypeQuestion {
  NOTE_5 = 'note_5',
  NOTE_10 = 'note_10',
  OUI_NON = 'oui_non',
  TEXTE = 'texte',
  CHOIX = 'choix',
}

/**
 * Définition d'une question (stockée en `jsonb` dans `questions`). L'`id` est
 * stable et sert de clé de rapprochement avec les réponses collectées.
 */
export interface QuestionDef {
  id: string;
  libelle: string;
  type: TypeQuestion;
  /** Options proposées (pertinent uniquement pour `type = choix`). */
  options?: string[];
}

/**
 * Questionnaire / enquête de satisfaction patient. Le barème (max /5 ou /10) est
 * déduit des questions de type note ; on stocke aussi `echelleMax` pour figer le
 * barème d'affichage du questionnaire.
 */
@Entity('satisfaction_questionnaires')
export class Questionnaire {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ example: 'Enquête de satisfaction — sortie hospitalisation' })
  @Column()
  titre: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Liste des questions',
    type: 'array',
    example: [
      { id: 'q1', libelle: 'Accueil', type: 'note_5' },
      { id: 'q2', libelle: 'Recommanderiez-vous notre établissement ?', type: 'oui_non' },
    ],
  })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  questions: QuestionDef[];

  @ApiProperty({ description: 'Barème d\'affichage (5 ou 10)', example: 5 })
  @Column({ type: 'int', default: 5 })
  echelleMax: number;

  @ApiProperty({ description: 'Questionnaire actif (proposé à la collecte)' })
  @Index()
  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
