import { PartialType } from '@nestjs/swagger';
import { CreateOffreSaasDto } from './create-offre-saas.dto';

export class UpdateOffreSaasDto extends PartialType(CreateOffreSaasDto) {}
