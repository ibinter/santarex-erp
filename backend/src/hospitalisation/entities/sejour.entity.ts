import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceHospitalisation } from './lit.entity';

export enum TypeSejour {
  PROGRAMME = 'programme',
  URGENTE = 'urgente',
  TRANSFERT_INTERNE = 'transfert_interne',
  TRANSFERT_EXTERNE = 'transfert_externe',
}

export enum TypeSortie {
  GUERI = 'gueri',
  TRANSFERT = 'transfert',
  DECES = 'deces',
  CONTRE_AVIS_MEDICAL = 'contre_avis_medical',
  EN_COURS = 'en_cours',
}

export enum StatutSejour {
  ACTIF = 'actif',
  SORTI = 'sorti',
  TRANSFERE = 'transfere',
}

@Entity('sejours')
export class Sejour {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'HSP-2025-00001', description: 'Numéro de séjour auto-généré' })
  @Column()
  numero: string;

  @ApiProperty({ description: 'ID du patient hospitalisé' })
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'ID du lit assigné' })
  @Index()
  @Column()
  litId: string;

  @ApiProperty({ description: 'ID du médecin référent' })
  @Index()
  @Column()
  medecinReferentId: string;

  @ApiProperty({ enum: ServiceHospitalisation, description: 'Service d\'hospitalisation' })
  @Column({ type: 'enum', enum: ServiceHospitalisation })
  service: ServiceHospitalisation;

  @ApiProperty({ enum: TypeSejour, description: 'Type d\'admission' })
  @Column({ type: 'enum', enum: TypeSejour })
  type: TypeSejour;

  @ApiProperty({ description: 'Date et heure d\'admission' })
  @Column({ type: 'timestamp' })
  dateHeureAdmission: Date;

  @ApiPropertyOptional({ description: 'Date et heure de sortie' })
  @Column({ type: 'timestamp', nullable: true })
  dateHeureSortie: Date;

  @ApiPropertyOptional({ description: 'Durée du séjour en jours (calculé à la sortie)' })
  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 1 })
  dureeJours: number;

  @ApiProperty({ description: 'Diagnostic à l\'entrée' })
  @Column({ type: 'text' })
  diagnosticEntree: string;

  @ApiPropertyOptional({ description: 'Diagnostic à la sortie' })
  @Column({ type: 'text', nullable: true })
  diagnosticSortie: string;

  @ApiProperty({ enum: TypeSortie, default: TypeSortie.EN_COURS, description: 'Type de sortie' })
  @Column({ type: 'enum', enum: TypeSortie, default: TypeSortie.EN_COURS })
  typeSortie: TypeSortie;

  @ApiPropertyOptional({ description: 'Instructions post-hospitalisation' })
  @Column({ type: 'text', nullable: true })
  instructionsPostHospitalisation: string;

  @ApiProperty({ enum: StatutSejour, default: StatutSejour.ACTIF, description: 'Statut du séjour' })
  @Column({ type: 'enum', enum: StatutSejour, default: StatutSejour.ACTIF })
  statut: StatutSejour;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'ID de l\'utilisateur créateur' })
  @Column()
  createdById: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
