import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto, RemboursePaiementDto } from './dto/create-paiement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('paiements')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
// Lecture caisse ouverte au soignant ; encaissements et remboursements
// réservés à la caisse et à la direction.
@Roles(
  UserRole.MEDECIN,
  UserRole.CAISSIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class PaiementsController {
  constructor(private readonly paiementsService: PaiementsService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('factureId') factureId?: string,
    @Query('patientId') patientId?: string,
    @Query('modePaiement') modePaiement?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paiementsService.findAll(
      req.user.tenantId,
      { factureId, patientId, modePaiement, dateDebut, dateFin },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('stats-caisse')
  getStatsCaisse(@Request() req, @Query('date') date?: string) {
    return this.paiementsService.getStatsCaisse(req.user.tenantId, date);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.paiementsService.findOne(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  create(@Body() dto: CreatePaiementDto, @Request() req) {
    return this.paiementsService.createPaiement(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/valider')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  valider(@Param('id') id: string, @Request() req) {
    return this.paiementsService.valider(id, req.user.tenantId, req.user.id);
  }

  @Patch(':id/rembourser')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  rembourser(
    @Param('id') id: string,
    @Body() dto: RemboursePaiementDto,
    @Request() req,
  ) {
    return this.paiementsService.rembourser(id, dto.motif, req.user.tenantId, req.user.id);
  }
}

