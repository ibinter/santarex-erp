import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeConsultation {
  CONSULTATION_GENERALE = 'consultation_generale',
  SPECIALITE = 'specialite',
  URGENCE = 'urgence',
  SUIVI = 'suivi',
  TELECONSULTATION = 'teleconsultation',
}

export enum StatutConsultation {
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  FACTUREE = 'facturee',
}

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @Index()
  @Column()
  medecinId: string;

  @Index()
  @Column({ nullable: true })
  rendezVousId: string;

  @Column({ type: 'timestamptz' })
  dateHeure: Date;

  @Column({ type: 'enum', enum: TypeConsultation })
  type: TypeConsultation;

  @Column()
  motif: string;

  @Column({ type: 'text', nullable: true })
  anamnese: string;

  @Column({ type: 'text', nullable: true })
  examenClinique: string;

  @Column({ nullable: true })
  tensionArterielle: string;

  @Column({ type: 'int', nullable: true })
  frequenceCardiaque: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  poidsKg: number;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  tailleCm: number;

  @Column({ type: 'int', nullable: true })
  saturationO2: number;

  @Column({ type: 'text', nullable: true })
  diagnostic: string;

  @Column({ nullable: true })
  codeCIM10: string;

  @Column({ type: 'text', nullable: true })
  conclusion: string;

  @Column({ type: 'text', nullable: true })
  planSoins: string;

  @Column({ nullable: true })
  prochainRdvJours: number;

  @Column({
    type: 'enum',
    enum: StatutConsultation,
    default: StatutConsultation.EN_COURS,
  })
  statut: StatutConsultation;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
