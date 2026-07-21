'use client';

import { LogIn, Home } from 'lucide-react';
import StatusScreen from '@/components/StatusScreen';

export default function UnauthorizedPage() {
  return (
    <StatusScreen
      code="401"
      title="Session expirée"
      description="Vous n'êtes pas connecté ou votre session a expiré. Reconnectez-vous pour continuer."
      accent="#F59E0B"
      icon="🔒"
      actions={[
        { label: 'Se reconnecter', href: '/login', primary: true, icon: <LogIn size={16} /> },
        { label: "Page d'accueil", href: '/', icon: <Home size={16} /> },
      ]}
    />
  );
}
