import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Enregistre un événement. Volontairement tolérant : une erreur d'insertion
   * ne doit jamais casser le tracking côté client (fire-and-forget).
   */
  async record(
    dto: CreateAnalyticsEventDto,
    meta: { userAgent?: string | null } = {},
  ): Promise<{ ok: true }> {
    try {
      const entity = this.repo.create({
        event: dto.event,
        props: dto.props ?? null,
        path: dto.path ?? null,
        referrer: dto.referrer ?? null,
        userAgent: (meta.userAgent ?? '').slice(0, 512) || null,
      });
      await this.repo.save(entity);
    } catch (err) {
      this.logger.warn(
        `Échec enregistrement analytics "${dto.event}": ${(err as Error).message}`,
      );
    }
    return { ok: true };
  }
}
