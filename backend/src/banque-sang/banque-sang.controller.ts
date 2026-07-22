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
import { BanqueSangService } from './banque-sang.service';
import { CreatePocheDto } from './dto/create-poche.dto';
import { CreateTransfusionDto } from './dto/create-transfusion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  GroupeABO,
  Rhesus,
  StatutPoche,
  TypeProduitSanguin,
} from './entities/poche-sang.entity';

@ApiTags('Banque de sang')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Consultation ouverte aux soignants ; mutations du stock et enregistrement
// des transfusions réservés au laboratoire/soignants habilités et à la direction.
@Roles(
  UserRole.LABORANTIN,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('banque-sang')
export class BanqueSangController {
  constructor(private readonly service: BanqueSangService) {}

  // ── Poches ──────────────────────────────────────────────────────
  @Get('poches')
  @ApiOperation({ summary: 'Liste des poches de sang (filtres + pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'groupe', required: false, enum: GroupeABO })
  @ApiQuery({ name: 'rhesus', required: false, enum: Rhesus })
  @ApiQuery({ name: 'typeProduit', required: false, enum: TypeProduitSanguin })
  @ApiQuery({ name: 'statut', required: false, enum: StatutPoche })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllPoches(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('groupe') groupe?: GroupeABO,
    @Query('rhesus') rhesus?: Rhesus,
    @Query('typeProduit') typeProduit?: TypeProduitSanguin,
    @Query('statut') statut?: StatutPoche,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPoches(
      req.user.tenantId,
      { groupe, rhesus, typeProduit, statut, search },
      { page: page ? +page : 1, limit: limit ? +limit : 50 },
    );
  }

  @Get('poches/compatibles')
  @ApiOperation({ summary: 'Poches disponibles compatibles avec un groupe patient' })
  @ApiQuery({ name: 'groupe', required: true, enum: GroupeABO })
  @ApiQuery({ name: 'rhesus', required: true, enum: Rhesus })
  @ApiQuery({ name: 'typeProduit', required: false, enum: TypeProduitSanguin })
  findCompatibles(
    @Request() req,
    @Query('groupe') groupe: GroupeABO,
    @Query('rhesus') rhesus: Rhesus,
    @Query('typeProduit') typeProduit?: TypeProduitSanguin,
  ) {
    return this.service.findPochesCompatibles(groupe, rhesus, req.user.tenantId, typeProduit);
  }

  @Get('poches/:id')
  @ApiOperation({ summary: 'Détail d\'une poche' })
  findOnePoche(@Param('id') id: string, @Request() req) {
    return this.service.findOnePoche(id, req.user.tenantId);
  }

  @Post('poches')
  @Roles(UserRole.LABORANTIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Entrée de stock : enregistrer une poche' })
  createPoche(@Body() dto: CreatePocheDto, @Request() req) {
    return this.service.createPoche(dto, req.user.tenantId);
  }

  @Put('poches/:id')
  @Roles(UserRole.LABORANTIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Mettre à jour une poche' })
  updatePoche(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePocheDto>,
    @Request() req,
  ) {
    return this.service.updatePoche(id, dto, req.user.tenantId);
  }

  @Patch('poches/:id/statut')
  @Roles(UserRole.LABORANTIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Changer le statut d\'une poche (réserver, détruire…)' })
  changerStatut(
    @Param('id') id: string,
    @Body('statut') statut: StatutPoche,
    @Request() req,
  ) {
    return this.service.changerStatut(id, statut, req.user.tenantId);
  }

  // ── Transfusions ────────────────────────────────────────────────
  @Get('transfusions')
  @ApiOperation({ summary: 'Historique des transfusions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  findAllTransfusions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.service.findAllTransfusions(
      req.user.tenantId,
      { patientId },
      { page: page ? +page : 1, limit: limit ? +limit : 50 },
    );
  }

  @Post('transfusions')
  @Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({
    summary:
      'Enregistrer une transfusion (contrôle de compatibilité ABO/Rhésus + décrément du stock)',
  })
  enregistrerTransfusion(@Body() dto: CreateTransfusionDto, @Request() req) {
    return this.service.enregistrerTransfusion(dto, req.user.tenantId);
  }

  @Patch('transfusions/:id/reaction')
  @Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Consigner une réaction transfusionnelle' })
  enregistrerReaction(
    @Param('id') id: string,
    @Body('reaction') reaction: string,
    @Request() req,
  ) {
    return this.service.enregistrerReaction(id, reaction, req.user.tenantId);
  }

  // ── Stats ───────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques : stock par groupe, proches péremption…' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }
}
