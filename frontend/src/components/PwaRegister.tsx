'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

/**
 * Enregistre le service worker (/sw.js) au montage et gère les mises à jour.
 * Quand une nouvelle version du SW est installée et en attente, affiche un
 * bandeau « Nouvelle version disponible — Recharger ».
 * Comportement transparent si le réseau est OK ou si le SW n'est pas supporté.
 */
export default function PwaRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const promptUpdate = (worker: ServiceWorker) => {
      setWaitingWorker(worker);
      setShowReload(true);
    };

    // Transmet l'origine de l'API au SW pour le cache offline & la file de mutations.
    let apiOrigin = '';
    try {
      apiOrigin = new URL(API_URL, window.location.origin).origin;
    } catch {
      apiOrigin = '';
    }
    const swUrl = apiOrigin
      ? `/sw.js?apiOrigin=${encodeURIComponent(apiOrigin)}`
      : '/sw.js';

    // Rejoue la file de mutations hors-ligne au retour du réseau.
    const triggerReplay = () => {
      navigator.serviceWorker.ready
        .then((r) => r.active?.postMessage({ type: 'REPLAY_QUEUE' }))
        .catch(() => undefined);
    };
    window.addEventListener('online', triggerReplay);

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(swUrl);
        // Si on est déjà en ligne, tente de vider une file éventuelle laissée par une session précédente.
        if (navigator.onLine) triggerReplay();

        // Un SW est déjà en attente (nouvelle version prête)
        if (reg.waiting && navigator.serviceWorker.controller) {
          promptUpdate(reg.waiting);
        }

        // Une nouvelle version est en cours d'installation
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(installing);
            }
          });
        });
      } catch (_err) {
        // Silencieux : l'app doit rester fonctionnelle même si l'enregistrement échoue
      }
    };

    // Recharge automatique une fois le nouveau SW pris le contrôle
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Enregistre après le load pour ne pas concurrencer le rendu initial
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('online', triggerReplay);
    };
  }, []);

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
    setShowReload(false);
  };

  if (!showReload) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '20px',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#1A2332',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
        fontSize: '14px',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span style={{ fontWeight: 500 }}>Nouvelle version disponible</span>
      <button
        onClick={handleReload}
        style={{
          background: '#0D47A1',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Recharger
      </button>
      <button
        onClick={() => setShowReload(false)}
        aria-label="Fermer"
        style={{
          background: 'transparent',
          color: '#90A4AE',
          border: 'none',
          fontSize: '18px',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '0 4px',
        }}
      >
        ×
      </button>
    </div>
  );
}
