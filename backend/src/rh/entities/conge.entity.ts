import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employe } from './employe.entity';

export enum TypeConge {
  CONGE_ANNUEL = 'conge',
  MALADIE = 'maladie',
  MATERNITE = 'maternite',
  FORMATION = 'formation',
  AUTRE = 'autre',
}

export enum StatutConge {
  DEMANDE = 'demande',
  APPROUVE = 'approuve',
  REFUSE = 'refuse',
}

@Entity('rh_conges')
export class Conge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  employeId: string;

  @ManyToOne(() => Employe, (employe) => employe.conges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeId' })
  employe: Employe;

  @Column({ type: 'enum', enum: TypeConge, default: TypeConge.CONGE_ANNUEL })
  type: TypeConge;

  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date' })
  dateFin: Date;

  @Column({ type: 'int', default: 0 })
  jours: number;

  @Column({ type: 'enum', enum: StatutConge, default: StatutConge.DEMANDE })
  statut: StatutConge;

  @Column({ nullable: true, type: 'text' })
  motif: string;

  @Column({ nullable: true })
  approuveById: string;

  @Column({ type: 'timestamp', nullable: true })
  approuveAt: Date;

  @Column()
  @Index()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
