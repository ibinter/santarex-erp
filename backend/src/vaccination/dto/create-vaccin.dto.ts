import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CibleVaccin } from '../entities/vaccin.entity';

/** Création / mise à jour d'un vaccin du référentiel. */
export class CreateVaccinDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  nom: string;

  @ApiProperty()
  @IsString()
  maladieCible: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  nbDoses?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  intervalleJours?: number;

  @ApiPropertyOptional({ enum: CibleVaccin })
  @IsOptional()
  @IsEnum(CibleVaccin)
  cible?: CibleVaccin;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ageRecommande?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
