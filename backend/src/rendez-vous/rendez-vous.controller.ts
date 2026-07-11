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
import { RendezVousService } from './rendez-vous.service';
import { CreateRdvDto } from './dto/create-rdv.dto';
import { UpdateRdvDto } from './dto/update-rdv.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StatutRendezVous } from './entities/rendez-vous.entity';

@UseGuards(JwtAuthGuard)
@Controller('rendez-vous')
export class RendezVousController {
  constructor(private readonly rendezVousService: RendezVousService) {}

  @Get()
  findAll(
    @Query('medecinId') medecinId: string,
    @Query('patientId') patientId: string,
    @Query('date') date: string,
    @Query('statut') statut: StatutRendezVous,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    return this.rendezVousService.findAll(
      req.user.tenantId,
      { medecinId, patientId, date, statut },
      { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 },
    );
  }

  @Get('disponibilites')
  getCreneauxDisponibles(
    @Query('medecinId') medecinId: string,
    @Query('date') date: string,
    @Request() req,
  ) {
    return this.rendezVousService.getCreneauxDisponibles(medecinId, date, req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.rendezVousService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateRdvDto, @Request() req) {
    return this.rendezVousService.create(dto, req.user.tenantId, req.user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRdvDto, @Request() req) {
    return this.rendezVousService.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/confirmer')
  confirmer(@Param('id') id: string, @Request() req) {
    return this.rendezVousService.confirmer(id, req.user.tenantId);
  }

  @Patch(':id/annuler')
  annuler(@Param('id') id: string, @Request() req) {
    return this.rendezVousService.annuler(id, req.user.tenantId);
  }
}

