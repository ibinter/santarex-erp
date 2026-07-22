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
import { TiersPayantService } from './tiers-payant.service';
import { CreateBordereauDto } from './dto/create-bordereau.dto';
import { CreateLigneDto } from './dto/create-ligne.dto';
import { EnregistrerPaiementDto } from './dto/enregistrer-paiement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutBordereau } from './entities/bordereau-tiers-payant.entity';

@ApiTags('Tiers-payant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte aux profils facturation/administration ; mutations réservées
// aux profils caissier / administration / direction.
@Roles(
  UserRole.CAISSIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('tiers-payant')
export class TiersPayantController {
  constructor(private readonly service: TiersPayantService) {}

  // ── Stats ────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques tiers-payant (créances par assureur, impayés)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Bordereaux (CRUD) ────────────────────────────────────────────
  @Get('bordereaux')
  @ApiOperation({ summary: 'Liste des bordereaux' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'assureurId', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutBordereau })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('assureurId') assureurId?: string,
    @Query('statut') statut?: StatutBordereau,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      { assureurId, statut },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Post('bordereaux')
  @ApiOperation({ summary: 'Créer un bordereau pour un assureur sur une période' })
  create(@Body() dto: CreateBordereauDto, @Request() req) {
    return this.service.create(dto, req.user.tenantId, req.user.id);
  }

  @Get('bordereaux/:id')
  @ApiOperation({ summary: "Détail d'un bordereau (avec lignes)" })
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Patch('bordereaux/:id')
  @ApiOperation({ summary: 'Modifier un bordereau (brouillon uniquement)' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBordereauDto>,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Delete('bordereaux/:id')
  @ApiOperation({ summary: 'Supprimer un bordereau (brouillon uniquement)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.tenantId);
  }

  // ── Lignes ───────────────────────────────────────────────────────
  @Get('bordereaux/:id/lignes')
  @ApiOperation({ summary: "Lignes d'un bordereau" })
  findLignes(@Param('id') id: string, @Request() req) {
    return this.service.findLignes(id, req.user.tenantId);
  }

  @Post('bordereaux/:id/lignes')
  @ApiOperation({ summary: 'Ajouter une ligne (acte couvert) au bordereau' })
  addLigne(
    @Param('id') id: string,
    @Body() dto: CreateLigneDto,
    @Request() req,
  ) {
    return this.service.addLigne(id, dto, req.user.tenantId);
  }

  @Delete('bordereaux/:id/lignes/:ligneId')
  @ApiOperation({ summary: 'Retirer une ligne du bordereau' })
  removeLigne(
    @Param('id') id: string,
    @Param('ligneId') ligneId: string,
    @Request() req,
  ) {
    return this.service.removeLigne(id, ligneId, req.user.tenantId);
  }

  // ── Transitions ──────────────────────────────────────────────────
  @Patch('bordereaux/:id/emettre')
  @ApiOperation({ summary: 'Émettre le bordereau' })
  emettre(@Param('id') id: string, @Request() req) {
    return this.service.emettre(id, req.user.tenantId);
  }

  @Patch('bordereaux/:id/envoyer')
  @ApiOperation({ summary: "Marquer le bordereau comme envoyé à l'assureur" })
  envoyer(@Param('id') id: string, @Request() req) {
    return this.service.envoyer(id, req.user.tenantId);
  }

  @Patch('bordereaux/:id/rejeter')
  @ApiOperation({ summary: 'Marquer le bordereau comme rejeté par l\'assureur' })
  rejeter(
    @Param('id') id: string,
    @Body() body: { motif?: string },
    @Request() req,
  ) {
    return this.service.rejeter(id, body?.motif, req.user.tenantId);
  }

  @Patch('bordereaux/:id/paiement')
  @ApiOperation({ summary: 'Enregistrer un paiement assureur (partiel / total)' })
  enregistrerPaiement(
    @Param('id') id: string,
    @Body() dto: EnregistrerPaiementDto,
    @Request() req,
  ) {
    return this.service.enregistrerPaiement(id, dto, req.user.tenantId);
  }
}
