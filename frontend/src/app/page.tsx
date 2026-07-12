import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'SANTAREX ERP — Logiciel de Gestion Hospitalière pour l\'Afrique',
  description: 'SANTAREX ERP est le logiciel SaaS de gestion hospitalière conçu pour les établissements de santé africains. Patients, consultations, pharmacie, facturation, laboratoire — tout en un.',
  openGraph: {
    title: 'SANTAREX ERP — Gestion hospitalière intelligente',
    description: 'La solution SaaS complète pour cliniques, hôpitaux et cabinets médicaux en Afrique.',
    url: 'https://santarex.ibigsoft.com',
    siteName: 'SANTAREX ERP',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SANTAREX ERP',
    description: 'Gestion hospitalière SaaS pour l\'Afrique',
  },
  alternates: { canonical: 'https://santarex.ibigsoft.com' },
};

export default function Page() {
  return <LandingPage />;
}
