'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

/**
 * Affichage des prix en FCFA, euro ou dollar. Les paiements restent TOUJOURS en FCFA : euro et dollar
 * ne sont que des équivalents indicatifs. L'euro a une parité fixe officielle avec le FCFA ; le dollar
 * est mis à jour par le serveur (GET /taux-change).
 */
export type Devise = 'XOF' | 'EUR' | 'USD';

export interface Taux {
  xofParEur: number;
  xofParUsd: number;
}

/** Valeurs de repli si le serveur ne répond pas. */
const TAUX_DEFAUT: Taux = { xofParEur: 655.957, xofParUsd: 590 };
const CLE_STOCKAGE = 'santarex_devise';

/** « 12 000 » ou « 1 500 000 » → 12000. */
export function chiffres(texte: string | number): number {
  return Number(String(texte).replace(/\D/g, '')) || 0;
}

export function formaterMontant(xof: number, devise: Devise, taux: Taux): string {
  if (devise === 'XOF') return `${Math.round(xof).toLocaleString('fr-FR')} FCFA`;
  const valeur = devise === 'EUR' ? xof / taux.xofParEur : xof / taux.xofParUsd;
  const decimales = valeur < 100 ? 2 : 0;
  const nombre = valeur.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return devise === 'EUR' ? `≈ ${nombre} €` : `≈ ${nombre} $`;
}

export function useDevise() {
  const [devise, setDeviseEtat] = useState<Devise>('XOF');
  const [taux, setTaux] = useState<Taux>(TAUX_DEFAUT);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CLE_STOCKAGE);
      if (v === 'EUR' || v === 'USD' || v === 'XOF') setDeviseEtat(v);
    } catch { /* stockage indisponible : on garde le FCFA */ }

    let vivant = true;
    fetch(`${API_URL.replace(/\/$/, '')}/taux-change`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        if (vivant && d?.xofParEur > 0 && d?.xofParUsd > 0) setTaux({ xofParEur: d.xofParEur, xofParUsd: d.xofParUsd });
      })
      .catch(() => { /* taux de repli */ });
    return () => { vivant = false; };
  }, []);

  const setDevise = useCallback((d: Devise) => {
    setDeviseEtat(d);
    try { localStorage.setItem(CLE_STOCKAGE, d); } catch { /* ignore */ }
  }, []);

  const fmt = useCallback((xof: number) => formaterMontant(xof, devise, taux), [devise, taux]);
  return { devise, setDevise, taux, fmt };
}

/** Trois boutons : FCFA · € · $ */
export function SelecteurDevise({
  devise, onChange, lang = 'fr',
}: { devise: Devise; onChange: (d: Devise) => void; lang?: 'fr' | 'en' }) {
  const options: { code: Devise; label: string }[] = [
    { code: 'XOF', label: 'FCFA' },
    { code: 'EUR', label: '€ EUR' },
    { code: 'USD', label: '$ USD' },
  ];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
      <span style={{ fontSize: 12, opacity: 0.7 }}>{lang === 'fr' ? 'Devise :' : 'Currency:'}</span>
      <div role="group" aria-label={lang === 'fr' ? 'Devise' : 'Currency'} style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid rgba(100,116,139,0.45)', overflow: 'hidden' }}>
        {options.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => onChange(o.code)}
            aria-pressed={devise === o.code}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: devise === o.code ? '#14B8A6' : 'transparent',
              color: devise === o.code ? '#04302C' : 'inherit',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Mention affichée sous les prix convertis. */
export function MentionDevise({ devise, lang = 'fr' }: { devise: Devise; lang?: 'fr' | 'en' }) {
  if (devise === 'XOF') return null;
  return (
    <p style={{ textAlign: 'center', fontSize: 12, opacity: 0.75, margin: '8px 0 0' }}>
      {lang === 'fr'
        ? 'Montants indicatifs. Le paiement se fait en FCFA (1 € = 655,957 FCFA ; le dollar suit le taux du jour).'
        : 'Indicative amounts. Payment is made in FCFA (1 € = 655.957 FCFA; the dollar follows the daily rate).'}
    </p>
  );
}
