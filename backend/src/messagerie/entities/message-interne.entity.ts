import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Message d'une conversation de messagerie interne. `luPar` porte la liste des
 * identifiants users ayant lu le message (base du compteur de non-lus par
 * utilisateur). Scoping tenant strict via `tenantId`.
 */
@Entity('messagerie_messages')
export class MessageInterne {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  @Index()
  @Column()
  conversationId: string;

  @Column()
  auteurId: string;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ nullable: true })
  pieceJointeUrl?: string;

  /** Identifiants (users.id) ayant lu ce message. L'auteur est réputé lecteur. */
  @Column({ type: 'jsonb', default: [] })
  luPar: string[];

  @CreateDateColumn({ name: 'dateEnvoi' })
  dateEnvoi: Date;
}
