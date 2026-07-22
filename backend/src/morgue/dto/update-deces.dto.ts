import { PartialType } from '@nestjs/swagger';
import { CreateDecesDto } from './create-deces.dto';

export class UpdateDecesDto extends PartialType(CreateDecesDto) {}
