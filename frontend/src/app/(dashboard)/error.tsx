'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, LifeBuoy } from 'lucide-react';

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
        Une erreur s&apos;est produite
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: '#546E7A', maxWidth: 380, lineHeight: 1.6 }}>
        Une erreur inattendue a interrompu cette page. Vous pouvez réessayer ou créer un ticket
        support en conservant la référence ci-dessous.
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
        Réf. : {ref}
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
          <RefreshCw size={14} /> Réessayer
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
          <Home size={14} /> Tableau de bord
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
          <LifeBuoy size={14} /> Créer un ticket
        </button>
      </div>
    </div>
  );
}
