'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import StatusScreen from '@/components/StatusScreen';

export default function OfflinePage() {
  const [online, setOnline] = useState(false);

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

  return (
    <StatusScreen
      code="Hors ligne"
      title="Connexion internet indisponible"
      description={
        online
          ? 'La connexion semble rétablie. Vous pouvez recharger la page.'
          : "Vous n'êtes plus connecté au réseau. Certaines fonctionnalités sont indisponibles tant que la connexion n'est pas rétablie."
      }
      accent="#546E7A"
      icon={<WifiOff size={32} color="#fff" />}
      actions={[
        {
          label: 'Recharger',
          onClick: () => window.location.reload(),
          primary: true,
          icon: <RefreshCw size={16} />,
        },
      ]}
    />
  );
}
