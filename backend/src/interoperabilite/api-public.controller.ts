import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';

import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiScopes } from './decorators/api-scopes.decorator';
import { ApiKeyContext } from './interoperabilite.service';
import { PatientsService } from '../patients/patients.service';

/**
 * API PUBLIQUE — protégée par ApiKeyGuard (en-tête X-API-Key), PAS par JWT.
 *
 * SÉCURITÉ : le tenantId provient EXCLUSIVEMENT du contexte de la clé
 * (req.apiKeyContext.tenantId). Aucune donnée d'un autre tenant n'est jamais
 * accessible, quel que soit le paramètre fourni par le client.
 */
@ApiTags('API Publique')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyGuard)
@Controller('api-public')
export class ApiPublicController {
  constructor(private readonly patientsService: PatientsService) {}

  private ctx(req: Request): ApiKeyContext {
    return (req as any).apiKeyContext as ApiKeyContext;
  }

  @Get('patients')
  @ApiScopes('patients:read')
  @ApiOperation({ summary: 'Lister les patients du tenant de la clé' })
  listerPatients(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { tenantId } = this.ctx(req);
    return this.patientsService.findAll(tenantId, {
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get('patients/:id')
  @ApiScopes('patients:read')
  @ApiOperation({ summary: 'Détail d\'un patient (scoping tenant strict)' })
  getPatient(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = this.ctx(req);
    return this.patientsService.findOne(id, tenantId);
  }
}
