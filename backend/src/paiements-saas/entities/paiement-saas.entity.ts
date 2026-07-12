import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PaiementSaasStatut {
  EN_ATTENTE = 'en_attente',
  SUCCES = 'succes',
  ECHEC = 'echec',
  REMBOURSE = 'rembourse',
  ANNULE = 'annule',
}

export enum PaiementSaasMethode {
  CINETPAY = 'cinetpay',
  ORANGE_MONEY = 'orange_money',
  MANUEL = 'manuel',
}

@Entity('paiements_saas')
export class PaiementSaas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  reference: string;

  @Column({ nullable: true })
  transactionId: string;

  @Index()
  @Column()
  tenantId: string;

  @Column()
  licenceId: string;

  @Column({ type: 'enum', enum: PaiementSaasMethode })
  methode: PaiementSaasMethode;

  @Column({ type: 'enum', enum: PaiementSaasStatut, default: PaiementSaasStatut.EN_ATTENTE })
  statut: PaiementSaasStatut;

  @Column({ type: 'int' })
  montant: number;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ nullable: true })
  paymentUrl: string;

  @Column({ nullable: true })
  operateur: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  emailPayeur: string;

  @Column({ nullable: true })
  nomPayeur: string;

  @Column({ nullable: true, type: 'text' })
  notesAdmin: string;

  @Column({ nullable: true })
  validePar: string;

  @Column({ nullable: true })
  valideAt: Date;

  @Column({ nullable: true, type: 'jsonb' })
  webhookPayload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
