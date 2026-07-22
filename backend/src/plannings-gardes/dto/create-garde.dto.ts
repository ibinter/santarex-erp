import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { TypeGarde } from '../entities/garde.entity';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateGardeDto {
  @IsString()
  personnelRef: string;

  @IsString()
  service: string;

  @IsEnum(TypeGarde)
  typeGarde: TypeGarde;

  /** YYYY-MM-DD */
  @IsDateString()
  date: string;

  @Matches(HHMM, { message: 'heureDebut doit être au format HH:mm' })
  heureDebut: string;

  @Matches(HHMM, { message: 'heureFin doit être au format HH:mm' })
  heureFin: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
