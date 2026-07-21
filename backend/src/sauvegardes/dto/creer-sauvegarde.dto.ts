import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreerSauvegardeDto {
  @ApiPropertyOptional({ description: 'Nom lisible optionnel de la sauvegarde' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nom?: string;
}
