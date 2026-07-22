import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModeAccouchement {
  VOIE_BASSE = 'voie_basse',
  CESARIENNE = 'cesarienne',
  INSTRUMENTAL = 'instrumental',
}

export enum SexeNouveauNe {
  MASCULIN = 'masculin',
  FEMININ = 'feminin',
}

/**
 * Accouchement rattaché à un dossier de grossesse. La création d'un
 * accouchement clôt en principe le dossier (statut → terminée).
 */
@Entity('mat_accouchements')
export class Accouchement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du dossier de grossesse' })
  @Index()
  @Column()
  dossierId: string;

  @ApiProperty({ description: 'Date et heure de l\'accouchement' })
  @Column({ type: 'timestamptz' })
  dateHeure: Date;

  @ApiProperty({ enum: ModeAccouchement })
  @Column({ type: 'enum', enum: ModeAccouchement, default: ModeAccouchement.VOIE_BASSE })
  mode: ModeAccouchement;

  @ApiPropertyOptional({ description: 'Présentation (céphalique, siège, transverse…)' })
  @Column({ nullable: true })
  presentation: string;

  @ApiPropertyOptional({ description: 'Délivrance (naturelle, dirigée, artificielle)' })
  @Column({ nullable: true })
  delivrance: string;

  @ApiPropertyOptional({ description: 'État du périnée (intact, déchirure, épisiotomie)' })
  @Column({ nullable: true })
  etatPerinee: string;

  @ApiPropertyOptional({ enum: SexeNouveauNe })
  @Column({ type: 'enum', enum: SexeNouveauNe, nullable: true })
  sexeNouveauNe: SexeNouveauNe;

  @ApiPropertyOptional({ description: 'Poids du nouveau-né en grammes' })
  @Column({ type: 'int', nullable: true })
  poidsNouveauNe: number;

  @ApiPropertyOptional({ description: 'Score APGAR à 1 minute (0-10)' })
  @Column({ type: 'int', nullable: true })
  apgar1: number;

  @ApiPropertyOptional({ description: 'Score APGAR à 5 minutes (0-10)' })
  @Column({ type: 'int', nullable: true })
  apgar5: number;

  @ApiPropertyOptional({ description: 'Complications éventuelles' })
  @Column({ type: 'text', nullable: true })
  complications: string;

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
