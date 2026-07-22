import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutBonCommande {
  BROUILLON = 'brouillon',
  ENVOYEE = 'envoyee',
  PARTIELLEMENT_RECUE = 'partiellement_recue',
  RECUE = 'recue',
  ANNULEE = 'annulee',
}

@Entity('appro_bons_commande')
export class BonCommande {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BC-2026-0001', description: 'Numéro auto-généré par tenant et par année' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  fournisseurId: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateCommande: Date;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateLivraisonPrevue: Date;

  @ApiProperty({ enum: StatutBonCommande, default: StatutBonCommande.BROUILLON })
  @Column({ type: 'enum', enum: StatutBonCommande, default: StatutBonCommande.BROUILLON })
  statut: StatutBonCommande;

  @ApiProperty({ type: 'number', format: 'decimal', description: 'Montant total calculé à partir des lignes' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantTotal: number;

  @ApiProperty({ default: 'XOF' })
  @Column({ default: 'XOF' })
  devise: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

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
