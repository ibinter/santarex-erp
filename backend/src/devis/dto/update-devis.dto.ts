import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateDevisDto } from './create-devis.dto';

export class UpdateDevisDto extends PartialType(CreateDevisDto) {}

export class RepondreDevisDto {
  // 'accepte' | 'refuse'
  @IsString()
  reponse: string;

  @IsOptional()
  @IsString()
  motifRefus?: string;
}
