import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ModePaiement {
  ESPECES = 'especes',
  CARTE_BANCAIRE = 'carte_bancaire',
  MOBILE_MONEY = 'mobile_money',
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  ASSURANCE = 'assurance',
  AUTRE = 'autre',
}

export enum StatutPaiement {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  ECHEC = 'echec',
  REMBOURSE = 'rembourse',
  ANNULE = 'annule',
}

@Entity('paiements')
export class Paiement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  reference: string;

  @Column()
  @Index()
  factureId: string;

  @Column()
  @Index()
  patientId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant: number;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ type: 'enum', enum: ModePaiement })
  modePaiement: ModePaiement;

  @Column({ nullable: true })
  operateur: string;

  @Column({ nullable: true })
  referenceTransaction: string;

  @Column({ type: 'enum', enum: StatutPaiement, default: StatutPaiement.EN_ATTENTE })
  statut: StatutPaiement;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;
}
