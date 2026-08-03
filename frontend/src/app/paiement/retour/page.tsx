import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Confirmation de paiement — SANTAREX ERP',
};

const DICT = {
  fr: {
    successTitle: 'Paiement confirmé !',
    successLead: 'Votre abonnement SANTAREX ERP a été activé.',
    reference: 'Référence',
    successNote: 'Un email de confirmation vous a été envoyé. Votre licence est maintenant active.',
    successCta: 'Accéder à mon espace',
    failTitle: 'Paiement échoué',
    failLead: "Le paiement n'a pas pu être traité. Aucun montant n'a été débité.",
    failCta: "Retour à l'accueil",
  },
  en: {
    successTitle: 'Payment confirmed!',
    successLead: 'Your SANTAREX ERP subscription has been activated.',
    reference: 'Reference',
    successNote: 'A confirmation email has been sent to you. Your license is now active.',
    successCta: 'Go to my workspace',
    failTitle: 'Payment failed',
    failLead: 'The payment could not be processed. No amount has been charged.',
    failCta: 'Back to home',
  },
};

export default function PaiementRetourPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const localeCookie = cookies().get('NEXT_LOCALE')?.value;
  const locale: 'fr' | 'en' = localeCookie === 'en' ? 'en' : 'fr';
  const t = DICT[locale];

  const succes = searchParams['status'] !== 'REFUSED' && searchParams['status'] !== 'CANCELLED';
  const reference = searchParams['transaction_id'] ?? searchParams['order_id'] ?? '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {succes ? (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8F5E9' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h1>
            <p className="text-gray-500 mb-1">{t.successLead}</p>
            {reference && <p className="text-xs text-gray-400 mb-6">{t.reference} : {reference}</p>}
            <p className="text-sm text-gray-500 mb-8">{t.successNote}</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
            >
              {t.successCta}
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFEBEE' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.failTitle}</h1>
            <p className="text-gray-500 mb-6">{t.failLead}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#0D47A1' }}
            >
              {t.failCta}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
