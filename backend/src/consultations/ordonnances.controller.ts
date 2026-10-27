import { Controller, Get, Query, Request, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ConsultationsService } from './consultations.service';

@ApiTags('Ordonnances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ordonnances')
export class OrdonnancesController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  @ApiOperation({ summary: "Ordonnances d'un patient (dossier médical)" })
  list(
    @Request() req,
    @Query('patientId', ParseUUIDPipe) patientId: string,
    @Query('limit') limit?: string,
  ) {
    return this.consultationsService.getOrdonnancesByPatient(
      patientId,
      req.user.tenantId,
      limit ? Number(limit) : 20,
    );
  }
}
