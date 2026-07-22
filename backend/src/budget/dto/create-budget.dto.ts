import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeBudget } from '../entities/budget.entity';

export class CreateLigneBudgetDto {
  @IsString()
  poste: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantPrevu?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRealise?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBudgetDto {
  @IsString()
  libelle: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  exercice: number;

  @IsOptional()
  @IsEnum(TypeBudget)
  type?: TypeBudget;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneBudgetDto)
  lignes?: CreateLigneBudgetDto[];
}
