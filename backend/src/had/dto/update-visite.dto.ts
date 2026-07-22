import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateVisiteDto } from './create-visite.dto';

export class UpdateVisiteDto extends PartialType(CreateVisiteDto) {
  @ApiPropertyOptional({ description: 'Date/heure effective de réalisation (ISO)' })
  @IsOptional()
  @IsDateString()
  dateRealisation?: string;

  @ApiPropertyOptional({ description: 'Motif d\'annulation ou de report' })
  @IsOptional()
  @IsString()
  motifChangement?: string;
}
