import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ModeArrivee, CategorieUrgence } from '../entities/patient-urgence.entity';

export class AdmissionUrgenceDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  nomProvisoire?: string;

  @IsEnum(ModeArrivee)
  modeArrivee: ModeArrivee;

  @IsString()
  motifConsultation: string;

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
  infirmiereTriageId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
