'use client';

import { useEffect, useState } from 'react';

/**
 * Bandeau discret affiché lorsque l'appareil passe hors-ligne.
 * - « Mode hors-ligne — les modifications seront synchronisées ».
 * - Affiche brièvement une confirmation quand la file de mutations a été synchronisée
 *   (message QUEUE_SYNCED envoyé par le service worker).
 * Sûr côté serveur (rien tant que window indisponible) et ne bloque jamais l'UI.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [syncedNote, setSyncedNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => setOffline(!navigator.onLine);
    update();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    // Notification de synchronisation depuis le service worker.
    const onSwMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'QUEUE_SYNCED' && e.data.count > 0) {
        const n = e.data.count as number;
        setSyncedNote(
          `${n} modification${n > 1 ? 's' : ''} synchronisée${n > 1 ? 's' : ''}`
        );
        setTimeout(() => setSyncedNote(null), 4000);
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, []);

  if (!offline && !syncedNote) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9997,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '7px 16px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#fff',
        background: offline ? '#B45309' : '#15803D',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        paddingTop: 'calc(7px + env(safe-area-inset-top))',
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
          background: '#fff',
          flexShrink: 0,
          opacity: 0.9,
        }}
      />
      <span>
        {offline
          ? 'Mode hors-ligne — les modifications seront synchronisées'
          : syncedNote}
      </span>
    </div>
  );
}
