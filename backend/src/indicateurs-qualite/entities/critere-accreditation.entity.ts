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
 * Statut de conformité d'un critère d'accréditation/certification.
 * `na` = non applicable (exclu du calcul du taux de conformité).
 */
export enum StatutConformite {
  CONFORME = 'conforme',
  PARTIEL = 'partiel',
  NON_CONFORME = 'non_conforme',
  NA = 'na',
}

@Entity('criteres_accreditation')
export class CritereAccreditation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ example: 'HAS V2020', description: 'Référentiel / norme de rattachement' })
  @Index()
  @Column()
  referentiel: string;

  @ApiPropertyOptional({ example: 'Chapitre 2 — Parcours du patient' })
  @Column({ nullable: true })
  chapitre: string | null;

  @ApiProperty({ description: 'Libellé de l\'exigence à satisfaire' })
  @Column({ type: 'text' })
  exigence: string;

  @ApiProperty({ enum: StatutConformite })
  @Index()
  @Column({ type: 'enum', enum: StatutConformite, default: StatutConformite.NON_CONFORME })
  statut: StatutConformite;

  @ApiPropertyOptional({ description: 'Preuve / élément justificatif de conformité' })
  @Column({ type: 'text', nullable: true })
  preuve: string | null;

  @ApiPropertyOptional({ description: 'Référence du responsable (userId / nom)' })
  @Column({ nullable: true })
  responsableRef: string | null;

  @ApiPropertyOptional({ description: 'Échéance de mise en conformité' })
  @Column({ type: 'date', nullable: true })
  echeance: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
