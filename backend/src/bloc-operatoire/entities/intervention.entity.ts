import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutIntervention {
  PROGRAMMEE = 'programmee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee',
}

@Entity('bloc_interventions')
export class Intervention {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'INT-2025-00001', description: 'Numéro d\'intervention auto-généré' })
  @Column()
  numero: string;

  @ApiProperty({ description: 'ID du patient opéré' })
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'ID du chirurgien référent' })
  @Index()
  @Column()
  chirurgienId: string;

  @ApiPropertyOptional({ description: 'ID de l\'anesthésiste (optionnel)' })
  @Column({ nullable: true })
  anesthesisteId: string;

  @ApiProperty({ description: 'ID de la salle d\'opération' })
  @Index()
  @Column()
  salleId: string;

  @ApiProperty({ example: 'Appendicectomie', description: 'Type / libellé de l\'intervention' })
  @Column()
  typeIntervention: string;

  @ApiProperty({ description: 'Date et heure prévues de l\'intervention' })
  @Column({ type: 'timestamp' })
  dateHeurePrevue: Date;

  @ApiProperty({ example: 90, description: 'Durée estimée en minutes' })
  @Column({ type: 'int' })
  dureeEstimee: number;

  @ApiProperty({ default: false, description: 'Intervention urgente' })
  @Column({ default: false })
  urgence: boolean;

  @ApiProperty({ enum: StatutIntervention, default: StatutIntervention.PROGRAMMEE, description: 'Statut de l\'intervention' })
  @Column({ type: 'enum', enum: StatutIntervention, default: StatutIntervention.PROGRAMMEE })
  statut: StatutIntervention;

  @ApiPropertyOptional({ description: 'Date et heure réelles de début' })
  @Column({ type: 'timestamp', nullable: true })
  dateHeureDebut: Date;

  @ApiPropertyOptional({ description: 'Date et heure réelles de fin' })
  @Column({ type: 'timestamp', nullable: true })
  dateHeureFin: Date;

  @ApiPropertyOptional({ description: 'Compte-rendu opératoire' })
  @Column({ type: 'text', nullable: true })
  compteRendu: string;

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
