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
 * Point de partogramme (surveillance du travail). Chaque ligne représente une
 * observation horaire durant le travail, rattachée à un dossier de grossesse
 * (et éventuellement à un accouchement).
 */
@Entity('mat_surveillances_travail')
export class SurveillanceTravail {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du dossier de grossesse' })
  @Index()
  @Column()
  dossierId: string;

  @ApiPropertyOptional({ description: 'ID de l\'accouchement associé' })
  @Index()
  @Column({ nullable: true })
  accouchementId: string;

  @ApiProperty({ description: 'Heure de l\'observation' })
  @Column({ type: 'timestamptz' })
  heure: Date;

  @ApiPropertyOptional({ description: 'Dilatation du col en cm (0-10)' })
  @Column({ type: 'int', nullable: true })
  dilatationCol: number;

  @ApiPropertyOptional({ description: 'Descente de la présentation (niveau, en cm ou station)' })
  @Column({ nullable: true })
  descentePresentation: string;

  @ApiPropertyOptional({ description: 'Fréquence des contractions (nombre / 10 min)' })
  @Column({ type: 'int', nullable: true })
  frequenceContractions: number;

  @ApiPropertyOptional({ description: 'Rythme cardiaque fœtal (bpm)' })
  @Column({ type: 'int', nullable: true })
  rythmeCardiaqueFoetal: number;

  @ApiPropertyOptional({ description: 'Observations' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
