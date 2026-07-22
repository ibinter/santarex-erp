import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BordereauTiersPayant } from './bordereau-tiers-payant.entity';

/**
 * Ligne d'un bordereau : un acte couvert à rembourser. `factureRef` et
 * `numeroBPC` sont des références libres vers facturation / prise-en-charge
 * (pas de FK dure — modules découplés).
 */
@Entity('tp_lignes_bordereau')
export class LigneBordereau {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  bordereauId: string;

  @ManyToOne(() => BordereauTiersPayant, (b) => b.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bordereauId' })
  bordereau: BordereauTiersPayant;

  @ApiPropertyOptional({ description: 'Référence facture (facturation.factures)' })
  @Column({ nullable: true })
  factureRef: string;

  @ApiProperty({ description: 'Nom du patient' })
  @Column()
  patientNom: string;

  @ApiProperty({ description: 'Libellé de l\'acte / prestation' })
  @Column()
  acte: string;

  @ApiProperty({ description: 'Date de l\'acte' })
  @Column({ type: 'timestamptz' })
  dateActe: Date;

  @ApiProperty({ description: 'Montant total de l\'acte (XOF)' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  montantTotal: number;

  @ApiProperty({ description: 'Taux de couverture appliqué (%)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tauxCouverture: number;

  @ApiProperty({ description: 'Montant couvert à rembourser (XOF)' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  montantCouvert: number;

  @ApiPropertyOptional({ description: 'Numéro de bon de prise en charge lié' })
  @Column({ nullable: true })
  numeroBPC: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
