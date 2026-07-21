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
import { ImagerieService } from './imagerie.service';
import { CreateDemandeImagerieDto } from './dto/create-demande-imagerie.dto';
import { SaisirResultatImagerieDto } from './dto/saisir-resultat-imagerie.dto';
import { ChangerStatutImagerieDto } from './dto/changer-statut.dto';
import { TypeExamenImagerie } from './entities/type-examen-imagerie.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Imagerie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('imagerie')
export class ImagerieController {
  constructor(private readonly imagerieService: ImagerieService) {}

  // ── Examens (liste enrichie consommée par le frontend) ─────────────
  @Get('examens')
  @ApiOperation({ summary: 'Liste des examens d\'imagerie (forme frontend)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'urgence', required: false, type: Boolean })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'YYYY-MM-DD' })
  findAllExamens(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statut') statut?: string,
    @Query('patientId') patientId?: string,
    @Query('urgence') urgence?: string,
    @Query('date') date?: string,
  ) {
    return this.imagerieService.findAllExamens(
      req.user.tenantId,
      {
        statut,
        patientId,
        urgence: urgence !== undefined ? urgence === 'true' : undefined,
        date,
      },
      { page: page ? +page : 1, limit: limit ? +limit : 100 },
    );
  }

  // ── Stats du jour ──────────────────────────────────────────────────
  @Get('stats/jour')
  @ApiOperation({ summary: 'Statistiques imagerie du jour' })
  getStatsJour(@Request() req) {
    return this.imagerieService.getStatsJour(req.user.tenantId);
  }

  // ── Catalogue de types d'examen ────────────────────────────────────
  @Get('types-examen')
  @ApiOperation({ summary: 'Catalogue des types d\'examen d\'imagerie' })
  findAllTypes(@Request() req) {
    return this.imagerieService.findAllTypes(req.user.tenantId);
  }

  @Post('types-examen')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un type d\'examen dans le catalogue' })
  createType(@Body() dto: Partial<TypeExamenImagerie>, @Request() req) {
    return this.imagerieService.createType(dto, req.user.tenantId);
  }

  // ── Demandes ───────────────────────────────────────────────────────
  @Post('demandes')
  @ApiOperation({ summary: 'Créer une demande d\'examen d\'imagerie' })
  creerDemande(@Body() dto: CreateDemandeImagerieDto, @Request() req) {
    return this.imagerieService.creerDemande(dto, req.user.tenantId, req.user.id);
  }

  @Get('demandes/:id')
  @ApiOperation({ summary: 'Détail d\'une demande d\'imagerie' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.imagerieService.findOneDemande(id, req.user.tenantId);
  }

  @Patch('demandes/:id/statut')
  @ApiOperation({ summary: 'Changer le statut d\'une demande' })
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutImagerieDto,
    @Request() req,
  ) {
    return this.imagerieService.changerStatut(id, dto.statut, req.user.tenantId);
  }

  @Post('demandes/:id/resultat')
  @ApiOperation({ summary: 'Saisir le compte-rendu / résultat d\'un examen' })
  saisirResultat(
    @Param('id') id: string,
    @Body() dto: SaisirResultatImagerieDto,
    @Request() req,
  ) {
    return this.imagerieService.saisirResultat(id, dto, req.user.tenantId, req.user.id);
  }
}
