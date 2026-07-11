import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LigneFacture } from './ligne-facture.entity';

export enum StatutFacture {
  BROUILLON = 'brouillon',
  EMISE = 'emise',
  PARTIELLEMENT_PAYEE = 'partiellement_payee',
  PAYEE = 'payee',
  ANNULEE = 'annulee',
  EN_LITIGE = 'en_litige',
}

@Entity('factures')
@Index(['tenantId', 'numero'], { unique: true })
export class Facture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: false })
  numero: string;

  @Column()
  @Index()
  patientId: string;

  @Column({ nullable: true })
  @Index()
  consultationId: string;

  @Column({ nullable: true })
  hospitalisationId: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateEmission: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateEcheance: Date;

  @Column({ type: 'enum', enum: StatutFacture, default: StatutFacture.BROUILLON })
  statut: StatutFacture;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantHT: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tauxTVA: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantTVA: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantTTC: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantPaye: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montantRestant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  partAssurance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  partPatient: number;

  @Column({ nullable: true })
  assuranceNom: string;

  @Column({ nullable: true })
  assuranceNumero: string;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  createdById: string;

  @OneToMany(() => LigneFacture, (ligne) => ligne.facture, { cascade: true })
  lignes: LigneFacture[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
