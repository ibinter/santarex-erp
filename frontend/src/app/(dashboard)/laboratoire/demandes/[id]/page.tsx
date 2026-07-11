'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, CheckCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { InterpretationResultat } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_DEMANDE = {
  id: 'd2',
  numero: 'LAB-2025-0311',
  patient: { nom: 'TRAORÉ', prenom: 'Ibrahim', ipp: 'IPP-00089', dateNaissance: '1972-07-22', sexe: 'M' },
  medecin: { nom: 'BAMBA', prenom: 'Salimata', specialite: 'Cardiologie' },
  statut: 'en_analyse' as const,
  urgence: false,
  createdAt: '2025-07-10T07:45:00',
  datePrelevement: '2025-07-10T09:00:00',
  typesAnalyse: [
    {
      id: 'ta3', code: 'BILI', nom: 'Bilan lipidique', categorie: 'Biochimie', prix: 5000,
      parametres: [
        { id: 'p1', nom: 'Cholestérol total', unite: 'mmol/L', valeurNormaleMin: 0, valeurNormaleMax: 5.2 },
        { id: 'p2', nom: 'HDL-Cholestérol', unite: 'mmol/L', valeurNormaleMin: 1.0, valeurNormaleMax: 2.5 },
        { id: 'p3', nom: 'LDL-Cholestérol', unite: 'mmol/L', valeurNormaleMin: 0, valeurNormaleMax: 3.4 },
        { id: 'p4', nom: 'Triglycérides', unite: 'mmol/L', valeurNormaleMin: 0, valeurNormaleMax: 1.7 },
      ],
    },
    {
      id: 'ta4', code: 'CRP', nom: 'CRP (Protéine C-réactive)', categorie: 'Biochimie', prix: 2500,
      parametres: [
        { id: 'p5', nom: 'CRP', unite: 'mg/L', valeurNormaleMin: 0, valeurNormaleMax: 5.0 },
      ],
    },
  ],
};

// Mock résultats (pour état "termine")
const MOCK_RESULTATS = [
  { parametreId: 'p1', valeur: '6.8', interpretation: 'ELEVE' as InterpretationResultat },
  { parametreId: 'p2', valeur: '0.9', interpretation: 'BAS' as InterpretationResultat },
  { parametreId: 'p3', valeur: '4.2', interpretation: 'ELEVE' as InterpretationResultat },
  { parametreId: 'p4', valeur: '1.3', interpretation: 'NORMAL' as InterpretationResultat },
  { parametreId: 'p5', valeur: '12.5', interpretation: 'ELEVE' as InterpretationResultat },
];

const STATUT_STEPS = [
  { key: 'attente_prelevement', label: 'Demande' },
  { key: 'preleve', label: 'Prélèvement' },
  { key: 'en_analyse', label: 'Analyse' },
  { key: 'termine', label: 'Résultats' },
];

const STATUT_ORDER = ['attente_prelevement', 'preleve', 'en_analyse', 'termine'];

