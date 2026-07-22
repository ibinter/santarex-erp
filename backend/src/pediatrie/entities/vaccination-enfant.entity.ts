import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutVaccination {
  A_FAIRE = 'a_faire',
  FAIT = 'fait',
  EN_RETARD = 'en_retard',
}

/**
 * Ligne du carnet vaccinal d'un enfant : un vaccin attendu à un âge donné
 * (selon le calendrier PEV Côte d'Ivoire), avec la date d'administration
 * réelle une fois réalisé. Le statut est recalculé à la volée (en_retard si
 * la date prévue est dépassée et le vaccin non fait).
 */
@Entity('ped_vaccinations')
export class VaccinationEnfant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ example: 'BCG', description: 'Vaccin (BCG, Polio, Penta, Rougeole, Fièvre jaune…)' })
  @Column()
  vaccin: string;

  @ApiPropertyOptional({ description: 'Âge recommandé (libellé), ex. "à la naissance", "6 semaines"' })
  @Column({ nullable: true })
  dosePrevueAge: string;

  @ApiPropertyOptional({ description: 'Âge recommandé en semaines (pour tri / calcul date prévue)' })
  @Column({ type: 'integer', nullable: true })
  agePrevuSemaines: number;

  @ApiPropertyOptional({ description: 'Date prévue calculée à partir de la naissance' })
  @Column({ type: 'date', nullable: true })
  datePrevue: string;

  @ApiPropertyOptional({ description: "Date d'administration réelle (nullable tant que non fait)" })
  @Column({ type: 'date', nullable: true })
  dateAdministration: string;

  @ApiPropertyOptional({ description: 'Numéro de lot du vaccin' })
  @Column({ nullable: true })
  lot: string;

  @ApiProperty({ enum: StatutVaccination })
  @Column({ type: 'enum', enum: StatutVaccination, default: StatutVaccination.A_FAIRE })
  statut: StatutVaccination;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  administrePar: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
