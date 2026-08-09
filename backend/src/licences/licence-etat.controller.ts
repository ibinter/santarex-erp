import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LicencesService } from './licences.service';

/**
 * Endpoint TENANT (cahier IBIG v1.1, §9.4) : l'état de licence du tenant courant.
 * Source unique côté client pour le palier, les droits, les quotas patients et
 * le filigrane. Authentifié (n'importe quel rôle), scopé au tenant du token.
 */
@ApiTags('Licence — état tenant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('licence')
export class LicenceEtatController {
  constructor(private readonly licencesService: LicencesService) {}

  @Get('etat')
  @ApiOperation({ summary: 'État de licence du tenant courant (palier, droits, quotas)' })
  getEtat(@CurrentUser('tenantId') tenantId: string) {
    return this.licencesService.getEtatPourTenant(tenantId);
  }
}
