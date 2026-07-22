import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutPlanSoins {
  ACTIF = 'actif',
  ATTEINT = 'atteint',
  ARRETE = 'arrete',
}

/**
 * Plan de soins (démarche de soins infirmiers) : diagnostic infirmier,
 * objectif de soin, interventions planifiées, échéance et statut de suivi.
 */
@Entity('soins_plans')
export class PlanSoins {
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

  @ApiProperty({ description: 'Diagnostic infirmier' })
  @Column({ type: 'text' })
  diagnostic: string;

  @ApiProperty({ description: 'Objectif de soin visé' })
  @Column({ type: 'text' })
  objectif: string;

  @ApiPropertyOptional({ description: 'Interventions / actions planifiées' })
  @Column({ type: 'text', nullable: true })
  interventions: string;

  @ApiPropertyOptional({ description: 'Échéance / date cible' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  echeance: Date;

  @ApiProperty({ enum: StatutPlanSoins, description: 'Statut du plan' })
  @Column({ type: 'enum', enum: StatutPlanSoins, default: StatutPlanSoins.ACTIF })
  statut: StatutPlanSoins;

  @ApiProperty({ description: 'ID de l\'infirmier référent' })
  @Column()
  infirmierRef: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
