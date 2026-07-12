import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto, RepondreTicketDto, UpdateTicketStatutDto } from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('support-tickets')
export class SupportTicketsController {
  constructor(private readonly service: SupportTicketsService) {}

  @Post()
  creer(@Body() dto: CreateTicketDto, @Req() req: Request) {
    return this.service.creer(dto, (req as any).user);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = (req as any).user;
    return this.service.findAll(user.tenantId, user.role === UserRole.SUPERADMIN);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.service.findOne(id, user.tenantId, user.role === UserRole.SUPERADMIN);
  }

  @Post(':id/repondre')
  repondre(@Param('id') id: string, @Body() dto: RepondreTicketDto, @Req() req: Request) {
    return this.service.repondre(id, dto, (req as any).user);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Patch(':id/statut')
  updateStatut(@Param('id') id: string, @Body() dto: UpdateTicketStatutDto, @Req() req: Request) {
    return this.service.updateStatut(id, dto, (req as any).user.tenantId);
  }
}
