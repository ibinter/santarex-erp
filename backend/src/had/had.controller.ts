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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HadService } from './had.service';
import { CreatePriseEnChargeDto } from './dto/create-prise-en-charge.dto';
import { UpdatePriseEnChargeDto } from './dto/update-prise-en-charge.dto';
import { CreateVisiteDto } from './dto/create-visite.dto';
import { UpdateVisiteDto } from './dto/update-visite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutHAD } from './entities/prise-en-charge-had.entity';

@ApiTags('HAD - Hospitalisation à domicile')
@ApiBearerAuth()
@Controller('had')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
export class HadController {
  constructor(private readonly hadService: HadService) {}

  // ─── Agenda & stats (avant :id pour éviter les collisions de route) ───────

  @ApiOperation({ summary: 'Agenda des visites HAD du jour' })
  @Get('visites-jour')
  visitesJour(@Request() req) {
    return this.hadService.visitesJour(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Statistiques HAD (patients actifs, visites du jour / en retard)' })
  @Get('stats')
  getStats(@Request() req) {
    return this.hadService.getStats(req.user.tenantId);
  }

  // ─── Prises en charge ─────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lister les prises en charge HAD (filtres: statut, patientId)' })
  @Get()
  findAll(
    @Request() req,
    @Query('statut') statut?: StatutHAD,
    @Query('patientId') patientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.hadService.findAll(
      req.user.tenantId,
      { statut, patientId },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @ApiOperation({ summary: 'Admettre un patient en HAD' })
  @Post()
  admettre(@Body() dto: CreatePriseEnChargeDto, @Request() req) {
    return this.hadService.admettre(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Détail d\'une prise en charge (avec visites)' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.hadService.findOne(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mettre à jour une prise en charge' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePriseEnChargeDto,
    @Request() req,
  ) {
    return this.hadService.update(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Changer le statut (active / suspendue / terminee)' })
  @Patch(':id/statut')
  changerStatut(
    @Param('id') id: string,
    @Body() body: { statut: StatutHAD; motif?: string },
    @Request() req,
  ) {
    return this.hadService.changerStatut(id, body.statut, req.user.tenantId, body.motif);
  }

  // ─── Visites d'une prise en charge ────────────────────────────────────────

  @ApiOperation({ summary: 'Lister les visites d\'une prise en charge' })
  @Get(':id/visites')
  findVisites(@Param('id') id: string, @Request() req) {
    return this.hadService.findVisites(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Planifier une visite' })
  @Post(':id/visites')
  planifierVisite(
    @Param('id') id: string,
    @Body() dto: CreateVisiteDto,
    @Request() req,
  ) {
    return this.hadService.planifierVisite(id, dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Mettre à jour / enregistrer une visite effectuée' })
  @Patch(':id/visites/:visiteId')
  majVisite(
    @Param('id') id: string,
    @Param('visiteId') visiteId: string,
    @Body() dto: UpdateVisiteDto,
    @Request() req,
  ) {
    return this.hadService.majVisite(id, visiteId, dto, req.user.tenantId);
  }
}
