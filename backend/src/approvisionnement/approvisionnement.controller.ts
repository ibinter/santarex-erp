import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApprovisionnementService } from './approvisionnement.service';
import { CreateFournisseurDto, UpdateFournisseurDto } from './dto/fournisseur.dto';
import {
  CreateBonCommandeDto,
  UpdateBonCommandeDto,
  ReceptionDto,
} from './dto/bon-commande.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TypeFournisseur } from './entities/fournisseur.entity';
import { StatutBonCommande } from './entities/bon-commande.entity';

@ApiTags('Approvisionnement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Circuit achat : géré par la pharmacie, la direction et l'administration.
@Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('approvisionnement')
export class ApprovisionnementController {
  constructor(private readonly service: ApprovisionnementService) {}

  // ── Fournisseurs ────────────────────────────────────────────────
  @Get('fournisseurs')
  @ApiOperation({ summary: 'Liste des fournisseurs' })
  @ApiQuery({ name: 'type', required: false, enum: TypeFournisseur })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  findAllFournisseurs(
    @Request() req,
    @Query('type') type?: TypeFournisseur,
    @Query('search') search?: string,
    @Query('actif') actif?: string,
  ) {
    return this.service.findAllFournisseurs(req.user.tenantId, {
      type,
      search,
      actif: actif === undefined ? undefined : actif === 'true',
    });
  }

  @Get('fournisseurs/:id')
  @ApiOperation({ summary: 'Détail d\'un fournisseur' })
  findOneFournisseur(@Param('id') id: string, @Request() req) {
    return this.service.findOneFournisseur(id, req.user.tenantId);
  }

  @Post('fournisseurs')
  @ApiOperation({ summary: 'Créer un fournisseur' })
  createFournisseur(@Body() dto: CreateFournisseurDto, @Request() req) {
    return this.service.createFournisseur(dto, req.user.tenantId);
  }

  @Put('fournisseurs/:id')
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  updateFournisseur(@Param('id') id: string, @Body() dto: UpdateFournisseurDto, @Request() req) {
    return this.service.updateFournisseur(id, dto, req.user.tenantId);
  }

  // ── Bons de commande ────────────────────────────────────────────
  @Get('commandes')
  @ApiOperation({ summary: 'Liste des bons de commande (paginée)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, enum: StatutBonCommande })
  @ApiQuery({ name: 'fournisseurId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllCommandes(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statut') statut?: StatutBonCommande,
    @Query('fournisseurId') fournisseurId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllBonsCommande(
      req.user.tenantId,
      { statut, fournisseurId, search },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get('commandes/:id')
  @ApiOperation({ summary: 'Détail d\'un bon de commande (avec lignes)' })
  findOneCommande(@Param('id') id: string, @Request() req) {
    return this.service.findOneBonCommande(id, req.user.tenantId);
  }

  @Post('commandes')
  @ApiOperation({ summary: 'Créer un bon de commande (brouillon) avec ses lignes' })
  createCommande(@Body() dto: CreateBonCommandeDto, @Request() req) {
    return this.service.createBonCommande(dto, req.user.tenantId, req.user.id);
  }

  @Put('commandes/:id')
  @ApiOperation({ summary: 'Modifier un bon de commande (brouillon uniquement)' })
  updateCommande(@Param('id') id: string, @Body() dto: UpdateBonCommandeDto, @Request() req) {
    return this.service.updateBonCommande(id, dto, req.user.tenantId);
  }

  @Patch('commandes/:id/envoyer')
  @ApiOperation({ summary: 'Envoyer un bon (brouillon → envoyée)' })
  envoyer(@Param('id') id: string, @Request() req) {
    return this.service.envoyer(id, req.user.tenantId);
  }

  @Patch('commandes/:id/annuler')
  @ApiOperation({ summary: 'Annuler un bon de commande' })
  annuler(@Param('id') id: string, @Request() req) {
    return this.service.annuler(id, req.user.tenantId);
  }

  @Post('commandes/:id/reception')
  @ApiOperation({ summary: 'Réceptionner (totale ou partielle) : saisie des quantités reçues' })
  reception(@Param('id') id: string, @Body() dto: ReceptionDto, @Request() req) {
    return this.service.receptionner(id, dto, req.user.tenantId, req.user.id);
  }

  // ── Stats ───────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques approvisionnement (commandes en cours, montant engagé)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }
}
