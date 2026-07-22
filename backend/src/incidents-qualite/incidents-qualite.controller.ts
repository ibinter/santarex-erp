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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IncidentsQualiteService } from './incidents-qualite.service';
import {
  CreateIncidentQualiteDto,
  UpdateIncidentQualiteDto,
  UpdateStatutIncidentDto,
  AjouterActionIncidentDto,
} from './dto/incident-qualite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  GraviteIncident,
  StatutIncident,
  TypeIncident,
} from './entities/incident-qualite.entity';

@ApiTags('Incidents Qualité')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Déclaration ouverte à tout le personnel soignant/administratif ; l'analyse et
// la clôture restent contrôlées côté service (traçabilité de chaque action).
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.PHARMACIEN,
  UserRole.LABORANTIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('incidents-qualite')
export class IncidentsQualiteController {
  constructor(private readonly service: IncidentsQualiteService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du tableau de bord qualité' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Liste filtrable des incidents qualité' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, enum: StatutIncident })
  @ApiQuery({ name: 'type', required: false, enum: TypeIncident })
  @ApiQuery({ name: 'gravite', required: false, enum: GraviteIncident })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statut') statut?: StatutIncident,
    @Query('type') type?: TypeIncident,
    @Query('gravite') gravite?: GraviteIncident,
    @Query('patientId') patientId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      { statut, type, gravite, patientId, search },
      { page: page ? +page : 1, limit: limit ? +limit : 50 },
    );
  }

  @Post()
  @ApiOperation({ summary: 'Déclarer un incident qualité' })
  creer(@Body() dto: CreateIncidentQualiteDto, @Request() req) {
    return this.service.creer(dto, req.user.tenantId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un incident qualité' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un incident (causes, mesures, gravité…)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentQualiteDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut (workflow qualité)' })
  changerStatut(
    @Param('id') id: string,
    @Body() dto: UpdateStatutIncidentDto,
    @Request() req,
  ) {
    return this.service.changerStatut(id, dto, req.user.tenantId, req.user.id);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Ajouter une action / commentaire au fil de suivi' })
  ajouterAction(
    @Param('id') id: string,
    @Body() dto: AjouterActionIncidentDto,
    @Request() req,
  ) {
    return this.service.ajouterAction(id, dto, req.user.tenantId, req.user.id);
  }
}
