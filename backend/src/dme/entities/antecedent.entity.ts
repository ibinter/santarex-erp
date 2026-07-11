import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeAntecedent {
  MEDICAL = 'medical',
  CHIRURGICAL = 'chirurgical',
  FAMILIAL = 'familial',
  GYNECO_OBSTETRICAL = 'gyneco_obstetrical',
  ALLERGIE = 'allergie',
  VACCINATION = 'vaccination',
  TRAITEMENT_CHRONIQUE = 'traitement_chronique',
}

export enum GraviteAntecedent {
  LEGER = 'leger',
  MODERE = 'modere',
  GRAVE = 'grave',
}

@Entity('antecedents')
export class Antecedent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @Column({ type: 'enum', enum: TypeAntecedent })
  type: TypeAntecedent;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date', nullable: true })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date;

  @Column({ type: 'enum', enum: GraviteAntecedent, nullable: true })
  gravite: GraviteAntecedent;

  @Column()
  tenantId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
