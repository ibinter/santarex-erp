import { Controller, Get, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('nonLues') nonLues?: string,
  ) {
    const { tenantId, id: userId } = (req as any).user;
    return this.service.findForUser(tenantId, userId, nonLues === 'true');
  }

  @Get('count')
  count(@Req() req: Request) {
    const { tenantId, id: userId } = (req as any).user;
    return this.service.countNonLues(tenantId, userId).then((count) => ({ count }));
  }

  @Patch(':id/lire')
  marquerLue(@Param('id') id: string, @Req() req: Request) {
    return this.service.marquerLue(id, (req as any).user.tenantId);
  }

  @Patch('tout-lire')
  marquerToutesLues(@Req() req: Request) {
    const { tenantId, id: userId } = (req as any).user;
    return this.service.marquerToutesLues(tenantId, userId);
  }
}
