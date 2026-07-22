import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Référentiel du calendrier vaccinal pédiatrique (PEV Côte d'Ivoire). Sert de
 * modèle pour générer le carnet vaccinal d'un enfant selon son âge. Scopé par
 * tenant : chaque établissement peut adapter son calendrier ; un jeu par défaut
 * est semé au premier accès si la table est vide pour le tenant.
 */
@Entity('ped_calendrier_vaccinal')
export class CalendrierVaccinalPediatrique {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BCG' })
  @Column()
  vaccin: string;

  @ApiProperty({ description: 'Âge recommandé (libellé lisible)', example: 'À la naissance' })
  @Column()
  ageRecommande: string;

  @ApiProperty({ description: 'Âge recommandé en semaines depuis la naissance', example: 0 })
  @Column({ type: 'integer', default: 0 })
  ageSemaines: number;

  @ApiPropertyOptional({ description: 'Maladie(s) ciblée(s)' })
  @Column({ nullable: true })
  maladieCible: string;

  @ApiProperty({ description: "Ordre d'affichage dans le calendrier" })
  @Column({ type: 'integer', default: 0 })
  ordre: number;

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
}
