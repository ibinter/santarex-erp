import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LigneDevis } from './ligne-devis.entity';

export enum StatutDevis {
  BROUILLON = 'brouillon',
  ENVOYE = 'envoye',
  ACCEPTE = 'accepte',
  REFUSE = 'refuse',
  EXPIRE = 'expire',
  FACTURE = 'facture',
}

/**
 * Devis / estimatif patient : montant à prévoir avant une intervention ou une
 * hospitalisation. Convertible en facture (module facturation) une fois accepté.
 * Numéro auto : DEV-P-AAAA-NNNN. Multi-tenant obligatoire (`tenantId`).
 */
@Entity('devis_patient')
@Index(['tenantId', 'numero'], { unique: true })
export class DevisPatient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column()
  @Index()
  patientId: string;

  // Objet du devis : ex. « Intervention chirurgicale », « Hospitalisation 5 jours ».
  @Column()
  objet: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateEmission: Date;

  // Date de validité de l'offre (au-delà : expiré).
  @Column({ type: 'timestamp', nullable: true })
  dateValidite: Date;

  @Column({ type: 'enum', enum: StatutDevis, default: StatutDevis.BROUILLON })
  statut: StatutDevis;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantHT: number;

  // Remise globale en pourcentage appliquée au total.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remisePourcent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantRemise: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  montantTTC: number;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  // Motif de refus éventuel.
  @Column({ nullable: true, type: 'text' })
  motifRefus: string;

  // Renseigné lors de la conversion en facture (id de la facture créée).
  @Column({ nullable: true })
  factureId: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  createdById: string;

  @OneToMany(() => LigneDevis, (ligne) => ligne.devis, { cascade: true })
  lignes: LigneDevis[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
