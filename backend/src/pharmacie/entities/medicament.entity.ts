import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MedicamentForme {
  COMPRIME = 'comprime',
  GELULE = 'gelule',
  SIROP = 'sirop',
  INJECTABLE = 'injectable',
  POMMADE = 'pommade',
  COLLYRE = 'collyre',
  SUPPOSITOIRE = 'suppositoire',
  PATCH = 'patch',
  SPRAY = 'spray',
  AUTRE = 'autre',
}

export enum MedicamentCategorie {
  ANTIBIOTIQUE = 'antibiotique',
  ANTALGIQUE = 'antalgique',
  ANTIHYPERTENSEUR = 'antihypertenseur',
  ANTIDIABETIQUE = 'antidiabetique',
  ANTIPALUDEEN = 'antipaludeen',
  ANTIRETROVIRAL = 'antiretroviral',
  VACCIN = 'vaccin',
  AUTRE = 'autre',
}

@Entity('medicaments')
export class Medicament {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'MED-00001', description: 'Code unique auto-généré par tenant' })
  @Index()
  @Column()
  code: string;

  @ApiProperty({ example: 'Amoxicilline' })
  @Column()
  nom: string;

  @ApiPropertyOptional({ example: 'Clamoxyl' })
  @Column({ nullable: true })
  nomCommercial: string;

  @ApiPropertyOptional({ example: 'Amoxicilline' })
  @Column({ nullable: true })
  dci: string;

  @ApiProperty({ enum: MedicamentForme })
  @Column({ type: 'enum', enum: MedicamentForme })
  forme: MedicamentForme;

  @ApiProperty({ example: '500mg' })
  @Column()
  dosage: string;

  @ApiProperty({ example: 'comprimé' })
  @Column()
  unite: string;

  @ApiProperty({ enum: MedicamentCategorie })
  @Column({ type: 'enum', enum: MedicamentCategorie })
  categorie: MedicamentCategorie;

  @ApiPropertyOptional({ example: 'Beta-lactamines' })
  @Column({ nullable: true })
  classeTherapeutique: string;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  stockActuel: number;

  @ApiProperty({ default: 10 })
  @Column({ default: 10 })
  stockMinimum: number;

  @ApiProperty({ default: 1000 })
  @Column({ default: 1000 })
  stockMaximum: number;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prixUnitaire: number;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prixVente: number;

  @ApiProperty({ default: 'XOF' })
  @Column({ default: 'XOF' })
  devise: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  prescriptionRequise: boolean;

  @ApiProperty({ default: true })
  @Column({ default: true })
  estActif: boolean;

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
