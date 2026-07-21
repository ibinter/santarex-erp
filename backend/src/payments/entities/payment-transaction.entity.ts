import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { PaymentMethodType, PaymentStatus } from '../payments.enums';

// Une intention/opération de paiement d'abonnement (une "commande").
@Entity('pay_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  reference: string; // ex: PAY-2026-000123, généré côté serveur

  @Index()
  @Column()
  tenantId: string;

  @Column()
  tenantSlug: string;

  // Licence/offre visée
  @Column({ nullable: true })
  licenceId: string;

  @Column({ nullable: true })
  offreCode: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  methodType: PaymentMethodType;

  // key du PaymentMethodConfig utilisé
  @Column()
  methodKey: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Index()
  status: PaymentStatus;

  // Montants en plus petite unité (centimes) pour éviter les flottants.
  @Column({ type: 'int' })
  amountExpected: number;

  @Column({ type: 'int', nullable: true })
  amountReceived: number | null;

  @Column({ default: 'XOF' })
  currency: string;

  // Passerelle : identifiant de transaction externe + URL de paiement.
  @Index()
  @Column({ nullable: true })
  gatewayTransactionId: string | null;

  @Column({ type: 'text', nullable: true })
  paymentUrl: string | null;

  // Référence fournie par le client (MTCN, hash crypto, n° chèque, code reçu…)
  @Column({ nullable: true })
  clientReference: string | null;

  // Coordonnées payeur
  @Column({ nullable: true }) payerName: string | null;
  @Column({ nullable: true }) payerEmail: string | null;
  @Column({ nullable: true }) payerPhone: string | null;

  // Validation admin (flux manuels)
  @Column({ nullable: true }) reviewedById: string | null;
  @Column({ type: 'timestamptz', nullable: true }) reviewedAt: Date | null;
  @Column({ type: 'text', nullable: true }) reviewNotes: string | null;

  // Expiration d'une commande non payée
  @Column({ type: 'timestamptz', nullable: true }) expiresAt: Date | null;

  // Traçabilité brute (payload passerelle, etc.)
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
