import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TypeConge } from '../entities/conge.entity';

export class CreateCongeDto {
  @IsString()
  employeId: string;

  @IsOptional()
  @IsEnum(TypeConge)
  type?: TypeConge;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;

  @IsOptional()
  @IsString()
  motif?: string;
}

export class ApprouverCongeDto {
  /** true = approuver, false = refuser. Défaut : approuver. */
  @IsOptional()
  approuver?: boolean;

  @IsOptional()
  @IsString()
  motif?: string;
}
