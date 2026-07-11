'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { ModePaiement } from '@/types';

interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  resteAPayer: number;
  factureNumero: string;
  onSave: (data: {
    montant: number;
    mode: ModePaiement;
    operateur?: string;
    reference?: string;
    notes?: string;
  }) => void;
}

const MODES: { value: ModePaiement; label: string; emoji: string }[] = [
  { value: 'especes', label: 'Espèces', emoji: '💵' },
  { value: 'carte', label: 'Carte bancaire', emoji: '💳' },
  { value: 'mobile_money', label: 'Mobile Money', emoji: '📱' },
  { value: 'virement', label: 'Virement', emoji: '🏦' },
  { value: 'assurance', label: 'Assurance (tiers-payant)', emoji: '🏥' },
];

const OPERATEURS_MOBILE = ['Orange Money', 'MTN MoMo', 'Moov Money', 'Wave'];

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function PaiementModal({ isOpen, onClose, resteAPayer, factureNumero, onSave }: PaiementModalProps) {
  const [mode, setMode] = useState<ModePaiement>('especes');
  const [montant, setMontant] = useState(resteAPayer);
  const [operateur, setOperateur] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleValidate = () => {
    if (!montant || montant <= 0) return alert('Veuillez saisir un montant valide.');
    if (mode === 'mobile_money' && !operateur) return alert('Veuillez sélectionner un opérateur.');
    onSave({ montant, mode, operateur: mode === 'mobile_money' ? operateur : undefined, reference: reference || undefined, notes: notes || undefined });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enregistrer un paiement — ${factureNumero}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleValidate}>Valider le paiement</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Reste à payer */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <p className="text-xs text-text-secondary">Reste à payer</p>
          <p className="text-2xl font-bold" style={{ color: '#0D47A1' }}>{formatXOF(resteAPayer)}</p>
        </div>

        {/* Mode de paiement */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Mode de paiement</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MODES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  mode === m.value
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-border hover:border-primary/40 text-text-secondary'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-center leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Opérateur mobile money */}
        {mode === 'mobile_money' && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Opérateur Mobile Money *</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={operateur}
              onChange={e => setOperateur(e.target.value)}
            >
              <option value="">Sélectionner un opérateur...</option>
              {OPERATEURS_MOBILE.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
        )}

        {/* Montant */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Montant payé (XOF) *</label>
          <input
            type="number"
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={montant}
            onChange={e => setMontant(parseFloat(e.target.value) || 0)}
            min="1"
          />
          {montant < resteAPayer && (
            <p className="mt-1 text-xs text-warning">Paiement partiel — reste {formatXOF(resteAPayer - montant)} à payer</p>
          )}
        </div>

        {/* Référence transaction */}
        {(mode === 'mobile_money' || mode === 'virement' || mode === 'carte') && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Référence transaction {mode === 'mobile_money' ? '*' : '(optionnel)'}
            </label>
            <input
              type="text"
              placeholder="Ex: TXN-4521..."
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Notes (optionnel)</label>
          <textarea
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows={2}
            placeholder="Commentaire sur ce paiement..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
