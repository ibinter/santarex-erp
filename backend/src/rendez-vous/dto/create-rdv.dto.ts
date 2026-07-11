import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { TypeRendezVous } from '../entities/rendez-vous.entity';

export class CreateRdvDto {
  @IsString()
  patientId: string;

  @IsString()
  medecinId: string;

  @IsDateString()
  dateHeure: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  dureeMinutes?: number;

  @IsString()
  motif: string;

  @IsEnum(TypeRendezVous)
  type: TypeRendezVous;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  salle?: string;
}
