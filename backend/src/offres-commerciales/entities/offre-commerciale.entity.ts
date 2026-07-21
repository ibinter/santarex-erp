import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Statut du cycle de vie d'un devis / offre commerciale. */
export enum OffreCommercialeStatut {
  BROUILLON = 'brouillon',
  ENVOYEE = 'envoyee',
  ACCEPTEE = 'acceptee',
  REFUSEE = 'refusee',
  EXPIREE = 'expiree',
}

/**
 * Offre commerciale personnalisée (DEVIS) envoyée à un prospect ou client.
 * À ne pas confondre avec `OffreSaas` (plans tarifaires publics).
 * Table : `offre_com_offres`.
 */
@Entity('offre_com_offres')
export class OffreCommerciale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro lisible auto-généré : DEV-AAAA-NNNN. */
  @Index()
  @Column({ unique: true })
  numero: string;

  /** Référence facultative vers un prospect (CRM). */
  @Column({ nullable: true })
  prospectId: string;

  @Column()
  clientNom: string;

  @Column()
  clientEmail: string;

  /** Logiciel concerné (ex. « SANTAREX ERP »). */
  @Column({ default: 'SANTAREX ERP' })
  logiciel: string;

  /** Formule / plan retenu (ex. « Clinique », « Hôpital »). */
  @Column({ nullable: true })
  formule: string;

  /** Modules inclus dans l'offre. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  modules: string[];

  @Column({ type: 'int', default: 1 })
  nbUtilisateurs: number;

  @Column({ type: 'int', default: 1 })
  nbSites: number;

  /** Durée d'engagement (ex. « 12 mois », « annuel »). */
  @Column({ nullable: true })
  duree: string;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ type: 'int', default: 0 })
  prixHT: number;

  @Column({ type: 'int', default: 0 })
  remise: number;

  @Column({ type: 'int', default: 0 })
  taxes: number;

  @Column({ type: 'int', default: 0 })
  prixTTC: number;

  /** Options additionnelles [{ libelle, prix }]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  options: Array<{ libelle: string; prix: number }>;

  @Column({ type: 'text', nullable: true })
  formation: string;

  @Column({ type: 'text', nullable: true })
  migration: string;

  @Column({ type: 'text', nullable: true })
  accompagnement: string;

  /** Échéancier de paiement [{ libelle, montant, echeance }]. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  echeancier: Array<{ libelle: string; montant: number; echeance?: string }>;

  @Column({ type: 'timestamptz', nullable: true })
  dateValidite: Date;

  @Column({ type: 'text', nullable: true })
  conditions: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: OffreCommercialeStatut,
    default: OffreCommercialeStatut.BROUILLON,
  })
  statut: OffreCommercialeStatut;

  /** Token aléatoire non prévisible pour la consultation/acceptation publique. */
  @Index()
  @Column({ unique: true })
  tokenAcceptation: string;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date;

  /** Date de la dernière relance automatique (idempotence scheduler). */
  @Column({ type: 'timestamptz', nullable: true })
  dateDerniereRelance: Date;

  /** Nombre de relances automatiques déjà envoyées (plafonné par le scheduler). */
  @Column({ type: 'int', default: 0 })
  nbRelances: number;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
