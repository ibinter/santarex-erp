import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  DomaineIndicateur,
  SensIndicateur,
  UniteIndicateur,
} from '../entities/indicateur-qualite.entity';
import {
  StatutConformite,
} from '../entities/critere-accreditation.entity';
import { TypePeriodeMesure } from '../entities/mesure-indicateur.entity';

// ── Indicateurs ────────────────────────────────────────────────────────────
export class CreateIndicateurDto {
  @IsString()
  @MaxLength(80)
  code: string;

  @IsString()
  @MaxLength(200)
  libelle: string;

  @IsEnum(DomaineIndicateur)
  domaine: DomaineIndicateur;

  @IsEnum(UniteIndicateur)
  unite: UniteIndicateur;

  @IsNumber()
  cible: number;

  @IsOptional()
  @IsNumber()
  seuil?: number;

  @IsEnum(SensIndicateur)
  sens: SensIndicateur;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateIndicateurDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  libelle?: string;

  @IsOptional()
  @IsEnum(DomaineIndicateur)
  domaine?: DomaineIndicateur;

  @IsOptional()
  @IsEnum(UniteIndicateur)
  unite?: UniteIndicateur;

  @IsOptional()
  @IsNumber()
  cible?: number;

  @IsOptional()
  @IsNumber()
  seuil?: number;

  @IsOptional()
  @IsEnum(SensIndicateur)
  sens?: SensIndicateur;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

// ── Mesures ──────────────────────────────────────────────────────────────────
export class CreateMesureDto {
  @IsEnum(TypePeriodeMesure)
  typePeriode: TypePeriodeMesure;

  @IsString()
  @MaxLength(20)
  periode: string;

  @IsNumber()
  valeur: number;

  @IsOptional()
  @IsDateString()
  dateMesure?: string;

  @IsOptional()
  @IsString()
  commentaire?: string;
}

// ── Critères d'accréditation ────────────────────────────────────────────────
export class CreateCritereDto {
  @IsString()
  @MaxLength(150)
  referentiel: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chapitre?: string;

  @IsString()
  exigence: string;

  @IsOptional()
  @IsEnum(StatutConformite)
  statut?: StatutConformite;

  @IsOptional()
  @IsString()
  preuve?: string;

  @IsOptional()
  @IsString()
  responsableRef?: string;

  @IsOptional()
  @IsDateString()
  echeance?: string;
}

export class UpdateCritereDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  referentiel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chapitre?: string;

  @IsOptional()
  @IsString()
  exigence?: string;

  @IsOptional()
  @IsEnum(StatutConformite)
  statut?: StatutConformite;

  @IsOptional()
  @IsString()
  preuve?: string;

  @IsOptional()
  @IsString()
  responsableRef?: string;

  @IsOptional()
  @IsDateString()
  echeance?: string;
}
