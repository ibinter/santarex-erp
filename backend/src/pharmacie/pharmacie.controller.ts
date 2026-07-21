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
import { PharmacieService } from './pharmacie.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { EntreeStockDto, SortieStockDto } from './dto/mouvement-stock.dto';
import { DispenserOrdonnanceDto } from './dto/dispenser-ordonnance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MedicamentCategorie } from './entities/medicament.entity';

@ApiTags('Pharmacie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
// Consultation du catalogue/stock ouverte aux soignants ; toute mutation du
// stock ou dispensation réservée à la pharmacie et à la direction.
@Roles(
  UserRole.PHARMACIEN,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('pharmacie')
export class PharmacieController {
  constructor(private readonly pharmService: PharmacieService) {}

  // â”€â”€ MÃ©dicaments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('medicaments')
  @ApiOperation({ summary: 'Liste des mÃ©dicaments avec filtres et pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categorie', required: false, enum: MedicamentCategorie })
  @ApiQuery({ name: 'enRupture', required: false, type: Boolean })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categorie') categorie?: MedicamentCategorie,
    @Query('enRupture') enRupture?: string,
  ) {
    return this.pharmService.findAllMedicaments(
      req.user.tenantId,
      { categorie, search, enRupture: enRupture === 'true' },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get('medicaments/rupture')
  @ApiOperation({ summary: 'MÃ©dicaments en rupture de stock (stockActuel <= stockMinimum)' })
  getEnRupture(@Request() req) {
    return this.pharmService.getMedicamentsEnRupture(req.user.tenantId);
  }

  @Get('medicaments/alerte')
  @ApiOperation({ summary: 'MÃ©dicaments proches du seuil d\'alerte (stockActuel <= stockMinimum * 1.2)' })
  getEnAlerte(@Request() req) {
    return this.pharmService.getMedicamentsEnAlerte(req.user.tenantId);
  }

  @Get('medicaments/expiration')
  @ApiOperation({ summary: 'MÃ©dicaments expirant bientÃ´t' })
  @ApiQuery({ name: 'jours', required: false, type: Number, description: 'Nombre de jours avant expiration (dÃ©faut: 30)' })
  getExpiration(@Request() req, @Query('jours') jours?: number) {
    return this.pharmService.getMedicamentsExpirantBientot(req.user.tenantId, jours ? +jours : 30);
  }

  @Get('medicaments/:id')
  @ApiOperation({ summary: 'DÃ©tail d\'un mÃ©dicament' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.pharmService.findOneMedicament(id, req.user.tenantId);
  }

  @Post('medicaments')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'CrÃ©er un mÃ©dicament' })
  create(@Body() dto: CreateMedicamentDto, @Request() req) {
    return this.pharmService.createMedicament(dto, req.user.tenantId);
  }

  @Put('medicaments/:id')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre Ã  jour un mÃ©dicament' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateMedicamentDto>, @Request() req) {
    return this.pharmService.updateMedicament(id, dto, req.user.tenantId);
  }

  // â”€â”€ Mouvements de stock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('medicaments/:id/entree-stock')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'EntrÃ©e de stock (ajout d\'un lot)' })
  entreeStock(
    @Param('id') id: string,
    @Body() dto: EntreeStockDto,
    @Request() req,
  ) {
    return this.pharmService.entreeStock(id, dto, req.user.tenantId, req.user.id);
  }

  @Post('medicaments/:id/sortie-stock')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Sortie de stock manuelle' })
  sortieStock(
    @Param('id') id: string,
    @Body() dto: SortieStockDto,
    @Request() req,
  ) {
    return this.pharmService.sortieStock(
      id,
      dto.quantite,
      dto.motif ?? 'Sortie manuelle',
      req.user.tenantId,
      req.user.id,
      dto.ordonnanceId,
      dto.patientId,
    );
  }

  @Get('medicaments/:id/mouvements')
  @ApiOperation({ summary: 'Historique des mouvements d\'un mÃ©dicament' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistorique(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pharmService.getHistoriqueMouvements(
      id,
      req.user.tenantId,
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  // â”€â”€ Ordonnances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('ordonnances/:ordonnanceId/dispenser')
  @Roles(UserRole.PHARMACIEN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Dispenser tous les mÃ©dicaments d\'une ordonnance' })
  dispenserOrdonnance(
    @Param('ordonnanceId') ordonnanceId: string,
    @Body() dto: DispenserOrdonnanceDto,
    @Request() req,
  ) {
    return this.pharmService.dispenserOrdonnance(ordonnanceId, dto, req.user.tenantId, req.user.id);
  }

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('stats/jour')
  @ApiOperation({ summary: 'Statistiques pharmacie du jour' })
  getStats(@Request() req) {
    return this.pharmService.getStatsPharmacieJour(req.user.tenantId);
  }
}

