import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MethodeSterilisation } from '../entities/lot-sterilisation.entity';

export class CreateLotDto {
  @ApiProperty({ enum: MethodeSterilisation, description: 'Méthode de stérilisation' })
  @IsEnum(MethodeSterilisation)
  methode: MethodeSterilisation;

  @ApiProperty({ example: 'Plateau chirurgie viscérale (12 instruments)', description: 'Contenu / description' })
  @IsString()
  contenu: string;

  @ApiPropertyOptional({ example: 134, description: 'Température (°C)' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 18, description: 'Durée du cycle en minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dureeMin?: number;

  @ApiPropertyOptional({ description: 'Date/heure du cycle (ISO 8601). Par défaut : maintenant.' })
  @IsOptional()
  @IsDateString()
  dateCycle?: string;

  @ApiPropertyOptional({ description: 'ID de l\'opérateur (par défaut : utilisateur courant)' })
  @IsOptional()
  @IsString()
  operateurRef?: string;

  @ApiPropertyOptional({ description: 'Durée de validité de la stérilité en jours (par défaut selon méthode)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dureeValiditeJours?: number;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;
}
