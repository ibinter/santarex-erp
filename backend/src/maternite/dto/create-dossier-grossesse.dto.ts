import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Rhesus } from '../entities/dossier-grossesse.entity';

export class CreateDossierGrossesseDto {
  @ApiProperty({ description: 'ID de la patiente' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Date des dernières règles (YYYY-MM-DD)' })
  @IsDateString()
  ddr: string;

  @ApiPropertyOptional({ default: 1, description: 'Gestité' })
  @IsOptional()
  @IsInt()
  @Min(1)
  gestite?: number;

  @ApiPropertyOptional({ default: 0, description: 'Parité' })
  @IsOptional()
  @IsInt()
  @Min(0)
  parite?: number;

  @ApiPropertyOptional({ default: 0, description: 'Avortements / fausses couches' })
  @IsOptional()
  @IsInt()
  @Min(0)
  avortements?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  groupeSanguin?: string;

  @ApiPropertyOptional({ enum: Rhesus })
  @IsOptional()
  @IsEnum(Rhesus)
  rhesus?: Rhesus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  antecedents?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  grossesseARisque?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motifRisque?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
