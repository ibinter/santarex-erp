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
 * Catégories réglementaires de déchets d'activités de soins.
 * DASRI = Déchets d'Activités de Soins à Risques Infectieux.
 */
export enum CategorieDechet {
  DASRI = 'dasri',
  ANATOMIQUE = 'anatomique',
  CHIMIQUE = 'chimique',
  PHARMACEUTIQUE = 'pharmaceutique',
  RADIOACTIF = 'radioactif',
  MENAGER_ASSIMILE = 'menager_assimile',
}

/** Type de conditionnement du déchet collecté. */
export enum TypeConditionnement {
  CARTON = 'carton',
  FUT = 'fut',
  BOITE_OPCT = 'boite_opct', // Objets Piquants, Coupants, Tranchants
}

/** Statut du cycle de vie d'une collecte jusqu'à destruction. */
export enum StatutCollecte {
  COLLECTE = 'collecte',
  EN_STOCKAGE = 'en_stockage',
  ENLEVE = 'enleve',
  INCINERE = 'incinere',
}

@Entity('dechets_collectes')
export class CollecteDechets {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'DAS-2026-0001', description: 'Numéro auto-généré par tenant' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty({ enum: CategorieDechet })
  @Index()
  @Column({ type: 'enum', enum: CategorieDechet })
  categorie: CategorieDechet;

  @ApiProperty({ example: 'Bloc opératoire', description: 'Service / unité producteur' })
  @Column()
  serviceProducteur: string;

  @ApiPropertyOptional({ example: 'Salle 2' })
  @Column({ nullable: true })
  uniteProducteur: string;

  @ApiProperty({ type: 'number', format: 'decimal', example: 3.5 })
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  poidsKg: number;

  @ApiProperty({ enum: TypeConditionnement })
  @Column({ type: 'enum', enum: TypeConditionnement })
  typeConditionnement: TypeConditionnement;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateCollecte: Date;

  @ApiPropertyOptional({ description: 'Référence / identifiant de l\'agent collecteur' })
  @Column({ nullable: true })
  agentRef: string;

  @ApiProperty({ enum: StatutCollecte, default: StatutCollecte.COLLECTE })
  @Index()
  @Column({ type: 'enum', enum: StatutCollecte, default: StatutCollecte.COLLECTE })
  statut: StatutCollecte;

  @ApiPropertyOptional({ description: 'Enlèvement de rattachement (null tant que non enlevé)' })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  enlevementId: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
