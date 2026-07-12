import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Confirmation de paiement — SANTAREX ERP',
};

export default function PaiementRetourPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h1>
            <p className="text-gray-500 mb-1">Votre abonnement SANTAREX ERP a été activé.</p>
            {reference && <p className="text-xs text-gray-400 mb-6">Référence : {reference}</p>}
            <p className="text-sm text-gray-500 mb-8">Un email de confirmation vous a été envoyé. Votre licence est maintenant active.</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
            >
              Accéder à mon espace
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FFEBEE' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement échoué</h1>
            <p className="text-gray-500 mb-6">Le paiement n'a pas pu être traité. Aucun montant n'a été débité.</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#0D47A1' }}
            >
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
