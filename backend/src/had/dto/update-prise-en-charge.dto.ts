import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePriseEnChargeDto } from './create-prise-en-charge.dto';
import { StatutHAD } from '../entities/prise-en-charge-had.entity';

export class UpdatePriseEnChargeDto extends PartialType(CreatePriseEnChargeDto) {
  @ApiPropertyOptional({ enum: StatutHAD })
  @IsOptional()
  @IsEnum(StatutHAD)
  statut?: StatutHAD;

  @ApiPropertyOptional({ description: 'Date de fin réelle (clôture)' })
  @IsOptional()
  @IsDateString()
  dateFinReelle?: string;

  @ApiPropertyOptional({ description: 'Motif de clôture / suspension' })
  @IsOptional()
  @IsString()
  motifCloture?: string;
}
