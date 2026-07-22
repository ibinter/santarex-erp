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
 * Domaine qualité couvert par l'indicateur. Aligné sur les grands axes de suivi
 * en établissement de santé (hygiène, sécurité du patient, délais, satisfaction,
 * mortalité, infections nosocomiales).
 */
export enum DomaineIndicateur {
  HYGIENE = 'hygiene',
  SECURITE_PATIENT = 'securite_patient',
  DELAIS = 'delais',
  SATISFACTION = 'satisfaction',
  MORTALITE = 'mortalite',
  INFECTIONS = 'infections',
}

/** Unité de mesure de l'indicateur (pilote l'affichage : %, valeur, nombre de jours). */
export enum UniteIndicateur {
  POURCENTAGE = 'pourcentage',
  NOMBRE = 'nombre',
  JOURS = 'jours',
}

/**
 * Sens d'amélioration : indique si une hausse ou une baisse de la valeur est
 * favorable. Détermine l'évaluation atteint/alerte/critique d'une mesure.
 */
export enum SensIndicateur {
  HAUSSE_BONNE = 'hausse_bonne',
  BAISSE_BONNE = 'baisse_bonne',
}

@Entity('indicateurs_qualite')
@Index(['tenantId', 'code'], { unique: true })
export class IndicateurQualite {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ example: 'TAUX_OCCUPATION', description: 'Code métier (unique par tenant)' })
  @Column()
  code: string;

  @ApiProperty({ example: "Taux d'occupation des lits" })
  @Column()
  libelle: string;

  @ApiProperty({ enum: DomaineIndicateur })
  @Index()
  @Column({ type: 'enum', enum: DomaineIndicateur, default: DomaineIndicateur.SECURITE_PATIENT })
  domaine: DomaineIndicateur;

  @ApiProperty({ enum: UniteIndicateur })
  @Column({ type: 'enum', enum: UniteIndicateur, default: UniteIndicateur.POURCENTAGE })
  unite: UniteIndicateur;

  @ApiProperty({ description: 'Valeur cible à atteindre' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  cible: number;

  @ApiPropertyOptional({
    description:
      "Seuil d'alerte : borne au-delà de laquelle on passe en alerte (avant critique). Optionnel.",
  })
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  seuil: number | null;

  @ApiProperty({ enum: SensIndicateur })
  @Column({ type: 'enum', enum: SensIndicateur, default: SensIndicateur.HAUSSE_BONNE })
  sens: SensIndicateur;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ default: true })
  @Column({ type: 'boolean', default: true })
  actif: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
