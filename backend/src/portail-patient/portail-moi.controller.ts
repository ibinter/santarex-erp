import { Controller, Get, UseGuards } from '@nestjs/common';
import { PortailGuard } from './guards/portail.guard';
import {
  CurrentPortailUser,
  PortailUser,
} from './decorators/portail-user.decorator';
import { PortailPatientService } from './portail-patient.service';

/**
 * Surface PATIENT (lecture seule), protégée par PortailGuard (scope 'portail').
 * Le patientId + tenant proviennent EXCLUSIVEMENT du token portail : aucun
 * paramètre client n'intervient dans le scoping, donc aucune fuite possible.
 *
 * Routes : /api/v1/portail-patient/moi/{profil|rendez-vous|resultats|ordonnances}
 */
@UseGuards(PortailGuard)
@Controller('portail-patient/moi')
export class PortailMoiController {
  constructor(private readonly service: PortailPatientService) {}

  @Get('profil')
  profil(@CurrentPortailUser() u: PortailUser) {
    return this.service.profil(u.patientId, u.tenantSlug);
  }

  @Get('rendez-vous')
  rendezVous(@CurrentPortailUser() u: PortailUser) {
    return this.service.mesRendezVous(u.patientId, u.tenantSlug);
  }

  @Get('resultats')
  resultats(@CurrentPortailUser() u: PortailUser) {
    return this.service.mesResultats(u.patientId, u.tenantSlug);
  }

  @Get('ordonnances')
  ordonnances(@CurrentPortailUser() u: PortailUser) {
    return this.service.mesOrdonnances(u.patientId, u.tenantSlug);
  }
}
