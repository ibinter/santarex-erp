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
import { UrgencesService } from './urgences.service';
import { AdmissionUrgenceDto } from './dto/admission-urgence.dto';
import { UpdateTriageDto, SortirPatientDto } from './dto/update-triage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutUrgence, CategorieUrgence, DispositionUrgence } from './entities/patient-urgence.entity';

@Controller('urgences')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
export class UrgencesController {
  constructor(private readonly urgencesService: UrgencesService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('statut') statut?: StatutUrgence,
    @Query('categorie') categorie?: CategorieUrgence,
    @Query('date') date?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.urgencesService.findAll(
      req.user.tenantId,
      { statut, categorie, date },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('actifs')
  findActifs(@Request() req) {
    return this.urgencesService.getDashboardUrgences(req.user.tenantId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.urgencesService.getStatsDuJour(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.urgencesService.findOne(id, req.user.tenantId);
  }

  @Post('admettre')
  admettre(@Body() dto: AdmissionUrgenceDto, @Request() req) {
    return this.urgencesService.admettrePatient(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/triage')
  mettreAJourTriage(
    @Param('id') id: string,
    @Body() dto: UpdateTriageDto,
    @Request() req,
  ) {
    return this.urgencesService.mettreAJourTriage(id, dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/assigner-medecin')
  assignerMedecin(
    @Param('id') id: string,
    @Body('medecinId') medecinId: string,
    @Request() req,
  ) {
    return this.urgencesService.assignerMedecin(id, medecinId, req.user.tenantId);
  }

  @Patch(':id/soins')
  mettreEnSoins(@Param('id') id: string, @Request() req) {
    return this.urgencesService.mettreEnSoins(id, req.user.tenantId);
  }

  @Patch(':id/hospitaliser')
  hospitaliser(@Param('id') id: string, @Request() req) {
    return this.urgencesService.hospitaliser(id, req.user.tenantId);
  }

  @Patch(':id/sortir')
  sortirPatient(
    @Param('id') id: string,
    @Body() dto: SortirPatientDto,
    @Request() req,
  ) {
    return this.urgencesService.sortirPatient(
      id,
      dto.disposition as DispositionUrgence,
      req.user.tenantId,
    );
  }
}

