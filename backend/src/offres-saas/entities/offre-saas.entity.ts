import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OffreCycle {
  MENSUEL = 'mensuel',
  TRIMESTRIEL = 'trimestriel',
  ANNUEL = 'annuel',
  UNIQUE = 'unique',
}

@Entity('offres_saas')
export class OffreSaas {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'starter', description: 'Code unique identifiant le plan' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 'STARTER', description: 'Nom affiché du plan' })
  @Column()
  nom: string;

  @ApiPropertyOptional({ example: 'Idéal pour les petites structures' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 49000, description: 'Prix en FCFA (centimes non utilisés)' })
  @Column({ type: 'int', default: 0 })
  prix: number;

  @ApiProperty({ enum: OffreCycle, example: OffreCycle.MENSUEL })
  @Column({ type: 'enum', enum: OffreCycle, default: OffreCycle.MENSUEL })
  cycle: OffreCycle;

  @ApiPropertyOptional({ example: 10, description: 'Remise en % pour paiement annuel' })
  @Column({ type: 'int', default: 0 })
  remiseAnnuelle: number;

  @ApiProperty({ example: 5, description: 'Nombre max d\'utilisateurs inclus' })
  @Column({ type: 'int', default: 5 })
  maxUtilisateurs: number;

  @ApiPropertyOptional({ description: 'Modules inclus dans ce plan (JSON array de codes)' })
  @Column({ type: 'text', nullable: true })
  modulesInclus: string;

  @ApiPropertyOptional({ description: 'Fonctionnalités clés listées sur la page de vente (JSON array)' })
  @Column({ type: 'text', nullable: true })
  fonctionnalites: string;

  @ApiProperty({ example: true, description: 'Plan visible sur la page publique' })
  @Column({ default: true })
  estVisible: boolean;

  @ApiProperty({ example: false, description: 'Plan mis en avant (badge Recommandé)' })
  @Column({ default: false })
  estMisEnAvant: boolean;

  @ApiProperty({ example: 1, description: 'Ordre d\'affichage' })
  @Column({ type: 'int', default: 0 })
  ordre: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  estActif: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
