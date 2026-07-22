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
 * Suivi post-natal (mère + nouveau-né), rattaché à un dossier de grossesse.
 */
@Entity('mat_suivis_postnatal')
export class SuiviPostNatal {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du dossier de grossesse' })
  @Index()
  @Column()
  dossierId: string;

  @ApiProperty({ description: 'Date du suivi' })
  @Column({ type: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'État général de la mère' })
  @Column({ type: 'text', nullable: true })
  etatMere: string;

  @ApiPropertyOptional({ description: 'Involution utérine (normale, retardée…)' })
  @Column({ nullable: true })
  involutionUterine: string;

  @ApiPropertyOptional({ description: 'Allaitement (maternel exclusif, mixte, artificiel)' })
  @Column({ nullable: true })
  allaitement: string;

  @ApiPropertyOptional({ description: 'État du nouveau-né' })
  @Column({ type: 'text', nullable: true })
  etatNouveauNe: string;

  @ApiProperty({ default: false, description: 'Vaccination BCG effectuée' })
  @Column({ default: false })
  vaccinationBCG: boolean;

  @ApiProperty({ default: false, description: 'Vaccination Polio 0 effectuée' })
  @Column({ default: false })
  vaccinationPolio: boolean;

  @ApiPropertyOptional({ description: 'Observations' })
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
