import { PartialType } from '@nestjs/mapped-types';
import { IsEnum } from 'class-validator';
import { CreateProspectDto } from './create-prospect.dto';
import { ProspectStatut } from '../crm.enums';

/** Mise à jour partielle d'un prospect. */
export class UpdateProspectDto extends PartialType(CreateProspectDto) {}

/** Changement de statut pipeline (endpoint dédié). */
export class UpdateStatutDto {
  @IsEnum(ProspectStatut)
  statut: ProspectStatut;
}
