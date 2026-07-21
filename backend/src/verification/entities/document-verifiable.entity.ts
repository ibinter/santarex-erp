import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DocumentType, VerificationStatus } from '../verification.enums';

/**
 * Un document (facture, reçu, ordonnance, attestation) rendu vérifiable
 * publiquement via un token aléatoire non prévisible et une empreinte SHA-256
 * de son contenu. Table `doc_verifications`.
 *
 * La vérification publique n'expose JAMAIS de donnée confidentielle : seuls le
 * type, la référence, la société émettrice, la date et le statut sont révélés.
 */
@Entity('doc_verifications')
export class DocumentVerifiable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Token aléatoire non prévisible (crypto.randomBytes(24).toString('base64url')).
  @Index({ unique: true })
  @Column({ unique: true })
  token: string;

  @Column({ type: 'enum', enum: DocumentType })
  typeDocument: DocumentType;

  // Référence métier du document (n° facture, n° ordonnance…).
  @Column()
  reference: string;

  @Index()
  @Column()
  tenantId: string;

  // Nom lisible de la société émettrice (affiché sur la page publique).
  @Column()
  tenantNom: string;

  // Empreinte SHA-256 (hex, 64 caractères) du contenu du document.
  @Index()
  @Column({ type: 'varchar', length: 64 })
  hash: string;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.AUTHENTIQUE })
  @Index()
  statut: VerificationStatus;

  // Date d'émission du document (peut différer de createdAt).
  @Column({ type: 'timestamptz' })
  emisLe: Date;

  @Column({ nullable: true })
  createdById: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
