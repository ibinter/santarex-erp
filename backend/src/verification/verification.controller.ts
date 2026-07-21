import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';
import { SkipLicence } from '../common/decorators/skip-licence.decorator';

import { VerificationService, TenantContext } from './verification.service';
import { EnregistrerDocumentDto } from './dto/verification.dto';

interface AuthedRequest {
  user: { id: string; tenantId: string; tenantSlug?: string; role?: UserRole };
}

/**
 * Routes AUTHENTIFIÉES d'enregistrement / révocation d'un document vérifiable.
 * Le tenant courant est déduit du JWT (isolation multi-tenant).
 */
@ApiTags('Vérification de documents')
@ApiBearerAuth()
@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  private ctxOf(req: AuthedRequest): TenantContext {
    return { tenantId: req.user.tenantId, userId: req.user.id };
  }

  @Post()
  @ApiOperation({ summary: 'Enregistrer un document vérifiable (token + hash)' })
  enregistrer(@Req() req: AuthedRequest, @Body() dto: EnregistrerDocumentDto) {
    return this.verification.enregistrer(dto, this.ctxOf(req));
  }

  @Patch(':token/revoquer')
  @ApiOperation({ summary: 'Révoquer un document vérifiable' })
  revoquer(@Req() req: AuthedRequest, @Param('token') token: string) {
    return this.verification.revoquer(token, this.ctxOf(req));
  }
}

/**
 * Route PUBLIQUE de vérification — SANS authentification ni licence.
 * Renvoie uniquement des méta-données non confidentielles.
 * `@SkipLicence()` garantit l'exemption même si un garde global est ajouté.
 */
@ApiTags('Vérification publique')
@Controller('public')
export class PublicVerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('verify/:token')
  @SkipLicence()
  @ApiOperation({
    summary: "Vérifier publiquement l'authenticité d'un document par token",
  })
  verify(@Param('token') token: string) {
    return this.verification.verifier(token);
  }
}
