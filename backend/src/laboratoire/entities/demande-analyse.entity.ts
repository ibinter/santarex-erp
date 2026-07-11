import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutPrelevement {
  ATTENTE_PRELEVEMENT = 'attente_prelevement',
  PRELEVE = 'preleve',
  EN_ANALYSE = 'en_analyse',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

@Entity('demandes_analyse')
export class DemandeAnalyse {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'LAB-2024-00001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty()
  @Index()
  @Column()
  medecinId: string;

  @ApiPropertyOptional()
  @Index()
  @Column({ nullable: true })
  consultationId: string;

  @ApiProperty({ description: 'Tableau des IDs de types d\'analyse demandés', type: 'array' })
  @Column({ type: 'jsonb', default: '[]' })
  analyses: string[];

  @ApiProperty({ default: false })
  @Column({ default: false })
  urgence: boolean;

  @ApiProperty({ enum: StatutPrelevement })
  @Column({ type: 'enum', enum: StatutPrelevement, default: StatutPrelevement.ATTENTE_PRELEVEMENT })
  statutPrelevement: StatutPrelevement;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateHeureDemande: Date;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateHeurePrelevement: Date;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  datePrevueResultats: Date;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
