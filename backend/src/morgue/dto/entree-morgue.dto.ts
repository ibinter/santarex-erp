import { IsUUID, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EntreeMorgueDto {
  @ApiProperty({ description: 'ID du décès à placer en chambre froide' })
  @IsUUID()
  decesId: string;

  @ApiProperty({ description: 'ID du casier (doit être libre)' })
  @IsUUID()
  casierId: string;

  @ApiPropertyOptional({ description: 'Date et heure d\'entrée (défaut: maintenant)' })
  @IsOptional()
  @IsDateString()
  dateEntree?: string;

  @ApiPropertyOptional({ default: 0, description: 'Tarif journalier de conservation (FCFA)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifJournalier?: number;
}
