import { IsOptional, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Numéro de page' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Nombre d\'éléments par page (max 100)' })
  @IsOptional()
  // On PLAFONNE la limite à 100 au lieu de rejeter la requête : ainsi un
  // ?limit=200 renvoie 100 résultats (au lieu d'une erreur de validation qui
  // faisait apparaître les listes vides — ex. sélection patient en pédiatrie).
  @Transform(({ value }) => Math.min(Math.max(parseInt(value, 10) || 20, 1), 100))
  limit?: number = 20;
}
