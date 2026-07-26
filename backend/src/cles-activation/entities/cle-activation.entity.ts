import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CleActivationStatut {
  ACTIVE = 'active',
  UTILISEE = 'utilisee',
  REVOQUEE = 'revoquee',
  EXPIREE = 'expiree',
}

/**
 * Clé d'activation assistée (section 19.6).
 *
 * Une clé encapsule un droit d'activation de licence : elle référence une offre
 * (`offreCode`) et une durée (`dureeJours`). Elle peut être générique (utilisable
 * par n'importe quel tenant) ou nominative (`tenantSlug` renseigné → réservée à
 * une seule société). Le code est ALÉATOIRE et non prévisible (128 bits d'entropie).
 *
 * SÉCURITÉ : la clé ne débloque JAMAIS quoi que ce soit côté client. Sa saisie
 * déclenche uniquement l'activation serveur de la licence via `LicencesService`.
 */
@Entity('cles_activation')
export class CleActivation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Code d\'activation unique, non prévisible (SRX-XXXX-XXXX-XXXX)' })
  @Index({ unique: true })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ example: 'starter', description: 'Code de l\'offre/formule liée' })
  @Index()
  @Column()
  offreCode: string;

  @ApiProperty({ example: 30, description: 'Durée de licence octroyée par la clé (jours)' })
  @Column({ type: 'int', default: 30 })
  dureeJours: number;

  @ApiPropertyOptional({
    description:
      'Slug du tenant auquel la clé est réservée (null = clé générique, utilisable par tout tenant)',
  })
  @Index()
  @Column({ type: 'varchar', nullable: true })
  tenantSlug: string | null;

  @ApiProperty({ enum: CleActivationStatut, default: CleActivationStatut.ACTIVE })
  @Index()
  @Column({ type: 'enum', enum: CleActivationStatut, default: CleActivationStatut.ACTIVE })
  statut: CleActivationStatut;

  @ApiPropertyOptional({ description: 'Date d\'expiration de la clé (au-delà : inutilisable)' })
  @Column({ type: 'timestamptz', nullable: true })
  dateExpiration: Date | null;

  @ApiPropertyOptional({ description: 'Date de saisie/utilisation effective de la clé' })
  @Column({ type: 'timestamptz', nullable: true })
  dateUtilisation: Date | null;

  @ApiPropertyOptional({ description: 'Slug du tenant ayant réellement utilisé la clé' })
  @Column({ type: 'varchar', nullable: true })
  utiliseeParTenant: string | null;

  @ApiPropertyOptional({ description: 'UUID de la licence activée par cette clé' })
  @Column({ type: 'uuid', nullable: true })
  licenceId: string | null;

  @ApiProperty({ description: 'Identifiant de lot (traçabilité des générations en masse)' })
  @Index()
  @Column()
  lot: string;

  @ApiPropertyOptional({ description: 'UUID de l\'admin/superadmin ayant généré la clé' })
  @Column({ type: 'uuid', nullable: true })
  creeParId: string | null;

  @ApiPropertyOptional({ description: 'Motif de révocation' })
  @Column({ type: 'text', nullable: true })
  motifRevocation: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
