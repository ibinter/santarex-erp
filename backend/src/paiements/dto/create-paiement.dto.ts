import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ModePaiement } from '../entities/paiement.entity';

export class CreatePaiementDto {
  @IsString()
  factureId: string;

  @IsString()
  patientId: string;

  @IsNumber()
  @Min(0.01)
  montant: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsEnum(ModePaiement)
  modePaiement: ModePaiement;

  @IsOptional()
  @IsString()
  operateur?: string;

  @IsOptional()
  @IsString()
  referenceTransaction?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RemboursePaiementDto {
  @IsString()
  motif: string;
}
