import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * Clôture d'un enlèvement : enregistrement du certificat de destruction.
 * Passe l'enlèvement (et ses collectes) au statut « traité / incinéré ».
 */
export class TraiterEnlevementDto {
  @ApiProperty({ example: 'CERT-2026-0042' })
  @IsString()
  certificatDestruction: string;

  @ApiPropertyOptional({ example: '2026-07-23T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateTraitement?: string;
}
