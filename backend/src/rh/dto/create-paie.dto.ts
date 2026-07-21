import { IsString, IsOptional, IsNumber, Min, Max, Matches } from 'class-validator';

/**
 * Génération d'un bulletin de paie. `mois` au format 'YYYY-MM'.
 * Si `employeId` est omis, un bulletin est généré pour tous les employés actifs.
 * Les taux CNPS/ITS sont configurables (défauts CIV simplifiés appliqués sinon).
 */
export class CreatePaieDto {
  @IsOptional()
  @IsString()
  employeId?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'mois doit être au format YYYY-MM' })
  mois: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  primes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retenues?: number;

  /** Taux de cotisation CNPS salarié (ex. 0.063 = 6,3 %). Défaut 0.063. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  tauxCNPS?: number;

  /** Taux ITS simplifié (ex. 0.015 = 1,5 %). Défaut 0.015. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  tauxITS?: number;
}
