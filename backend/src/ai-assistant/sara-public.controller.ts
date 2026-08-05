import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';

class SaraPublicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}

/**
 * Endpoint PUBLIC (non authentifié) du chatbot SARA de la landing.
 *
 * Sécurité : la clé Groq n'est plus dans le bundle frontend — le front appelle
 * ce proxy, qui parle à Groq avec `GROQ_API_KEY` (côté serveur uniquement).
 * Anti-abus : throttle 12 req/min par IP, message plafonné à 500 caractères,
 * modèle + max_tokens verrouillés côté service.
 */
@ApiTags('SARA (public)')
@Controller('ai-assistant')
export class SaraPublicController {
  constructor(private readonly service: AiAssistantService) {}

  @Throttle({ default: { ttl: 60000, limit: 12 } })
  @Post('sara')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chatbot SARA de la landing (public, proxy Groq)' })
  sara(@Body() dto: SaraPublicDto) {
    return this.service.saraPublic(dto.message);
  }
}
