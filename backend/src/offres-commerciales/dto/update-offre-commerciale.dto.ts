import { PartialType } from '@nestjs/swagger';
import { CreateOffreCommercialeDto } from './create-offre-commerciale.dto';

export class UpdateOffreCommercialeDto extends PartialType(
  CreateOffreCommercialeDto,
) {}
