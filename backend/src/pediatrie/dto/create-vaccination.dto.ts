import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateVaccinationDto {
  @ApiProperty({ description: 'ID du patient (enfant)' })
  @IsString()
  patientId: string;

  @ApiProperty({ example: 'BCG', description: 'Nom du vaccin' })
  @IsString()
  vaccin: string;

  @ApiPropertyOptional({ description: 'Âge recommandé (libellé)' })
  @IsOptional()
  @IsString()
  dosePrevueAge?: string;

  @ApiPropertyOptional({ description: 'Âge recommandé en semaines' })
  @IsOptional()
  @IsInt()
  agePrevuSemaines?: number;

  @ApiPropertyOptional({ description: "Date d'administration si déjà réalisé (YYYY-MM-DD)" })
  @IsOptional()
  @IsDateString()
  dateAdministration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
