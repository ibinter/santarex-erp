import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ModeRecu } from '../entities/recu.entity';

export class OuvrirSessionDto {
  @IsNumber()
  @Min(0)
  fondCaisseInitial: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloturerSessionDto {
  @IsNumber()
  @Min(0)
  montantCompteEspeces: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecuDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  factureRef?: string;

  @IsOptional()
  @IsString()
  paiementRef?: string;

  @IsNumber()
  @Min(0)
  montant: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsEnum(ModeRecu)
  modePaiement: ModeRecu;

  @IsOptional()
  @IsString()
  objet?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
