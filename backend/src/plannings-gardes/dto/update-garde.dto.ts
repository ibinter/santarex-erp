import { PartialType } from '@nestjs/mapped-types';
import { CreateGardeDto } from './create-garde.dto';

export class UpdateGardeDto extends PartialType(CreateGardeDto) {}
