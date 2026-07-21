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
import { RhService } from './rh.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { CreateCongeDto, ApprouverCongeDto } from './dto/create-conge.dto';
import { CreatePaieDto } from './dto/create-paie.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutEmploye } from './entities/employe.entity';
import { StatutConge } from './entities/conge.entity';
import { StatutBulletin } from './entities/bulletin-paie.entity';

@Controller('rh')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.DRH, UserRole.ADMIN, UserRole.DIRECTEUR)
export class RhController {
  constructor(private readonly rhService: RhService) {}

  // ── Employés ────────────────────────────────────────────────────────────

  @Get('employes')
  findAllEmployes(
    @Request() req,
    @Query('statut') statut?: StatutEmploye,
    @Query('departement') departement?: string,
    @Query('q') q?: string,
  ) {
    return this.rhService.findAllEmployes(req.user.tenantId, { statut, departement, q });
  }

  @Get('employes/:id')
  findOneEmploye(@Param('id') id: string, @Request() req) {
    return this.rhService.findOneEmploye(id, req.user.tenantId);
  }

  @Post('employes')
  createEmploye(@Body() dto: CreateEmployeDto, @Request() req) {
    return this.rhService.createEmploye(dto, req.user.tenantId);
  }

  @Patch('employes/:id')
  updateEmploye(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeDto,
    @Request() req,
  ) {
    return this.rhService.updateEmploye(id, dto, req.user.tenantId);
  }

  // ── Congés ──────────────────────────────────────────────────────────────

  @Get('conges')
  findAllConges(
    @Request() req,
    @Query('employeId') employeId?: string,
    @Query('statut') statut?: StatutConge,
  ) {
    return this.rhService.findAllConges(req.user.tenantId, { employeId, statut });
  }

  @Post('conges')
  createConge(@Body() dto: CreateCongeDto, @Request() req) {
    return this.rhService.createConge(dto, req.user.tenantId);
  }

  @Patch('conges/:id/approuver')
  approuverConge(
    @Param('id') id: string,
    @Body() dto: ApprouverCongeDto,
    @Request() req,
  ) {
    return this.rhService.approuverConge(id, dto, req.user.tenantId, req.user.id);
  }

  // ── Paie ────────────────────────────────────────────────────────────────

  @Get('paie')
  findAllPaie(
    @Request() req,
    @Query('employeId') employeId?: string,
    @Query('mois') mois?: string,
    @Query('statut') statut?: StatutBulletin,
  ) {
    return this.rhService.findAllPaie(req.user.tenantId, { employeId, mois, statut });
  }

  @Post('paie')
  genererPaie(@Body() dto: CreatePaieDto, @Request() req) {
    return this.rhService.genererPaie(dto, req.user.tenantId);
  }

  // ── Statistiques ──────────────────────────────────────────────────────────

  @Get('stats')
  getStats(@Request() req) {
    return this.rhService.getStats(req.user.tenantId);
  }
}
