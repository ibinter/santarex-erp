'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import StatusScreen from '@/components/StatusScreen';

const DICT = {
  fr: {
    code: 'Hors ligne',
    title: 'Connexion internet indisponible',
    restored: 'La connexion semble rétablie. Vous pouvez recharger la page.',
    offline: "Vous n'êtes plus connecté au réseau. Certaines fonctionnalités sont indisponibles tant que la connexion n'est pas rétablie.",
    reload: 'Recharger',
  },
  en: {
    code: 'Offline',
    title: 'No internet connection',
    restored: 'The connection appears to be back. You can reload the page.',
    offline: 'You are no longer connected to the network. Some features are unavailable until the connection is restored.',
    reload: 'Reload',
  },
};

export default function OfflinePage() {
  const [online, setOnline] = useState(false);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLocale(m[1] as 'fr' | 'en');
  }, []);

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== 'undefined' && navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const t = DICT[locale];

  return (
    <StatusScreen
      code={t.code}
      title={t.title}
      description={online ? t.restored : t.offline}
      accent="#546E7A"
      icon={<WifiOff size={32} color="#fff" />}
      actions={[
        {
          label: t.reload,
          onClick: () => window.location.reload(),
          primary: true,
          icon: <RefreshCw size={16} />,
        },
      ]}
    />
  );
}
