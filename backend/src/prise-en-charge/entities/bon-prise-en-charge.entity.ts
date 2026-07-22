import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutBon {
  BROUILLON = 'brouillon',
  DEMANDE_ENVOYEE = 'demande_envoyee',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire',
}

@Entity('bons_prise_en_charge')
export class BonPriseEnCharge {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BPC-2026-0001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty()
  @Index()
  @Column()
  assureurId: string;

  @ApiPropertyOptional({ description: "Numéro d'assuré / de police" })
  @Column({ nullable: true })
  numeroAssure: string;

  @ApiProperty({ description: 'Acte / prestation demandée' })
  @Column()
  prestation: string;

  @ApiPropertyOptional({ description: 'Détail / justification médicale' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Montant estimé de l\'acte (XOF)' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantEstime: number;

  @ApiProperty({ description: 'Taux de couverture appliqué (%)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tauxCouverture: number;

  @ApiProperty({ description: 'Montant couvert calculé (XOF)' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantCouvert: number;

  @ApiProperty({ enum: StatutBon })
  @Column({ type: 'enum', enum: StatutBon, default: StatutBon.BROUILLON })
  statut: StatutBon;

  @ApiPropertyOptional({ description: "Numéro d'autorisation reçu de l'assureur" })
  @Column({ nullable: true })
  numeroAutorisation: string;

  @ApiPropertyOptional({ description: 'Date de validité de l\'autorisation' })
  @Column({ type: 'timestamptz', nullable: true })
  dateValidite: Date;

  @ApiPropertyOptional({ description: 'Motif du refus' })
  @Column({ type: 'text', nullable: true })
  motifRefus: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateEnvoi: Date;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateReponse: Date;

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

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
