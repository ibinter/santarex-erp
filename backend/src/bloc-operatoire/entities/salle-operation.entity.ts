import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum StatutSalle {
  DISPONIBLE = 'disponible',
  OCCUPEE = 'occupee',
  NETTOYAGE = 'nettoyage',
  MAINTENANCE = 'maintenance',
}

@Entity('bloc_salles')
export class SalleOperation {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Salle 1', description: 'Nom / numéro de la salle d\'opération' })
  @Column()
  nom: string;

  @ApiProperty({ example: 'Chirurgie générale', description: 'Type / spécialité de la salle' })
  @Column()
  type: string;

  @ApiProperty({ enum: StatutSalle, default: StatutSalle.DISPONIBLE, description: 'Statut actuel de la salle' })
  @Column({ type: 'enum', enum: StatutSalle, default: StatutSalle.DISPONIBLE })
  statut: StatutSalle;

  @ApiProperty({ default: true, description: 'Salle active ou désactivée' })
  @Column({ default: true })
  estActive: boolean;

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
