'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, CreditCard, X as XIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PaiementModal from '@/components/facturation/PaiementModal';
import type { StatutFacture, ModePaiement } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_FACTURE = {
  id: 'f1', numero: 'FAC-2025-0412',
  patient: { id: 'p2', ipp: 'IPP-00089', nom: 'TRAORÉ', prenom: 'Ibrahim', dateNaissance: '1972-07-22', sexe: 'M', pays: 'CI' },
  statut: 'partiellement_payee' as StatutFacture,
  tiersPayant: true,
  assuranceNom: 'CNPS',
  assuranceNumero: 'CNP-44521',
  lignes: [
    { id: 'l1', type: 'consultation', libelle: 'Consultation cardiologie', quantite: 1, prixUnitaire: 15000, remise: 0, total: 15000 },
    { id: 'l2', type: 'analyse', libelle: 'Bilan lipidique', quantite: 1, prixUnitaire: 5000, remise: 0, total: 5000 },
    { id: 'l3', type: 'analyse', libelle: 'CRP', quantite: 1, prixUnitaire: 2500, remise: 0, total: 2500 },
    { id: 'l4', type: 'medicament', libelle: 'Amlodipine 5mg x30', quantite: 1, prixUnitaire: 12000, remise: 0, total: 12000 },
    { id: 'l5', type: 'medicament', libelle: 'Atorvastatine 40mg x30', quantite: 1, prixUnitaire: 10500, remise: 0, total: 10500 },
  ],
  sousTotal: 45000, tva: 0, total: 45000,
  partAssurance: 27000, partPatient: 18000, montantPaye: 10000, resteAPayer: 8000,
  dateEmission: '2025-07-09T10:30:00', createdAt: '2025-07-09T10:00:00',
  paiements: [
    { id: 'pay1', reference: 'PAY-2025-0891', date: '2025-07-09T11:00:00', mode: 'especes' as ModePaiement, montant: 5000, statut: 'valide', notes: 'Acompte à l\'admission' },
    { id: 'pay2', reference: 'PAY-2025-0892', date: '2025-07-10T09:30:00', mode: 'mobile_money' as ModePaiement, montant: 5000, statut: 'valide', notes: 'Orange Money — TXN-4521' },
  ],
};

const STATUT_CONFIG: Record<StatutFacture, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }> = {
  brouillon: { label: 'Brouillon', variant: 'neutral' },
  emise: { label: 'Émise', variant: 'info' },
  partiellement_payee: { label: 'Partiellement payée', variant: 'warning' },
  payee: { label: 'Payée', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'danger' },
};

