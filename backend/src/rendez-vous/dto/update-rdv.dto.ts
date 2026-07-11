import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateRdvDto } from './create-rdv.dto';
import { StatutRendezVous } from '../entities/rendez-vous.entity';

export class UpdateRdvDto extends PartialType(CreateRdvDto) {
  @IsOptional()
  @IsEnum(StatutRendezVous)
  statut?: StatutRendezVous;
}
