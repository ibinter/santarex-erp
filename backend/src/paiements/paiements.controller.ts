import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaiementsService } from './paiements.service';
import { CreatePaiementDto, RemboursePaiementDto } from './dto/create-paiement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('paiements')
@UseGuards(JwtAuthGuard)
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
  findOne(@Param('id') id: string, @Request() req) {
    return this.paiementsService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreatePaiementDto, @Request() req) {
    return this.paiementsService.createPaiement(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/valider')
  valider(@Param('id') id: string, @Request() req) {
    return this.paiementsService.valider(id, req.user.tenantId, req.user.id);
  }

  @Patch(':id/rembourser')
  rembourser(
    @Param('id') id: string,
    @Body() dto: RemboursePaiementDto,
    @Request() req,
  ) {
    return this.paiementsService.rembourser(id, dto.motif, req.user.tenantId, req.user.id);
  }
}

