import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LigneOrdonnanceDto {
  @IsString()
  medicamentNom: string;

  @IsString()
  posologie: string;

  @IsString()
  duree: string;

  @IsOptional()
  quantite?: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreateOrdonnanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneOrdonnanceDto)
  lignes: LigneOrdonnanceDto[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsDateString()
  dateExpiration?: string;
}
