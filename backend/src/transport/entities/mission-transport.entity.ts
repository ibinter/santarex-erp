import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeMission {
  TRANSFERT = 'transfert',
  EVACUATION = 'evacuation',
  CONSULTATION = 'consultation',
  RETOUR_DOMICILE = 'retour_domicile',
}

export enum StatutMission {
  PLANIFIEE = 'planifiee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee',
}

@Entity('transport_missions')
export class MissionTransport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column()
  @Index()
  vehiculeId: string;

  @Column({ type: 'enum', enum: TypeMission, default: TypeMission.TRANSFERT })
  type: TypeMission;

  @Column({ nullable: true })
  @Index()
  patientId: string;

  @Column()
  origine: string;

  @Column()
  destination: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateDepart: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateArrivee: Date;

  @Column({ nullable: true })
  chauffeurRef: string;

  @Column({ type: 'boolean', default: false })
  accompagnantMedical: boolean;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceKm: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cout: number;

  @Column({ type: 'int', nullable: true })
  dureeMinutes: number;

  @Column({
    type: 'enum',
    enum: StatutMission,
    default: StatutMission.PLANIFIEE,
  })
  statut: StatutMission;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
