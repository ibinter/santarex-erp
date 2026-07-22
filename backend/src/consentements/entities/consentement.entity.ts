import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeConsentement } from './modele-consentement.entity';

/**
 * Cycle de vie d'un consentement éclairé.
 * a_signer → signe (signature du patient / représentant légal)
 * a_signer → refuse (refus tracé avec motif)
 * signe    → revoque (le patient retire son consentement, avec motif + date)
 */
export enum StatutConsentement {
  A_SIGNER = 'a_signer',
  SIGNE = 'signe',
  REFUSE = 'refuse',
  REVOQUE = 'revoque',
}

/**
 * Lien du signataire avec le patient — indispensable pour un mineur ou un
 * majeur protégé (parent, tuteur, représentant légal).
 */
export enum LienSignataire {
  PATIENT = 'patient',
  PARENT = 'parent',
  TUTEUR = 'tuteur',
  REPRESENTANT_LEGAL = 'representant_legal',
  CONJOINT = 'conjoint',
  AUTRE = 'autre',
}

/**
 * Un formulaire de consentement éclairé rattaché à un patient et à un acte
 * précis. Le texte du modèle y est FIGÉ (`texteConsentement`) au moment de la
 * création, afin de conserver la valeur médico-légale même si le modèle évolue
 * ensuite. Table `consentements`.
 */
@Entity('consentements')
export class Consentement {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'CONS-2026-0001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiPropertyOptional({ description: 'Modèle source (peut être null si saisi libre)' })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  modeleId: string | null;

  @ApiProperty({ enum: TypeConsentement })
  @Index()
  @Column({ type: 'enum', enum: TypeConsentement })
  type: TypeConsentement;

  @ApiProperty({ example: 'Appendicectomie', description: 'Acte / intervention concerné' })
  @Column()
  acteConcerne: string;

  @ApiProperty({ description: "Titre du formulaire (copié du modèle)" })
  @Column()
  titre: string;

  @ApiProperty({ description: 'Texte figé du consentement (valeur médico-légale)' })
  @Column({ type: 'text' })
  texteConsentement: string;

  @ApiPropertyOptional({ description: "Référence du médecin responsable de l'acte" })
  @Index()
  @Column({ nullable: true })
  medecinRef: string;

  @ApiPropertyOptional({ description: 'Rattachement à une intervention du bloc opératoire' })
  @Index()
  @Column({ type: 'uuid', nullable: true })
  interventionId: string | null;

  @ApiProperty({ enum: StatutConsentement, default: StatutConsentement.A_SIGNER })
  @Index()
  @Column({ type: 'enum', enum: StatutConsentement, default: StatutConsentement.A_SIGNER })
  statut: StatutConsentement;

  // ── Signature ────────────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateSignature: Date | null;

  @ApiPropertyOptional({ description: 'Nom complet du signataire' })
  @Column({ nullable: true })
  signataireNom: string;

  @ApiPropertyOptional({ enum: LienSignataire, description: 'Lien du signataire avec le patient' })
  @Column({ type: 'enum', enum: LienSignataire, nullable: true })
  signataireLien: LienSignataire | null;

  @ApiPropertyOptional({ description: 'Signataire mineur → représentant légal requis' })
  @Column({ default: false })
  patientMineur: boolean;

  // ── Témoin (optionnel) ───────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Nom du témoin (optionnel)' })
  @Column({ nullable: true })
  temoinNom: string;

  // ── Refus / révocation ───────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Motif de refus ou de révocation' })
  @Column({ type: 'text', nullable: true })
  motif: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateRevocation: Date | null;

  @ApiPropertyOptional({ description: 'Observations / notes libres' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
