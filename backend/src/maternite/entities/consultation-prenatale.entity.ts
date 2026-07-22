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
 * Consultation prénatale (CPN). Un point de suivi clinique rattaché à un
 * dossier de grossesse.
 */
@Entity('mat_consultations_prenatales')
export class ConsultationPrenatale {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du dossier de grossesse' })
  @Index()
  @Column()
  dossierId: string;

  @ApiProperty({ description: 'Date de la consultation' })
  @Column({ type: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'Terme en semaines d\'aménorrhée (SA)' })
  @Column({ type: 'int', nullable: true })
  termeSA: number;

  @ApiPropertyOptional({ description: 'Poids en kg' })
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  poids: number;

  @ApiPropertyOptional({ description: 'Tension artérielle (ex : 120/80)' })
  @Column({ nullable: true })
  tensionArterielle: string;

  @ApiPropertyOptional({ description: 'Hauteur utérine en cm' })
  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true })
  hauteurUterine: number;

  @ApiPropertyOptional({ description: 'Bruits du cœur fœtal (bpm)' })
  @Column({ type: 'int', nullable: true })
  bruitsCoeurFoetal: number;

  @ApiProperty({ default: false, description: 'Présence d\'œdèmes' })
  @Column({ default: false })
  oedemes: boolean;

  @ApiPropertyOptional({ description: 'Albuminurie (bandelette : négatif, +, ++, +++)' })
  @Column({ nullable: true })
  albuminurie: string;

  @ApiPropertyOptional({ description: 'Glycosurie (bandelette : négatif, +, ++, +++)' })
  @Column({ nullable: true })
  glycosurie: string;

  @ApiPropertyOptional({ description: 'Observations cliniques' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
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
