import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Parité fixe officielle du franc CFA (zone UEMOA) avec l'euro : 1 € = 655,957 FCFA. */
export const XOF_PAR_EUR = 655.957;

/** Garde-fou : un taux hors de cette fourchette est refusé (réponse d'API erronée). */
const FOURCHETTE_XOF_PAR_USD = { min: 300, max: 1500 };
/** Durée de vie du taux en mémoire. */
const DUREE_CACHE_MS = 6 * 3_600_000;

export interface TauxChange {
  xofParEur: number;
  xofParUsd: number;
  source: string;
  majLe: string;
}

/**
 * Taux de change FCFA → euro / dollar, pour l'AFFICHAGE des prix (indicatif). Les paiements restent en FCFA.
 *  - Euro : parité fixe, jamais variable.
 *  - Dollar : récupéré sur une API publique gratuite, gardé 6 h en mémoire. En cas d'échec, dernier taux
 *    connu, sinon la valeur de secours `TAUX_USD_XOF` (défaut 590).
 */
@Injectable()
export class TauxChangeService {
  private readonly logger = new Logger(TauxChangeService.name);
  private cache: (TauxChange & { expire: number }) | null = null;

  constructor(private readonly config: ConfigService) {}

  private secours(): number {
    const v = Number(this.config.get('TAUX_USD_XOF'));
    return Number.isFinite(v) && v >= FOURCHETTE_XOF_PAR_USD.min && v <= FOURCHETTE_XOF_PAR_USD.max ? v : 590;
  }

  async taux(): Promise<TauxChange> {
    const maintenant = Date.now();
    if (this.cache && this.cache.expire > maintenant) return this.vue(this.cache);

    let xofParUsd = this.cache?.xofParUsd ?? this.secours();
    let source = this.cache?.source ?? 'valeur de secours';
    let frais = false;
    try {
      const { data } = await axios.get<{ rates?: { XOF?: number } }>('https://open.er-api.com/v6/latest/USD', { timeout: 4000 });
      const x = Number(data?.rates?.XOF);
      if (Number.isFinite(x) && x >= FOURCHETTE_XOF_PAR_USD.min && x <= FOURCHETTE_XOF_PAR_USD.max) {
        xofParUsd = x;
        source = 'open.er-api.com';
        frais = true;
      } else {
        this.logger.warn(`Taux USD/XOF inattendu (${data?.rates?.XOF}) : ignoré`);
      }
    } catch (err) {
      this.logger.warn(`Taux de change indisponible : ${(err as Error).message} — dernier taux connu utilisé`);
    }

    this.cache = {
      xofParEur: XOF_PAR_EUR,
      xofParUsd: Math.round(xofParUsd * 100) / 100,
      source,
      majLe: new Date().toISOString(),
      // Échec : on réessaie plus tôt (15 min) au lieu d'attendre 6 h.
      expire: maintenant + (frais ? DUREE_CACHE_MS : 15 * 60_000),
    };
    return this.vue(this.cache);
  }

  private vue(c: TauxChange): TauxChange {
    return { xofParEur: c.xofParEur, xofParUsd: c.xofParUsd, source: c.source, majLe: c.majLe };
  }
}
