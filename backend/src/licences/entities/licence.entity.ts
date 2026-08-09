import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LicenceStatut {
  ACTIVE = 'active',
  SUSPENDUE = 'suspendue',
  EXPIREE = 'expiree',
  ESSAI = 'essai',
  ANNULEE = 'annulee',
  // Palier gratuit à vie « Découverte » (cahier IBIG v1.1, §3). Accès aux
  // fonctions de base, plafonné par le compteur métier (10 patients), sans
  // export / API / SARA / multi-utilisateur.
  DECOUVERTE = 'decouverte',
  // Période de grâce (cahier IBIG-LICENCE-UNIVERSEL v1.1, §5.6). Accès complet
  // maintenu après l'échéance d'une licence ACTIVE, pendant `grace_jours` (7),
  // le temps de renouveler. Passé ce délai → EXPIREE (lecture seule).
  GRACE = 'grace',
}

export enum LicenceModePaiement {
  CINETPAY = 'cinetpay',
  ORANGE_MONEY = 'orange_money',
  VIREMENT = 'virement',
  MANUEL = 'manuel',
  GRATUIT = 'gratuit',
}

@Entity('licences')
export class Licence {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Clé de licence unique générée automatiquement' })
  @Index({ unique: true })
  @Column({ unique: true })
  cle: string;

  @ApiProperty({ description: 'Slug du tenant (référence vers tenants.slug)' })
  @Index()
  @Column()
  tenantSlug: string;

  @ApiProperty({ description: 'UUID de l\'offre SaaS souscrite' })
  @Column({ type: 'uuid' })
  offreId: string;

  @ApiProperty({ example: 'starter', description: 'Code de l\'offre (dupliqué pour lisibilité)' })
  @Column()
  offreCode: string;

  @ApiProperty({ enum: LicenceStatut, default: LicenceStatut.ESSAI })
  @Column({ type: 'enum', enum: LicenceStatut, default: LicenceStatut.ESSAI })
  statut: LicenceStatut;

  @ApiProperty({ description: 'Date de début de la licence' })
  @Column({ type: 'timestamptz' })
  dateDebut: Date;

  @ApiProperty({ description: 'Date d\'expiration de la licence' })
  @Column({ type: 'timestamptz' })
  dateExpiration: Date;

  @ApiPropertyOptional({ description: 'Date du dernier renouvellement' })
  @Column({ type: 'timestamptz', nullable: true })
  dateDernierRenouvellement: Date;

  @ApiProperty({ description: 'Nombre max d\'utilisateurs autorisés par cette licence' })
  @Column({ type: 'int', default: 5 })
  maxUtilisateurs: number;

  @ApiPropertyOptional({ description: 'Modules activés (peut surcharger l\'offre)' })
  @Column({ type: 'text', nullable: true })
  modulesActivesJson: string;

  @ApiProperty({ example: 49000, description: 'Montant payé en FCFA' })
  @Column({ type: 'int', default: 0 })
  montantPaye: number;

  @ApiProperty({ enum: LicenceModePaiement })
  @Column({ type: 'enum', enum: LicenceModePaiement, default: LicenceModePaiement.MANUEL })
  modePaiement: LicenceModePaiement;

  @ApiPropertyOptional({ description: 'Référence transaction paiement' })
  @Column({ nullable: true })
  refTransaction: string;

  @ApiPropertyOptional({ description: 'UUID de l\'admin IBIG SOFT ayant activé manuellement' })
  @Column({ type: 'uuid', nullable: true })
  activeParId: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Nombre de jours d\'essai (0 si pas en période d\'essai)' })
  @Column({ type: 'int', default: 30 })
  joursEssai: number;

  @ApiPropertyOptional({
    description:
      'Fin de la période de grâce (état GRACE). = dateExpiration + grace_jours (7). '
      + 'Au-delà, la licence passe EXPIREE (lecture seule).',
  })
  @Column({ type: 'timestamptz', nullable: true })
  dateFinGrace: Date;

  @ApiPropertyOptional({
    description:
      'Date de purge des données (état EXPIREE). = dateFinGrace + retention_jours (90). '
      + 'Au-delà, le tenant est éligible à la purge best-effort.',
  })
  @Column({ type: 'timestamptz', nullable: true })
  datePurge: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
