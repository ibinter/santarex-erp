import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

/**
 * Pagination + terme de recherche `q`. Nécessaire car la validation globale
 * (`forbidNonWhitelisted`) rejette tout paramètre inconnu : un `@Query() PaginationDto`
 * seul faisait échouer `?q=...` avec « property q should not exist ».
 */
export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string;
}
