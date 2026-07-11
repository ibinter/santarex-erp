import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateFactureDto } from './create-facture.dto';

export class UpdateFactureDto extends PartialType(CreateFactureDto) {}

export class AnnulerFactureDto {
  @IsString()
  motif: string;
}

export class ApplyAssuranceDto {
  @IsString()
  assuranceNom: string;

  @IsString()
  assuranceNumero: string;

  @IsOptional()
  partAssurance?: number;
}
