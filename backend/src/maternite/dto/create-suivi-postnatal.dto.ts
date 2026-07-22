import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateSuiviPostNatalDto {
  @ApiProperty({ description: 'Date du suivi (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  etatMere?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  involutionUterine?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allaitement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  etatNouveauNe?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  vaccinationBCG?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  vaccinationPolio?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
