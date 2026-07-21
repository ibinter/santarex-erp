// ════════════════════════════════════════════════════════════════════════════
//  WebhooksController — points d'entrée PUBLICS des webhooks de passerelles.
//
//  Routes : POST /api/v1/payments/webhooks/:gateway
//  PUBLIQUES (aucun JwtAuthGuard) — la seule authentification est la SIGNATURE
//  cryptographique vérifiée dans GatewayService.handleWebhook().
//
//  ⚠️ CORPS BRUT : la vérification HMAC/RSA exige le corps EXACT reçu (non
//  re-sérialisé). On lit `req.rawBody` (Buffer), exposé par Nest lorsque
//  l'application est créée avec `{ rawBody: true }` (voir note main.ts dans le
//  rapport). Un fallback `req.body` est fourni si le raw n'est pas disponible,
//  mais la signature échouera alors — le raw body DOIT être activé.
// ════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Post,
  Param,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';

import { GatewayService, WebhookResult } from './gateway.service';
import { PaymentGateway } from './payments.enums';
import { WebhookHeaders } from './gateways/gateway.interface';

@Controller('payments/webhooks')
export class WebhooksController {
  constructor(private readonly gatewayService: GatewayService) {}

  /**
   * Réception d'un webhook de passerelle. Public, protégé par la signature.
   * Retourne 200 en cas de succès/idempotence ; 401 si signature invalide.
   */
  @SkipThrottle()
  @HttpCode(200)
  @Post(':gateway')
  async handle(
    @Param('gateway') gatewayParam: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: WebhookHeaders,
  ): Promise<WebhookResult> {
    const gateway = this.parseGateway(gatewayParam);

    // Corps BRUT indispensable au HMAC. `req.rawBody` requiert `rawBody: true`
    // à la création de l'app (main.ts). Fallback best-effort sinon.
    const rawBody: Buffer | string =
      req.rawBody ??
      (typeof req.body === 'string'
        ? req.body
        : Buffer.isBuffer(req.body)
          ? req.body
          : JSON.stringify(req.body ?? {}));

    return this.gatewayService.handleWebhook(gateway, rawBody, headers);
  }

  private parseGateway(value: string): PaymentGateway {
    const match = (Object.values(PaymentGateway) as string[]).includes(value);
    if (!match) {
      throw new BadRequestException(`Passerelle inconnue : ${value}`);
    }
    return value as PaymentGateway;
  }
}
