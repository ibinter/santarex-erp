import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransmissionDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation' })
  @IsOptional()
  @IsUUID()
  sejourId?: string;

  @ApiPropertyOptional({ description: 'Date et heure (ISO). Défaut: maintenant' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Cible / problème / besoin' })
  @IsString()
  cible: string;

  @ApiPropertyOptional({ description: 'Données (D)' })
  @IsOptional()
  @IsString()
  donnees?: string;

  @ApiPropertyOptional({ description: 'Actions (A)' })
  @IsOptional()
  @IsString()
  actions?: string;

  @ApiPropertyOptional({ description: 'Résultats (R)' })
  @IsOptional()
  @IsString()
  resultats?: string;
}
