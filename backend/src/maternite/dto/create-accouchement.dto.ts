import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ModeAccouchement, SexeNouveauNe } from '../entities/accouchement.entity';

export class CreateAccouchementDto {
  @ApiProperty({ description: 'Date et heure de l\'accouchement (ISO)' })
  @IsDateString()
  dateHeure: string;

  @ApiProperty({ enum: ModeAccouchement })
  @IsEnum(ModeAccouchement)
  mode: ModeAccouchement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delivrance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  etatPerinee?: string;

  @ApiPropertyOptional({ enum: SexeNouveauNe })
  @IsOptional()
  @IsEnum(SexeNouveauNe)
  sexeNouveauNe?: SexeNouveauNe;

  @ApiPropertyOptional({ description: 'Poids du nouveau-né en grammes' })
  @IsOptional()
  @IsInt()
  poidsNouveauNe?: number;

  @ApiPropertyOptional({ description: 'APGAR à 1 min (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar1?: number;

  @ApiPropertyOptional({ description: 'APGAR à 5 min (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar5?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complications?: string;
}
