import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateCpnDto {
  @ApiProperty({ description: 'Date de la consultation (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Terme en semaines d\'aménorrhée' })
  @IsOptional()
  @IsInt()
  termeSA?: number;

  @ApiPropertyOptional({ description: 'Poids en kg' })
  @IsOptional()
  @IsNumber()
  poids?: number;

  @ApiPropertyOptional({ description: 'Tension artérielle (ex : 120/80)' })
  @IsOptional()
  @IsString()
  tensionArterielle?: string;

  @ApiPropertyOptional({ description: 'Hauteur utérine en cm' })
  @IsOptional()
  @IsNumber()
  hauteurUterine?: number;

  @ApiPropertyOptional({ description: 'Bruits du cœur fœtal (bpm)' })
  @IsOptional()
  @IsInt()
  bruitsCoeurFoetal?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  oedemes?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  albuminurie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  glycosurie?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
