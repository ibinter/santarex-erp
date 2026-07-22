import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Mode de traitement/destruction appliqué par le prestataire. */
export enum ModeTraitement {
  INCINERATION = 'incineration',
  BANALISATION = 'banalisation',
  ENFOUISSEMENT = 'enfouissement',
}

/** Statut du bordereau de suivi (type BSDASRI). */
export enum StatutEnlevement {
  PLANIFIE = 'planifie',
  ENLEVE = 'enleve',
  TRAITE = 'traite',
}

@Entity('dechets_enlevements')
export class EnlevementDechets {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BSD-2026-0001', description: 'Numéro de bordereau de suivi' })
  @Index()
  @Column()
  bordereauNumero: string;

  @ApiProperty({ example: 'SICOM Environnement', description: 'Prestataire agréé' })
  @Column()
  prestataire: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateEnlevement: Date;

  @ApiProperty({ type: 'number', format: 'decimal', description: 'Poids total enlevé (kg)' })
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  poidsTotal: number;

  @ApiProperty({ enum: ModeTraitement })
  @Column({ type: 'enum', enum: ModeTraitement })
  modeTraitement: ModeTraitement;

  @ApiProperty({ enum: StatutEnlevement, default: StatutEnlevement.ENLEVE })
  @Index()
  @Column({ type: 'enum', enum: StatutEnlevement, default: StatutEnlevement.ENLEVE })
  statut: StatutEnlevement;

  @ApiPropertyOptional({
    description: 'Référence du certificat de destruction (null tant que non traité)',
  })
  @Column({ nullable: true })
  certificatDestruction: string | null;

  @ApiPropertyOptional({ description: 'Date effective de traitement/destruction' })
  @Column({ type: 'timestamptz', nullable: true })
  dateTraitement: Date | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

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
