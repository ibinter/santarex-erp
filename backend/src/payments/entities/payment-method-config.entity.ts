import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { PaymentMethodType, PaymentGateway } from '../payments.enums';

// Configuration d'un moyen de paiement — TOUT est en base, rien codé en dur.
// Modifiable par l'admin sans redéploiement. Les secrets sont chiffrés/masqués
// à la lecture par le service (jamais renvoyés en clair au front).
@Entity('pay_method_configs')
export class PaymentMethodConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Clé logique unique, ex: "mobile_money.orange", "gateway.cinetpay",
  // "bank_transfer", "crypto.usdt.trc20", "voucher"...
  @Index()
  @Column({ unique: true })
  key: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType;

  @Column({ nullable: true })
  label: string; // libellé affiché au client

  @Column({ default: false })
  enabled: boolean; // bouton ON/OFF admin

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  // Sous-type éventuel : opérateur MM, passerelle, crypto asset...
  @Column({ type: 'enum', enum: PaymentGateway, nullable: true })
  gateway: PaymentGateway | null;

  // Identifiants / paramètres publics NON sensibles (numéros de réception,
  // IBAN, adresse wallet, nom titulaire, réseau crypto, ordre du chèque…).
  @Column({ type: 'jsonb', default: {} })
  publicConfig: Record<string, unknown>;

  // Secrets chiffrés (API keys, secret keys, webhook secrets). Stockés chiffrés
  // au repos ; jamais exposés en clair par l'API (masqués : "••••1234").
  @Column({ type: 'jsonb', default: {} })
  secretConfig: Record<string, string>;

  // Sandbox vs production (passerelles).
  @Column({ default: true })
  sandbox: boolean;

  // Instructions affichées au client pour ce moyen.
  @Column({ type: 'text', nullable: true })
  instructions: string;

  // Restriction géographique (codes pays ISO2) ; vide = tous pays.
  @Column({ type: 'jsonb', default: [] })
  countries: string[];

  // Restriction par forfait (codes d'offre) ; vide = tous forfaits.
  @Column({ type: 'jsonb', default: [] })
  offerCodes: string[];

  // Devises acceptées (ISO), vide = devise par défaut.
  @Column({ type: 'jsonb', default: [] })
  currencies: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
