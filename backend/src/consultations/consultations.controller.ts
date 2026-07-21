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
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutConsultation } from './entities/consultation.entity';

@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  findAll(
    @Query('medecinId') medecinId: string,
    @Query('patientId') patientId: string,
    @Query('statut') statut: StatutConsultation,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    return this.consultationsService.findAll(
      req.user.tenantId,
      { medecinId, patientId, statut, dateDebut, dateFin },
      { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 20 },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.consultationsService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateConsultationDto, @Request() req) {
    return this.consultationsService.create(dto, req.user.tenantId, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateConsultationDto>,
    @Request() req,
  ) {
    return this.consultationsService.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/terminer')
  terminer(@Param('id') id: string, @Request() req) {
    return this.consultationsService.terminer(id, req.user.tenantId);
  }

  @Get(':id/ordonnances')
  getOrdonnances(@Param('id') id: string, @Request() req) {
    return this.consultationsService.getOrdonnances(id, req.user.tenantId);
  }

  @Post(':id/ordonnances')
  createOrdonnance(
    @Param('id') id: string,
    @Body() dto: CreateOrdonnanceDto,
    @Request() req,
  ) {
    return this.consultationsService.createOrdonnance(id, dto, req.user.tenantId, req.user.id);
  }
}

