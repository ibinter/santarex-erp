import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeAssureur {
  MUTUELLE = 'mutuelle',
  ASSURANCE_PRIVEE = 'assurance_privee',
  CMU = 'cmu',
  CNAM = 'cnam',
}

@Entity('assureurs')
export class Assureur {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'SUNU Assurances' })
  @Index()
  @Column()
  nom: string;

  @ApiProperty({ enum: TypeAssureur })
  @Column({ type: 'enum', enum: TypeAssureur, default: TypeAssureur.ASSURANCE_PRIVEE })
  type: TypeAssureur;

  @ApiPropertyOptional({ description: 'Personne / service de contact' })
  @Column({ nullable: true })
  contactNom: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  contactTelephone: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  contactEmail: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  adresse: string;

  @ApiProperty({ default: 80, description: 'Taux de couverture par défaut (%)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 80 })
  tauxCouvertureDefaut: number;

  @ApiPropertyOptional({ description: 'Plafond de prise en charge (XOF)' })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  plafond: number;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  actif: boolean;

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
