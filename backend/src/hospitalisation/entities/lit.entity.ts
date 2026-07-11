import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceHospitalisation {
  MEDECINE_GENERALE = 'medecine_generale',
  CHIRURGIE = 'chirurgie',
  MATERNITE = 'maternite',
  PEDIATRIE = 'pediatrie',
  REANIMATION = 'reanimation',
  ORTHOPEDIE = 'orthopedie',
  OPHTALMOLOGIE = 'ophtalmologie',
  CARDIOLOGIE = 'cardiologie',
  NEUROLOGIE = 'neurologie',
  AUTRE = 'autre',
}

export enum StatutLit {
  LIBRE = 'libre',
  OCCUPE = 'occupe',
  EN_NETTOYAGE = 'en_nettoyage',
  EN_MAINTENANCE = 'en_maintenance',
  RESERVE = 'reserve',
}

@Entity('lits')
export class Lit {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'CH-101', description: 'Numéro du lit' })
  @Column()
  numero: string;

  @ApiProperty({ enum: ServiceHospitalisation, description: 'Service médical du lit' })
  @Column({ type: 'enum', enum: ServiceHospitalisation })
  service: ServiceHospitalisation;

  @ApiPropertyOptional({ example: 'Salle 1', description: 'Salle du lit' })
  @Column({ nullable: true })
  salle: string;

  @ApiPropertyOptional({ example: '2ème étage', description: 'Étage du lit' })
  @Column({ nullable: true })
  etage: string;

  @ApiProperty({ enum: StatutLit, default: StatutLit.LIBRE, description: 'Statut actuel du lit' })
  @Column({ type: 'enum', enum: StatutLit, default: StatutLit.LIBRE })
  statut: StatutLit;

  @ApiPropertyOptional({ description: 'ID du séjour en cours sur ce lit' })
  @Column({ nullable: true })
  sejourActuelId: string;

  @ApiProperty({ default: true, description: 'Lit actif ou désactivé' })
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
