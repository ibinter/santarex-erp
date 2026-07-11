import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CategorieAnalyse {
  HEMATOLOGIE = 'hematologie',
  BIOCHIMIE = 'biochimie',
  MICROBIOLOGIE = 'microbiologie',
  SEROLOGIE = 'serologie',
  HORMONOLOGIE = 'hormonologie',
  UROLOGIE = 'urologie',
  PARASITOLOGIE = 'parasitologie',
  AUTRE = 'autre',
}

export interface ParametreAnalyse {
  nom: string;
  unite: string;
  valeursNormalesMin?: number;
  valeursNormalesMax?: number;
  valeursNormalesTexte?: string;
}

@Entity('types_analyse')
export class TypeAnalyse {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'NFS' })
  @Index()
  @Column()
  code: string;

  @ApiProperty({ example: 'Numération Formule Sanguine' })
  @Column()
  nom: string;

  @ApiProperty({ enum: CategorieAnalyse })
  @Column({ type: 'enum', enum: CategorieAnalyse })
  categorie: CategorieAnalyse;

  @ApiProperty({ default: 24, description: 'Délai moyen en heures pour obtenir les résultats' })
  @Column({ default: 24 })
  delaiResultatsHeures: number;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prixUnitaire: number;

  @ApiProperty({ description: 'Paramètres avec valeurs normales (JSON)', type: 'object' })
  @Column({ type: 'jsonb', default: '[]' })
  parametres: ParametreAnalyse[];

  @ApiPropertyOptional({ description: 'Instructions de prélèvement' })
  @Column({ type: 'text', nullable: true })
  instructions: string;

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
