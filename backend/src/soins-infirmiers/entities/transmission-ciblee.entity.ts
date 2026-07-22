import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transmission ciblée — modèle DAR (Données / Actions / Résultats).
 * Support central du dossier de soins infirmiers : autour d'une « cible »
 * (problème / besoin), l'infirmier consigne ce qu'il observe (D), ce qu'il
 * fait (A) et le résultat obtenu (R).
 */
@Entity('soins_transmissions_ciblees')
export class TransmissionCiblee {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du patient' })
  @Index()
  @Column()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation (optionnel)' })
  @Index()
  @Column({ nullable: true })
  sejourId: string;

  @ApiProperty({ description: 'Date et heure de la transmission' })
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @ApiProperty({ description: 'Cible / problème / besoin identifié' })
  @Column({ type: 'text' })
  cible: string;

  @ApiPropertyOptional({ description: 'Données (D) — observations, recueil' })
  @Column({ type: 'text', nullable: true })
  donnees: string;

  @ApiPropertyOptional({ description: 'Actions (A) — interventions réalisées' })
  @Column({ type: 'text', nullable: true })
  actions: string;

  @ApiPropertyOptional({ description: 'Résultats (R) — effet / évolution' })
  @Column({ type: 'text', nullable: true })
  resultats: string;

  @ApiProperty({ description: 'ID de l\'infirmier auteur de la transmission' })
  @Column()
  infirmierRef: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;
}
