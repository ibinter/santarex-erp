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
import { SoinsInfirmiersService } from './soins-infirmiers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateTransmissionDto } from './dto/create-transmission.dto';
import {
  CreatePlanSoinsDto,
  UpdatePlanSoinsDto,
} from './dto/create-plan-soins.dto';
import {
  CreateActeSoinDto,
  UpdateActeSoinDto,
} from './dto/create-acte-soin.dto';
import { CreateEvaluationDouleurDto } from './dto/create-evaluation-douleur.dto';
import { StatutPlanSoins } from './entities/plan-soins.entity';

@ApiTags('Soins infirmiers')
@ApiBearerAuth()
@Controller('soins-infirmiers')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class SoinsInfirmiersController {
  constructor(private readonly service: SoinsInfirmiersService) {}

  // ─── Transmissions ciblées (DAR) ─────────────────────────────────────
  @ApiOperation({ summary: 'Lister les transmissions ciblées (filtres: patientId, sejourId)' })
  @Get('transmissions')
  findTransmissions(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('sejourId') sejourId?: string,
  ) {
    return this.service.findTransmissions(req.user.tenantId, { patientId, sejourId });
  }

  @ApiOperation({ summary: 'Créer une transmission ciblée (DAR)' })
  @Post('transmissions')
  createTransmission(@Body() dto: CreateTransmissionDto, @Request() req) {
    return this.service.createTransmission(dto, req.user.tenantId, req.user.id);
  }

  // ─── Plan de soins ────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les plans de soins (filtres: patientId, sejourId, statut)' })
  @Get('plans')
  findPlans(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('sejourId') sejourId?: string,
    @Query('statut') statut?: StatutPlanSoins,
  ) {
    return this.service.findPlans(req.user.tenantId, { patientId, sejourId, statut });
  }

  @ApiOperation({ summary: 'Créer un plan de soins' })
  @Post('plans')
  createPlan(@Body() dto: CreatePlanSoinsDto, @Request() req) {
    return this.service.createPlan(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Mettre à jour un plan de soins (statut, interventions…)' })
  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanSoinsDto,
    @Request() req,
  ) {
    return this.service.updatePlan(id, dto, req.user.tenantId);
  }

  // ─── Actes de soin (feuille de soins) ─────────────────────────────────
  @ApiOperation({ summary: 'Lister les actes de soin (filtres: patientId, sejourId)' })
  @Get('actes')
  findActes(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('sejourId') sejourId?: string,
  ) {
    return this.service.findActes(req.user.tenantId, { patientId, sejourId });
  }

  @ApiOperation({ summary: 'Créer un acte de soin' })
  @Post('actes')
  createActe(@Body() dto: CreateActeSoinDto, @Request() req) {
    return this.service.createActe(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Mettre à jour un acte (ex: marquer réalisé)' })
  @Patch('actes/:id')
  updateActe(
    @Param('id') id: string,
    @Body() dto: UpdateActeSoinDto,
    @Request() req,
  ) {
    return this.service.updateActe(id, dto, req.user.tenantId);
  }

  // ─── Évaluation de la douleur ─────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les évaluations de douleur (filtres: patientId, sejourId)' })
  @Get('douleur')
  findDouleurs(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('sejourId') sejourId?: string,
  ) {
    return this.service.findDouleurs(req.user.tenantId, { patientId, sejourId });
  }

  @ApiOperation({ summary: 'Créer une évaluation de douleur (avec interprétation du score)' })
  @Post('douleur')
  createDouleur(@Body() dto: CreateEvaluationDouleurDto, @Request() req) {
    return this.service.createDouleur(dto, req.user.tenantId, req.user.id);
  }

  // ─── Statistiques ─────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Statistiques du dossier de soins (transmissions du jour, douleurs non réévaluées…)' })
  @Get('stats')
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }
}
