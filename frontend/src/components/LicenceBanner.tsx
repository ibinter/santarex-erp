'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

/**
 * Bandeau discret d'état de licence (cahier IBIG v1.1 §8.3/§8.4).
 * Au montage, interroge GET /licence/etat et affiche une bannière selon `etat` :
 *   essai / decouverte -> bleu (informatif)
 *   grace              -> orange (avertissement)
 *   expiree            -> rouge (lecture seule)
 *   active / aucune    -> rien
 * Bilingue FR/EN via le cookie NEXT_LOCALE (même mécanisme que les pages d'erreur).
 * Échec de l'appel -> silencieux (aucune bannière), ne bloque jamais l'UI.
 */

type Etat = 'active' | 'essai' | 'decouverte' | 'grace' | 'expiree' | 'aucune';

interface LicenceEtat {
  etat: Etat;
  palierGratuit?: boolean;
  joursRestants?: number;
  lectureSeule?: boolean;
  graceJoursRestants?: number;
  droits?: { export?: boolean; api?: boolean; sara?: boolean; multiUtilisateur?: boolean };
  quotas?: { patients?: { valeur: number; plafond: number; restant: number } | null };
  filigrane?: boolean;
  message?: string;
}

type Lang = 'fr' | 'en';

const SEVERITE: Record<string, { bg: string; dot: string }> = {
  info: { bg: '#1D4ED8', dot: '#fff' }, // bleu — essai / decouverte
  warn: { bg: '#B45309', dot: '#fff' }, // orange — grace
  danger: { bg: '#B91C1C', dot: '#fff' }, // rouge — expiree / lecture seule
};

function buildMessage(d: LicenceEtat, lang: Lang): { text: string; sev: keyof typeof SEVERITE } | null {
  const fr = lang === 'fr';
  switch (d.etat) {
    case 'essai': {
      const j = d.joursRestants ?? 0;
      if (j <= 1) {
        return {
          sev: 'info',
          text: fr
            ? "Dernier jour d'essai. Activez une formule pour conserver l'export et le multi-utilisateur."
            : 'Last day of trial. Activate a plan to keep export and multi-user access.',
        };
      }
      return {
        sev: 'info',
        text: fr
          ? `Essai en cours — ${j} jour(s) restant(s).`
          : `Trial in progress — ${j} day(s) remaining.`,
      };
    }
    case 'decouverte': {
      const plafond = d.quotas?.patients?.plafond ?? 0;
      return {
        sev: 'info',
        text: fr
          ? `Palier Découverte — ${plafond} patients. Passez à une formule payante pour lever la limite.`
          : `Discovery tier — ${plafond} patients. Upgrade to a paid plan to remove the limit.`,
      };
    }
    case 'grace': {
      const g = d.graceJoursRestants ?? 0;
      return {
        sev: 'warn',
        text: fr
          ? `Abonnement échu. Accès maintenu ${g} jour(s), puis passage en lecture seule.`
          : `Subscription expired. Access kept for ${g} day(s), then read-only.`,
      };
    }
    case 'expiree': {
      return {
        sev: 'danger',
        text: fr
          ? 'Abonnement expiré — lecture seule. Vos données sont conservées.'
          : 'Subscription expired — read-only. Your data is preserved.',
      };
    }
    default:
      return null; // active / aucune
  }
}

export default function LicenceBanner() {
  const [data, setData] = useState<LicenceEtat | null>(null);
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLang(m[1] as Lang);

    let cancelled = false;
    apiClient<LicenceEtat>('/licence/etat')
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        /* silencieux : pas de bannière si l'appel échoue */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;
  const msg = buildMessage(data, lang);
  if (!msg) return null;

  const { bg, dot } = SEVERITE[msg.sev];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '7px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#fff',
        background: bg,
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        textAlign: 'center',
        lineHeight: 1.3,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
          opacity: 0.9,
        }}
      />
      <span>{msg.text}</span>
    </div>
  );
}
