import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Modes de règlement supportés par un reçu/ticket. Aligné (valeurs) sur
 * `ModePaiement` du module paiements — dupliqué volontairement pour éviter
 * tout couplage fort (on ne modifie pas paiements/facturation).
 */
export enum ModeRecu {
  ESPECES = 'especes',
  CARTE_BANCAIRE = 'carte_bancaire',
  MOBILE_MONEY = 'mobile_money',
  VIREMENT = 'virement',
  CHEQUE = 'cheque',
  ASSURANCE = 'assurance',
  AUTRE = 'autre',
}

/**
 * Reçu / ticket d'encaissement imprimable. Peut être rattaché à une session
 * de caisse (sessionId), et optionnellement à une facture ou un paiement
 * existant (références souples, aucune FK dure vers ces modules).
 */
@Entity('caisse_recus')
export class Recu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro auto REC-AAAA-NNNN */
  @Column()
  @Index()
  numero: string;

  /** Session de caisse de rattachement (nullable) */
  @Column({ nullable: true })
  @Index()
  sessionId: string | null;

  @Column({ nullable: true })
  @Index()
  patientId: string | null;

  /** Référence facture optionnelle (id facture) */
  @Column({ nullable: true })
  factureRef: string | null;

  /** Référence paiement optionnelle (id paiement) */
  @Column({ nullable: true })
  paiementRef: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  montant: number;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ type: 'enum', enum: ModeRecu, default: ModeRecu.ESPECES })
  modePaiement: ModeRecu;

  @Column({ type: 'timestamp', default: () => 'now()' })
  date: Date;

  /** Objet / libellé du reçu (ex: « Consultation », « Acompte hospitalisation ») */
  @Column({ nullable: true })
  objet: string | null;

  /** Référence de l'utilisateur émetteur */
  @Column({ nullable: true })
  emisParRef: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column()
  @Index()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
