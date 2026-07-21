import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsEmail,
  Min,
} from 'class-validator';
import { TypeContrat, StatutEmploye } from '../entities/employe.entity';

export class CreateEmployeDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsString()
  poste: string;

  @IsOptional()
  @IsString()
  departement?: string;

  @IsOptional()
  @IsDateString()
  dateEmbauche?: string;

  @IsOptional()
  @IsEnum(TypeContrat)
  typeContrat?: TypeContrat;

  @IsNumber()
  @Min(0)
  salaireBase: number;

  @IsOptional()
  @IsEnum(StatutEmploye)
  statut?: StatutEmploye;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  adresse?: string;
}
