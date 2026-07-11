'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Medicament } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  medicamentId?: string;
  medicaments: Medicament[];
  onSave: (data: {
    medicamentId: string;
    numeroLot: string;
    datePeremption: string;
    quantite: number;
    fournisseur: string;
    prixAchatUnitaire: number;
    localisation: string;
  }) => void;
}

export default function EntreeStockModal({ isOpen, onClose, medicamentId, medicaments, onSave }: Props) {
  const [form, setForm] = useState({
    medicamentId: medicamentId || '',
    numeroLot: '',
    datePeremption: '',
    quantite: '',
    fournisseur: '',
    prixAchatUnitaire: '',
    localisation: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (medicamentId) setForm(f => ({ ...f, medicamentId }));
  }, [medicamentId]);

  useEffect(() => {
    if (!isOpen) {
      setForm({ medicamentId: medicamentId || '', numeroLot: '', datePeremption: '', quantite: '', fournisseur: '', prixAchatUnitaire: '', localisation: '' });
    }
  }, [isOpen]);

  const selectedMed = medicaments.find(m => m.id === form.medicamentId);

  const handleSubmit = async () => {
    if (!form.medicamentId || !form.numeroLot || !form.datePeremption || !form.quantite) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave({
      medicamentId: form.medicamentId,
      numeroLot: form.numeroLot,
      datePeremption: form.datePeremption,
      quantite: Number(form.quantite),
      fournisseur: form.fournisseur,
      prixAchatUnitaire: Number(form.prixAchatUnitaire),
      localisation: form.localisation,
    });
    setLoading(false);
  };

  const isValid = form.medicamentId && form.numeroLot && form.datePeremption && Number(form.quantite) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Entrée de stock"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!isValid}>
            Enregistrer l'entrée
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Sélection médicament */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Médicament <span className="text-danger">*</span>
          </label>
          <select
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.medicamentId}
            onChange={e => setForm(f => ({ ...f, medicamentId: e.target.value }))}
          >
            <option value="">Sélectionner un médicament...</option>
            {medicaments.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.nom} ({m.dosage})
              </option>
            ))}
          </select>
          {selectedMed && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs">
              <span className="font-medium">{selectedMed.nom}</span>
              <span className="text-text-secondary ml-2">Stock actuel : {selectedMed.stockActuel} {selectedMed.unite}s</span>
              <span className="text-text-secondary ml-2">Stock min : {selectedMed.stockMinimum}</span>
            </div>
          )}
        </div>

        {/* Lot + Péremption */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Numéro de lot *"
            placeholder="Ex: LOT-2024-001"
            value={form.numeroLot}
            onChange={e => setForm(f => ({ ...f, numeroLot: e.target.value }))}
          />
          <Input
            label="Date de péremption *"
            type="date"
            value={form.datePeremption}
            onChange={e => setForm(f => ({ ...f, datePeremption: e.target.value }))}
          />
        </div>

        {/* Quantité + Prix */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantité reçue *"
            type="number"
            min="1"
            placeholder="0"
            value={form.quantite}
            onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Prix achat unitaire</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="0"
                className="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.prixAchatUnitaire}
                onChange={e => setForm(f => ({ ...f, prixAchatUnitaire: e.target.value }))}
              />
              <span className="text-xs text-text-secondary font-medium flex-shrink-0">XOF</span>
            </div>
          </div>
        </div>

        {/* Fournisseur */}
        <Input
          label="Fournisseur"
          placeholder="Nom du fournisseur..."
          value={form.fournisseur}
          onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))}
        />

        {/* Localisation */}
        <Input
          label="Localisation en pharmacie (optionnel)"
          placeholder="Ex: Étagère B2, Réfrigérateur 1..."
          value={form.localisation}
          onChange={e => setForm(f => ({ ...f, localisation: e.target.value }))}
        />

        {/* Résumé */}
        {selectedMed && form.quantite && Number(form.quantite) > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <p className="font-semibold text-green-800 mb-1">Résumé de l'entrée</p>
            <p className="text-green-700">
              <span className="font-medium">+{form.quantite}</span> {selectedMed.unite}s de <span className="font-medium">{selectedMed.nom}</span>
            </p>
            <p className="text-green-600 text-xs mt-0.5">
              Nouveau stock estimé : {selectedMed.stockActuel + Number(form.quantite)} {selectedMed.unite}s
              {Number(form.prixAchatUnitaire) > 0 && ` • Coût total : ${(Number(form.quantite) * Number(form.prixAchatUnitaire)).toLocaleString('fr-FR')} XOF`}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
