import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MessagerieService } from './messagerie.service';
import { CreateConversationDto, EnvoyerMessageDto } from './dto/messagerie.dto';

@ApiTags('Messagerie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messagerie')
export class MessagerieController {
  constructor(private readonly service: MessagerieService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Mes conversations (triées par récence)' })
  mesConversations(@Req() req: Request) {
    return this.service.mesConversations((req as any).user);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Créer une conversation (directe ou groupe)' })
  creer(@Body() dto: CreateConversationDto, @Req() req: Request) {
    return this.service.creerConversation(dto, (req as any).user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: "Messages d'une conversation" })
  messages(@Param('id') id: string, @Req() req: Request) {
    return this.service.messagesDe(id, (req as any).user);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message dans une conversation' })
  envoyer(
    @Param('id') id: string,
    @Body() dto: EnvoyerMessageDto,
    @Req() req: Request,
  ) {
    return this.service.envoyerMessage(id, dto, (req as any).user);
  }

  @Patch('conversations/:id/lu')
  @ApiOperation({ summary: 'Marquer une conversation comme lue' })
  marquerLu(@Param('id') id: string, @Req() req: Request) {
    return this.service.marquerLu(id, (req as any).user);
  }

  @Get('non-lus')
  @ApiOperation({ summary: 'Compteur global de messages non lus' })
  nonLus(@Req() req: Request) {
    return this.service.compterNonLus((req as any).user);
  }

  @Get('destinataires')
  @ApiOperation({ summary: 'Utilisateurs destinataires du tenant' })
  destinataires(@Req() req: Request, @Query('q') q?: string) {
    return this.service.destinataires((req as any).user, q);
  }
}
