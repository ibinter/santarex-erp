import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LigneBordereau } from './ligne-bordereau.entity';

export enum StatutBordereau {
  BROUILLON = 'brouillon',
  EMIS = 'emis',
  ENVOYE = 'envoye',
  PAYE_PARTIEL = 'paye_partiel',
  PAYE = 'paye',
  REJETE = 'rejete',
}

/**
 * Bordereau de remboursement adressé à un assureur : regroupe, pour une période
 * donnée, l'ensemble des actes couverts (lignes) à rembourser. L'`assureurId`
 * référence `prise-en-charge.assureurs` (pas de FK dure — modules découplés).
 */
@Entity('tp_bordereaux')
@Index(['tenantId', 'numero'], { unique: true })
export class BordereauTiersPayant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BOR-2026-0001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty({ description: "ID de l'assureur (prise-en-charge.assureurs)" })
  @Index()
  @Column()
  assureurId: string;

  @ApiProperty({ description: 'Début de la période couverte' })
  @Column({ type: 'timestamptz' })
  periodeDebut: Date;

  @ApiProperty({ description: 'Fin de la période couverte' })
  @Column({ type: 'timestamptz' })
  periodeFin: Date;

  @ApiProperty({ description: 'Montant total couvert (somme des lignes, XOF)' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  montantTotalCouvert: number;

  @ApiProperty({ description: 'Nombre d\'actes / lignes' })
  @Column({ type: 'int', default: 0 })
  nbActes: number;

  @ApiProperty({ enum: StatutBordereau })
  @Column({ type: 'enum', enum: StatutBordereau, default: StatutBordereau.BROUILLON })
  statut: StatutBordereau;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateEmission: Date;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateEnvoi: Date;

  @ApiProperty({ description: 'Montant déjà payé par l\'assureur (XOF)' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  montantPaye: number;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  datePaiement: Date;

  @ApiPropertyOptional({ description: 'Référence de paiement / virement assureur' })
  @Column({ nullable: true })
  reference: string;

  @ApiPropertyOptional({ description: 'Motif de rejet éventuel' })
  @Column({ type: 'text', nullable: true })
  motifRejet: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @OneToMany(() => LigneBordereau, (l) => l.bordereau)
  lignes: LigneBordereau[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
