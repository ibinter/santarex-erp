import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique,
} from 'typeorm';
import { PaymentGateway, WebhookStatus } from '../payments.enums';

// Journal des webhooks entrants — garantit l'idempotence (un event_id ne peut
// déclencher qu'UNE seule activation) et trace les signatures invalides.
@Entity('pay_webhook_events')
@Unique(['gateway', 'eventId'])
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  // Identifiant unique de l'événement fourni par la passerelle.
  @Index()
  @Column()
  eventId: string;

  @Column({ type: 'enum', enum: WebhookStatus, default: WebhookStatus.RECEIVED })
  status: WebhookStatus;

  @Column({ nullable: true })
  transactionReference: string;

  @Column({ default: false })
  signatureValid: boolean;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
