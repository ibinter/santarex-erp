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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SterilisationService } from './sterilisation.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { ValiderCycleDto } from './dto/valider-cycle.dto';
import { UtiliserLotDto } from './dto/utiliser-lot.dto';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  MethodeSterilisation,
  StatutLot,
} from './entities/lot-sterilisation.entity';

@ApiTags('Stérilisation')
@ApiBearerAuth()
@Controller('sterilisation')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.INFIRMIER,
  UserRole.MEDECIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class SterilisationController {
  constructor(private readonly service: SterilisationService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Statistiques de stérilisation (cycles du jour, conformité, périmés)' })
  @Get('stats')
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Lister les lots dont la stérilité est périmée' })
  @Get('lots/perimes')
  findPerimes(@Request() req) {
    return this.service.findLotsPerimes(req.user.tenantId);
  }

  // ─── Instruments / plateaux ──────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister le référentiel instruments / plateaux' })
  @Get('instruments')
  findAllInstruments(@Request() req) {
    return this.service.findAllInstruments(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Créer un instrument / plateau' })
  @Post('instruments')
  createInstrument(@Body() dto: CreateInstrumentDto, @Request() req) {
    return this.service.createInstrument(dto, req.user.tenantId);
  }

  // ─── Lots (CRUD) ─────────────────────────────────────────────────────────────
  @ApiOperation({ summary: 'Lister les lots de stérilisation (filtres: statut, methode)' })
  @Get('lots')
  findAllLots(
    @Request() req,
    @Query('statut') statut?: StatutLot,
    @Query('methode') methode?: MethodeSterilisation,
  ) {
    return this.service.findAllLots(req.user.tenantId, { statut, methode });
  }

  @ApiOperation({ summary: 'Détail d\'un lot de stérilisation' })
  @Get('lots/:id')
  findOneLot(@Param('id') id: string, @Request() req) {
    return this.service.findOneLot(id, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Créer un nouveau cycle / lot de stérilisation' })
  @Post('lots')
  createLot(@Body() dto: CreateLotDto, @Request() req) {
    return this.service.createLot(dto, req.user.tenantId, req.user.id);
  }

  @ApiOperation({ summary: 'Mettre à jour un lot (uniquement si en cours)' })
  @Patch('lots/:id')
  updateLot(@Param('id') id: string, @Body() dto: UpdateLotDto, @Request() req) {
    return this.service.updateLot(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Valider un cycle : résultat indicateur → statut valide/rejeté' })
  @Patch('lots/:id/valider')
  validerCycle(
    @Param('id') id: string,
    @Body() dto: ValiderCycleDto,
    @Request() req,
  ) {
    return this.service.validerCycle(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Marquer un lot comme utilisé (bloqué si non conforme ou périmé)' })
  @Patch('lots/:id/utiliser')
  utiliserLot(
    @Param('id') id: string,
    @Body() dto: UtiliserLotDto,
    @Request() req,
  ) {
    return this.service.utiliserLot(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Supprimer un lot (interdit si déjà utilisé)' })
  @Delete('lots/:id')
  removeLot(@Param('id') id: string, @Request() req) {
    return this.service.removeLot(id, req.user.tenantId);
  }
}
