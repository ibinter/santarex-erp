'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'santarex_pwa_install_dismissed';
const SEEN_KEY = 'santarex_pwa_install_seen';

/**
 * Bannière d'installation PWA pour l'espace interne (dashboard).
 * - Capte `beforeinstallprompt`, l'affiche après quelques secondes (et surtout
 *   à partir de la 2e visite) pour ne pas être intrusif.
 * - Boutons : Installer / Plus tard / Ne plus afficher (mémorisé en localStorage).
 * - Astuce iOS (Partager → Ajouter à l'écran d'accueil) si iOS détecté.
 * La landing possède sa propre bannière : ce composant est monté uniquement
 * dans le layout (dashboard).
 */
export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Déjà refusé définitivement
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    // Déjà installé (mode standalone) → ne rien afficher
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Détection iOS (pas de beforeinstallprompt sur iOS)
    const ua = window.navigator.userAgent || '';
    const iOS = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    setIsIos(iOS);

    // Compteur de visites (affichage plutôt à la 2e visite)
    const seen = Number(localStorage.getItem(SEEN_KEY) || '0') + 1;
    localStorage.setItem(SEEN_KEY, String(seen));

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const delay = seen >= 2 ? 4000 : 12000;
      timer = setTimeout(() => setVisible(true), delay);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS : pas d'événement natif → afficher l'astuce (dès la 2e visite)
    if (iOS && isSafari && seen >= 2) {
      timer = setTimeout(() => setVisible(true), 6000);
    }

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (_e) {
      /* ignore */
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleLater = () => {
    setVisible(false);
  };

  const handleNever = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application SANTAREX"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '84px',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        width: 'calc(100vw - 32px)',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(13,71,161,0.18)',
        border: '1px solid #E3ECF7',
        padding: '16px',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <img
          src="/logo-icon-tr.png"
          alt="SANTAREX"
          width={40}
          height={40}
          style={{ borderRadius: '10px', flexShrink: 0 }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1A2332' }}>
            Installer SANTAREX
          </div>
          <div style={{ fontSize: '12px', color: '#546E7A' }}>
            Accès rapide, plein écran et hors ligne
          </div>
        </div>
      </div>

      {isIos ? (
        <p style={{ fontSize: '13px', color: '#546E7A', lineHeight: 1.5, margin: '4px 0 12px' }}>
          Sur iPhone / iPad : appuyez sur <strong>Partager</strong> puis{' '}
          <strong>« Ajouter à l&apos;écran d&apos;accueil »</strong>.
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: '#546E7A', lineHeight: 1.5, margin: '4px 0 12px' }}>
          Installez l&apos;application pour un accès plus rapide depuis votre écran d&apos;accueil.
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstall}
            style={{
              flex: '1 1 auto',
              background: '#0D47A1',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Installer
          </button>
        )}
        <button
          onClick={handleLater}
          style={{
            flex: isIos ? '1 1 auto' : '0 0 auto',
            background: '#F5F7FA',
            color: '#546E7A',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Plus tard
        </button>
        <button
          onClick={handleNever}
          style={{
            flex: '0 0 auto',
            background: 'transparent',
            color: '#90A4AE',
            border: 'none',
            padding: '10px 8px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Ne plus afficher
        </button>
      </div>
    </div>
  );
}
