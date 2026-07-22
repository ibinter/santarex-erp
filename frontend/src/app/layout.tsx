import type { Metadata, Viewport } from 'next';
import { getLocale, getMessages } from 'next-intl/server';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0D47A1',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <PwaRegister />
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
