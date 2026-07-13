'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: '#E0E0E0', lineHeight: 1, marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>404</div>
      <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#1A2332' }}>Page introuvable</h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#546E7A', maxWidth: 360, lineHeight: 1.6 }}>
        La page que vous cherchez n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez au tableau de bord.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <button onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700 }}>
          <Home size={14} /> Tableau de bord
        </button>
      </div>
    </div>
  );
}
