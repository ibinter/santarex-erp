import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DechetsMedicauxService } from './dechets-medicaux.service';
import { CreateCollecteDto } from './dto/create-collecte.dto';
import { CreateEnlevementDto } from './dto/create-enlevement.dto';
import { TraiterEnlevementDto } from './dto/traiter-enlevement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  CategorieDechet,
  StatutCollecte,
} from './entities/collecte-dechets.entity';
import { StatutEnlevement } from './entities/enlevement-dechets.entity';

/**
 * Traçabilité réglementaire des déchets d'activités de soins (DASRI et
 * assimilés) : collectes par service, regroupement en enlèvements (bordereau
 * de suivi type BSDASRI) et suivi jusqu'à destruction. Multi-tenant.
 */
@ApiTags('Déchets médicaux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.INFIRMIER,
  UserRole.PHARMACIEN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('dechets-medicaux')
export class DechetsMedicauxController {
  constructor(private readonly service: DechetsMedicauxService) {}

  // ── Statistiques ────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques déchets (poids par catégorie/mois, en attente)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Collectes ───────────────────────────────────────────────────
  @Get('collectes')
  @ApiOperation({ summary: 'Liste des collectes avec filtres et pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categorie', required: false, enum: CategorieDechet })
  @ApiQuery({ name: 'statut', required: false, enum: StatutCollecte })
  @ApiQuery({ name: 'serviceProducteur', required: false, type: String })
  findAllCollectes(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categorie') categorie?: CategorieDechet,
    @Query('statut') statut?: StatutCollecte,
    @Query('serviceProducteur') serviceProducteur?: string,
  ) {
    return this.service.findAllCollectes(
      req.user.tenantId,
      { categorie, statut, serviceProducteur, search },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get('collectes/en-attente')
  @ApiOperation({ summary: 'Collectes en stockage prêtes à être enlevées' })
  findEnAttente(@Request() req) {
    return this.service.findCollectesEnAttente(req.user.tenantId);
  }

  @Get('collectes/stockage-prolonge')
  @ApiOperation({ summary: 'Alerte : collectes stockées trop longtemps' })
  findStockageProlonge(@Request() req) {
    return this.service.findCollectesStockageProlonge(req.user.tenantId);
  }

  @Get('collectes/:id')
  @ApiOperation({ summary: 'Détail d\'une collecte' })
  findOneCollecte(@Param('id') id: string, @Request() req) {
    return this.service.findOneCollecte(id, req.user.tenantId);
  }

  @Post('collectes')
  @ApiOperation({ summary: 'Enregistrer une collecte' })
  createCollecte(@Body() dto: CreateCollecteDto, @Request() req) {
    return this.service.createCollecte(dto, req.user.tenantId, req.user.id);
  }

  @Put('collectes/:id')
  @ApiOperation({ summary: 'Mettre à jour une collecte' })
  updateCollecte(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCollecteDto>,
    @Request() req,
  ) {
    return this.service.updateCollecte(id, dto, req.user.tenantId);
  }

  @Delete('collectes/:id')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer une collecte (non rattachée)' })
  removeCollecte(@Param('id') id: string, @Request() req) {
    return this.service.removeCollecte(id, req.user.tenantId);
  }

  // ── Enlèvements (regroupement / bordereau) ──────────────────────
  @Get('enlevements')
  @ApiOperation({ summary: 'Liste des enlèvements / bordereaux' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutEnlevement })
  findAllEnlevements(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('statut') statut?: StatutEnlevement,
  ) {
    return this.service.findAllEnlevements(
      req.user.tenantId,
      { statut, search },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get('enlevements/:id')
  @ApiOperation({ summary: 'Détail d\'un enlèvement + collectes liées' })
  findOneEnlevement(@Param('id') id: string, @Request() req) {
    return this.service.findOneEnlevement(id, req.user.tenantId);
  }

  @Post('enlevements')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un enlèvement regroupant des collectes' })
  createEnlevement(@Body() dto: CreateEnlevementDto, @Request() req) {
    return this.service.createEnlevement(dto, req.user.tenantId, req.user.id);
  }

  @Put('enlevements/:id')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour un enlèvement' })
  updateEnlevement(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEnlevementDto>,
    @Request() req,
  ) {
    return this.service.updateEnlevement(id, dto, req.user.tenantId);
  }

  @Patch('enlevements/:id/traiter')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Clôturer : enregistrer le certificat de destruction' })
  traiterEnlevement(
    @Param('id') id: string,
    @Body() dto: TraiterEnlevementDto,
    @Request() req,
  ) {
    return this.service.traiterEnlevement(id, dto, req.user.tenantId);
  }

  @Delete('enlevements/:id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un enlèvement (non traité)' })
  removeEnlevement(@Param('id') id: string, @Request() req) {
    return this.service.removeEnlevement(id, req.user.tenantId);
  }
}
