import { PartialType } from '@nestjs/swagger';
import { CreateCasierDto } from './create-casier.dto';

export class UpdateCasierDto extends PartialType(CreateCasierDto) {}
