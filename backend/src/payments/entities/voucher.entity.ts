import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { VoucherStatus } from '../payments.enums';

// Code prépayé à usage unique, généré en lot par l'admin, vendu par des
// revendeurs agréés. La redemption active immédiatement (pas de webhook).
@Entity('pay_vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  code: string; // ex: SANT-XXXX-XXXX-XXXX (unique)

  // Lot de génération (pour export CSV revendeurs).
  @Index()
  @Column({ nullable: true })
  batchId: string;

  // Valeur (centimes) et/ou offre associée.
  @Column({ type: 'int', default: 0 })
  value: number;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ nullable: true })
  offerCode: string;

  @Column({ type: 'int', default: 0 })
  durationDays: number; // durée d'abonnement conférée

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.AVAILABLE })
  status: VoucherStatus;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  // Traçabilité d'utilisation
  @Column({ nullable: true }) usedByTenantId: string | null;
  @Column({ type: 'timestamptz', nullable: true }) usedAt: Date | null;
  @Column({ nullable: true }) resellerRef: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
