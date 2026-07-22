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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MaterniteService } from './maternite.service';
import { CreateDossierGrossesseDto } from './dto/create-dossier-grossesse.dto';
import { UpdateDossierGrossesseDto } from './dto/update-dossier-grossesse.dto';
import { CreateCpnDto } from './dto/create-cpn.dto';
import { CreateAccouchementDto } from './dto/create-accouchement.dto';
import { CreateSurveillanceTravailDto } from './dto/create-surveillance-travail.dto';
import { CreateSuiviPostNatalDto } from './dto/create-suivi-postnatal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutGrossesse } from './entities/dossier-grossesse.entity';

@ApiTags('Maternité')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte au personnel soignant ; mutations réservées aux
// prescripteurs et sages-femmes (médecin, infirmier) et à l'administration.
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('maternite')
export class MaterniteController {
  constructor(private readonly materniteService: MaterniteService) {}

  // ── Stats ────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques maternité (grossesses en cours, à risque, accouchements du mois)' })
  getStats(@Request() req) {
    return this.materniteService.getStats(req.user.tenantId);
  }

  // ── Dossiers de grossesse ────────────────────────────────────────
  @Get('dossiers')
  @ApiOperation({ summary: 'Liste des dossiers de grossesse' })
  @ApiQuery({ name: 'statut', required: false, enum: StatutGrossesse })
  @ApiQuery({ name: 'risque', required: false, type: Boolean })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllDossiers(
    @Request() req,
    @Query('statut') statut?: StatutGrossesse,
    @Query('risque') risque?: string,
    @Query('patientId') patientId?: string,
    @Query('search') search?: string,
  ) {
    return this.materniteService.findAllDossiers(req.user.tenantId, {
      statut,
      risque: risque !== undefined ? risque === 'true' : undefined,
      patientId,
      search,
    });
  }

  @Post('dossiers')
  @ApiOperation({ summary: 'Créer un dossier de grossesse' })
  createDossier(@Body() dto: CreateDossierGrossesseDto, @Request() req) {
    return this.materniteService.createDossier(dto, req.user.tenantId, req.user.id);
  }

  @Get('dossiers/:id')
  @ApiOperation({ summary: 'Détail complet d\'un dossier (CPN, accouchement, partogramme, post-natal)' })
  findOneDossier(@Param('id') id: string, @Request() req) {
    return this.materniteService.findDossierDetail(id, req.user.tenantId);
  }

  @Patch('dossiers/:id')
  @ApiOperation({ summary: 'Mettre à jour un dossier de grossesse' })
  updateDossier(
    @Param('id') id: string,
    @Body() dto: UpdateDossierGrossesseDto,
    @Request() req,
  ) {
    return this.materniteService.updateDossier(id, dto, req.user.tenantId);
  }

  @Delete('dossiers/:id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un dossier de grossesse' })
  removeDossier(@Param('id') id: string, @Request() req) {
    return this.materniteService.removeDossier(id, req.user.tenantId);
  }

  // ── Consultations prénatales (CPN) ───────────────────────────────
  @Get('dossiers/:id/cpn')
  @ApiOperation({ summary: 'Liste des CPN d\'un dossier' })
  findCpns(@Param('id') id: string, @Request() req) {
    return this.materniteService.findCpns(id, req.user.tenantId);
  }

  @Post('dossiers/:id/cpn')
  @ApiOperation({ summary: 'Ajouter une consultation prénatale' })
  addCpn(@Param('id') id: string, @Body() dto: CreateCpnDto, @Request() req) {
    return this.materniteService.addCpn(id, dto, req.user.tenantId, req.user.id);
  }

  // ── Accouchement ─────────────────────────────────────────────────
  @Get('dossiers/:id/accouchement')
  @ApiOperation({ summary: 'Liste des accouchements d\'un dossier' })
  findAccouchements(@Param('id') id: string, @Request() req) {
    return this.materniteService.findAccouchements(id, req.user.tenantId);
  }

  @Post('dossiers/:id/accouchement')
  @ApiOperation({ summary: 'Enregistrer un accouchement (clôt le dossier)' })
  addAccouchement(
    @Param('id') id: string,
    @Body() dto: CreateAccouchementDto,
    @Request() req,
  ) {
    return this.materniteService.addAccouchement(id, dto, req.user.tenantId, req.user.id);
  }

  // ── Partogramme (surveillance du travail) ────────────────────────
  @Get('dossiers/:id/partogramme')
  @ApiOperation({ summary: 'Points de partogramme d\'un dossier' })
  findPartogramme(@Param('id') id: string, @Request() req) {
    return this.materniteService.findPartogramme(id, req.user.tenantId);
  }

  @Post('dossiers/:id/partogramme')
  @ApiOperation({ summary: 'Ajouter un point de partogramme' })
  addSurveillance(
    @Param('id') id: string,
    @Body() dto: CreateSurveillanceTravailDto,
    @Request() req,
  ) {
    return this.materniteService.addSurveillance(id, dto, req.user.tenantId, req.user.id);
  }

  // ── Suivi post-natal ─────────────────────────────────────────────
  @Get('dossiers/:id/postnatal')
  @ApiOperation({ summary: 'Liste des suivis post-natals d\'un dossier' })
  findPostnatal(@Param('id') id: string, @Request() req) {
    return this.materniteService.findPostnatal(id, req.user.tenantId);
  }

  @Post('dossiers/:id/postnatal')
  @ApiOperation({ summary: 'Ajouter un suivi post-natal' })
  addPostnatal(
    @Param('id') id: string,
    @Body() dto: CreateSuiviPostNatalDto,
    @Request() req,
  ) {
    return this.materniteService.addPostnatal(id, dto, req.user.tenantId, req.user.id);
  }
}
