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
import { DevisService } from './devis.service';
import { CreateDevisDto, CreateLigneDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto, RepondreDevisDto } from './dto/update-devis.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutDevis } from './entities/devis-patient.entity';

@Controller('devis')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture large (soignant + caisse + direction) ; mutations réservées caisse/admin/direction.
@Roles(
  UserRole.MEDECIN,
  UserRole.CAISSIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Get()
  findAll(
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('statut') statut?: StatutDevis,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.devisService.findAll(
      req.user.tenantId,
      { patientId, statut },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.devisService.getStats(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.devisService.findOne(id, req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  create(@Body() dto: CreateDevisDto, @Request() req) {
    return this.devisService.create(dto, req.user.tenantId, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  update(@Param('id') id: string, @Body() dto: UpdateDevisDto, @Request() req) {
    return this.devisService.update(id, dto, req.user.tenantId);
  }

  @Post(':id/lignes')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  addLigne(@Param('id') id: string, @Body() dto: CreateLigneDevisDto, @Request() req) {
    return this.devisService.addLigne(id, dto, req.user.tenantId);
  }

  @Delete(':id/lignes/:ligneId')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  removeLigne(@Param('id') id: string, @Param('ligneId') ligneId: string, @Request() req) {
    return this.devisService.removeLigne(ligneId, id, req.user.tenantId);
  }

  @Patch(':id/envoyer')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  envoyer(@Param('id') id: string, @Request() req) {
    return this.devisService.envoyer(id, req.user.tenantId);
  }

  @Patch(':id/repondre')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  repondre(@Param('id') id: string, @Body() dto: RepondreDevisDto, @Request() req) {
    return this.devisService.repondre(id, dto.reponse, dto.motifRefus, req.user.tenantId);
  }

  @Patch(':id/convertir-facture')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  convertirFacture(
    @Param('id') id: string,
    @Body() body: { factureId?: string },
    @Request() req,
  ) {
    return this.devisService.convertirEnFacture(id, req.user.tenantId, body?.factureId);
  }

  @Delete(':id')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  remove(@Param('id') id: string, @Request() req) {
    return this.devisService.remove(id, req.user.tenantId);
  }
}
