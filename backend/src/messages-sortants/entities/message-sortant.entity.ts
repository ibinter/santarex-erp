import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CanalMessage } from './modele-message.entity';

export enum StatutMessageSortant {
  EN_ATTENTE = 'en_attente',
  ENVOYE = 'envoye',
  ECHOUE = 'echoue',
  /** Le message a été « envoyé » via le provider simulé (aucun appel réseau). */
  SIMULE = 'simule',
}

/**
 * Un message sortant (SMS/WhatsApp) destiné à un patient ou un numéro libre.
 * Trace le contenu final, le statut d'envoi et une référence à l'objet source
 * (ex. rdvId) pour l'idempotence des rappels automatiques.
 * Scopé par tenant.
 */
@Entity('messages_sortants')
export class MessageSortant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  /** Patient destinataire (nullable : envoi possible vers un numéro libre). */
  @Index()
  @Column({ nullable: true })
  patientId: string;

  /** Numéro de téléphone du destinataire (format libre / international). */
  @Column()
  destinataire: string;

  @Column({ type: 'enum', enum: CanalMessage, default: CanalMessage.SMS })
  canal: CanalMessage;

  /** Contenu final, variables déjà substituées. */
  @Column({ type: 'text' })
  contenu: string;

  @Column({
    type: 'enum',
    enum: StatutMessageSortant,
    default: StatutMessageSortant.EN_ATTENTE,
  })
  statut: StatutMessageSortant;

  @Column({ type: 'timestamptz', nullable: true })
  dateEnvoi: Date;

  @Column({ type: 'text', nullable: true })
  erreur: string;

  /** Code du modèle utilisé (rappel_rdv…), si applicable. */
  @Index()
  @Column({ nullable: true })
  modeleCode: string;

  /** Référence de l'objet source (ex. rdvId) — sert à l'idempotence. */
  @Index()
  @Column({ nullable: true })
  referenceObjet: string;

  /** Nom du provider ayant traité l'envoi (log/simule, twilio, orange…). */
  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
