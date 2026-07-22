import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CaisseSessionsService } from './caisse-sessions.service';
import {
  OuvrirSessionDto,
  CloturerSessionDto,
  CreateRecuDto,
} from './dto/caisse-sessions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('caisse-sessions')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
export class CaisseSessionsController {
  constructor(private readonly service: CaisseSessionsService) {}

  // ── Sessions ────────────────────────────────────────────────────────────
  @Get()
  findAll(
    @Request() req,
    @Query('statut') statut?: string,
    @Query('caissierRef') caissierRef?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      { statut, caissierRef },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('ouverte')
  getSessionOuverte(@Request() req) {
    return this.service.findSessionOuverte(req.user.tenantId, req.user.id);
  }

  @Get('stats')
  getStats(@Request() req, @Query('date') date?: string) {
    return this.service.getStats(req.user.tenantId, date);
  }

  // ── Reçus (avant :id pour éviter la collision de route) ──────────────────
  @Get('recus')
  findAllRecus(
    @Request() req,
    @Query('sessionId') sessionId?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findAllRecus(
      req.user.tenantId,
      { sessionId, patientId },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('recus/:id')
  findOneRecu(@Param('id') id: string, @Request() req) {
    return this.service.findOneRecu(id, req.user.tenantId);
  }

  @Post('recus')
  createRecu(@Body() dto: CreateRecuDto, @Request() req) {
    return this.service.createRecu(dto, req.user.tenantId, req.user.id);
  }

  @Post('ouvrir')
  ouvrir(@Body() dto: OuvrirSessionDto, @Request() req) {
    return this.service.ouvrir(dto, req.user.tenantId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOneDetail(id, req.user.tenantId);
  }

  @Patch(':id/cloturer')
  cloturer(
    @Param('id') id: string,
    @Body() dto: CloturerSessionDto,
    @Request() req,
  ) {
    return this.service.cloturer(id, dto, req.user.tenantId);
  }
}
