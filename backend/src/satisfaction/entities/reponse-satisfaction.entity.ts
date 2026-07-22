import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Réponse individuelle à une question (stockée en `jsonb`). La valeur est typée
 * librement (number pour les notes, boolean pour oui/non, string pour texte/choix).
 */
export interface ReponseItem {
  questionId: string;
  valeur: number | string | boolean | null;
}

/**
 * Réponse d'un patient (ou anonyme) à un questionnaire de satisfaction.
 * `scoreGlobal` est calculé côté service à partir des questions de type note,
 * ramené sur l'échelle du questionnaire (/5 ou /10). `recommande` porte l'axe NPS.
 */
@Entity('satisfaction_reponses')
export class ReponseSatisfaction {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Index()
  @Column()
  questionnaireId: string;

  @ApiPropertyOptional({ description: 'Patient concerné (nullable = anonyme)' })
  @Index()
  @Column({ nullable: true })
  patientId: string | null;

  @ApiPropertyOptional({ description: 'Service / unité concerné', example: 'Maternité' })
  @Index()
  @Column({ nullable: true })
  serviceConcerne: string | null;

  @ApiProperty({ description: 'Date de la réponse' })
  @Column({ type: 'timestamptz' })
  dateReponse: Date;

  @ApiProperty({ description: 'Réponses aux questions', type: 'array' })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  reponses: ReponseItem[];

  @ApiPropertyOptional({ description: 'Score global calculé (/echelleMax du questionnaire)' })
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  scoreGlobal: number | null;

  @ApiPropertyOptional({ description: 'Commentaire libre du répondant' })
  @Column({ type: 'text', nullable: true })
  commentaireLibre: string | null;

  @ApiPropertyOptional({ description: 'Recommanderait l\'établissement (axe NPS)' })
  @Column({ type: 'boolean', nullable: true })
  recommande: boolean | null;

  @ApiProperty()
  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
