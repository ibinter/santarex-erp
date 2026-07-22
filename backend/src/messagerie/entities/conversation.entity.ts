import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConversationType {
  DIRECT = 'direct',
  GROUPE = 'groupe',
}

/**
 * Conversation de messagerie interne inter-services (soignants d'un même tenant).
 * Les participants sont stockés sous forme de tableau d'identifiants users
 * (`participantsIds`), scoping tenant strict via `tenantId`.
 */
@Entity('messagerie_conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  @Column({ nullable: true })
  sujet?: string;

  @Column({ type: 'enum', enum: ConversationType, default: ConversationType.DIRECT })
  type: ConversationType;

  /** Identifiants (users.id) des participants. */
  @Column({ type: 'jsonb', default: [] })
  participantsIds: string[];

  /** Identifiant du créateur de la conversation. */
  @Column({ nullable: true })
  creeParId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateDernierMessage?: Date;

  /** Aperçu du dernier message (pour la liste des conversations). */
  @Column({ type: 'text', nullable: true })
  dernierMessageApercu?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
