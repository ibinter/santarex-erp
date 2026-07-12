import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum TicketStatut {
  OUVERT = 'ouvert',
  EN_COURS = 'en_cours',
  RESOLU = 'resolu',
  FERME = 'ferme',
}

export enum TicketPriorite {
  FAIBLE = 'faible',
  NORMALE = 'normale',
  HAUTE = 'haute',
  CRITIQUE = 'critique',
}

export enum TicketCategorie {
  BUG = 'bug',
  QUESTION = 'question',
  AMELIORATION = 'amelioration',
  FACTURATION = 'facturation',
  AUTRE = 'autre',
}

export interface TicketReponse {
  id: string;
  auteurId: string;
  auteurNom: string;
  estAdmin: boolean;
  message: string;
  createdAt: string;
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  numero: string;

  @Index()
  @Column()
  tenantId: string;

  @Column()
  auteurId: string;

  @Column()
  auteurNom: string;

  @Column()
  auteurEmail: string;

  @Column()
  sujet: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: TicketStatut, default: TicketStatut.OUVERT })
  statut: TicketStatut;

  @Column({ type: 'enum', enum: TicketPriorite, default: TicketPriorite.NORMALE })
  priorite: TicketPriorite;

  @Column({ type: 'enum', enum: TicketCategorie, default: TicketCategorie.QUESTION })
  categorie: TicketCategorie;

  @Column({ type: 'jsonb', default: [] })
  reponses: TicketReponse[];

  @Column({ nullable: true })
  assigneA: string;

  @Column({ nullable: true })
  resoluAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
