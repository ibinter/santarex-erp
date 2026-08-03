import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Endpoint public (aucun guard) : la landing envoie des événements légers en
   * fire-and-forget. Répond toujours 200 pour ne jamais bloquer l'UI.
   */
  // Endpoint public non authentifié → throttle agressif anti-spam/inflation
  // de données (30 événements / minute par IP).
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enregistrer un événement analytics (public)' })
  event(
    @Body() dto: CreateAnalyticsEventDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.analyticsService.record(dto, { userAgent });
  }
}
