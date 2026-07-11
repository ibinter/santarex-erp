import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsBoolean,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientSexe, PatientGroupeSanguin } from '../entities/patient.entity';

export class CreatePatientDto {
  @ApiProperty({ example: 'KOUASSI', description: 'Nom de famille (obligatoire)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: 'Jean-Baptiste', description: 'Prénom (obligatoire)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ example: '1985-03-15', description: 'Date de naissance au format ISO (obligatoire)' })
  @IsDateString()
  dateNaissance: string;

  @ApiProperty({ enum: PatientSexe, example: PatientSexe.MASCULIN, description: 'Sexe (obligatoire)' })
  @IsEnum(PatientSexe)
  sexe: PatientSexe;

  @ApiPropertyOptional({ example: '+22507070707', description: 'Numéro de téléphone principal' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiPropertyOptional({ example: '+22508080808', description: 'Téléphone d\'urgence' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephoneUrgence?: string;

  @ApiPropertyOptional({ example: 'Rue des Fleurs, Cocody', description: 'Adresse postale' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adresse?: string;

  @ApiPropertyOptional({ example: 'Abidjan', description: 'Ville' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ville?: string;

  @ApiPropertyOptional({ example: 'CI', description: 'Code pays ISO 2 lettres (défaut CI)' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  pays?: string;

  @ApiPropertyOptional({ example: 'Ivoirienne', description: 'Nationalité' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationalite?: string;

  @ApiPropertyOptional({ example: 'CI-2024-123456', description: 'Numéro de pièce d\'identité' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroPieceIdentite?: string;

  @ApiPropertyOptional({ example: 'CNI', description: 'Type de pièce d\'identité' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  typePieceIdentite?: string;

  @ApiPropertyOptional({ enum: PatientGroupeSanguin, description: 'Groupe sanguin' })
  @IsOptional()
  @IsEnum(PatientGroupeSanguin)
  groupeSanguin?: PatientGroupeSanguin;

  @ApiPropertyOptional({ example: 'https://cdn.santarex.ci/photos/patient-123.jpg', description: 'URL photo du patient' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Allergies en JSON stringifié', example: '[{"nom":"Pénicilline","severite":"grave"}]' })
  @IsOptional()
  @IsString()
  allergiesJson?: string;

  @ApiPropertyOptional({ description: 'Antécédents médicaux' })
  @IsOptional()
  @IsString()
  antecedentsMedicaux?: string;

  @ApiPropertyOptional({ example: 'MUGEFCI', description: 'Nom de la mutuelle/assurance' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assuranceNom?: string;

  @ApiPropertyOptional({ example: 'MUG-2024-789', description: 'Numéro d\'adhérent assurance' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assuranceNumero?: string;

  @ApiPropertyOptional({ example: false, description: 'Activer le tiers-payant assurance' })
  @IsOptional()
  @IsBoolean()
  assuranceTiersPayant?: boolean;
}
