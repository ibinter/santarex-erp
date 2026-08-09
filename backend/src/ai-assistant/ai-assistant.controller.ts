import { Controller, Post, Get, Patch, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { ChatDto, UpdateAiConfigDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaidTierGuard } from '../common/guards/paid-tier.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Request, Response } from 'express';

// PaidTierGuard : l'assistant SARA est fermé au palier Découverte (§3.3/§12.5.2).
@UseGuards(JwtAuthGuard, PaidTierGuard)
@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly service: AiAssistantService) {}

  @Post('chat')
  async chat(@Body() dto: ChatDto, @Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    return this.service.chat(user?.tenantId, user?.userId ?? user?.id, dto, res);
  }

  @Get('config')
  getConfig(@Req() req: Request) {
    return this.service.getOrCreateConfig((req as any).user?.tenantId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Get('usage')
  getUsage(@Req() req: Request) {
    return this.service.getUsageSummary((req as any).user?.tenantId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Patch('config')
  updateConfig(@Body() dto: UpdateAiConfigDto, @Req() req: Request) {
    return this.service.updateConfig((req as any).user?.tenantId, dto);
  }
}
