'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2, Save, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Patient, TypeLigneFacture } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', ipp: 'IPP-00145', nom: 'KOUASSI', prenom: 'Adjoua Marie', dateNaissance: '1985-03-12', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
  { id: 'p2', ipp: 'IPP-00089', nom: 'TRAORÉ', prenom: 'Ibrahim', dateNaissance: '1972-07-22', sexe: 'M', pays: 'CI', assuranceTiersPayant: true, assuranceNom: 'CNPS', assuranceNumero: 'CNP-44521', statut: 'actif', createdAt: '' },
  { id: 'p3', ipp: 'IPP-00213', nom: 'KONÉ', prenom: 'Fatoumata', dateNaissance: '1990-11-05', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
];

const TYPES_LIGNES: { value: TypeLigneFacture; label: string }[] = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'medicament', label: 'Médicament' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'acte_chirurgical', label: 'Acte chirurgical' },
  { value: 'hospitalisation', label: 'Hospitalisation' },
  { value: 'materiel', label: 'Matériel médical' },
  { value: 'autre', label: 'Autre' },
];

interface LigneForm {
  id: string;
  type: TypeLigneFacture;
  libelle: string;
  quantite: number;
  prixUnitaire: number;
  remise: number;
}

function newLigne(): LigneForm {
  return { id: `l${Date.now()}`, type: 'consultation', libelle: '', quantite: 1, prixUnitaire: 0, remise: 0 };
}

function calcTotal(l: LigneForm) {
  return l.quantite * l.prixUnitaire * (1 - l.remise / 100);
}

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function NouvelleFacturePage() {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tiersPayant, setTiersPayant] = useState(false);
  const [lignes, setLignes] = useState<LigneForm[]>([newLigne()]);

  const suggestions = MOCK_PATIENTS.filter(p =>
    patientSearch.length >= 2 &&
    (`${p.nom} ${p.prenom}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.ipp.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const updateLigne = (id: string, field: keyof LigneForm, value: string | number) => {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLigne = (id: string) => setLignes(prev => prev.filter(l => l.id !== id));

  const sousTotal = lignes.reduce((acc, l) => acc + calcTotal(l), 0);
  const tva = 0; // santé = 0%
  const total = sousTotal + tva;
  const partAssurance = tiersPayant && selectedPatient?.assuranceTiersPayant ? total * 0.6 : 0;
  const partPatient = total - partAssurance;

  const handleSubmit = (emit: boolean) => {
    if (!selectedPatient) return alert('Veuillez sélectionner un patient.');
    if (lignes.every(l => !l.libelle)) return alert('Veuillez saisir au moins une ligne de facturation.');
    alert(`Facture ${emit ? 'émise' : 'enregistrée en brouillon'} pour ${selectedPatient.nom} ${selectedPatient.prenom}`);
    router.push('/facturation');
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
          ← Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nouvelle facture</h1>
          <p className="text-sm text-text-secondary">Créer une nouvelle facture patient</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section Patient */}
          <div className="bg-white border border-border rounded-card p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
              Patient
            </h2>
            <div className="relative">
              <Input
                label="Rechercher patient"
                placeholder="Nom, prénom ou IPP..."
                value={selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom} — ${selectedPatient.ipp}` : patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); setShowSuggestions(true); setTiersPayant(false); }}
                onFocus={() => setShowSuggestions(true)}
                leftIcon={<Search size={16} />}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg">
                  {suggestions.map(p => (
                    <button key={p.id} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-border last:border-0"
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowSuggestions(false); if (p.assuranceTiersPayant) setTiersPayant(true); }}>
                      <p className="font-medium text-text-primary">{p.nom} {p.prenom}</p>
                      <p className="text-xs text-text-secondary">{p.ipp} {p.assuranceTiersPayant ? `· Assuré: ${p.assuranceNom}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                    {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-text-primary">{selectedPatient.nom} {selectedPatient.prenom}</p>
                    <p className="text-text-secondary">{selectedPatient.ipp}</p>
                  </div>
                  <button onClick={() => { setSelectedPatient(null); setTiersPayant(false); }} className="text-text-secondary hover:text-danger text-xs">✕</button>
                </div>
                {selectedPatient.assuranceTiersPayant && (
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-teal-800">Patient assuré : {selectedPatient.assuranceNom}</p>
                        <p className="text-xs text-teal-700">N° {selectedPatient.assuranceNumero}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-teal-800 font-medium">Appliquer tiers-payant</span>
                        <button type="button" onClick={() => setTiersPayant(!tiersPayant)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${tiersPayant ? 'bg-teal-600' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${tiersPayant ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Lignes de facturation */}
          <div className="bg-white border border-border rounded-card p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
              Lignes de facturation
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-2 text-xs font-semibold text-text-secondary">Type</th>
                    <th className="text-left pb-2 text-xs font-semibold text-text-secondary pl-2">Libellé</th>
                    <th className="text-center pb-2 text-xs font-semibold text-text-secondary w-16">Qté</th>
                    <th className="text-right pb-2 text-xs font-semibold text-text-secondary w-28">Prix unit.</th>
                    <th className="text-center pb-2 text-xs font-semibold text-text-secondary w-16">Remise %</th>
                    <th className="text-right pb-2 text-xs font-semibold text-text-secondary w-28">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lignes.map(l => (
                    <tr key={l.id}>
                      <td className="py-2 pr-2">
                        <select
                          className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 w-full"
                          value={l.type}
                          onChange={e => updateLigne(l.id, 'type', e.target.value as TypeLigneFacture)}
                        >
                          {TYPES_LIGNES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pl-2">
                        <input
                          type="text" placeholder="Description..."
                          className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={l.libelle}
                          onChange={e => updateLigne(l.id, 'libelle', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="number" min="1"
                          className="w-14 border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={l.quantite}
                          onChange={e => updateLigne(l.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input type="number" min="0"
                          className="w-28 border border-border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={l.prixUnitaire}
                          onChange={e => updateLigne(l.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input type="number" min="0" max="100"
                          className="w-16 border border-border rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={l.remise}
                          onChange={e => updateLigne(l.id, 'remise', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-text-primary whitespace-nowrap">
                        {formatXOF(calcTotal(l))}
                      </td>
                      <td className="py-2 pl-1">
                        <button onClick={() => removeLigne(l.id)} disabled={lignes.length === 1}
                          className="p-1 rounded hover:bg-red-50 text-danger transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setLignes(prev => [...prev, newLigne()])}
              className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-card p-5 sticky top-4">
            <h2 className="text-base font-semibold text-text-primary mb-4">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Sous-total HT</span>
                <span>{formatXOF(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>TVA (0% — santé)</span>
                <span>{formatXOF(tva)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-text-primary text-base">
                <span>Total TTC</span>
                <span>{formatXOF(total)}</span>
              </div>
              {tiersPayant && (
                <>
                  <div className="flex justify-between text-teal-700">
                    <span>Part assurance (60%)</span>
                    <span>{formatXOF(partAssurance)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-2" style={{ color: '#0D47A1' }}>
                    <span>Part patient</span>
                    <span>{formatXOF(partPatient)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="secondary" leftIcon={<Save size={16} />} onClick={() => handleSubmit(false)} className="w-full">
                Enregistrer brouillon
              </Button>
              <Button leftIcon={<Send size={16} />} onClick={() => handleSubmit(true)} className="w-full">
                Émettre la facture
              </Button>
              <Button variant="ghost" onClick={() => router.back()} className="w-full">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
