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
import { PediatrieService } from './pediatrie.service';
import { CreateMesureCroissanceDto } from './dto/create-mesure-croissance.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { UpdateVaccinationDto } from './dto/update-vaccination.dto';
import { PosologieDto } from './dto/posologie.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Pédiatrie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte au personnel soignant ; mutations réservées aux soignants
// habilités (médecin, infirmier, laborantin pour la saisie des mesures).
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.LABORANTIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('pediatrie')
export class PediatrieController {
  constructor(private readonly pediatrieService: PediatrieService) {}

  // ── Croissance ──────────────────────────────────────────────────

  @Get('croissance')
  @ApiOperation({ summary: 'Liste des mesures de croissance par patient' })
  @ApiQuery({ name: 'patientId', required: true, type: String })
  findMesures(@Request() req, @Query('patientId') patientId: string) {
    return this.pediatrieService.findMesuresByPatient(patientId, req.user.tenantId);
  }

  @Post('croissance')
  @ApiOperation({ summary: 'Enregistrer une mesure de croissance (âge/IMC calculés)' })
  createMesure(@Body() dto: CreateMesureCroissanceDto, @Request() req) {
    return this.pediatrieService.createMesure(dto, req.user.tenantId, req.user.id);
  }

  @Get('croissance/:patientId/courbe')
  @ApiOperation({ summary: "Courbe de croissance d'un enfant (série de points triée)" })
  getCourbe(@Param('patientId') patientId: string, @Request() req) {
    return this.pediatrieService.getCourbeCroissance(patientId, req.user.tenantId);
  }

  // ── Calendrier vaccinal (référentiel) ───────────────────────────

  @Get('calendrier')
  @ApiOperation({ summary: 'Calendrier vaccinal pédiatrique (PEV Côte d\'Ivoire)' })
  getCalendrier(@Request() req) {
    return this.pediatrieService.getCalendrier(req.user.tenantId);
  }

  // ── Carnet vaccinal de l'enfant ─────────────────────────────────

  @Get('vaccinations')
  @ApiOperation({ summary: "Carnet vaccinal d'un enfant (généré selon l'âge si absent)" })
  @ApiQuery({ name: 'patientId', required: true, type: String })
  getCarnet(@Request() req, @Query('patientId') patientId: string) {
    return this.pediatrieService.getCarnetVaccinal(patientId, req.user.tenantId);
  }

  @Post('vaccinations')
  @ApiOperation({ summary: 'Ajouter une vaccination au carnet' })
  createVaccination(@Body() dto: CreateVaccinationDto, @Request() req) {
    return this.pediatrieService.createVaccination(dto, req.user.tenantId);
  }

  @Patch('vaccinations/:id')
  @ApiOperation({ summary: 'Marquer un vaccin administré / mettre à jour une ligne' })
  updateVaccination(
    @Param('id') id: string,
    @Body() dto: UpdateVaccinationDto,
    @Request() req,
  ) {
    return this.pediatrieService.updateVaccination(id, dto, req.user.tenantId);
  }

  // ── Posologie ───────────────────────────────────────────────────

  @Post('posologie')
  @ApiOperation({ summary: 'Calcul de posologie pédiatrique selon le poids' })
  calculerPosologie(@Body() dto: PosologieDto) {
    return this.pediatrieService.calculerPosologieDto(dto);
  }

  // ── Stats ───────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du module pédiatrie' })
  getStats(@Request() req) {
    return this.pediatrieService.getStats(req.user.tenantId);
  }
}
