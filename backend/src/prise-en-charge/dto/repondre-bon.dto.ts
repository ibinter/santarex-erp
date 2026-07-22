import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsDateString } from 'class-validator';

export class RepondreBonDto {
  @ApiProperty({ description: 'Réponse de l\'assureur : accepté (true) ou refusé (false)' })
  @IsBoolean()
  accepte: boolean;

  @ApiPropertyOptional({ description: "Numéro d'autorisation (si accepté)" })
  @IsOptional()
  @IsString()
  numeroAutorisation?: string;

  @ApiPropertyOptional({ description: 'Date de validité de l\'autorisation (si accepté)' })
  @IsOptional()
  @IsDateString()
  dateValidite?: string;

  @ApiPropertyOptional({ description: 'Motif du refus (si refusé)' })
  @IsOptional()
  @IsString()
  motifRefus?: string;
}
