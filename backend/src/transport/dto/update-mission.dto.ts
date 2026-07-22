import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { CreateMissionDto } from './create-mission.dto';

export class UpdateMissionDto extends PartialType(CreateMissionDto) {}

export class TerminerMissionDto {
  @IsOptional()
  @IsDateString()
  dateArrivee?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrageArrivee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;
}
