import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InterventionType {
  PREVENTIVE = 'preventive',
  CURATIVE = 'curative',
  ETALONNAGE = 'etalonnage',
}

export enum InterventionStatut {
  PLANIFIEE = 'planifiee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
}

@Entity('equip_interventions')
export class InterventionMaintenance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  equipementId: string;

  @ApiProperty({ enum: InterventionType })
  @Column({ type: 'enum', enum: InterventionType, default: InterventionType.CURATIVE })
  type: InterventionType;

  @ApiProperty({ type: 'string', format: 'date' })
  @Column({ type: 'date' })
  date: Date;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ description: 'Référence du technicien interne (userId)' })
  @Column({ nullable: true })
  technicienRef: string;

  @ApiPropertyOptional({ description: 'Prestataire externe' })
  @Column({ nullable: true })
  prestataire: string;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  cout: number;

  @ApiProperty({ default: 'XOF' })
  @Column({ default: 'XOF' })
  devise: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  resultat: string;

  @ApiProperty({ default: 0, description: 'Durée d\'indisponibilité en heures' })
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  dureeIndispoHeures: number;

  @ApiProperty({ enum: InterventionStatut })
  @Column({ type: 'enum', enum: InterventionStatut, default: InterventionStatut.PLANIFIEE })
  statut: InterventionStatut;

  @ApiPropertyOptional({ type: 'string', format: 'date', description: 'Prochaine échéance calculée' })
  @Column({ type: 'date', nullable: true })
  prochaineDate: Date;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
