import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('appro_lignes_commande')
export class LigneCommande {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  bonCommandeId: string;

  @ApiProperty({ example: 'Amoxicilline 500mg comprimé' })
  @Column()
  designation: string;

  @ApiPropertyOptional({
    description:
      'Lien optionnel vers un médicament du module pharmacie (entité Medicament). Null = article libre / consommable.',
  })
  @Index()
  @Column({ nullable: true })
  medicamentId: string;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  quantiteCommandee: number;

  @ApiProperty({ default: 0, description: 'Quantité effectivement reçue (cumulée) lors des réceptions' })
  @Column({ default: 0 })
  quantiteRecue: number;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  prixUnitaire: number;

  @ApiProperty({ type: 'number', format: 'decimal', description: 'quantiteCommandee * prixUnitaire' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantLigne: number;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
