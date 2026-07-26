import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { COORDONNEES_MOMO, CoordonneeMomo } from './paiement-momo.config';

/**
 * Endpoint PUBLIC exposant les coordonnées de paiement Mobile Money direct
 * (section 19.5). Le front les charge d'ici plutôt que de les coder en dur.
 * Chaque entrée peut être surchargée par une variable d'environnement
 * (`MOMO_ORANGE`, `MOMO_MOOV`, `MOMO_MTN`, `MOMO_WAVE`) contenant le numéro.
 */
@ApiTags('Paiement')
@Controller('paiement')
export class PaiementConfigController {
  constructor(private readonly config: ConfigService) {}

  private readonly envParCode: Record<CoordonneeMomo['code'], string> = {
    orange_money: 'MOMO_ORANGE',
    moov_money: 'MOMO_MOOV',
    mtn_momo: 'MOMO_MTN',
    wave: 'MOMO_WAVE',
  };

  @Get('coordonnees-momo')
  @ApiOperation({ summary: 'Coordonnées officielles de paiement Mobile Money direct' })
  getCoordonneesMomo(): {
    securite: string;
    coordonnees: CoordonneeMomo[];
  } {
    const coordonnees = COORDONNEES_MOMO.map((c) => {
      const override = this.config.get<string>(this.envParCode[c.code]);
      return override ? { ...c, numero: override } : { ...c };
    });
    return {
      securite:
        'Vérifiez toujours le numéro et le titulaire IBIG SARL avant tout envoi. '
        + 'Aucune activation automatique : votre preuve est validée manuellement.',
      coordonnees,
    };
  }
}
