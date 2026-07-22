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
 * Type d'acte couvert par un formulaire de consentement éclairé.
 * Enjeu médico-légal : chaque acte invasif ou à risque exige un consentement
 * signé et tracé.
 */
export enum TypeConsentement {
  CHIRURGIE = 'chirurgie',
  ANESTHESIE = 'anesthesie',
  TRANSFUSION = 'transfusion',
  ACTE_INVASIF = 'acte_invasif',
  SOINS = 'soins',
  RECHERCHE = 'recherche',
}

/**
 * Référentiel des modèles de formulaire de consentement propres à chaque
 * établissement (tenant). Sert de base au texte présenté puis figé dans un
 * `Consentement` au moment de sa création.
 */
@Entity('consentement_modeles')
export class ModeleConsentement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: TypeConsentement })
  @Index()
  @Column({ type: 'enum', enum: TypeConsentement })
  type: TypeConsentement;

  @ApiProperty({ example: 'Consentement à une intervention chirurgicale' })
  @Column()
  titre: string;

  @ApiPropertyOptional({ description: 'Résumé / objet du modèle' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Texte type du formulaire (contenu médico-légal)' })
  @Column({ type: 'text' })
  texteModele: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  actif: boolean;

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
