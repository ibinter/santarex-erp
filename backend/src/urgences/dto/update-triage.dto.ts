import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { CategorieUrgence } from '../entities/patient-urgence.entity';

export class UpdateTriageDto {
  @IsOptional()
  @IsEnum(CategorieUrgence)
  categorieUrgence?: CategorieUrgence;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(15)
  scoreGlasgow?: number;

  @IsOptional()
  @IsString()
  tensionArterielle?: string;

  @IsOptional()
  @IsNumber()
  frequenceCardiaque?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  saturationO2?: number;

  @IsOptional()
  @IsNumber()
  frequenceRespiratoire?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  douleur?: number;

  @IsOptional()
  @IsString()
  diagnostic?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SortirPatientDto {
  @IsString()
  disposition: string;

  @IsOptional()
  @IsString()
  diagnostic?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
