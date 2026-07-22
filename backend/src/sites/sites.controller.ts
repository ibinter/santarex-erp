import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateAffectationDto } from './dto/create-affectation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.DRH)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  // ── Vue réseau (routes fixes avant :id) ──────────────────────────────────

  @Get('consolidation')
  @ApiOperation({ summary: 'Vue consolidée du réseau (lits + personnel par site)' })
  consolidation(@Request() req) {
    return this.sitesService.consolidation(req.user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques agrégées du réseau de sites' })
  stats(@Request() req) {
    return this.sitesService.stats(req.user.tenantId);
  }

  // ── CRUD Sites ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lister les sites du tenant' })
  findAll(@Request() req) {
    return this.sitesService.findAll(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un site' })
  create(@Body() dto: CreateSiteDto, @Request() req) {
    return this.sitesService.create(dto, req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un site" })
  findOne(@Param('id') id: string, @Request() req) {
    return this.sitesService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un site' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @Request() req,
  ) {
    return this.sitesService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un site' })
  remove(@Param('id') id: string, @Request() req) {
    return this.sitesService.remove(id, req.user.tenantId);
  }

  // ── Affectations du personnel ────────────────────────────────────────────

  @Get(':id/affectations')
  @ApiOperation({ summary: 'Lister les affectations de personnel du site' })
  findAffectations(@Param('id') id: string, @Request() req) {
    return this.sitesService.findAffectations(id, req.user.tenantId);
  }

  @Post(':id/affectations')
  @ApiOperation({ summary: 'Affecter un membre du personnel au site' })
  addAffectation(
    @Param('id') id: string,
    @Body() dto: CreateAffectationDto,
    @Request() req,
  ) {
    return this.sitesService.addAffectation(id, dto, req.user.tenantId);
  }

  @Delete(':id/affectations/:affectationId')
  @ApiOperation({ summary: 'Retirer une affectation du site' })
  removeAffectation(
    @Param('id') id: string,
    @Param('affectationId') affectationId: string,
    @Request() req,
  ) {
    return this.sitesService.removeAffectation(id, affectationId, req.user.tenantId);
  }
}
