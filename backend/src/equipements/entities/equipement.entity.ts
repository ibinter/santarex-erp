import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EquipementCategorie {
  IMAGERIE = 'imagerie',
  LABORATOIRE = 'laboratoire',
  MONITORING = 'monitoring',
  BLOC = 'bloc',
  AUTRE = 'autre',
}

export enum EquipementStatut {
  EN_SERVICE = 'en_service',
  EN_PANNE = 'en_panne',
  EN_MAINTENANCE = 'en_maintenance',
  REFORME = 'reforme',
}

@Entity('equip_equipements')
export class Equipement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'EQP-00001', description: 'Code inventaire unique auto-généré par tenant' })
  @Index()
  @Column()
  code: string;

  @ApiProperty({ example: 'Scanner CT 64 barrettes' })
  @Column()
  nom: string;

  @ApiProperty({ enum: EquipementCategorie })
  @Column({ type: 'enum', enum: EquipementCategorie, default: EquipementCategorie.AUTRE })
  categorie: EquipementCategorie;

  @ApiPropertyOptional({ example: 'Siemens' })
  @Column({ nullable: true })
  marque: string;

  @ApiPropertyOptional({ example: 'Somatom go.Now' })
  @Column({ nullable: true })
  modele: string;

  @ApiPropertyOptional({ example: 'SN-123456' })
  @Column({ nullable: true })
  numeroSerie: string;

  @ApiPropertyOptional({ example: 'Radiologie', description: 'Service ou localisation physique' })
  @Column({ nullable: true })
  localisation: string;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @Column({ type: 'date', nullable: true })
  dateAcquisition: Date;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  valeurAcquisition: number;

  @ApiProperty({ default: 'XOF' })
  @Column({ default: 'XOF' })
  devise: string;

  @ApiProperty({ enum: EquipementStatut })
  @Column({ type: 'enum', enum: EquipementStatut, default: EquipementStatut.EN_SERVICE })
  statut: EquipementStatut;

  @ApiProperty({ default: 0, description: 'Périodicité de la maintenance préventive en jours (0 = aucune)' })
  @Column({ default: 0 })
  periodiciteMaintenanceJours: number;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @Column({ type: 'date', nullable: true })
  dateProchaineMaintenance: Date;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

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
