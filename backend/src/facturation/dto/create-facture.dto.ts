import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeLigneFacture } from '../entities/ligne-facture.entity';

export class CreateLigneFactureDto {
  @IsEnum(TypeLigneFacture)
  type: TypeLigneFacture;

  @IsString()
  libelle: string;

  @IsNumber()
  @Min(0.01)
  quantite: number;

  @IsNumber()
  @Min(0)
  prixUnitaire: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  remisePourcent?: number;

  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class CreateFactureDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  consultationId?: string;

  @IsOptional()
  @IsString()
  hospitalisationId?: string;

  @IsOptional()
  @IsDateString()
  dateEcheance?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxTVA?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partAssurance?: number;

  @IsOptional()
  @IsString()
  assuranceNom?: string;

  @IsOptional()
  @IsString()
  assuranceNumero?: string;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneFactureDto)
  lignes?: CreateLigneFactureDto[];
}
