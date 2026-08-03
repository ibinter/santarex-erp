'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, LifeBuoy } from 'lucide-react';

const DICT = {
  fr: {
    title: "Une erreur s'est produite",
    description: 'Une erreur inattendue a interrompu cette page. Vous pouvez réessayer ou créer un ticket support en conservant la référence ci-dessous.',
    ref: 'Réf.',
    retry: 'Réessayer',
    dashboard: 'Tableau de bord',
    ticket: 'Créer un ticket',
  },
  en: {
    title: 'An error occurred',
    description: 'An unexpected error interrupted this page. You can try again or create a support ticket keeping the reference below.',
    ref: 'Ref.',
    retry: 'Try again',
    dashboard: 'Dashboard',
    ticket: 'Create a ticket',
  },
};

/**
 * Frontière d'erreur du périmètre (dashboard). Capture les erreurs de rendu
 * des pages métier sans faire tomber toute l'application, et propose de créer
 * un ticket support pré-rempli avec la référence de l'incident.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLocale(m[1] as 'fr' | 'en');
  }, []);
  const t = DICT[locale];

  useEffect(() => {
    console.error('[SANTAREX] Dashboard error:', error);
  }, [error]);

  const ref = error?.digest || `ERR-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'rgba(239,68,68,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <AlertTriangle size={34} color="#EF4444" />
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1A2332' }}>
        {t.title}
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#546E7A', maxWidth: 380, lineHeight: 1.6 }}>
        {t.description}
      </p>

      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#78909C',
          background: '#ECEFF1',
          padding: '6px 12px',
          borderRadius: 8,
          marginBottom: 28,
        }}
      >
        {t.ref} : {ref}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 18px',
            borderRadius: 9,
            border: '1px solid #E0E0E0',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: '#546E7A',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={14} /> {t.retry}
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 18px',
            borderRadius: 9,
            border: '1px solid #E0E0E0',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            color: '#546E7A',
            fontWeight: 600,
          }}
        >
          <Home size={14} /> {t.dashboard}
        </button>
        <button
          onClick={() => router.push(`/support?ref=${encodeURIComponent(ref)}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '10px 20px',
            borderRadius: 9,
            background: '#1565C0',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: '#fff',
            fontWeight: 700,
          }}
        >
          <LifeBuoy size={14} /> {t.ticket}
        </button>
      </div>
    </div>
  );
}
