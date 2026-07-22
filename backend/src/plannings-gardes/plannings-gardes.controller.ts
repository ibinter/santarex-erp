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
import { PlanningsGardesService } from './plannings-gardes.service';
import { CreateGardeDto } from './dto/create-garde.dto';
import { UpdateGardeDto } from './dto/update-garde.dto';
import { ChangerStatutDto } from './dto/changer-statut.dto';
import { RemplacerGardeDto } from './dto/remplacer-garde.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutGarde, TypeGarde } from './entities/garde.entity';

@Controller('plannings-gardes')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
  UserRole.DRH,
  UserRole.MEDECIN,
)
export class PlanningsGardesController {
  constructor(private readonly service: PlanningsGardesService) {}

  // ── Vue calendrier (par période / service / personnel) ───────────────────
  @Get('calendrier')
  calendrier(
    @Request() req,
    @Query('debut') debut: string,
    @Query('fin') fin: string,
    @Query('service') service?: string,
    @Query('personnelRef') personnelRef?: string,
  ) {
    return this.service.calendrier(req.user.tenantId, {
      debut,
      fin,
      service,
      personnelRef,
    });
  }

  // ── Statistiques ─────────────────────────────────────────────────────────
  @Get('stats')
  getStats(@Request() req, @Query('date') date?: string) {
    return this.service.getStats(req.user.tenantId, date);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  @Get()
  findAll(
    @Request() req,
    @Query('personnelRef') personnelRef?: string,
    @Query('service') service?: string,
    @Query('statut') statut?: StatutGarde,
    @Query('typeGarde') typeGarde?: TypeGarde,
    @Query('date') date?: string,
  ) {
    return this.service.findAll(req.user.tenantId, {
      personnelRef,
      service,
      statut,
      typeGarde,
      date,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateGardeDto, @Request() req) {
    return this.service.create(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGardeDto, @Request() req) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/statut')
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutDto,
    @Request() req,
  ) {
    return this.service.changerStatut(id, dto.statut, req.user.tenantId);
  }

  @Patch(':id/remplacer')
  remplacer(
    @Param('id') id: string,
    @Body() dto: RemplacerGardeDto,
    @Request() req,
  ) {
    return this.service.remplacer(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.tenantId);
  }
}
