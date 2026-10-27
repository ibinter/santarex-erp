'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { API_URL } from '@/lib/api';

type Etat = 'attente' | 'ok' | 'erreur';

function ConfirmerEmail() {
  const token = useSearchParams().get('token') ?? '';
  const [etat, setEtat] = useState<Etat>(token ? 'attente' : 'erreur');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => setEtat(r.ok ? 'ok' : 'erreur'))
      .catch(() => setEtat('erreur'));
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-tr.png" alt="SANTAREX ERP" className="h-28 w-auto mx-auto mb-2 object-contain" />
        </div>
        <div className="bg-white rounded-card shadow-card p-8 text-center">
          {etat === 'attente' && (
            <>
              <span className="inline-block w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-text-secondary">Confirmation en cours…</p>
            </>
          )}
          {etat === 'ok' && (
            <>
              <div className="flex justify-center mb-4"><CheckCircle2 size={48} className="text-emerald-500" /></div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Adresse e-mail confirmée</h2>
              <p className="text-sm text-text-secondary mb-6">Merci, votre compte est maintenant vérifié.</p>
              <Link href="/login" className="btn-primary w-full py-2.5 flex items-center justify-center">Se connecter</Link>
            </>
          )}
          {etat === 'erreur' && (
            <>
              <div className="flex justify-center mb-4"><XCircle size={48} className="text-danger" /></div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Lien invalide ou expiré</h2>
              <p className="text-sm text-text-secondary mb-6">
                Connectez-vous : un bandeau vous permettra de recevoir un nouveau lien de confirmation.
              </p>
              <Link href="/login" className="btn-primary w-full py-2.5 flex items-center justify-center">Se connecter</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmerEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmerEmail />
    </Suspense>
  );
}
