import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { TypeVehicule, StatutVehicule } from '../entities/vehicule.entity';

export class CreateVehiculeDto {
  @IsString()
  immatriculation: string;

  @IsOptional()
  @IsEnum(TypeVehicule)
  type?: TypeVehicule;

  @IsOptional()
  @IsString()
  marque?: string;

  @IsOptional()
  @IsString()
  modele?: string;

  @IsOptional()
  @IsEnum(StatutVehicule)
  statut?: StatutVehicule;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometrage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seuilEntretienKm?: number;

  @IsOptional()
  @IsString()
  dateProchainEntretien?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
