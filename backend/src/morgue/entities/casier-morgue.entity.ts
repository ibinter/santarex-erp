import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutCasier {
  LIBRE = 'libre',
  OCCUPE = 'occupe',
  MAINTENANCE = 'maintenance',
}

@Entity('morgue_casiers')
export class CasierMorgue {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'CF-01', description: 'Numéro d\'emplacement en chambre froide' })
  @Column()
  numero: string;

  @ApiPropertyOptional({ example: 'Chambre froide A - rangée 1', description: 'Description / localisation' })
  @Column({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: StatutCasier, default: StatutCasier.LIBRE, description: 'Statut du casier' })
  @Column({ type: 'enum', enum: StatutCasier, default: StatutCasier.LIBRE })
  statut: StatutCasier;

  @ApiPropertyOptional({ description: 'ID du séjour morgue en cours occupant ce casier' })
  @Column({ nullable: true })
  sejourActuelId: string | null;

  @ApiProperty({ default: true, description: 'Casier actif ou désactivé' })
  @Column({ default: true })
  estActif: boolean;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
