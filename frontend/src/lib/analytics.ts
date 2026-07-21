/**
 * Analytics léger — fire-and-forget.
 *
 * `track(event, props?)` envoie un événement anonyme vers
 * `POST {NEXT_PUBLIC_API_URL}/analytics/event`. L'appel ne bloque JAMAIS l'UI :
 * toute erreur (réseau, endpoint absent, etc.) est silencieusement ignorée.
 */

import { API_URL } from './api';

export type AnalyticsProps = Record<string, unknown>;

/**
 * Enregistre un événement analytics. Ne renvoie rien d'exploitable et
 * n'échoue jamais de manière visible.
 */
export function track(event: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify({
    event,
    props: props ?? undefined,
    path: window.location?.pathname ?? undefined,
    referrer: document.referrer || undefined,
  });

  try {
    // sendBeacon survit à la navigation (clic sortant, changement de page)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      const ok = navigator.sendBeacon(`${API_URL}/analytics/event`, blob);
      if (ok) return;
    }
  } catch {
    /* on retombe sur fetch ci-dessous */
  }

  try {
    void fetch(`${API_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* silence total : le tracking ne doit jamais casser l'UI */
  }
}
