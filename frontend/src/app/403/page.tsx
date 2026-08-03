'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StatusScreen from '@/components/StatusScreen';

const DICT = {
  fr: {
    title: 'Accès refusé',
    description: "Votre rôle ne vous autorise pas à accéder à cette ressource. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.",
    back: 'Retour',
    dashboard: 'Tableau de bord',
  },
  en: {
    title: 'Access denied',
    description: 'Your role does not allow you to access this resource. Contact an administrator if you believe this is a mistake.',
    back: 'Back',
    dashboard: 'Dashboard',
  },
};

export default function ForbiddenPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLocale(m[1] as 'fr' | 'en');
  }, []);
  const t = DICT[locale];

  return (
    <StatusScreen
      code="403"
      title={t.title}
      description={t.description}
      accent="#EF4444"
      icon="⛔"
      actions={[
        { label: t.back, onClick: () => router.back(), icon: <ArrowLeft size={16} /> },
        { label: t.dashboard, href: '/dashboard', primary: true, icon: <Home size={16} /> },
      ]}
    />
  );
}
