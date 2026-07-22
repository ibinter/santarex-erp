import { PartialType } from '@nestjs/mapped-types';
import { CreateVehiculeDto } from './create-vehicule.dto';

export class UpdateVehiculeDto extends PartialType(CreateVehiculeDto) {}
