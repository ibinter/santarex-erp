import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PatientSexe {
  MASCULIN = 'M',
  FEMININ = 'F',
  INDETERMINE = 'I',
}

export enum PatientGroupeSanguin {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
}

export enum PatientStatut {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  DECEDE = 'decede',
}

@Entity('patients')
export class Patient {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '2024-00001', description: 'Identifiant patient permanent (IPP) auto-généré' })
  @Index({ unique: true })
  @Column({ unique: true })
  ipp: string;

  @ApiProperty({ example: 'KOUASSI', description: 'Nom de famille du patient' })
  @Column()
  nom: string;

  @ApiProperty({ example: 'Jean-Baptiste', description: 'Prénom du patient' })
  @Column()
  prenom: string;

  @ApiProperty({ example: '1985-03-15', description: 'Date de naissance' })
  @Column({ type: 'date' })
  dateNaissance: Date;

  @ApiProperty({ enum: PatientSexe, example: PatientSexe.MASCULIN, description: 'Sexe du patient' })
  @Column({ type: 'enum', enum: PatientSexe })
  sexe: PatientSexe;

  @ApiPropertyOptional({ example: '+22507070707', description: 'Numéro de téléphone principal' })
  @Column({ nullable: true })
  telephone: string;

  @ApiPropertyOptional({ example: '+22508080808', description: 'Téléphone en cas d\'urgence' })
  @Column({ nullable: true })
  telephoneUrgence: string;

  @ApiPropertyOptional({ example: 'Rue des Fleurs, Cocody', description: 'Adresse postale' })
  @Column({ nullable: true })
  adresse: string;

  @ApiPropertyOptional({ example: 'Abidjan', description: 'Ville de résidence' })
  @Column({ nullable: true })
  ville: string;

  @ApiPropertyOptional({ example: 'CI', description: 'Code pays ISO (défaut: CI)' })
  @Column({ default: 'CI' })
  pays: string;

  @ApiPropertyOptional({ example: 'Ivoirienne', description: 'Nationalité du patient' })
  @Column({ nullable: true })
  nationalite: string;

  @ApiPropertyOptional({ example: 'CI-2024-123456', description: 'Numéro de pièce d\'identité' })
  @Column({ nullable: true })
  numeroPieceIdentite: string;

  @ApiPropertyOptional({ example: 'CNI', description: 'Type de pièce d\'identité (CNI, Passeport, etc.)' })
  @Column({ nullable: true })
  typePieceIdentite: string;

  @ApiPropertyOptional({ enum: PatientGroupeSanguin, description: 'Groupe sanguin du patient' })
  @Column({ type: 'enum', enum: PatientGroupeSanguin, nullable: true })
  groupeSanguin: PatientGroupeSanguin;

  @ApiPropertyOptional({ example: 'https://cdn.santarex.ci/photos/patient-123.jpg', description: 'URL de la photo du patient' })
  @Column({ nullable: true })
  photoUrl: string;

  @ApiPropertyOptional({ description: 'Liste des allergies (stocké en JSON)', example: '[{"nom":"Pénicilline","severite":"grave"}]' })
  @Column({ type: 'text', nullable: true })
  allergiesJson: string;

  @ApiPropertyOptional({ description: 'Antécédents médicaux du patient' })
  @Column({ type: 'text', nullable: true })
  antecedentsMedicaux: string;

  @ApiPropertyOptional({ example: 'MUGEFCI', description: 'Nom de l\'assurance maladie' })
  @Column({ nullable: true })
  assuranceNom: string;

  @ApiPropertyOptional({ example: 'MUG-2024-789', description: 'Numéro d\'assurance' })
  @Column({ nullable: true })
  assuranceNumero: string;

  @ApiPropertyOptional({ example: false, description: 'Tiers-payant assurance activé' })
  @Column({ default: false })
  assuranceTiersPayant: boolean;

  @ApiProperty({ enum: PatientStatut, example: PatientStatut.ACTIF, description: 'Statut du dossier patient' })
  @Column({ type: 'enum', enum: PatientStatut, default: PatientStatut.ACTIF })
  statut: PatientStatut;

  @ApiProperty({ example: 'clinique-saint-joseph', description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'UUID de l\'utilisateur créateur du dossier' })
  @Column({ type: 'uuid' })
  createdById: string;

  @ApiProperty({ description: 'Date de création du dossier' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
