import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeNoteEvolution {
  EVOLUTION_MEDICALE = 'evolution_medicale',
  NOTE_INFIRMIERE = 'note_infirmiere',
  PRESCRIPTION = 'prescription',
  OBSERVATION = 'observation',
  COMPTE_RENDU = 'compte_rendu',
}

@Entity('notes_evolution')
export class NoteEvolution {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du séjour auquel appartient cette note' })
  @Index()
  @Column()
  sejourId: string;

  @ApiProperty({ description: 'ID du patient' })
  @Column()
  patientId: string;

  @ApiProperty({ description: 'ID de l\'auteur de la note' })
  @Column()
  auteurId: string;

  @ApiProperty({ description: 'Date et heure de la note' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateHeure: Date;

  @ApiProperty({ enum: TypeNoteEvolution, description: 'Type de note' })
  @Column({ type: 'enum', enum: TypeNoteEvolution })
  type: TypeNoteEvolution;

  @ApiProperty({ description: 'Contenu de la note' })
  @Column({ type: 'text' })
  contenu: string;

  @ApiPropertyOptional({ example: '120/80', description: 'Tension artérielle' })
  @Column({ nullable: true })
  tensionArterielle: string;

  @ApiPropertyOptional({ example: 72, description: 'Fréquence cardiaque (bpm)' })
  @Column({ type: 'int', nullable: true })
  frequenceCardiaque: number;

  @ApiPropertyOptional({ example: 37.5, description: 'Température (°C)' })
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturation en O2 (%)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  saturationO2: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Poids en kg' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  poidsKg: number;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;
}
