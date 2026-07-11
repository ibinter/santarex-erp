'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, ChevronUp, AlertTriangle, FlaskConical } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Patient } from '@/types';

// ─── Types d'analyses par catégorie ────────────────────────
const TYPES_ANALYSES = [
  {
    categorie: 'hematologie',
    label: 'Hématologie',
    analyses: [
      { id: 'NFS', code: 'NFS', nom: 'Numération Formule Sanguine', prix: 3500 },
      { id: 'GRP', code: 'GRP', nom: 'Groupage sanguin', prix: 4000 },
      { id: 'INR', code: 'INR', nom: 'INR / TP', prix: 3000 },
      { id: 'VS', code: 'VS', nom: 'Vitesse de sédimentation', prix: 1500 },
    ],
  },
  {
    categorie: 'biochimie',
    label: 'Biochimie',
    analyses: [
      { id: 'GLYC', code: 'GLYC', nom: 'Glycémie', prix: 2000 },
      { id: 'CREAT', code: 'CREAT', nom: 'Créatinine', prix: 2000 },
      { id: 'TGOTGP', code: 'TGOTGP', nom: 'Transaminases (TGO/TGP)', prix: 3500 },
      { id: 'BILI', code: 'BILI', nom: 'Bilan lipidique', prix: 5000 },
      { id: 'CRP', code: 'CRP', nom: 'CRP (Protéine C-réactive)', prix: 2500 },
      { id: 'IONOG', code: 'IONOG', nom: 'Ionogramme sanguin', prix: 4500 },
      { id: 'HBA1C', code: 'HBA1C', nom: 'HbA1c', prix: 6000 },
      { id: 'URIC', code: 'URIC', nom: 'Uricémie', prix: 2000 },
    ],
  },
  {
    categorie: 'serologie',
    label: 'Sérologie',
    analyses: [
      { id: 'HIV', code: 'HIV', nom: 'Sérologie HIV 1&2', prix: 8000 },
      { id: 'AGHBS', code: 'AGHBS', nom: 'Ag HBs (Hépatite B)', prix: 7000 },
      { id: 'HEPC', code: 'HEPC', nom: 'Sérologie Hépatite C', prix: 9000 },
      { id: 'TPHA', code: 'TPHA', nom: 'TPHA/VDRL (Syphilis)', prix: 4000 },
      { id: 'BHCG', code: 'BHCG', nom: 'Beta-HCG (Grossesse)', prix: 5000 },
    ],
  },
  {
    categorie: 'microbiologie',
    label: 'Microbiologie',
    analyses: [
      { id: 'ECBU', code: 'ECBU', nom: 'ECBU (Examen Cytobactériologique des Urines)', prix: 6000 },
      { id: 'PALU', code: 'PALU', nom: 'Test paludisme (TDR + frottis)', prix: 3000 },
    ],
  },
  {
    categorie: 'hormonologie',
    label: 'Hormonologie',
    analyses: [
      { id: 'TSH', code: 'TSH', nom: 'TSH (Thyréostimuline)', prix: 7500 },
      { id: 'PSA', code: 'PSA', nom: 'PSA (Antigène Prostatique)', prix: 8000 },
    ],
  },
];

const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', ipp: 'IPP-00145', nom: 'KOUASSI', prenom: 'Adjoua Marie', dateNaissance: '1985-03-12', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
  { id: 'p2', ipp: 'IPP-00089', nom: 'TRAORÉ', prenom: 'Ibrahim', dateNaissance: '1972-07-22', sexe: 'M', pays: 'CI', assuranceTiersPayant: true, assuranceNom: 'CNPS', assuranceNumero: 'CNP-44521', statut: 'actif', createdAt: '' },
  { id: 'p3', ipp: 'IPP-00213', nom: 'KONÉ', prenom: 'Fatoumata', dateNaissance: '1990-11-05', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
];

