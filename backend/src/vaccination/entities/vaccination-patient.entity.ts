import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Statut d'une ligne de vaccination (dose administrée / rappel). */
export enum StatutVaccination {
  ADMINISTRE = 'administre',
  RAPPEL_DU = 'rappel_du',
  EN_RETARD = 'en_retard',
}

/** Voie d'administration. */
export enum VoieVaccination {
  INTRAMUSCULAIRE = 'intramusculaire',
  SOUS_CUTANEE = 'sous_cutanee',
  INTRADERMIQUE = 'intradermique',
  ORALE = 'orale',
  NASALE = 'nasale',
}

/**
 * Registre des vaccinations administrées à un patient (le carnet). Chaque ligne
 * = une dose. À l'administration, `dateRappelPrevue` est calculée depuis
 * l'intervalle du vaccin si d'autres doses restent au schéma.
 */
@Entity('vacc_vaccinations')
export class VaccinationPatient {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty()
  @Index()
  @Column()
  vaccinId: string;

  @ApiProperty({ default: 1, description: 'Numéro de la dose dans le schéma' })
  @Column({ default: 1 })
  doseNumero: number;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateAdministration: Date;

  @ApiPropertyOptional({ example: 'LOT-2026-A12' })
  @Column({ type: 'varchar', nullable: true })
  lot: string;

  @ApiPropertyOptional({ enum: VoieVaccination })
  @Column({ type: 'enum', enum: VoieVaccination, nullable: true })
  voie: VoieVaccination;

  @ApiPropertyOptional({ example: 'Bras gauche (deltoïde)' })
  @Column({ type: 'varchar', nullable: true })
  siteInjection: string;

  @ApiPropertyOptional({ description: 'ID du vaccinateur (User)' })
  @Index()
  @Column({ type: 'varchar', nullable: true })
  vaccinateurRef: string;

  @ApiPropertyOptional({ description: 'Date de rappel calculée automatiquement' })
  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  dateRappelPrevue: Date;

  @ApiProperty({ enum: StatutVaccination, default: StatutVaccination.ADMINISTRE })
  @Column({ type: 'enum', enum: StatutVaccination, default: StatutVaccination.ADMINISTRE })
  statut: StatutVaccination;

  @ApiProperty({ default: false, description: 'MAPI / effet indésirable à déclarer aux autorités' })
  @Column({ default: false })
  aDeclarer: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional()
  @Column({ type: 'varchar', nullable: true })
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
