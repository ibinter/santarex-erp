import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { CreateDossierGrossesseDto } from './create-dossier-grossesse.dto';
import { StatutGrossesse } from '../entities/dossier-grossesse.entity';

export class UpdateDossierGrossesseDto extends PartialType(CreateDossierGrossesseDto) {
  @ApiPropertyOptional({ enum: StatutGrossesse })
  @IsOptional()
  @IsEnum(StatutGrossesse)
  statut?: StatutGrossesse;
}
