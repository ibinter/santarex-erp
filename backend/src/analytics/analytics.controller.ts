import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
