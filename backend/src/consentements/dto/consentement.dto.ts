import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeConsentement } from '../entities/modele-consentement.entity';
import { LienSignataire } from '../entities/consentement.entity';

// ── Modèles ──────────────────────────────────────────────────────────────────

export class CreateModeleConsentementDto {
  @ApiProperty({ enum: TypeConsentement })
  @IsEnum(TypeConsentement)
  type: TypeConsentement;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texteModele: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateModeleConsentementDto {
  @ApiPropertyOptional({ enum: TypeConsentement })
  @IsOptional()
  @IsEnum(TypeConsentement)
  type?: TypeConsentement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  texteModele?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

// ── Consentements ────────────────────────────────────────────────────────────

export class CreateConsentementDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Modèle source ; sinon fournir type + texte' })
  @IsOptional()
  @IsUUID()
  modeleId?: string;

  @ApiPropertyOptional({ enum: TypeConsentement, description: 'Requis si aucun modèle' })
  @IsOptional()
  @IsEnum(TypeConsentement)
  type?: TypeConsentement;

  @ApiProperty({ example: 'Appendicectomie' })
  @IsString()
  @IsNotEmpty()
  acteConcerne: string;

  @ApiPropertyOptional({ description: 'Titre libre (sinon repris du modèle)' })
  @IsOptional()
  @IsString()
  titre?: string;

  @ApiPropertyOptional({ description: 'Texte libre (sinon repris du modèle)' })
  @IsOptional()
  @IsString()
  texteConsentement?: string;

  @ApiPropertyOptional({ description: "Référence du médecin responsable" })
  @IsOptional()
  @IsString()
  medecinRef?: string;

  @ApiPropertyOptional({ description: 'Intervention du bloc opératoire liée' })
  @IsOptional()
  @IsUUID()
  interventionId?: string;

  @ApiPropertyOptional({ description: 'Patient mineur / majeur protégé' })
  @IsOptional()
  @IsBoolean()
  patientMineur?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}

export class SignerConsentementDto {
  @ApiProperty({ description: 'Nom complet du signataire' })
  @IsString()
  @IsNotEmpty()
  signataireNom: string;

  @ApiPropertyOptional({ enum: LienSignataire, default: LienSignataire.PATIENT })
  @IsOptional()
  @IsEnum(LienSignataire)
  signataireLien?: LienSignataire;

  @ApiPropertyOptional({ description: 'Nom du témoin (optionnel)' })
  @IsOptional()
  @IsString()
  temoinNom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}

export class RefuserConsentementDto {
  @ApiProperty({ description: 'Motif du refus (traçabilité obligatoire)' })
  @IsString()
  @IsNotEmpty()
  motif: string;

  @ApiPropertyOptional({ description: 'Nom de la personne ayant refusé' })
  @IsOptional()
  @IsString()
  signataireNom?: string;
}

export class RevoquerConsentementDto {
  @ApiProperty({ description: 'Motif de la révocation (traçabilité obligatoire)' })
  @IsString()
  @IsNotEmpty()
  motif: string;
}
