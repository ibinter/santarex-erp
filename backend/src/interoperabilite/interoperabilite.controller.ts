import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { InteroperabiliteService } from './interoperabilite.service';
import {
  CreateCleApiDto,
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateConfigInterfaceDto,
  UpdateConfigInterfaceDto,
} from './dto/interop.dto';
import { TypeInterface } from './entities/config-interface.entity';
import {
  SensMessage,
  StatutMessage,
  ProtocoleMessage,
} from './entities/message-interop.entity';

/**
 * Console d'administration de l'interopérabilité (réservée ADMIN/DIRECTEUR).
 * Toutes les opérations sont strictement scoping-tenant : req.user.tenantId.
 */
@ApiTags('Interopérabilité')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('interoperabilite')
export class InteroperabiliteController {
  constructor(private readonly service: InteroperabiliteService) {}

  // ── Clés API ──────────────────────────────────────────────────────────────
  @Post('cles')
  @ApiOperation({ summary: 'Créer une clé API (valeur renvoyée une seule fois)' })
  creerCle(@Body() dto: CreateCleApiDto, @Request() req) {
    return this.service.creerCleApi(dto, req.user.tenantId);
  }

  @Get('cles')
  @ApiOperation({ summary: 'Lister les clés API du tenant' })
  listerCles(@Request() req) {
    return this.service.findClesApi(req.user.tenantId);
  }

  @Patch('cles/:id/revoquer')
  @ApiOperation({ summary: 'Révoquer (désactiver) une clé API' })
  revoquerCle(@Param('id') id: string, @Request() req) {
    return this.service.revoquerCleApi(id, req.user.tenantId);
  }

  // ── Webhooks ──────────────────────────────────────────────────────────────
  @Post('webhooks')
  @ApiOperation({ summary: 'Créer un webhook (secret renvoyé une seule fois)' })
  creerWebhook(@Body() dto: CreateWebhookDto, @Request() req) {
    return this.service.creerWebhook(dto, req.user.tenantId);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Lister les webhooks du tenant' })
  listerWebhooks(@Request() req) {
    return this.service.findWebhooks(req.user.tenantId);
  }

  @Patch('webhooks/:id')
  @ApiOperation({ summary: 'Modifier un webhook' })
  updateWebhook(@Param('id') id: string, @Body() dto: UpdateWebhookDto, @Request() req) {
    return this.service.updateWebhook(id, dto, req.user.tenantId);
  }

  @Post('webhooks/:id/test')
  @ApiOperation({ summary: 'Envoyer un payload de test vers un webhook' })
  testerWebhook(@Param('id') id: string, @Request() req) {
    return this.service.testerWebhook(id, req.user.tenantId);
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Supprimer un webhook' })
  supprimerWebhook(@Param('id') id: string, @Request() req) {
    return this.service.supprimerWebhook(id, req.user.tenantId);
  }

  // ── Interfaces HL7 / DICOM ────────────────────────────────────────────────
  @Post('interfaces')
  @ApiOperation({ summary: 'Créer une configuration d\'interface (HL7/DICOM)' })
  creerConfig(@Body() dto: CreateConfigInterfaceDto, @Request() req) {
    return this.service.creerConfig(dto, req.user.tenantId);
  }

  @Get('interfaces')
  @ApiOperation({ summary: 'Lister les configurations d\'interface' })
  listerConfigs(@Request() req, @Query('type') type?: TypeInterface) {
    return this.service.findConfigs(req.user.tenantId, type);
  }

  @Patch('interfaces/:id')
  @ApiOperation({ summary: 'Modifier une configuration d\'interface' })
  updateConfig(@Param('id') id: string, @Body() dto: UpdateConfigInterfaceDto, @Request() req) {
    return this.service.updateConfig(id, dto, req.user.tenantId);
  }

  @Post('interfaces/:id/tester')
  @ApiOperation({ summary: 'Tester la connexion (simulé tant que hors site)' })
  testerConnexion(@Param('id') id: string, @Request() req) {
    return this.service.testerConnexion(id, req.user.tenantId);
  }

  @Delete('interfaces/:id')
  @ApiOperation({ summary: 'Supprimer une configuration d\'interface' })
  supprimerConfig(@Param('id') id: string, @Request() req) {
    return this.service.supprimerConfig(id, req.user.tenantId);
  }

  // ── Journal des messages ──────────────────────────────────────────────────
  @Get('messages')
  @ApiOperation({ summary: 'Journal des messages d\'interopérabilité' })
  listerMessages(
    @Request() req,
    @Query('sens') sens?: SensMessage,
    @Query('statut') statut?: StatutMessage,
    @Query('protocole') protocole?: ProtocoleMessage,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findMessages(
      req.user.tenantId,
      { sens, statut, protocole },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques d\'interopérabilité du tenant' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }
}
