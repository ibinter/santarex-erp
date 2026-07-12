import { IsString, IsInt, IsEmail, IsOptional, Min } from 'class-validator';

export class InitierPaiementDto {
  @IsString()
  licenceId: string;

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

  @IsOptional()
  @IsString()
  devise?: string;
}

export class ValiderPaiementManuelDto {
  @IsString()
  paiementId: string;

  @IsOptional()
  @IsString()
  notesAdmin?: string;
}
