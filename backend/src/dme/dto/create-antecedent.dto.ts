import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { TypeAntecedent, GraviteAntecedent } from '../entities/antecedent.entity';

export class CreateAntecedentDto {
  @IsEnum(TypeAntecedent)
  type: TypeAntecedent;

  @IsString()
  description: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @IsOptional()
  @IsEnum(GraviteAntecedent)
  gravite?: GraviteAntecedent;
}
