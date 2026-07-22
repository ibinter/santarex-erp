import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutHAD {
  ACTIVE = 'active',
  SUSPENDUE = 'suspendue',
  TERMINEE = 'terminee',
}

/**
 * Prise en charge d'un patient en Hospitalisation À Domicile (HAD).
 * Numéro auto-généré HAD-AAAA-NNNN. Multi-tenant (colonne tenantId indexée).
 */
@Entity('had_prises_en_charge')
export class PriseEnChargeHAD {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'HAD-2026-0001', description: 'Numéro auto-généré' })
  @Column()
  numero: string;

  @ApiProperty({ description: 'ID du patient pris en charge' })
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'Adresse du domicile où sont dispensés les soins' })
  @Column({ type: 'text' })
  adresseDomicile: string;

  @ApiPropertyOptional({ description: 'Ville / commune' })
  @Column({ nullable: true })
  ville: string;

  @ApiPropertyOptional({ description: 'Téléphone de contact au domicile' })
  @Column({ nullable: true })
  telephoneContact: string;

  @ApiProperty({ description: 'Motif / pathologie justifiant la prise en charge' })
  @Column({ type: 'text' })
  motif: string;

  @ApiProperty({ description: 'ID du médecin référent (User)' })
  @Index()
  @Column()
  medecinReferentRef: string;

  @ApiProperty({ description: 'Date de début de la prise en charge' })
  @Column({ type: 'date' })
  dateDebut: string;

  @ApiPropertyOptional({ description: 'Date de fin prévue' })
  @Column({ type: 'date', nullable: true })
  dateFinPrevue: string;

  @ApiPropertyOptional({ description: 'Date de fin réelle (clôture)' })
  @Column({ type: 'date', nullable: true })
  dateFinReelle: string | null;

  @ApiPropertyOptional({ description: 'Protocole de soins / plan de soins à domicile' })
  @Column({ type: 'text', nullable: true })
  protocoleSoins: string;

  @ApiPropertyOptional({ description: 'Fréquence de visites prévue (ex. quotidienne, 3x/semaine)' })
  @Column({ nullable: true })
  frequenceVisites: string;

  @ApiPropertyOptional({ description: 'ID du séjour hospitalier d\'origine (si sortie précoce)' })
  @Column({ nullable: true })
  sejourOrigineRef: string;

  @ApiProperty({ enum: StatutHAD, default: StatutHAD.ACTIVE })
  @Column({ type: 'enum', enum: StatutHAD, default: StatutHAD.ACTIVE })
  statut: StatutHAD;

  @ApiPropertyOptional({ description: 'Motif de clôture ou de suspension' })
  @Column({ type: 'text', nullable: true })
  motifCloture: string;

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
