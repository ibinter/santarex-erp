import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cycle de vie d'une déclaration sanitaire :
 * a_declarer → declaree → transmise → confirmee → classee.
 * Les transitions autorisées sont contrôlées dans le service.
 */
export enum StatutDeclaration {
  A_DECLARER = 'a_declarer',
  DECLAREE = 'declaree',
  TRANSMISE = 'transmise',
  CONFIRMEE = 'confirmee',
  CLASSEE = 'classee',
}

/** Gravité clinique du cas (échelle croissante). Pilote le code couleur. */
export enum GraviteDeclaration {
  BENIN = 'benin',
  MODERE = 'modere',
  SEVERE = 'severe',
  CRITIQUE = 'critique',
}

/** Évolution du cas déclaré. */
export enum EvolutionCas {
  EN_COURS = 'en_cours',
  GUERI = 'gueri',
  DECES = 'deces',
}

/** Sexe du patient déclaré (surveillance épidémiologique). */
export enum SexePatient {
  M = 'm',
  F = 'f',
  INCONNU = 'inconnu',
}

@Entity('decl_san_declarations')
export class DeclarationSanitaire {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'MDO-2026-0001', description: 'Numéro auto-généré' })
  @Index()
  @Column({ unique: true })
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Référence de la MDO du référentiel' })
  @Index()
  @Column()
  maladieId: string;

  @ApiProperty({ description: 'Libellé de la maladie (snapshot à la déclaration)' })
  @Column()
  maladieNom: string;

  @ApiPropertyOptional({ description: 'Code CIM-10 (snapshot)' })
  @Column({ nullable: true })
  codeCIM10: string | null;

  @ApiPropertyOptional({ description: 'Patient du dossier, si rattaché (nullable)' })
  @Index()
  @Column({ nullable: true })
  patientId: string | null;

  @ApiPropertyOptional({ description: 'Identité du cas (si patient non enregistré)' })
  @Column({ nullable: true })
  patientNom: string | null;

  @ApiPropertyOptional({ description: 'Âge du cas (années)' })
  @Column({ type: 'int', nullable: true })
  patientAge: number | null;

  @ApiProperty({ enum: SexePatient })
  @Column({ type: 'enum', enum: SexePatient, default: SexePatient.INCONNU })
  patientSexe: SexePatient;

  @ApiPropertyOptional({ description: 'Localité / zone de survenue (surveillance)', example: 'Abidjan, Cocody' })
  @Index()
  @Column({ nullable: true })
  localite: string | null;

  @ApiProperty({ description: 'Date de diagnostic / suspicion' })
  @Column({ type: 'timestamptz' })
  dateDiagnostic: Date;

  @ApiPropertyOptional({ description: 'Date de déclaration (renseignée au passage en « declaree »)' })
  @Column({ type: 'timestamptz', nullable: true })
  dateDeclaration: Date | null;

  @ApiProperty({ description: 'Identifiant du médecin déclarant' })
  @Index()
  @Column()
  medecinDeclarantRef: string;

  @ApiProperty({ enum: StatutDeclaration })
  @Index()
  @Column({ type: 'enum', enum: StatutDeclaration, default: StatutDeclaration.A_DECLARER })
  statut: StatutDeclaration;

  @ApiProperty({ enum: GraviteDeclaration })
  @Column({ type: 'enum', enum: GraviteDeclaration, default: GraviteDeclaration.MODERE })
  gravite: GraviteDeclaration;

  @ApiProperty({ enum: EvolutionCas })
  @Column({ type: 'enum', enum: EvolutionCas, default: EvolutionCas.EN_COURS })
  evolution: EvolutionCas;

  @ApiPropertyOptional({ description: 'Mesures prises (isolement, prophylaxie, prélèvements…)' })
  @Column({ type: 'text', nullable: true })
  mesuresPrises: string | null;

  @ApiPropertyOptional({ description: 'Autorité sanitaire destinataire', example: 'District sanitaire de Cocody' })
  @Column({ nullable: true })
  autoriteDestinataire: string | null;

  @ApiPropertyOptional({ description: 'Référence de transmission (accusé / bordereau)' })
  @Column({ nullable: true })
  referenceTransmission: string | null;

  @ApiPropertyOptional({ description: 'Date de transmission effective' })
  @Column({ type: 'timestamptz', nullable: true })
  dateTransmission: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
