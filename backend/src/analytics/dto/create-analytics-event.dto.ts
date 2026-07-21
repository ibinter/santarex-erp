import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnalyticsEventDto {
  @ApiProperty({ example: 'landing_visit', description: 'Nom de l\'événement' })
  @IsString()
  @MaxLength(120)
  event: string;

  @ApiPropertyOptional({ description: 'Propriétés libres (petit objet JSON)' })
  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Chemin / URL de la page' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  path?: string;

  @ApiPropertyOptional({ description: 'Référent HTTP' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;
}
