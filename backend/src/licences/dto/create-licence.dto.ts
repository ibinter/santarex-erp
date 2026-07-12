import { IsString, IsEnum, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LicenceModePaiement } from '../entities/licence.entity';

export class CreateLicenceDto {
  @ApiProperty({ example: 'clinique-saint-joseph' })
  @IsString()
  tenantSlug: string;

  @ApiProperty({ description: 'UUID de l\'offre SaaS' })
  @IsString()
  offreId: string;

  @ApiProperty({ description: 'Date de début ISO' })
  @IsDateString()
  dateDebut: string;

  @ApiPropertyOptional({ description: 'Date d\'expiration ISO (calculée auto si absente)' })
  @IsOptional()
  @IsDateString()
  dateExpiration?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUtilisateurs?: number;

  @ApiPropertyOptional({ example: 49000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  montantPaye?: number;

  @ApiPropertyOptional({ enum: LicenceModePaiement })
  @IsOptional()
  @IsEnum(LicenceModePaiement)
  modePaiement?: LicenceModePaiement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refTransaction?: string;

  @ApiPropertyOptional({ example: 30, description: 'Jours d\'essai gratuit (0 = pas d\'essai)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  joursEssai?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
