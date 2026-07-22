import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MethodeSterilisation {
  AUTOCLAVE = 'autoclave',
  CHALEUR_SECHE = 'chaleur_seche',
  CHIMIQUE = 'chimique',
}

export enum ResultatIndicateur {
  CONFORME = 'conforme',
  NON_CONFORME = 'non_conforme',
}

export enum StatutLot {
  EN_COURS = 'en_cours',
  VALIDE = 'valide',
  REJETE = 'rejete',
  UTILISE = 'utilise',
}

/**
 * Lot de stérilisation : un cycle de stérilisation d'instruments/plateaux.
 * Traçabilité complète (méthode, opérateur, indicateur de conformité —
 * intégrateur / test Bowie-Dick) et péremption de la stérilité.
 */
@Entity('sterilisation_lots')
export class LotSterilisation {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'STE-2026-0001', description: 'Numéro de lot auto-généré' })
  @Column()
  numero: string;

  @ApiProperty({ enum: MethodeSterilisation, description: 'Méthode de stérilisation' })
  @Column({ type: 'enum', enum: MethodeSterilisation, default: MethodeSterilisation.AUTOCLAVE })
  methode: MethodeSterilisation;

  @ApiProperty({ example: 'Plateau chirurgie viscérale (12 instruments)', description: 'Contenu / description des instruments ou plateaux' })
  @Column({ type: 'text' })
  contenu: string;

  @ApiPropertyOptional({ example: 134, description: 'Température du cycle (°C)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  temperature: number;

  @ApiPropertyOptional({ example: 18, description: 'Durée du cycle en minutes' })
  @Column({ type: 'int', nullable: true })
  dureeMin: number;

  @ApiProperty({ description: 'Date/heure du cycle' })
  @Column({ type: 'timestamp with time zone' })
  dateCycle: Date;

  @ApiProperty({ description: 'ID de l\'opérateur ayant conduit le cycle' })
  @Index()
  @Column()
  operateurRef: string;

  @ApiPropertyOptional({ enum: ResultatIndicateur, description: 'Résultat de l\'indicateur (intégrateur / Bowie-Dick)' })
  @Column({ type: 'enum', enum: ResultatIndicateur, nullable: true })
  resultatIndicateur: ResultatIndicateur;

  @ApiProperty({ enum: StatutLot, default: StatutLot.EN_COURS, description: 'Statut du lot' })
  @Column({ type: 'enum', enum: StatutLot, default: StatutLot.EN_COURS })
  statut: StatutLot;

  @ApiPropertyOptional({ description: 'Date de péremption de la stérilité (au-delà : re-stérilisation requise)' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  datePeremptionSterilite: Date;

  @ApiPropertyOptional({ description: 'Observations / commentaire de validation' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiPropertyOptional({ description: 'ID de l\'intervention / usage ayant consommé ce lot' })
  @Column({ nullable: true })
  utiliseParRef: string;

  @ApiPropertyOptional({ description: 'Date d\'utilisation du lot' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  dateUtilisation: Date;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'ID de l\'utilisateur créateur' })
  @Column()
  createdById: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
