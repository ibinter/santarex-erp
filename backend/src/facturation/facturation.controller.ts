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
import { FacturationService } from './facturation.service';
import { CreateFactureDto, CreateLigneFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto, AnnulerFactureDto } from './dto/update-facture.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutFacture } from './entities/facture.entity';

@Controller('facturation')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
// Lecture large (facturation visible par le soignant et la caisse) ;
// mutations réservées à la caisse et à la direction.
@Roles(
  UserRole.MEDECIN,
  UserRole.CAISSIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class FacturationController {
  constructor(private readonly facturationService: FacturationService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('statut') statut?: StatutFacture,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.facturationService.findAll(
      req.user.tenantId,
      { patientId, statut, dateDebut, dateFin },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.facturationService.getStatsFacturation(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.facturationService.findOne(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  create(@Body() dto: CreateFactureDto, @Request() req) {
    return this.facturationService.createFacture(dto, req.user.tenantId, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  update(@Param('id') id: string, @Body() dto: UpdateFactureDto, @Request() req) {
    return this.facturationService.update(id, dto, req.user.tenantId);
  }

  @Post(':id/lignes')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  addLigne(
    @Param('id') id: string,
    @Body() dto: CreateLigneFactureDto,
    @Request() req,
  ) {
    return this.facturationService.addLigne(id, dto, req.user.tenantId);
  }

  @Delete(':id/lignes/:ligneId')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  removeLigne(
    @Param('id') id: string,
    @Param('ligneId') ligneId: string,
    @Request() req,
  ) {
    return this.facturationService.removeLigne(ligneId, id, req.user.tenantId);
  }

  @Patch(':id/emettre')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  emettre(@Param('id') id: string, @Request() req) {
    return this.facturationService.emettre(id, req.user.tenantId);
  }

  @Patch(':id/annuler')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  annuler(@Param('id') id: string, @Body() dto: AnnulerFactureDto, @Request() req) {
    return this.facturationService.annuler(id, dto.motif, req.user.tenantId);
  }
}

