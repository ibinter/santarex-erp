import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TauxChangeService } from './taux-change.service';

@ApiTags('Taux de change')
@Controller('taux-change')
export class TauxChangeController {
  constructor(private readonly service: TauxChangeService) {}

  /** Public : sert à afficher les prix des formules en euros et en dollars (indicatif). */
  @Get()
  @ApiOperation({ summary: 'Taux FCFA → euro / dollar pour l’affichage des prix (indicatif)' })
  taux() {
    return this.service.taux();
  }
}
