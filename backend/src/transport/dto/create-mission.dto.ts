import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';
import { TypeMission } from '../entities/mission-transport.entity';

export class CreateMissionDto {
  @IsString()
  vehiculeId: string;

  @IsOptional()
  @IsEnum(TypeMission)
  type?: TypeMission;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  origine: string;

  @IsString()
  destination: string;

  @IsOptional()
  @IsDateString()
  dateDepart?: string;

  @IsOptional()
  @IsString()
  chauffeurRef?: string;

  @IsOptional()
  @IsBoolean()
  accompagnantMedical?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
