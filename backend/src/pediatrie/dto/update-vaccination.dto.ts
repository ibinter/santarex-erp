import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { StatutVaccination } from '../entities/vaccination-enfant.entity';

export class UpdateVaccinationDto {
  @ApiPropertyOptional({ description: "Date d'administration (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  dateAdministration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional({ enum: StatutVaccination })
  @IsOptional()
  @IsEnum(StatutVaccination)
  statut?: StatutVaccination;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  administrePar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
