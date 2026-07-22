import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { StatutBudget, TypeBudget } from '../entities/budget.entity';

export class UpdateBudgetDto {
  @IsOptional()
  @IsString()
  libelle?: string;

  @IsOptional()
  @IsEnum(TypeBudget)
  type?: TypeBudget;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsEnum(StatutBudget)
  statut?: StatutBudget;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLigneBudgetDto {
  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsString()
  categorie?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantPrevu?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRealise?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

/** Saisie du réalisé : soit un montant global, soit un réalisé mensuel. */
export class SaisirRealiseDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRealise?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  mois?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRealiseMois?: number;

  @IsOptional()
  @IsString()
  commentaire?: string;
}
