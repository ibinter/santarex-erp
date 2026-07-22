import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeveriteInteraction } from '../interactions.enums';

/**
 * Référentiel des interactions médicamenteuses (paire DCI / classe A ↔ B).
 *
 * Multi-tenant : `tenantId` nullable.
 *   - `null` = interaction GLOBALE (référentiel médical commun, partagé par tous
 *     les établissements — c'est la source seedée).
 *   - renseigné = interaction ajoutée localement par un tenant.
 *
 * `dciA` / `dciB` sont stockées NORMALISÉES (minuscules, sans accents, espaces
 * comprimés) afin de rendre la recherche insensible à la casse/graphie.
 * Convention : dciA <= dciB (ordre alphabétique) pour éviter les doublons
 * A/B vs B/A.
 */
@Entity('interactions_medicamenteuses')
@Index('IDX_interactions_paire', ['dciA', 'dciB'])
export class InteractionMedicamenteuse {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'anticoagulant oral', description: 'DCI ou classe A, normalisée (minuscules)' })
  @Index()
  @Column()
  dciA: string;

  @ApiProperty({ example: 'ains', description: 'DCI ou classe B, normalisée (minuscules)' })
  @Index()
  @Column()
  dciB: string;

  @ApiProperty({ enum: SeveriteInteraction })
  @Index()
  @Column({ type: 'enum', enum: SeveriteInteraction, default: SeveriteInteraction.MODEREE })
  severite: SeveriteInteraction;

  @ApiPropertyOptional({ example: 'Inhibition de l\'agrégation plaquettaire' })
  @Column({ type: 'text', nullable: true })
  mecanisme: string | null;

  @ApiPropertyOptional({ example: 'Majoration du risque hémorragique' })
  @Column({ type: 'text', nullable: true })
  effet: string | null;

  @ApiPropertyOptional({ example: 'Association déconseillée ; surveillance clinique et biologique renforcée.' })
  @Column({ type: 'text', nullable: true })
  conduiteATenir: string | null;

  @ApiPropertyOptional({ example: 'ANSM — Thesaurus des interactions médicamenteuses' })
  @Column({ nullable: true })
  source: string | null;

  // null = interaction globale (référentiel éditeur), partagée avec tous.
  @ApiPropertyOptional()
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
