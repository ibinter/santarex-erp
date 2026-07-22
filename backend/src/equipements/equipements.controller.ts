import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { EquipementsService } from './equipements.service';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  EquipementCategorie,
  EquipementStatut,
} from './entities/equipement.entity';

@ApiTags('Équipements / Maintenance biomédicale')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Consultation ouverte aux soignants et à la direction ; toute mutation du parc
// ou des interventions réservée à la maintenance/technique et à la direction.
@Roles(
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.LABORANTIN,
  UserRole.PHARMACIEN,
)
@Controller('equipements')
export class EquipementsController {
  constructor(private readonly service: EquipementsService) {}

  // ── Vues transverses (avant :id pour éviter les collisions de route) ──
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du parc (pannes, maintenances dues, taux de disponibilité)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get('maintenances-dues')
  @ApiOperation({ summary: 'Équipements dont la maintenance préventive est due' })
  @ApiQuery({ name: 'joursAvance', required: false, type: Number })
  getMaintenancesDues(@Request() req, @Query('joursAvance') joursAvance?: number) {
    return this.service.getMaintenancesDues(req.user.tenantId, joursAvance ? +joursAvance : 0);
  }

  // ── CRUD Équipements ────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Inventaire des équipements (filtres + pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categorie', required: false, enum: EquipementCategorie })
  @ApiQuery({ name: 'statut', required: false, enum: EquipementStatut })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categorie') categorie?: EquipementCategorie,
    @Query('statut') statut?: EquipementStatut,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      { categorie, statut, search },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fiche d\'un équipement' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Enregistrer un équipement' })
  create(@Body() dto: CreateEquipementDto, @Request() req) {
    return this.service.createEquipement(dto, req.user.tenantId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour un équipement' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateEquipementDto>, @Request() req) {
    return this.service.updateEquipement(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Réformer un équipement (mise hors parc)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.service.removeEquipement(id, req.user.tenantId);
  }

  @Patch(':id/panne')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.LABORANTIN)
  @ApiOperation({ summary: 'Déclarer une panne (équipement → en_panne)' })
  declarerPanne(@Param('id') id: string, @Body() body: { description?: string }, @Request() req) {
    return this.service.declarerPanne(id, req.user.tenantId, body?.description, req.user.id);
  }

  // ── Interventions ───────────────────────────────────────────────
  @Get(':id/interventions')
  @ApiOperation({ summary: 'Historique des interventions d\'un équipement' })
  getInterventions(@Param('id') id: string, @Request() req) {
    return this.service.getInterventions(id, req.user.tenantId);
  }

  @Post(':id/interventions')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Planifier / enregistrer une intervention de maintenance' })
  createIntervention(
    @Param('id') id: string,
    @Body() dto: CreateInterventionDto,
    @Request() req,
  ) {
    return this.service.createIntervention(id, dto, req.user.tenantId, req.user.id);
  }
}
