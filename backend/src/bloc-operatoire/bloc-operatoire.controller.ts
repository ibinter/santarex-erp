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
import { BlocOperatoireService } from './bloc-operatoire.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { ChangerStatutInterventionDto } from './dto/changer-statut-intervention.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutIntervention } from './entities/intervention.entity';

@ApiTags('Bloc Opératoire')
@ApiBearerAuth()
@Controller('bloc-operatoire')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
export class BlocOperatoireController {
  constructor(private readonly blocService: BlocOperatoireService) {}

  // ─── Salles ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lister les salles d\'opération' })
  @Get('salles')
  findAllSalles(@Request() req) {
    return this.blocService.findAllSalles(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Créer une salle d\'opération' })
  @Post('salles')
  createSalle(@Body() dto: CreateSalleDto, @Request() req) {
    return this.blocService.createSalle(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mettre à jour une salle (statut, type, nom...)' })
  @Patch('salles/:id')
  updateSalle(@Param('id') id: string, @Body() dto: UpdateSalleDto, @Request() req) {
    return this.blocService.updateSalle(id, dto, req.user.tenantId);
  }

  // ─── Interventions ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lister les interventions (filtres: statut, salleId, patientId)' })
  @Get('interventions')
  findAllInterventions(
    @Request() req,
    @Query('statut') statut?: StatutIntervention,
    @Query('salleId') salleId?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.blocService.findAllInterventions(req.user.tenantId, {
      statut,
      salleId,
      patientId,
    });
  }

  @ApiOperation({ summary: 'Programmer une nouvelle intervention (détection de conflit de salle)' })
  @Post('interventions')
  createIntervention(@Body() dto: CreateInterventionDto, @Request() req) {
    return this.blocService.createIntervention(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Changer le statut d\'une intervention (démarrer / terminer / annuler)' })
  @Patch('interventions/:id/statut')
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutInterventionDto,
    @Request() req,
  ) {
    return this.blocService.changerStatut(id, dto, req.user.tenantId);
  }

  // ─── Planning & stats ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Planning du jour: salles + interventions (param optionnel: date)' })
  @Get('planning')
  getPlanning(@Request() req, @Query('date') date?: string) {
    return this.blocService.getPlanningDuJour(req.user.tenantId, date);
  }

  @ApiOperation({ summary: 'Statistiques du bloc opératoire' })
  @Get('stats')
  getStats(@Request() req) {
    return this.blocService.getStats(req.user.tenantId);
  }
}
