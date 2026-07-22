import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Granularité de la période mesurée. */
export enum TypePeriodeMesure {
  MOIS = 'mois',
  TRIMESTRE = 'trimestre',
}

/**
 * Résultat de l'évaluation de la mesure vis-à-vis de la cible/seuil de
 * l'indicateur (calculé côté service selon le sens d'amélioration).
 */
export enum StatutMesure {
  ATTEINT = 'atteint',
  ALERTE = 'alerte',
  CRITIQUE = 'critique',
}

@Entity('mesures_indicateur')
@Index(['tenantId', 'indicateurId', 'periode'], { unique: true })
export class MesureIndicateur {
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
  indicateurId: string;

  @ApiProperty({ enum: TypePeriodeMesure })
  @Column({ type: 'enum', enum: TypePeriodeMesure, default: TypePeriodeMesure.MOIS })
  typePeriode: TypePeriodeMesure;

  @ApiProperty({ example: '2026-01', description: 'Clé de période (AAAA-MM ou AAAA-Tn)' })
  @Column()
  periode: string;

  @ApiProperty()
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  valeur: number;

  @ApiProperty()
  @Column({ type: 'date' })
  dateMesure: string;

  @ApiProperty({ enum: StatutMesure })
  @Column({ type: 'enum', enum: StatutMesure, default: StatutMesure.ATTEINT })
  statut: StatutMesure;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  commentaire: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