const INTERPRETATION_CONFIG: Record<InterpretationResultat, { label: string; className: string }> = {
  NORMAL: { label: 'NORMAL', className: 'bg-green-50 text-green-700 border border-green-200' },
  ELEVE: { label: 'ÉLEVÉ', className: 'bg-red-50 text-red-700 border border-red-200' },
  BAS: { label: 'BAS', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  CRITIQUE: { label: 'CRITIQUE', className: 'bg-red-100 text-red-900 border border-red-400 animate-pulse font-bold' },
};

type StatutDemande = 'attente_prelevement' | 'preleve' | 'en_analyse' | 'termine';

function isHorsNormes(valeur: string, min?: number, max?: number): boolean {
  const v = parseFloat(valeur);
  if (isNaN(v)) return false;
  if (min !== undefined && v < min) return true;
  if (max !== undefined && v > max) return true;
  return false;
}

export default function DetailDemandePage() {
  const router = useRouter();
  const [statut, setStatut] = useState<StatutDemande>(MOCK_DEMANDE.statut);
  const [expanded, setExpanded] = useState<Set<string>>(new Set([MOCK_DEMANDE.typesAnalyse[0].id]));
  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [interpretations, setInterpretations] = useState<Record<string, string>>({});

  const currentIndex = STATUT_ORDER.indexOf(statut);

  const toggleAccordion = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleMarquerPreleve = () => {
    setStatut('preleve');
  };

  const handleValiderResultats = () => {
    setStatut('termine');
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary transition-colors text-sm">
              ← Retour
            </button>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-mono">{MOCK_DEMANDE.numero}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Patient : <strong>{MOCK_DEMANDE.patient.nom} {MOCK_DEMANDE.patient.prenom}</strong> ({MOCK_DEMANDE.patient.ipp}) · Prescrit par Dr. {MOCK_DEMANDE.medecin.prenom} {MOCK_DEMANDE.medecin.nom}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            Demandé le {new Date(MOCK_DEMANDE.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        {statut === 'termine' && (
          <Button variant="secondary" leftIcon={<Printer size={16} />} onClick={() => alert('Impression PDF...')}>
            Imprimer / PDF
          </Button>
        )}
      </div>

      {/* Timeline stepper */}
      <div className="bg-white border border-border rounded-card p-5 mb-5">
        <div className="flex items-center">
          {STATUT_STEPS.map((step, idx) => {
            const done = idx < currentIndex;
            const active = idx === currentIndex;
            return (
              <div key={step.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    done ? 'bg-primary border-primary text-white' :
                    active ? 'bg-blue-50 border-primary text-primary' :
                    'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {done ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                    active ? 'text-primary' : done ? 'text-text-primary' : 'text-text-secondary'
                  }`}>{step.label}</span>
                </div>
                {idx < STATUT_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${done ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action : Marquer prélevé */}
      {statut === 'attente_prelevement' && (
        <div className="bg-amber-50 border border-amber-200 rounded-card p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-amber-800">En attente de prélèvement</p>
            <p className="text-sm text-amber-700">Confirmez le prélèvement pour passer à la phase d'analyse.</p>
          </div>
          <Button onClick={handleMarquerPreleve}>
            Marquer comme prélevé
          </Button>
        </div>
      )}

      {/* Section Saisie des résultats */}
      {(statut === 'preleve' || statut === 'en_analyse') && (
        <div className="bg-white border border-border rounded-card p-5 mb-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Saisie des résultats</h2>
          <div className="space-y-3">
            {MOCK_DEMANDE.typesAnalyse.map(ta => (
              <div key={ta.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion(ta.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">{ta.nom}</span>
                    <span className="text-xs text-text-secondary bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{ta.code}</span>
                  </div>
                  {expanded.has(ta.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.has(ta.id) && (
                  <div className="p-4 space-y-3">
                    {ta.parametres.map(p => {
                      const val = valeurs[p.id] || '';
                      const horsNormes = val && isHorsNormes(val, p.valeurNormaleMin, p.valeurNormaleMax);
                      return (
                        <div key={p.id} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4">
                            <p className="text-sm font-medium text-text-primary">{p.nom}</p>
                            <p className="text-xs text-text-secondary">
                              Normale: {p.valeurNormaleMin} – {p.valeurNormaleMax} {p.unite}
                            </p>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Valeur"
                              value={val}
                              onChange={e => setValeurs(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className={`w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                                horsNormes
                                  ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200'
                                  : 'border-border focus:ring-primary/30'
                              }`}
                            />
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-text-secondary">{p.unite}</span>
                          </div>
                          <div className="col-span-3">
                            {horsNormes && (
                              <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                <AlertTriangle size={12} /> Hors normes
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-text-secondary mb-1">Interprétation du biologiste</label>
                      <textarea
                        className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        rows={2}
                        placeholder="Commentaire sur les résultats de cette analyse..."
                        value={interpretations[ta.id] || ''}
                        onChange={e => setInterpretations(prev => ({ ...prev, [ta.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleValiderResultats} leftIcon={<CheckCircle size={16} />}>
              Valider les résultats
            </Button>
          </div>
        </div>
      )}

      {/* Section Résultats (si terminé) */}
      {statut === 'termine' && (
        <div className="bg-white border border-border rounded-card p-5 mb-5">
          <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-success" />
            Résultats validés
          </h2>
          {MOCK_DEMANDE.typesAnalyse.map(ta => (
            <div key={ta.id} className="mb-5">
              <h3 className="text-sm font-semibold text-text-primary mb-2">{ta.nom}</h3>
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Paramètre</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Valeur</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Unité</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Normes</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-text-secondary">Interprétation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ta.parametres.map(p => {
                    const res = MOCK_RESULTATS.find(r => r.parametreId === p.id);
                    const interp = res?.interpretation;
                    const cfg = interp ? INTERPRETATION_CONFIG[interp] : null;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-text-primary">{p.nom}</td>
                        <td className={`px-3 py-2 font-bold ${interp && interp !== 'NORMAL' ? 'text-red-600' : 'text-text-primary'}`}>
                          {res?.valeur ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{p.unite}</td>
                        <td className="px-3 py-2 text-text-secondary text-xs">{p.valeurNormaleMin} – {p.valeurNormaleMax}</td>
                        <td className="px-3 py-2">
                          {cfg && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">Interprétation globale du biologiste</p>
            <p className="text-sm text-text-primary">
              Dyslipidémie mixte avec hypercholestérolémie (CT : 6.8 mmol/L), hypo-HDL (0.9 mmol/L) et élévation du LDL (4.2 mmol/L). Syndrome inflammatoire modéré (CRP : 12.5 mg/L). Bilan cardiovasculaire à compléter. Traitement hypolipémiant à envisager.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