const MODE_LABEL: Record<ModePaiement, string> = {
  especes: 'Espèces',
  carte: 'Carte bancaire',
  mobile_money: 'Mobile Money',
  virement: 'Virement',
  assurance: 'Assurance',
};

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function DetailFacturePage() {
  const router = useRouter();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [facture, setFacture] = useState(MOCK_FACTURE);

  const cfg = STATUT_CONFIG[facture.statut];

  const handlePaiement = (data: { montant: number; mode: ModePaiement; operateur?: string; reference?: string; notes?: string }) => {
    const newPay = {
      id: `pay${Date.now()}`,
      reference: `PAY-2025-${Math.floor(Math.random() * 9000 + 1000)}`,
      date: new Date().toISOString(),
      mode: data.mode,
      montant: data.montant,
      statut: 'valide' as const,
      notes: data.notes || '',
    };
    const newMontantPaye = facture.montantPaye + data.montant;
    const newResteAPayer = Math.max(0, facture.resteAPayer - data.montant);
    setFacture(prev => ({
      ...prev,
      paiements: [...prev.paiements, newPay],
      montantPaye: newMontantPaye,
      resteAPayer: newResteAPayer,
      statut: newResteAPayer === 0 ? 'payee' : 'partiellement_payee',
    }));
    setShowPaiementModal(false);
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
              ← Retour
            </button>
            <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-mono">{facture.numero}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Patient :{' '}
            <button className="text-primary hover:underline font-medium" onClick={() => router.push(`/patients`)}>
              {facture.patient.nom} {facture.patient.prenom}
            </button>
            {' '}({facture.patient.ipp}) · Émise le {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="flex gap-2">
          {facture.statut !== 'annulee' && facture.statut !== 'payee' && (
            <Button variant="ghost" leftIcon={<XIcon size={16} />}
              onClick={() => { if (confirm('Annuler cette facture ?')) setFacture(p => ({ ...p, statut: 'annulee' })); }}>
              Annuler
            </Button>
          )}
          <Button variant="secondary" leftIcon={<Printer size={16} />} onClick={() => alert('Impression...')}>
            Imprimer
          </Button>
        </div>
      </div>

      {/* Assurance */}
      {facture.tiersPayant && (
        <div className="bg-teal-50 border border-teal-200 rounded-card p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="font-medium text-teal-800">Tiers-payant : {facture.assuranceNom}</p>
            <p className="text-sm text-teal-700">N° {facture.assuranceNumero} · Part assurance : {formatXOF(facture.partAssurance)} (60%)</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Lignes */}
          <div className="bg-white border border-border rounded-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Libellé</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Qté</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Prix unit.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Remise</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {facture.lignes.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-text-primary">{l.libelle}</p>
                      <p className="text-xs text-text-secondary capitalize">{l.type.replace('_', ' ')}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary">{l.quantite}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatXOF(l.prixUnitaire)}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">{l.remise > 0 ? `${l.remise}%` : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">{formatXOF(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paiements reçus */}
          <div className="bg-white border border-border rounded-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">Paiements reçus</h2>
              {facture.resteAPayer > 0 && facture.statut !== 'annulee' && (
                <Button leftIcon={<CreditCard size={16} />} onClick={() => setShowPaiementModal(true)}>
                  Enregistrer un paiement
                </Button>
              )}
            </div>
            {facture.paiements.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">Aucun paiement enregistré</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left pb-2 text-xs font-semibold text-text-secondary">Date</th>
                    <th className="text-left pb-2 text-xs font-semibold text-text-secondary">Référence</th>
                    <th className="text-left pb-2 text-xs font-semibold text-text-secondary">Mode</th>
                    <th className="text-right pb-2 text-xs font-semibold text-text-secondary">Montant</th>
                    <th className="text-center pb-2 text-xs font-semibold text-text-secondary">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {facture.paiements.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50">
                      <td className="py-2 text-text-secondary">{new Date(pay.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-2 font-mono text-xs text-text-primary">{pay.reference}</td>
                      <td className="py-2 text-text-secondary">{MODE_LABEL[pay.mode]}</td>
                      <td className="py-2 text-right font-medium text-success">{formatXOF(pay.montant)}</td>
                      <td className="py-2 text-center">
                        <Badge variant="success" dot>Validé</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Récapitulatif financier */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-card p-5 sticky top-4">
            <h2 className="text-base font-semibold text-text-primary mb-4">Récapitulatif financier</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Sous-total HT</span>
                <span>{formatXOF(facture.sousTotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>TVA (0%)</span>
                <span>{formatXOF(facture.tva)}</span>
              </div>
              <div className="flex justify-between font-bold text-text-primary border-t border-border pt-2">
                <span>Total TTC</span>
                <span>{formatXOF(facture.total)}</span>
              </div>
              {facture.tiersPayant && (
                <div className="flex justify-between text-teal-700">
                  <span>Part assurance</span>
                  <span>{formatXOF(facture.partAssurance)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold" style={{ color: '#0D47A1' }}>
                <span>Part patient</span>
                <span>{formatXOF(facture.partPatient)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Déjà payé</span>
                <span>{formatXOF(facture.montantPaye)}</span>
              </div>
              <div className={`flex justify-between font-bold text-lg border-t border-border pt-2 ${facture.resteAPayer > 0 ? 'text-danger' : 'text-success'}`}>
                <span>Reste à payer</span>
                <span>{formatXOF(facture.resteAPayer)}</span>
              </div>
            </div>
            {facture.resteAPayer > 0 && facture.statut !== 'annulee' && (
              <Button className="w-full mt-4" leftIcon={<CreditCard size={16} />} onClick={() => setShowPaiementModal(true)}>
                Enregistrer un paiement
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal paiement */}
      <PaiementModal
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        resteAPayer={facture.resteAPayer}
        factureNumero={facture.numero}
        onSave={handlePaiement}
      />
    </div>
  );
}
