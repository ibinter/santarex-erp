import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VaccinationService } from './vaccination.service';
import { CreateVaccinDto } from './dto/create-vaccin.dto';
import { EnregistrerVaccinationDto } from './dto/enregistrer-vaccination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CibleVaccin } from './entities/vaccin.entity';

@ApiTags('Vaccination')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte au personnel soignant ; l'enregistrement d'une dose et la
// gestion du référentiel sont réservés aux vaccinateurs (infirmier/médecin) et
// à l'administration.
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.LABORANTIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('vaccination')
export class VaccinationController {
  constructor(private readonly vaccinationService: VaccinationService) {}

  // ── Référentiel des vaccins ─────────────────────────────────────────────

  @Get('vaccins')
  @ApiOperation({ summary: 'Référentiel des vaccins (semé au 1er accès)' })
  @ApiQuery({ name: 'cible', required: false, enum: CibleVaccin })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllVaccins(
    @Request() req,
    @Query('cible') cible?: CibleVaccin,
    @Query('search') search?: string,
  ) {
    return this.vaccinationService.findAllVaccins(req.user.tenantId, { cible, search });
  }

  @Post('vaccins')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Ajouter un vaccin au référentiel' })
  createVaccin(@Body() dto: CreateVaccinDto, @Request() req) {
    return this.vaccinationService.createVaccin(dto, req.user.tenantId);
  }

  // ── Stats & rappels (avant les routes paramétrées) ──────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de vaccination (mois, rappels en retard…)' })
  getStats(@Request() req) {
    return this.vaccinationService.getStats(req.user.tenantId);
  }

  @Get('rappels')
  @ApiOperation({ summary: 'Rappels dus / en retard (tous patients)' })
  @ApiQuery({ name: 'joursAvenir', required: false, type: Number })
  getRappels(@Request() req, @Query('joursAvenir') joursAvenir?: string) {
    return this.vaccinationService.getRappels(
      req.user.tenantId,
      joursAvenir ? +joursAvenir : 30,
    );
  }

  // ── Vaccinations patient ────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Enregistrer une dose administrée (calcule le rappel)' })
  enregistrer(@Body() dto: EnregistrerVaccinationDto, @Request() req) {
    return this.vaccinationService.enregistrerVaccination(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Get(':patientId')
  @ApiOperation({ summary: 'Carnet de vaccination d\'un patient' })
  getCarnet(@Param('patientId') patientId: string, @Request() req) {
    return this.vaccinationService.getCarnetPatient(patientId, req.user.tenantId);
  }
}
