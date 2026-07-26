import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutVersion {
  BROUILLON = 'brouillon',
  PUBLIEE = 'publiee',
}

/**
 * Une nouveauté d'une version : un texte affiché dans « Quoi de neuf » et,
 * optionnellement, la formule d'abonnement minimale requise pour en profiter
 * (ex. « pro », « entreprise ») — sert à contextualiser une fonctionnalité.
 */
export interface NouveauteVersion {
  texte: string;
  formuleMin?: string;
}

/**
 * Version publiée de l'ERP SANTAREX (product-level, non multi-tenant : le
 * changelog produit est global). Alimente la page /changelog et la bannière
 * « Quoi de neuf ». Version sémantique unique (ex. "2.3.0").
 */
@Entity('version_erp')
export class VersionErp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Version sémantique, ex. "2.3.0". Unique.
  @Column({ unique: true })
  @Index()
  version: string;

  @Column({ type: 'timestamp', nullable: true })
  datePublication: Date;

  @Column()
  titre: string;

  // Liste de nouveautés : [{ texte, formuleMin? }].
  @Column({ type: 'jsonb', default: () => "'[]'" })
  nouveautesJson: NouveauteVersion[];

  @Column({ type: 'enum', enum: StatutVersion, default: StatutVersion.BROUILLON })
  statut: StatutVersion;

  // Version majeure : déclenche (à terme) une notification email aux tenants.
  @Column({ default: false })
  estMajeure: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
