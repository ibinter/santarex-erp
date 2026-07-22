import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAffectationDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  fonction?: string;

  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