const MEDECINS = [
  { id: 'm1', nom: 'DIALLO', prenom: 'Mamadou', specialite: 'Médecine Générale' },
  { id: 'm2', nom: 'BAMBA', prenom: 'Salimata', specialite: 'Cardiologie' },
  { id: 'm3', nom: 'COULIBALY', prenom: 'Dramane', specialite: 'Pédiatrie' },
];

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function NouvelleDemandeAnalysePage() {
  const router = useRouter();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [medecinId, setMedecinId] = useState('');
  const [urgence, setUrgence] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['hematologie', 'biochimie']));
  const [notes, setNotes] = useState('');

  const patientSuggestions = MOCK_PATIENTS.filter(p =>
    patientSearch.length >= 2 &&
    (`${p.nom} ${p.prenom}`.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.ipp.toLowerCase().includes(patientSearch.toLowerCase()))
  );

  const toggleCategorie = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleAnalyse = (id: string) => {
    setSelectedAnalyses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getSelectedItems = () => {
    const items: { id: string; nom: string; prix: number }[] = [];
    for (const grp of TYPES_ANALYSES) {
      for (const a of grp.analyses) {
        if (selectedAnalyses.has(a.id)) items.push(a);
      }
    }
    return items;
  };

  const total = getSelectedItems().reduce((acc, a) => acc + a.prix, 0);

  const handleSubmit = () => {
    if (!selectedPatient) return alert('Veuillez sélectionner un patient.');
    if (!medecinId) return alert('Veuillez sélectionner un prescripteur.');
    if (selectedAnalyses.size === 0) return alert('Veuillez sélectionner au moins une analyse.');
    alert(`Demande enregistrée pour ${selectedPatient.nom} ${selectedPatient.prenom}. Total: ${formatXOF(total)}`);
    router.push('/laboratoire');
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
          ← Retour
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Nouvelle demande d'analyse</h1>
          <p className="text-sm text-text-secondary">Remplissez les informations pour créer la demande</p>
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
                label="Rechercher patient (nom, prénom, IPP)"
                placeholder="Tapez au moins 2 caractères..."
                value={selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom} — ${selectedPatient.ipp}` : patientSearch}
                onChange={e => {
                  setPatientSearch(e.target.value);
                  setSelectedPatient(null);
                  setShowPatientSuggestions(true);
                }}
                onFocus={() => setShowPatientSuggestions(true)}
                leftIcon={<Search size={16} />}
              />
              {showPatientSuggestions && patientSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg">
                  {patientSuggestions.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-border last:border-0"
                      onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowPatientSuggestions(false); }}
                    >
                      <p className="font-medium text-text-primary">{p.nom} {p.prenom}</p>
                      <p className="text-xs text-text-secondary">{p.ipp} · {p.sexe === 'M' ? 'Homme' : 'Femme'} · né(e) le {new Date(p.dateNaissance).toLocaleDateString('fr-FR')}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPatient && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                  {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-text-primary">{selectedPatient.nom} {selectedPatient.prenom}</p>
                  <p className="text-text-secondary">{selectedPatient.ipp} · {selectedPatient.sexe === 'M' ? 'Homme' : 'Femme'} · né(e) le {new Date(selectedPatient.dateNaissance).toLocaleDateString('fr-FR')}</p>
                  {selectedPatient.assuranceTiersPayant && (
                    <p className="mt-0.5 text-teal-700 font-medium">Assuré : {selectedPatient.assuranceNom} ({selectedPatient.assuranceNumero})</p>
                  )}
                </div>
                <button onClick={() => setSelectedPatient(null)} className="ml-auto text-text-secondary hover:text-danger text-xs">✕</button>
              </div>
            )}
          </div>

          {/* Section Prescription */}
          <div className="bg-white border border-border rounded-card p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
              Prescription
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Médecin prescripteur *</label>
                <select
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={medecinId} onChange={e => setMedecinId(e.target.value)}
                >
                  <option value="">Sélectionner un médecin...</option>
                  {MEDECINS.map(m => (
                    <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom} — {m.specialite}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Consultation liée (optionnel)</label>
                <select className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Aucune consultation liée</option>
                  <option value="c1">CONS-2025-0145 — 10/07/2025</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-text-primary">Demande urgente</span>
                <button
                  type="button"
                  onClick={() => setUrgence(!urgence)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${urgence ? 'bg-red-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${urgence ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                {urgence && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <AlertTriangle size={12} /> URGENT
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Section Analyses */}
          <div className="bg-white border border-border rounded-card p-5">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
              Analyses à effectuer
            </h2>
            <div className="space-y-2">
              {TYPES_ANALYSES.map(grp => {
                const expanded = expandedCategories.has(grp.categorie);
                const selectedInGroup = grp.analyses.filter(a => selectedAnalyses.has(a.id)).length;
                return (
                  <div key={grp.categorie} className="border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleCategorie(grp.categorie)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-medium text-text-primary text-sm">{grp.label}</span>
                      <div className="flex items-center gap-2">
                        {selectedInGroup > 0 && (
                          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{selectedInGroup} sélectionné{selectedInGroup > 1 ? 's' : ''}</span>
                        )}
                        {expanded ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
                      </div>
                    </button>
                    {expanded && (
                      <div className="divide-y divide-border">
                        {grp.analyses.map(a => (
                          <label key={a.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedAnalyses.has(a.id)}
                              onChange={() => toggleAnalyse(a.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                            />
                            <span className="flex-1 text-sm text-text-primary">{a.nom}</span>
                            <span className="text-xs font-medium text-text-secondary bg-gray-100 px-2 py-0.5 rounded">
                              {formatXOF(a.prix)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-border rounded-card p-5">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
              Notes
            </h2>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Instructions particulières, contexte clinique..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-card p-5 sticky top-4">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FlaskConical size={16} className="text-primary" />
              Résumé de la demande
            </h2>
            {getSelectedItems().length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">Aucune analyse sélectionnée</p>
            ) : (
              <div className="space-y-2 mb-4">
                {getSelectedItems().map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{item.nom}</span>
                    <span className="font-medium text-text-secondary ml-2 flex-shrink-0">{formatXOF(item.prix)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Total à facturer</span>
                <span className="text-xl font-bold" style={{ color: '#0D47A1' }}>{formatXOF(total)}</span>
              </div>
            </div>
            {urgence && (
              <div className="mt-3 p-2 bg-red-50 rounded border border-red-200 flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertTriangle size={13} /> Demande marquée URGENTE
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={handleSubmit} className="w-full" disabled={!selectedPatient || selectedAnalyses.size === 0}>
                Enregistrer la demande
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
