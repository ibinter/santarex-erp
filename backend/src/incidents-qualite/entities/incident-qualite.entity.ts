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
 * Type d'événement indésirable déclaré. Enjeu médico-légal : la liste couvre les
 * catégories les plus fréquentes en établissement de santé (OMS / HAS).
 */
export enum TypeIncident {
  ERREUR_MEDICAMENTEUSE = 'erreur_medicamenteuse',
  CHUTE = 'chute',
  INFECTION_NOSOCOMIALE = 'infection_nosocomiale',
  ERREUR_IDENTITE = 'erreur_identite',
  MATERIEL_DEFECTUEUX = 'materiel_defectueux',
  AUTRE = 'autre',
}

/** Niveau de gravité (échelle croissante). Pilote le code couleur du tableau de bord. */
export enum GraviteIncident {
  MINEURE = 'mineure',
  MODEREE = 'moderee',
  GRAVE = 'grave',
  CRITIQUE = 'critique',
}

/**
 * Cycle de vie de l'incident :
 * declare → en_analyse → action_en_cours → cloture.
 * Les transitions autorisées sont contrôlées dans le service.
 */
export enum StatutIncident {
  DECLARE = 'declare',
  EN_ANALYSE = 'en_analyse',
  ACTION_EN_COURS = 'action_en_cours',
  CLOTURE = 'cloture',
}

/** Type d'entrée dans le fil de suivi (analyse / action corrective / commentaire). */
export enum TypeActionIncident {
  COMMENTAIRE = 'commentaire',
  ANALYSE = 'analyse',
  ACTION_CORRECTIVE = 'action_corrective',
  CHANGEMENT_STATUT = 'changement_statut',
}

/**
 * Entrée du fil d'actions/commentaires (stockée en `jsonb`, même approche que
 * `support_tickets.reponses`). Trace horodatée et non répudiable du suivi.
 */
export interface ActionIncident {
  id: string;
  type: TypeActionIncident;
  auteurId: string;
  contenu: string;
  ancienStatut?: StatutIncident;
  nouveauStatut?: StatutIncident;
  createdAt: string;
}

@Entity('incidents_qualite')
export class IncidentQualite {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'INC-2026-0001', description: 'Numéro auto-généré' })
  @Index()
  @Column({ unique: true })
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ enum: TypeIncident })
  @Column({ type: 'enum', enum: TypeIncident, default: TypeIncident.AUTRE })
  type: TypeIncident;

  @ApiProperty({ enum: GraviteIncident })
  @Column({ type: 'enum', enum: GraviteIncident, default: GraviteIncident.MINEURE })
  gravite: GraviteIncident;

  @ApiProperty({ enum: StatutIncident })
  @Index()
  @Column({ type: 'enum', enum: StatutIncident, default: StatutIncident.DECLARE })
  statut: StatutIncident;

  @ApiProperty({ description: 'Date/heure de survenue de l\'événement' })
  @Column({ type: 'timestamptz' })
  dateSurvenue: Date;

  @ApiProperty({ description: 'Service / unité concerné', example: 'Bloc opératoire' })
  @Column()
  serviceConcerne: string;

  @ApiPropertyOptional({ description: 'Patient concerné (nullable — incident non lié à un patient possible)' })
  @Index()
  @Column({ nullable: true })
  patientId: string | null;

  @ApiProperty({ description: 'Description factuelle de l\'événement' })
  @Column({ type: 'text' })
  description: string;

  @ApiPropertyOptional({ description: 'Causes identifiées lors de l\'analyse' })
  @Column({ type: 'text', nullable: true })
  causesIdentifiees: string | null;

  @ApiPropertyOptional({ description: 'Mesures correctives décidées / mises en œuvre' })
  @Column({ type: 'text', nullable: true })
  mesuresCorrectives: string | null;

  @ApiProperty({ description: 'Identifiant du déclarant' })
  @Index()
  @Column()
  declarantId: string;

  @ApiPropertyOptional({ description: 'Analyse structurée optionnelle (ex. 5M / arbre des causes)' })
  @Column({ type: 'jsonb', nullable: true })
  analyseJson: Record<string, unknown> | null;

  @ApiProperty({ description: 'Fil de suivi (analyses, actions correctives, commentaires)', type: 'array' })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  actions: ActionIncident[];

  @ApiPropertyOptional({ description: 'Date de clôture' })
  @Column({ type: 'timestamptz', nullable: true })
  dateCloture: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
