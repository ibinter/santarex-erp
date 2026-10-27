'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

/**
 * Bandeau affiché tant que l'adresse e-mail du compte n'est pas confirmée.
 * Non bloquant : l'utilisateur peut continuer à travailler. Les comptes
 * existants sont marqués « confirmés » par le script SQL de déploiement.
 */
export default function EmailVerifyBanner() {
  const [nonConfirme, setNonConfirme] = useState(false);
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'envoye' | 'erreur'>('repos');

  useEffect(() => {
    apiClient('/auth/email-status')
      .then((r: any) => {
        const d = r?.data ?? r;
        setNonConfirme(d?.verified === false);
      })
      .catch(() => setNonConfirme(false));
  }, []);

  if (!nonConfirme) return null;

  async function renvoyer() {
    setEtat('envoi');
    try {
      await apiClient('/auth/resend-verification', { method: 'POST', body: {} });
      setEtat('envoye');
    } catch {
      setEtat('erreur');
    }
  }

  return (
    <div
      role="status"
      style={{ background: '#FFF8E1', borderBottom: '1px solid #FFE082', padding: '8px 16px', fontSize: 13, color: '#8D6E00', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
    >
      <span>✉️ Confirmez votre adresse e-mail : un lien vous a été envoyé à l&apos;inscription.</span>
      {etat === 'envoye' ? (
        <strong>Nouveau lien envoyé, vérifiez votre boîte (et les courriers indésirables).</strong>
      ) : (
        <button
          onClick={renvoyer}
          disabled={etat === 'envoi'}
          style={{ background: 'none', border: 'none', color: '#1565C0', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 13 }}
        >
          {etat === 'envoi' ? 'Envoi…' : etat === 'erreur' ? 'Échec, réessayer' : 'Renvoyer le lien'}
        </button>
      )}
    </div>
  );
}
