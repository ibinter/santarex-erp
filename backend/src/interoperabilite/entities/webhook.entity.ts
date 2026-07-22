import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Événements métier auxquels un webhook peut s'abonner. */
export enum EvenementWebhook {
  PATIENT_CREE = 'patient.cree',
  RESULTAT_PRET = 'resultat.pret',
  FACTURE_CREEE = 'facture.creee',
  RENDEZVOUS_CREE = 'rendezvous.cree',
  MESSAGE_INTEROP_RECU = 'interop.message.recu',
}

/**
 * Abonnement webhook sortant d'un tenant. Chaque déclenchement POSTe le payload
 * signé (HMAC-SHA256, en-tête `X-Santarex-Signature`) vers `url`.
 */
@Entity('interop_webhooks')
export class Webhook {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Établissement propriétaire (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'URL cible du webhook (HTTPS recommandé)' })
  @Column()
  url: string;

  @ApiProperty({ enum: EvenementWebhook, isArray: true })
  @Column({ type: 'jsonb', default: '[]' })
  evenements: EvenementWebhook[];

  /** Secret partagé utilisé pour signer le payload (HMAC). Non exposé. */
  @Column({ select: false })
  secret: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  actif: boolean;

  @ApiPropertyOptional({ description: 'Dernier code HTTP / statut de livraison' })
  @Column({ nullable: true })
  dernierStatut: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateDernierEnvoi: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
