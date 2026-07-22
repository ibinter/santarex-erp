import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  ArrayNotEmpty,
} from 'class-validator';
import { ModeTraitement } from '../entities/enlevement-dechets.entity';

export class CreateEnlevementDto {
  @ApiPropertyOptional({
    description: 'Numéro de bordereau (auto-généré si absent)',
  })
  @IsOptional()
  @IsString()
  bordereauNumero?: string;

  @ApiProperty({ example: 'SICOM Environnement' })
  @IsString()
  prestataire: string;

  @ApiProperty({ example: '2026-07-22T10:00:00.000Z' })
  @IsDateString()
  dateEnlevement: string;

  @ApiProperty({ enum: ModeTraitement })
  @IsEnum(ModeTraitement)
  modeTraitement: ModeTraitement;

  @ApiProperty({
    type: [String],
    description: 'Identifiants des collectes regroupées dans cet enlèvement',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  collecteIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
