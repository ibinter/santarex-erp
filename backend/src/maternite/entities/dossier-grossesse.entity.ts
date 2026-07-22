import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutGrossesse {
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
}

export enum Rhesus {
  POSITIF = 'positif',
  NEGATIF = 'negatif',
}

/**
 * Dossier de suivi d'une grossesse. Racine du module Maternité : chaque CPN,
 * accouchement, point de partogramme et suivi post-natal se rattache à un
 * dossier via `dossierId`.
 */
@Entity('mat_dossiers_grossesse')
export class DossierGrossesse {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'MAT-2026-00001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty({ description: 'ID de la patiente (dossier patient)' })
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'Date des dernières règles (DDR)' })
  @Column({ type: 'date' })
  ddr: string;

  @ApiPropertyOptional({ description: 'Date prévue d\'accouchement (calculée : DDR + 280 jours)' })
  @Column({ type: 'date', nullable: true })
  dpa: string;

  @ApiProperty({ default: 1, description: 'Gestité (nombre total de grossesses)' })
  @Column({ type: 'int', default: 1 })
  gestite: number;

  @ApiProperty({ default: 0, description: 'Parité (nombre d\'accouchements)' })
  @Column({ type: 'int', default: 0 })
  parite: number;

  @ApiProperty({ default: 0, description: 'Nombre d\'avortements / fausses couches' })
  @Column({ type: 'int', default: 0 })
  avortements: number;

  @ApiPropertyOptional({ description: 'Groupe sanguin (A, B, AB, O)' })
  @Column({ nullable: true })
  groupeSanguin: string;

  @ApiPropertyOptional({ enum: Rhesus })
  @Column({ type: 'enum', enum: Rhesus, nullable: true })
  rhesus: Rhesus;

  @ApiPropertyOptional({ description: 'Antécédents médicaux, chirurgicaux et obstétricaux' })
  @Column({ type: 'text', nullable: true })
  antecedents: string;

  @ApiProperty({ default: false, description: 'Grossesse à risque' })
  @Column({ default: false })
  grossesseARisque: boolean;

  @ApiPropertyOptional({ description: 'Motif du classement à risque' })
  @Column({ type: 'text', nullable: true })
  motifRisque: string;

  @ApiProperty({ enum: StatutGrossesse, default: StatutGrossesse.EN_COURS })
  @Column({ type: 'enum', enum: StatutGrossesse, default: StatutGrossesse.EN_COURS })
  statut: StatutGrossesse;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @Column({ type: 'text', nullable: true })
  notes: string;

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
