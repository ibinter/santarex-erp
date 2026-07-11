import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ModeArrivee {
  AMBULANCE = 'ambulance',
  PROPRE_PIED = 'propre_pied',
  ACCOMPAGNE = 'accompagne',
  POMPIERS = 'pompiers',
  SMUR = 'smur',
}

export enum CategorieUrgence {
  ROUGE = 'rouge',
  ORANGE = 'orange',
  JAUNE = 'jaune',
  VERT = 'vert',
  NOIR = 'noir',
}

export enum StatutUrgence {
  ATTENTE_TRIAGE = 'attente_triage',
  EN_TRIAGE = 'en_triage',
  EN_SOINS = 'en_soins',
  EN_OBSERVATION = 'en_observation',
  HOSPITALISE = 'hospitalise',
  SORTI = 'sorti',
  TRANSFERE = 'transfere',
  DECEDE = 'decede',
}

export enum DispositionUrgence {
  RETOUR_DOMICILE = 'retour_domicile',
  HOSPITALISATION = 'hospitalisation',
  TRANSFERT = 'transfert',
  DECES = 'deces',
}

@Entity('patients_urgence')
export class PatientUrgence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column({ nullable: true })
  @Index()
  patientId: string;

  @Column({ nullable: true })
  nomProvisoire: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateHeureArrivee: Date;

  @Column({ type: 'enum', enum: ModeArrivee })
  modeArrivee: ModeArrivee;

  @Column()
  motifConsultation: string;

  @Column({ type: 'enum', enum: CategorieUrgence, default: CategorieUrgence.VERT })
  categorieUrgence: CategorieUrgence;

  @Column({ type: 'int', nullable: true })
  scoreGlasgow: number;

  @Column({ nullable: true })
  tensionArterielle: string;

  @Column({ type: 'int', nullable: true })
  frequenceCardiaque: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  saturationO2: number;

  @Column({ type: 'int', nullable: true })
  frequenceRespiratoire: number;

  @Column({ type: 'int', nullable: true })
  douleur: number;

  @Column({ nullable: true })
  medecinResponsableId: string;

  @Column({ nullable: true })
  infirmiereTriageId: string;

  @Column({ type: 'enum', enum: StatutUrgence, default: StatutUrgence.ATTENTE_TRIAGE })
  statut: StatutUrgence;

  @Column({ nullable: true, type: 'text' })
  diagnostic: string;

  @Column({ type: 'enum', enum: DispositionUrgence, nullable: true })
  disposition: DispositionUrgence;

  @Column({ type: 'timestamp', nullable: true })
  dateHeureSortie: Date;

  @Column({ type: 'int', nullable: true })
  dureePassageMinutes: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
