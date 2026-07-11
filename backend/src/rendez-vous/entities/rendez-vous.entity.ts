import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeRendezVous {
  CONSULTATION = 'consultation',
  SUIVI = 'suivi',
  URGENCE = 'urgence',
  EXAMEN = 'examen',
  CHIRURGIE = 'chirurgie',
  AUTRE = 'autre',
}

export enum StatutRendezVous {
  PLANIFIE = 'planifie',
  CONFIRME = 'confirme',
  EN_ATTENTE = 'en_attente',
  ANNULE = 'annule',
  REPORTE = 'reporte',
  HONORE = 'honore',
  ABSENT = 'absent',
}

@Entity('rendez_vous')
export class RendezVous {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @Index()
  @Column()
  medecinId: string;

  @Column({ type: 'timestamptz' })
  dateHeure: Date;

  @Column({ default: 30 })
  dureeMinutes: number;

  @Column()
  motif: string;

  @Column({ type: 'enum', enum: TypeRendezVous })
  type: TypeRendezVous;

  @Column({ type: 'enum', enum: StatutRendezVous, default: StatutRendezVous.PLANIFIE })
  statut: StatutRendezVous;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  salle: string;

  @Column({ default: false })
  rappelEnvoye: boolean;

  @Column()
  tenantId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
