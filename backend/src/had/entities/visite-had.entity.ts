import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeVisiteHAD {
  INFIRMIER = 'infirmier',
  MEDICAL = 'medical',
  KINE = 'kine',
  AUTRE = 'autre',
}

export enum StatutVisiteHAD {
  PLANIFIEE = 'planifiee',
  EFFECTUEE = 'effectuee',
  ANNULEE = 'annulee',
  REPORTEE = 'reportee',
}

/**
 * Visite planifiée / effectuée dans le cadre d'une prise en charge HAD.
 * Rattachée à une PriseEnChargeHAD via hadId. Multi-tenant.
 */
@Entity('had_visites')
export class VisiteHAD {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID de la prise en charge HAD parente' })
  @Index()
  @Column()
  hadId: string;

  @ApiProperty({ description: 'ID du patient (dénormalisé pour requêtes rapides)' })
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'Date et heure planifiées de la visite' })
  @Column({ type: 'timestamp' })
  dateVisite: Date;

  @ApiProperty({ enum: TypeVisiteHAD, default: TypeVisiteHAD.INFIRMIER })
  @Column({ type: 'enum', enum: TypeVisiteHAD, default: TypeVisiteHAD.INFIRMIER })
  type: TypeVisiteHAD;

  @ApiPropertyOptional({ description: 'ID de l\'intervenant assigné (User)' })
  @Column({ nullable: true })
  intervenantRef: string;

  @ApiProperty({ enum: StatutVisiteHAD, default: StatutVisiteHAD.PLANIFIEE })
  @Column({ type: 'enum', enum: StatutVisiteHAD, default: StatutVisiteHAD.PLANIFIEE })
  statut: StatutVisiteHAD;

  @ApiPropertyOptional({ description: 'Observations cliniques relevées lors de la visite' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiPropertyOptional({ description: 'Actes réalisés durant la visite' })
  @Column({ type: 'text', nullable: true })
  actesRealises: string;

  @ApiPropertyOptional({ description: 'Date et heure effectives de réalisation' })
  @Column({ type: 'timestamp', nullable: true })
  dateRealisation: Date | null;

  @ApiPropertyOptional({ description: 'Date suggérée pour la prochaine visite' })
  @Column({ type: 'timestamp', nullable: true })
  prochaineVisite: Date | null;

  @ApiPropertyOptional({ description: 'Motif d\'annulation ou de report' })
  @Column({ type: 'text', nullable: true })
  motifChangement: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur créateur' })
  @Column({ nullable: true })
  createdById: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
