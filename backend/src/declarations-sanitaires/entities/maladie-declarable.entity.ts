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
 * Catégorie épidémiologique d'une maladie à déclaration obligatoire (MDO).
 * - epidemique : potentiel épidémique élevé, déclaration en urgence (choléra, méningite, FHV…).
 * - endemique  : présente durablement, surveillance de tendance (tuberculose, paludisme grave…).
 * - autre      : autres MDO (tétanos néonatal, etc.).
 */
export enum CategorieMaladie {
  EPIDEMIQUE = 'epidemique',
  ENDEMIQUE = 'endemique',
  AUTRE = 'autre',
}

/**
 * Référentiel des maladies à déclaration obligatoire.
 * Les entrées seedées sont GLOBALES (`tenantId` NULL) — mêmes conventions que le
 * référentiel des interactions médicamenteuses. Un tenant peut, en option, en
 * ajouter des propres (tenantId renseigné).
 */
@Entity('decl_san_maladies')
export class MaladieDeclarable {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: 'NULL = référentiel global ; sinon MDO propre à un tenant' })
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @ApiProperty({ example: 'Choléra' })
  @Index()
  @Column()
  nom: string;

  @ApiPropertyOptional({ example: 'A00', description: 'Code CIM-10 principal' })
  @Column({ nullable: true })
  codeCIM10: string | null;

  @ApiProperty({ enum: CategorieMaladie })
  @Index()
  @Column({ type: 'enum', enum: CategorieMaladie, default: CategorieMaladie.AUTRE })
  categorie: CategorieMaladie;

  @ApiProperty({ description: 'Délai réglementaire de déclaration, en heures', example: 24 })
  @Column({ type: 'int', default: 24 })
  delaiDeclarationHeures: number;

  @ApiPropertyOptional({ description: 'Note clinique / surveillance' })
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
