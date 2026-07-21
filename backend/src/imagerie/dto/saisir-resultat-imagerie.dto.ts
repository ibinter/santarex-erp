import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class SaisirResultatImagerieDto {
  @ApiPropertyOptional({ description: 'Compte-rendu radiologique détaillé' })
  @IsOptional()
  @IsString()
  compteRendu?: string;

  @ApiPropertyOptional({ description: 'Conclusion / synthèse' })
  @IsOptional()
  @IsString()
  conclusion?: string;

  @ApiPropertyOptional({ description: 'URLs des images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagesUrls?: string[];

  @ApiPropertyOptional({
    default: true,
    description: 'Valider (clôturer) directement la demande après la saisie',
  })
  @IsOptional()
  @IsBoolean()
  valider?: boolean;
}
