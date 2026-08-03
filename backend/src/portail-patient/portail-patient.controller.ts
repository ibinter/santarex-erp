import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PortailPatientService } from './portail-patient.service';
import { PortailLoginDto } from './dto/portail-login.dto';

/**
 * Surface PUBLIQUE du portail patient : uniquement le login.
 * Route finale : POST /api/v1/portail-patient/login
 */
@Controller('portail-patient')
export class PortailPatientController {
  constructor(private readonly service: PortailPatientService) {}

  // Anti-force-brute : 5 tentatives / minute comme le login personnel.
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: PortailLoginDto) {
    return this.service.login(dto);
  }
}
