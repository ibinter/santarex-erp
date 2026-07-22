import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DevisPatient } from './devis-patient.entity';

export enum TypeLigneDevis {
  CONSULTATION = 'consultation',
  ACTE = 'acte',
  MEDICAMENT = 'medicament',
  HOSPITALISATION = 'hospitalisation',
  AUTRE = 'autre',
}

@Entity('lignes_devis')
export class LigneDevis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  devisId: string;

  @ManyToOne(() => DevisPatient, (devis) => devis.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'devisId' })
  devis: DevisPatient;

  @Column({ type: 'enum', enum: TypeLigneDevis, default: TypeLigneDevis.AUTRE })
  type: TypeLigneDevis;

  @Column()
  designation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantite: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  prixUnitaire: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantLigne: number;

  @Column()
  tenantId: string;
}
