import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum StatutOrdonnance {
  EMISE = 'emise',
  DELIVREE = 'delivree',
  PARTIELLEMENT_DELIVREE = 'partiellement_delivree',
  EXPIREE = 'expiree',
  ANNULEE = 'annulee',
}

export interface LigneOrdonnance {
  medicamentNom: string;
  posologie: string;
  duree: string;
  quantite: number;
  instructions?: string;
}

@Entity('ordonnances')
export class Ordonnance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  consultationId: string;

  @Index()
  @Column()
  patientId: string;

  @Column()
  medecinId: string;

  @Column({ type: 'date' })
  dateEmission: Date;

  @Column({ type: 'date', nullable: true })
  dateExpiration: Date;

  @Column({ type: 'json' })
  lignes: LigneOrdonnance[];

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({
    type: 'enum',
    enum: StatutOrdonnance,
    default: StatutOrdonnance.EMISE,
  })
  statut: StatutOrdonnance;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
