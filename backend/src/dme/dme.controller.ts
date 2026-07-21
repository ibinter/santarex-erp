import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DmeService } from './dme.service';
import { CreateAntecedentDto } from './dto/create-antecedent.dto';
import { CreateAllergieDto } from './dto/create-allergie.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.MEDECIN, UserRole.INFIRMIER, UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('dme')
export class DmeController {
  constructor(private readonly dmeService: DmeService) {}

  @Get(':patientId')
  getDossierComplet(@Param('patientId') patientId: string, @Request() req) {
    return this.dmeService.getDossierComplet(patientId, req.user.tenantId);
  }

  @Get(':patientId/antecedents')
  getAntecedents(@Param('patientId') patientId: string, @Request() req) {
    return this.dmeService.getAntecedents(patientId, req.user.tenantId);
  }

  @Post(':patientId/antecedents')
  addAntecedent(
    @Param('patientId') patientId: string,
    @Body() dto: CreateAntecedentDto,
    @Request() req,
  ) {
    return this.dmeService.addAntecedent(dto, patientId, req.user.tenantId, req.user.id);
  }

  @Put(':patientId/antecedents/:id')
  updateAntecedent(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAntecedentDto>,
    @Request() req,
  ) {
    return this.dmeService.updateAntecedent(id, dto, req.user.tenantId);
  }

  @Delete(':patientId/antecedents/:id')
  deleteAntecedent(@Param('id') id: string, @Request() req) {
    return this.dmeService.deleteAntecedent(id, req.user.tenantId);
  }

  @Get(':patientId/allergies')
  getAllergies(@Param('patientId') patientId: string, @Request() req) {
    return this.dmeService.getAllergies(patientId, req.user.tenantId);
  }

  @Post(':patientId/allergies')
  addAllergie(
    @Param('patientId') patientId: string,
    @Body() dto: CreateAllergieDto,
    @Request() req,
  ) {
    return this.dmeService.addAllergie(dto, patientId, req.user.tenantId);
  }

  @Get(':patientId/documents')
  getDocuments(@Param('patientId') patientId: string, @Request() req) {
    return this.dmeService.getDocuments(patientId, req.user.tenantId);
  }
}

