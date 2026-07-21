import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'SANTAREX ERP — Gestion Hospitalière',
  description: 'La technologie au service de la santé — IBIG SOFT',
  icons: {
    icon: [
      { url: '/favicon-32-tr.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32-tr.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon-32-tr.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
