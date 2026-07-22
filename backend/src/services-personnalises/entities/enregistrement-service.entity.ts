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
 * Statut d'un enregistrement saisi dans un service personnalisé. Cycle de vie
 * volontairement simple (l'usage réel des services sur mesure est très varié).
 */
export enum StatutEnregistrement {
  BROUILLON = 'brouillon',
  VALIDE = 'valide',
  ARCHIVE = 'archive',
}

@Entity('enregistrements_service')
export class EnregistrementService {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Service personnalisé auquel se rattache l\'enregistrement' })
  @Index()
  @Column()
  servicePersonnaliseId: string;

  @ApiPropertyOptional({ description: 'Patient concerné (optionnel)' })
  @Index()
  @Column({ nullable: true })
  patientId: string | null;

  @ApiProperty({
    description: 'Valeurs saisies, indexées par identifiant de champ ({champId: valeur})',
  })
  @Column({ type: 'jsonb', default: () => "'{}'" })
  valeurs: Record<string, unknown>;

  @ApiProperty({ enum: StatutEnregistrement })
  @Index()
  @Column({
    type: 'enum',
    enum: StatutEnregistrement,
    default: StatutEnregistrement.VALIDE,
  })
  statut: StatutEnregistrement;

  @ApiProperty({ description: 'Identifiant de l\'utilisateur ayant saisi l\'enregistrement' })
  @Column()
  creePar: string;

  @ApiProperty({ description: 'Date métier de l\'enregistrement' })
  @Column({ type: 'timestamptz', default: () => 'now()' })
  date: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
