import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeVehicule {
  AMBULANCE = 'ambulance',
  VSL = 'vsl',
  UTILITAIRE = 'utilitaire',
}

export enum StatutVehicule {
  DISPONIBLE = 'disponible',
  EN_MISSION = 'en_mission',
  MAINTENANCE = 'maintenance',
  HORS_SERVICE = 'hors_service',
}

@Entity('transport_vehicules')
export class Vehicule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  immatriculation: string;

  @Column({ type: 'enum', enum: TypeVehicule, default: TypeVehicule.AMBULANCE })
  type: TypeVehicule;

  @Column({ nullable: true })
  marque: string;

  @Column({ nullable: true })
  modele: string;

  @Column({
    type: 'enum',
    enum: StatutVehicule,
    default: StatutVehicule.DISPONIBLE,
  })
  statut: StatutVehicule;

  @Column({ type: 'int', default: 0 })
  kilometrage: number;

  @Column({ type: 'int', nullable: true })
  seuilEntretienKm: number;

  @Column({ type: 'date', nullable: true })
  dateProchainEntretien: string;

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
