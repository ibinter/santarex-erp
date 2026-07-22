import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EchelleDouleur {
  EVA = 'EVA', // Échelle Visuelle Analogique (0-10)
  EN = 'EN', // Échelle Numérique (0-10)
  CPOT = 'CPOT', // Critical-Care Pain Observation Tool (0-8)
  EVENDOL = 'EVENDOL', // Évaluation Enfant Douleur (0-15)
}

/**
 * Évaluation de la douleur selon une échelle validée (EVA, EN, CPOT, EVENDOL).
 * Le score est interprété (léger / modéré / intense) côté service selon l'échelle.
 */
@Entity('soins_evaluations_douleur')
export class EvaluationDouleur {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du patient' })
  @Index()
  @Column()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation (optionnel)' })
  @Index()
  @Column({ nullable: true })
  sejourId: string;

  @ApiProperty({ description: 'Date et heure de l\'évaluation' })
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @ApiProperty({ enum: EchelleDouleur, description: 'Échelle utilisée' })
  @Column({ type: 'enum', enum: EchelleDouleur, default: EchelleDouleur.EVA })
  echelle: EchelleDouleur;

  @ApiProperty({ description: 'Score obtenu sur l\'échelle' })
  @Column({ type: 'int' })
  score: number;

  @ApiPropertyOptional({ description: 'Localisation de la douleur' })
  @Column({ type: 'varchar', nullable: true })
  localisation: string;

  @ApiPropertyOptional({ description: 'Traitement antalgique administré' })
  @Column({ type: 'text', nullable: true })
  traitementAdministre: string;

  @ApiPropertyOptional({ description: 'Date/heure de réévaluation prévue ou effectuée' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  reevaluation: Date;

  @ApiProperty({ description: 'ID de l\'infirmier évaluateur' })
  @Column()
  infirmierRef: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;
}
