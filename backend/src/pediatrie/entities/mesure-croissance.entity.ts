import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Une mesure anthropométrique d'un enfant à une date donnée. L'âge en mois et
 * l'IMC sont calculés côté service (à partir de la date de naissance du patient
 * et des mesures) puis persistés pour figer l'historique et tracer la courbe
 * de croissance sans recalcul.
 */
@Entity('ped_mesures_croissance')
export class MesureCroissance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'Date de la mesure' })
  @Column({ type: 'date' })
  dateMesure: string;

  @ApiPropertyOptional({ description: "Âge de l'enfant en mois au moment de la mesure (calculé)" })
  @Column({ type: 'integer', nullable: true })
  ageMois: number;

  @ApiPropertyOptional({ description: 'Poids en kilogrammes' })
  @Column({ type: 'numeric', precision: 6, scale: 3, nullable: true })
  poidsKg: number;

  @ApiPropertyOptional({ description: 'Taille en centimètres' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  tailleCm: number;

  @ApiPropertyOptional({ description: 'Périmètre crânien en centimètres' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  perimetreCranienCm: number;

  @ApiPropertyOptional({ description: 'Indice de Masse Corporelle (calculé)' })
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  imc: number;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
