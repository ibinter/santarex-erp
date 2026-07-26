'use client';

/**
 * « Quoi de neuf » — modale affichée sur le dashboard quand une nouvelle version
 * publiée (GET /changelog/derniere) est plus récente que celle déjà vue par
 * l'utilisateur (localStorage `santarex_version_vue`). Bouton « Compris » qui
 * mémorise la version pour ne pas la réafficher.
 *
 * MONTAGE : à monter dans le layout dashboard —
 *   frontend/src/app/(dashboard)/layout.tsx, à l'intérieur de <main>, juste
 *   après `<div style={{ flex: 1 }}>{children}</div>` (ou n'importe où dans le
 *   rendu de la page authentifiée). Composant client autonome, sans prop.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sparkles, X } from 'lucide-react';
import { apiClient } from '@/lib/api';

const STORAGE_KEY = 'santarex_version_vue';

type Nouveaute = { texte: string; formuleMin?: string };
type Version = {
  version: string;
  titre: string;
  datePublication?: string;
  nouveautesJson?: Nouveaute[];
  estMajeure?: boolean;
};

/** Compare deux versions sémantiques. > 0 si a plus récente que b. */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function unwrap<T>(r: any): T | null {
  return (r?.data ?? r ?? null) as T | null;
}

export default function QuoiDeNeuf() {
  const t = useTranslations('quoiDeNeuf');
  const [version, setVersion] = useState<Version | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient<any>('/changelog/derniere');
        const v = unwrap<Version>(res);
        if (!v || !v.version || cancelled) return;
        const vue = typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEY)
          : null;
        // Affiche si aucune version vue, ou si la dernière est plus récente.
        if (!vue || compareSemver(v.version, vue) > 0) {
          setVersion(v);
          setOpen(true);
        }
      } catch {
        /* endpoint indisponible → on n'affiche rien. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const compris = () => {
    if (version) {
      try {
        localStorage.setItem(STORAGE_KEY, version.version);
      } catch {
        /* stockage indisponible → on ferme quand même. */
      }
    }
    setOpen(false);
  };

  if (!open || !version) return null;

  const nouveautes = version.nouveautesJson ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={compris}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0B7285 0%, #12A594 100%)',
            color: '#fff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{t('title')}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {t('version', { version: version.version })}
              </div>
            </div>
          </div>
          <button
            onClick={compris}
            aria-label={t('close')}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 16, color: '#1A2332', fontWeight: 700 }}>
            {version.titre}
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nouveautes.map((n, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span
                  style={{
                    marginTop: 6,
                    flexShrink: 0,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#12A594',
                  }}
                />
                <span style={{ fontSize: 14, color: '#37474F', lineHeight: 1.5 }}>
                  {n.texte}
                  {n.formuleMin && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#0B7285',
                        background: '#E6FCF5',
                        borderRadius: 6,
                        padding: '2px 6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('formuleMin', { formule: n.formuleMin })}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pied */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #F5F7FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Link
            href="/changelog"
            onClick={compris}
            style={{ fontSize: 13, color: '#0B7285', fontWeight: 600, textDecoration: 'none' }}
          >
            {t('voirChangelog')}
          </Link>
          <button
            onClick={compris}
            style={{
              border: 'none',
              background: '#12A594',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              borderRadius: 10,
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            {t('compris')}
          </button>
        </div>
      </div>
    </div>
  );
}
