import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

// Preuve de paiement uploadée (capture Mobile Money, bordereau, reçu…).
// Stockée en espace PRIVÉ (jamais dans /public). Déduplication par SHA256.
@Entity('pay_proofs')
export class PaymentProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  transactionId: string;

  // Chemin dans le stockage privé (hors /public).
  @Column()
  storagePath: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  sizeBytes: number;

  // Empreinte pour détecter les doublons de preuve.
  @Index()
  @Column({ length: 64 })
  sha256: string;

  @Column({ nullable: true })
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;
}
