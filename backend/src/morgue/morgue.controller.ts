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
import { MorgueService } from './morgue.service';
import { CreateDecesDto } from './dto/create-deces.dto';
import { UpdateDecesDto } from './dto/update-deces.dto';
import { CreateCasierDto } from './dto/create-casier.dto';
import { UpdateCasierDto } from './dto/update-casier.dto';
import { EntreeMorgueDto } from './dto/entree-morgue.dto';
import { RemiseCorpsDto } from './dto/remise-corps.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { LieuDeces } from './entities/deces.entity';
import { StatutCasier } from './entities/casier-morgue.entity';
import { StatutSejourMorgue } from './entities/sejour-morgue.entity';

@ApiTags('Morgue')
@ApiBearerAuth()
@Controller('morgue')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class MorgueController {
  constructor(private readonly morgueService: MorgueService) {}

  // ─── Statistiques ──────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Tableau de bord morgue (corps présents, casiers, décès du mois)' })
  @Get('stats')
  getStats(@Request() req) {
    return this.morgueService.getStats(req.user.tenantId);
  }

  // ─── Décès ─────────────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les décès (filtres: lieuDeces, certificatEmis, q)' })
  @Get('deces')
  findAllDeces(
    @Request() req,
    @Query('lieuDeces') lieuDeces?: LieuDeces,
    @Query('certificatEmis') certificatEmis?: string,
    @Query('q') q?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.morgueService.findAllDeces(
      req.user.tenantId,
      { lieuDeces, certificatEmis, q },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @ApiOperation({ summary: 'Enregistrer un décès (option: émettre le certificat)' })
  @Post('deces')
  createDeces(@Body() dto: CreateDecesDto, @Request() req) {
    return this.morgueService.createDeces(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Détails d\'un décès' })
  @Get('deces/:id')
  findOneDeces(@Param('id') id: string, @Request() req) {
    return this.morgueService.findOneDeces(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mettre à jour un décès' })
  @Patch('deces/:id')
  updateDeces(
    @Param('id') id: string,
    @Body() dto: UpdateDecesDto,
    @Request() req,
  ) {
    return this.morgueService.updateDeces(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Émettre le certificat de décès' })
  @Patch('deces/:id/certificat')
  emettreCertificat(@Param('id') id: string, @Request() req) {
    return this.morgueService.emettreCertificat(id, req.user.tenantId);
  }

  // ─── Casiers ───────────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les casiers (filtre: statut)' })
  @Get('casiers')
  findAllCasiers(@Request() req, @Query('statut') statut?: StatutCasier) {
    return this.morgueService.findAllCasiers(req.user.tenantId, { statut });
  }

  @ApiOperation({ summary: 'Lister les casiers libres' })
  @Get('casiers/libres')
  findCasiersLibres(@Request() req) {
    return this.morgueService.findCasiersLibres(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Créer un casier (emplacement chambre froide)' })
  @Post('casiers')
  createCasier(@Body() dto: CreateCasierDto, @Request() req) {
    return this.morgueService.createCasier(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Mettre à jour un casier (ex: mise en maintenance)' })
  @Patch('casiers/:id')
  updateCasier(
    @Param('id') id: string,
    @Body() dto: UpdateCasierDto,
    @Request() req,
  ) {
    return this.morgueService.updateCasier(id, dto, req.user.tenantId);
  }

  // ─── Sejours morgue ─────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les séjours morgue (filtre: statut)' })
  @Get('sejours')
  findAllSejours(
    @Request() req,
    @Query('statut') statut?: StatutSejourMorgue,
  ) {
    return this.morgueService.findAllSejours(req.user.tenantId, { statut });
  }

  @ApiOperation({ summary: 'Placer un corps dans un casier libre' })
  @Post('sejours/entree')
  entree(@Body() dto: EntreeMorgueDto, @Request() req) {
    return this.morgueService.entree(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Remise du corps (libère le casier, calcule les frais)' })
  @Patch('sejours/:id/remise')
  remise(
    @Param('id') id: string,
    @Body() dto: RemiseCorpsDto,
    @Request() req,
  ) {
    return this.morgueService.remise(id, dto, req.user.tenantId);
  }
}
