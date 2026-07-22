import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeFournisseur {
  GROSSISTE = 'grossiste',
  LABORATOIRE = 'laboratoire',
  CONSOMMABLES = 'consommables',
  AUTRE = 'autre',
}

@Entity('appro_fournisseurs')
export class Fournisseur {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Laborex CI' })
  @Column()
  nom: string;

  @ApiProperty({ enum: TypeFournisseur, default: TypeFournisseur.GROSSISTE })
  @Column({ type: 'enum', enum: TypeFournisseur, default: TypeFournisseur.GROSSISTE })
  type: TypeFournisseur;

  @ApiPropertyOptional({ example: 'M. Kouassi', description: 'Personne de contact' })
  @Column({ nullable: true })
  contact: string;

  @ApiPropertyOptional({ example: '+225 07 00 00 00 00' })
  @Column({ nullable: true })
  telephone: string;

  @ApiPropertyOptional({ example: 'contact@laborex.ci' })
  @Column({ nullable: true })
  email: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  adresse: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @Column({ nullable: true })
  ville: string;

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
