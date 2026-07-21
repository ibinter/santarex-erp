'use client';

import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StatusScreen from '@/components/StatusScreen';

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <StatusScreen
      code="403"
      title="Accès refusé"
      description="Votre rôle ne vous autorise pas à accéder à cette ressource. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
      accent="#EF4444"
      icon="⛔"
      actions={[
        { label: 'Retour', onClick: () => router.back(), icon: <ArrowLeft size={16} /> },
        { label: 'Tableau de bord', href: '/dashboard', primary: true, icon: <Home size={16} /> },
      ]}
    />
  );
}
