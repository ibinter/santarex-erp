import { IsString, IsEnum, IsInt, IsEmail, IsOptional, Min } from 'class-validator';
import { PaiementSaasMethode } from '../entities/paiement-saas.entity';

export class InitierPaiementDto {
  @IsString()
  licenceId: string;

  @IsEnum(PaiementSaasMethode)
  methode: PaiementSaasMethode;

  @IsInt()
  @Min(1000)
  montant: number;

  @IsEmail()
  emailPayeur: string;

  @IsString()
  nomPayeur: string;

  @IsOptional()
  @IsString()
  telephone?: string;
}

export class ValiderPaiementManuelDto {
  @IsString()
  paiementId: string;

  @IsOptional()
  @IsString()
  notesAdmin?: string;
}
