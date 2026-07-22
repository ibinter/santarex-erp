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
import { IndicateursQualiteService } from './indicateurs-qualite.service';
import {
  CreateIndicateurDto,
  UpdateIndicateurDto,
  CreateMesureDto,
  CreateCritereDto,
  UpdateCritereDto,
} from './dto/indicateur-qualite.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DomaineIndicateur } from './entities/indicateur-qualite.entity';

@ApiTags('Indicateurs Qualité & Accréditation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Pilotage qualité : réservé à l'encadrement (qualiticien, direction, admin) et
// aux médecins référents. La saisie de mesures reste tracée par tenant.
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.MEDECIN)
@Controller('indicateurs-qualite')
export class IndicateursQualiteController {
  constructor(private readonly service: IndicateursQualiteService) {}

  // ── Tableau de bord & stats ────────────────────────────────────────────────
  @Get('tableau-bord')
  @ApiOperation({ summary: 'Tableau de bord des indicateurs (valeur/cible/tendance)' })
  tableauBord(@Request() req) {
    return this.service.tableauBord(req.user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques synthétiques (indicateurs + conformité accréditation)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Indicateurs ─────────────────────────────────────────────────────────────
  @Get('indicateurs')
  @ApiOperation({ summary: 'Liste des indicateurs qualité' })
  @ApiQuery({ name: 'domaine', required: false, enum: DomaineIndicateur })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  listerIndicateurs(
    @Request() req,
    @Query('domaine') domaine?: DomaineIndicateur,
    @Query('actif') actif?: string,
  ) {
    return this.service.listerIndicateurs(req.user.tenantId, {
      domaine,
      actif: actif === undefined ? undefined : actif === 'true',
    });
  }

  @Post('indicateurs')
  @ApiOperation({ summary: 'Créer un indicateur qualité' })
  creerIndicateur(@Body() dto: CreateIndicateurDto, @Request() req) {
    return this.service.creerIndicateur(dto, req.user.tenantId);
  }

  @Get('indicateurs/:id')
  @ApiOperation({ summary: "Détail d'un indicateur" })
  getIndicateur(@Param('id') id: string, @Request() req) {
    return this.service.getIndicateur(id, req.user.tenantId);
  }

  @Patch('indicateurs/:id')
  @ApiOperation({ summary: 'Modifier un indicateur' })
  modifierIndicateur(
    @Param('id') id: string,
    @Body() dto: UpdateIndicateurDto,
    @Request() req,
  ) {
    return this.service.modifierIndicateur(id, dto, req.user.tenantId);
  }

  @Delete('indicateurs/:id')
  @ApiOperation({ summary: 'Supprimer un indicateur (et ses mesures)' })
  supprimerIndicateur(@Param('id') id: string, @Request() req) {
    return this.service.supprimerIndicateur(id, req.user.tenantId);
  }

  // ── Mesures ───────────────────────────────────────────────────────────────
  @Get('indicateurs/:id/mesures')
  @ApiOperation({ summary: "Historique des mesures d'un indicateur" })
  listerMesures(@Param('id') id: string, @Request() req) {
    return this.service.listerMesures(id, req.user.tenantId);
  }

  @Post('indicateurs/:id/mesures')
  @ApiOperation({ summary: 'Saisir une mesure périodique (statut calculé vs cible)' })
  ajouterMesure(
    @Param('id') id: string,
    @Body() dto: CreateMesureDto,
    @Request() req,
  ) {
    return this.service.ajouterMesure(id, dto, req.user.tenantId);
  }

  // ── Critères d'accréditation ────────────────────────────────────────────────
  @Get('accreditation')
  @ApiOperation({ summary: "Liste des critères d'accréditation" })
  @ApiQuery({ name: 'referentiel', required: false, type: String })
  listerCriteres(@Request() req, @Query('referentiel') referentiel?: string) {
    return this.service.listerCriteres(req.user.tenantId, referentiel);
  }

  @Post('accreditation')
  @ApiOperation({ summary: "Créer un critère d'accréditation" })
  creerCritere(@Body() dto: CreateCritereDto, @Request() req) {
    return this.service.creerCritere(dto, req.user.tenantId);
  }

  @Patch('accreditation/:id')
  @ApiOperation({ summary: 'Modifier un critère (statut de conformité, preuve…)' })
  modifierCritere(
    @Param('id') id: string,
    @Body() dto: UpdateCritereDto,
    @Request() req,
  ) {
    return this.service.modifierCritere(id, dto, req.user.tenantId);
  }

  @Delete('accreditation/:id')
  @ApiOperation({ summary: 'Supprimer un critère' })
  supprimerCritere(@Param('id') id: string, @Request() req) {
    return this.service.supprimerCritere(id, req.user.tenantId);
  }
}
