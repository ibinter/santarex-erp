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
import { TransportService } from './transport.service';
import { CreateVehiculeDto } from './dto/create-vehicule.dto';
import { UpdateVehiculeDto } from './dto/update-vehicule.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto, TerminerMissionDto } from './dto/update-mission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutVehicule, TypeVehicule } from './entities/vehicule.entity';
import { StatutMission } from './entities/mission-transport.entity';

@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // ─────────────────────────────── STATS ────────────────────────────────────

  @Get('stats')
  getStats(@Request() req) {
    return this.transportService.getStats(req.user.tenantId);
  }

  // ─────────────────────────────── VÉHICULES ────────────────────────────────

  @Get('vehicules')
  findAllVehicules(
    @Request() req,
    @Query('statut') statut?: StatutVehicule,
    @Query('type') type?: TypeVehicule,
  ) {
    return this.transportService.findAllVehicules(req.user.tenantId, {
      statut,
      type,
    });
  }

  @Get('vehicules/:id')
  findOneVehicule(@Param('id') id: string, @Request() req) {
    return this.transportService.findOneVehicule(id, req.user.tenantId);
  }

  @Post('vehicules')
  createVehicule(@Body() dto: CreateVehiculeDto, @Request() req) {
    return this.transportService.createVehicule(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Patch('vehicules/:id')
  updateVehicule(
    @Param('id') id: string,
    @Body() dto: UpdateVehiculeDto,
    @Request() req,
  ) {
    return this.transportService.updateVehicule(id, dto, req.user.tenantId);
  }

  @Delete('vehicules/:id')
  removeVehicule(@Param('id') id: string, @Request() req) {
    return this.transportService.removeVehicule(id, req.user.tenantId);
  }

  // ─────────────────────────────── MISSIONS ─────────────────────────────────

  @Get('missions')
  findAllMissions(
    @Request() req,
    @Query('statut') statut?: StatutMission,
    @Query('vehiculeId') vehiculeId?: string,
    @Query('date') date?: string,
  ) {
    return this.transportService.findAllMissions(req.user.tenantId, {
      statut,
      vehiculeId,
      date,
    });
  }

  @Get('missions/:id')
  findOneMission(@Param('id') id: string, @Request() req) {
    return this.transportService.findOneMission(id, req.user.tenantId);
  }

  @Post('missions')
  createMission(@Body() dto: CreateMissionDto, @Request() req) {
    return this.transportService.createMission(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Patch('missions/:id')
  updateMission(
    @Param('id') id: string,
    @Body() dto: UpdateMissionDto,
    @Request() req,
  ) {
    return this.transportService.updateMission(id, dto, req.user.tenantId);
  }

  @Patch('missions/:id/demarrer')
  demarrerMission(@Param('id') id: string, @Request() req) {
    return this.transportService.demarrerMission(id, req.user.tenantId);
  }

  @Patch('missions/:id/terminer')
  terminerMission(
    @Param('id') id: string,
    @Body() dto: TerminerMissionDto,
    @Request() req,
  ) {
    return this.transportService.terminerMission(id, dto, req.user.tenantId);
  }

  @Patch('missions/:id/annuler')
  annulerMission(@Param('id') id: string, @Request() req) {
    return this.transportService.annulerMission(id, req.user.tenantId);
  }
}
