'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[SANTAREX] Application error:', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D1B2A 0%, #1A2F45 100%)', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(198,40,40,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <AlertTriangle size={40} color="#EF5350" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Une erreur s'est produite</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', lineHeight: 1.6 }}>
          Une erreur inattendue s'est produite. Notre équipe technique en a été informée.
          {error?.digest && <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Code: {error.digest}</span>}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#1976D2', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            <RefreshCw size={16} /> Réessayer
          </button>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}
