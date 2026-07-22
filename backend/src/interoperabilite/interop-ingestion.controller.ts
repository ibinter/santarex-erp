import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';

import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiScopes } from './decorators/api-scopes.decorator';
import { InteroperabiliteService, ApiKeyContext } from './interoperabilite.service';
import { IngestionHl7Dto } from './dto/interop.dto';

/**
 * Points d'ingestion d'interfaçage — protégés par ApiKeyGuard (X-API-Key).
 * Destinés aux automates / middlewares d'intégration sur site.
 */
@ApiTags('Interop — Ingestion')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyGuard)
@Controller('interop')
export class InteropIngestionController {
  constructor(private readonly service: InteroperabiliteService) {}

  @Post('hl7/resultats')
  @HttpCode(201)
  @ApiScopes('hl7:write')
  @ApiOperation({
    summary: 'Ingestion d\'un message HL7 v2 de résultats de laboratoire (segments OBX)',
  })
  ingererHl7(@Body() dto: IngestionHl7Dto, @Req() req: Request) {
    const ctx = (req as any).apiKeyContext as ApiKeyContext;
    return this.service.ingererHl7Resultats(dto.message, ctx.tenantId);
  }
}
