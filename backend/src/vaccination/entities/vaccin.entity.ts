import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Population cible d'un vaccin. */
export enum CibleVaccin {
  ENFANT = 'enfant',
  ADULTE = 'adulte',
  TOUS = 'tous',
}

/**
 * Référentiel des vaccins (catalogue par tenant). Sémé automatiquement depuis
 * le PEV Côte d'Ivoire + vaccins adultes courants au premier accès si vide.
 */
@Entity('vacc_vaccins')
export class Vaccin {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BCG' })
  @Index()
  @Column()
  code: string;

  @ApiProperty({ example: 'BCG (tuberculose)' })
  @Column()
  nom: string;

  @ApiProperty({ example: 'Tuberculose' })
  @Column()
  maladieCible: string;

  @ApiProperty({ default: 1, description: 'Nombre total de doses du schéma' })
  @Column({ default: 1 })
  nbDoses: number;

  @ApiProperty({ default: 0, description: 'Intervalle en jours avant la dose suivante / rappel' })
  @Column({ default: 0 })
  intervalleJours: number;

  @ApiProperty({ enum: CibleVaccin, default: CibleVaccin.TOUS })
  @Column({ type: 'enum', enum: CibleVaccin, default: CibleVaccin.TOUS })
  cible: CibleVaccin;

  @ApiPropertyOptional({ description: "Âge recommandé pour la 1re dose (libellé)", example: 'Naissance' })
  @Column({ type: 'varchar', nullable: true })
  ageRecommande: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  estActif: boolean;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
