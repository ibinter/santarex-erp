import { IsEnum } from 'class-validator';
import { StatutGarde } from '../entities/garde.entity';

export class ChangerStatutDto {
  @IsEnum(StatutGarde)
  statut: StatutGarde;
}
