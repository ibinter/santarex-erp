'use client';

import { useEffect, useState } from 'react';
import { LogIn, Home } from 'lucide-react';
import StatusScreen from '@/components/StatusScreen';

const DICT = {
  fr: {
    title: 'Session expirée',
    description: "Vous n'êtes pas connecté ou votre session a expiré. Reconnectez-vous pour continuer.",
    reconnect: 'Se reconnecter',
    home: "Page d'accueil",
  },
  en: {
    title: 'Session expired',
    description: 'You are not signed in or your session has expired. Sign in again to continue.',
    reconnect: 'Sign in again',
    home: 'Home page',
  },
};

export default function UnauthorizedPage() {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLocale(m[1] as 'fr' | 'en');
  }, []);
  const t = DICT[locale];

  return (
    <StatusScreen
      code="401"
      title={t.title}
      description={t.description}
      accent="#F59E0B"
      icon="🔒"
      actions={[
        { label: t.reconnect, href: '/login', primary: true, icon: <LogIn size={16} /> },
        { label: t.home, href: '/', icon: <Home size={16} /> },
      ]}
    />
  );
}
