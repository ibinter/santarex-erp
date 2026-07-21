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
import { HospitalisationService } from './hospitalisation.service';
import { CreateLitDto } from './dto/create-lit.dto';
import { AdmissionHospitalisationDto } from './dto/admission-hospitalisation.dto';
import { CreateNoteEvolutionDto } from './dto/create-note-evolution.dto';
import { SortiePatientDto } from './dto/sortie-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ServiceHospitalisation, StatutLit } from './entities/lit.entity';
import { StatutSejour } from './entities/sejour.entity';

@ApiTags('Hospitalisation')
@ApiBearerAuth()
@Controller('hospitalisation')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
export class HospitalisationController {
  constructor(private readonly hospitalisationService: HospitalisationService) {}

  // â”€â”€â”€ Lits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @ApiOperation({ summary: 'Lister tous les lits (filtres: service, statut)' })
  @Get('lits')
  findAllLits(
    @Request() req,
    @Query('service') service?: ServiceHospitalisation,
    @Query('statut') statut?: StatutLit,
  ) {
    return this.hospitalisationService.findAllLits(req.user.tenantId, { service, statut });
  }

  @ApiOperation({ summary: 'Lister les lits libres (filtre optionnel: service)' })
  @Get('lits/libres')
  findLitsLibres(
    @Request() req,
    @Query('service') service?: ServiceHospitalisation,
  ) {
    return this.hospitalisationService.findLitsLibres(req.user.tenantId, service);
  }

  @ApiOperation({ summary: 'CrÃ©er un nouveau lit' })
  @Post('lits')
  createLit(@Body() dto: CreateLitDto, @Request() req) {
    return this.hospitalisationService.createLit(dto, req.user.tenantId);
  }

  // â”€â”€â”€ SÃ©jours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @ApiOperation({ summary: 'Lister tous les sÃ©jours (filtres: statut, service, patientId)' })
  @Get('sejours')
  findAllSejours(
    @Request() req,
    @Query('statut') statut?: StatutSejour,
    @Query('service') service?: ServiceHospitalisation,
    @Query('patientId') patientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.hospitalisationService.findAllSejours(
      req.user.tenantId,
      { statut, service, patientId },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @ApiOperation({ summary: 'Lister les sÃ©jours actuellement actifs' })
  @Get('sejours/actifs')
  findSejoursActifs(@Request() req) {
    return this.hospitalisationService.findSejoursActifs(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Tableau de bord: statistiques lits et sÃ©jours' })
  @Get('sejours/stats')
  getStats(@Request() req) {
    return this.hospitalisationService.getStatsDashboard(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Admettre un patient en hospitalisation' })
  @Post('sejours/admettre')
  admettre(@Body() dto: AdmissionHospitalisationDto, @Request() req) {
    return this.hospitalisationService.admettre(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Obtenir les dÃ©tails d\'un sÃ©jour' })
  @Get('sejours/:id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.hospitalisationService.findOne(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Ajouter une note d\'Ã©volution Ã  un sÃ©jour' })
  @Post('sejours/:id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteEvolutionDto,
    @Request() req,
  ) {
    return this.hospitalisationService.addNoteEvolution(
      id,
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @ApiOperation({ summary: 'Lister les notes d\'Ã©volution d\'un sÃ©jour' })
  @Get('sejours/:id/notes')
  getNotes(@Param('id') id: string, @Request() req) {
    return this.hospitalisationService.getNoteEvolution(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Effectuer la sortie d\'un patient hospitalisÃ©' })
  @Patch('sejours/:id/sortir')
  sortirPatient(
    @Param('id') id: string,
    @Body() dto: SortiePatientDto,
    @Request() req,
  ) {
    return this.hospitalisationService.sortirPatient(id, dto, req.user.tenantId);
  }
}

