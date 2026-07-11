'use client';

import { useState } from 'react';
import type { CategorieManchester, ModeArrivee, PatientUrgence } from '@/types';

interface AdmissionUrgenceModalProps {
  onClose: () => void;
  onAdmit: (data: Partial<PatientUrgence>) => void;
}

const MODES_ARRIVEE: { value: ModeArrivee; label: string; emoji: string }[] = [
  { value: 'ambulance', label: 'Ambulance', emoji: '🚑' },
  { value: 'propre_pied', label: 'Propre pied', emoji: '🚶' },
  { value: 'accompagne', label: 'Accompagné', emoji: '👥' },
  { value: 'pompiers', label: 'Pompiers', emoji: '🚒' },
  { value: 'smur', label: 'SMUR', emoji: '🏥' },
];

const CATEGORIES_TRIAGE: { value: CategorieManchester; label: string; desc: string; bg: string; border: string; text: string }[] = [
  { value: 'ROUGE', label: 'ROUGE', desc: 'Détresse vitale — 0-15 min', bg: '#C62828', border: '#B71C1C', text: '#fff' },
  { value: 'ORANGE', label: 'ORANGE', desc: 'Urgence vraie — 15-30 min', bg: '#E65100', border: '#BF360C', text: '#fff' },
  { value: 'JAUNE', label: 'JAUNE', desc: 'Urgence relative — 30-60 min', bg: '#F57F17', border: '#E65100', text: '#fff' },
  { value: 'VERT', label: 'VERT', desc: 'Non urgent — 2-4h', bg: '#2E7D32', border: '#1B5E20', text: '#fff' },
];

export default function AdmissionUrgenceModal({ onClose, onAdmit }: AdmissionUrgenceModalProps) {
  const [patientInconnu, setPatientInconnu] = useState(false);
  const [nomProvisoire, setNomProvisoire] = useState('');
  const [modeArrivee, setModeArrivee] = useState<ModeArrivee>('propre_pied');
  const [motif, setMotif] = useState('');
  const [categorie, setCategorie] = useState<CategorieManchester | ''>('');
  const [ta, setTa] = useState('');
  const [fc, setFc] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [glasgow, setGlasgow] = useState('');
  const [douleur, setDouleur] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!motif.trim() || !categorie) return;
    setSubmitting(true);
    const constantes: Record<string, any> = {};
    if (ta) constantes.tensionArterielle = ta;
    if (fc) constantes.frequenceCardiaque = Number(fc);
    if (temp) constantes.temperature = Number(temp);
    if (spo2) constantes.spo2 = Number(spo2);
    if (glasgow) constantes.glasgow = Number(glasgow);
    if (douleur) constantes.douleur = Number(douleur);

    onAdmit({
      nomProvisoire: patientInconnu ? (nomProvisoire || 'Patient non identifié') : undefined,
      modeArrivee,
      motif,
      categorieManchester: categorie as CategorieManchester,
      constantes: Object.keys(constantes).length > 0 ? constantes : undefined,
      statut: 'attente_triage',
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
          style={{ background: '#B71C1C' }}>
          <h2 className="text-white font-bold text-lg tracking-wide">🚨 Admission aux Urgences</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none font-light">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Patient</h3>
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => setPatientInconnu(false)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${!patientInconnu ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Rechercher un patient
              </button>
              <button
                onClick={() => setPatientInconnu(true)}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${patientInconnu ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                Patient non identifié
              </button>
            </div>
            {patientInconnu ? (
              <input
                type="text"
                placeholder="Nom provisoire (optionnel)"
                value={nomProvisoire}
                onChange={e => setNomProvisoire(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            ) : (
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou IPP..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </section>

          {/* Mode d'arrivée */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Mode d'arrivée</h3>
            <div className="grid grid-cols-5 gap-2">
              {MODES_ARRIVEE.map(m => (
                <button
                  key={m.value}
                  onClick={() => setModeArrivee(m.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-medium ${modeArrivee === m.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Motif */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Motif de consultation <span className="text-red-500">*</span></h3>
            <textarea
              rows={3}
              placeholder="Décrivez le motif de consultation..."
              value={motif}
              onChange={e => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </section>

          {/* Triage Manchester */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Triage Manchester <span className="text-red-500">*</span></h3>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES_TRIAGE.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategorie(cat.value)}
                  style={{
                    backgroundColor: categorie === cat.value ? cat.bg : '#f9fafb',
                    borderColor: categorie === cat.value ? cat.border : '#e5e7eb',
                    color: categorie === cat.value ? cat.text : '#374151',
                  }}
                  className="py-4 rounded-xl border-2 transition-all font-bold text-left px-5 hover:opacity-90"
                >
                  <div className="text-base font-black">{cat.label}</div>
                  <div className={`text-xs mt-0.5 font-normal ${categorie === cat.value ? 'text-white/90' : 'text-gray-500'}`}>{cat.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Constantes (optionnel) */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Constantes vitales <span className="text-gray-400 font-normal">(optionnel)</span></h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TA (mmHg)', placeholder: '120/80', value: ta, set: setTa },
                { label: 'FC (bpm)', placeholder: '80', value: fc, set: setFc },
                { label: 'Temp. (°C)', placeholder: '37.0', value: temp, set: setTemp },
                { label: 'SpO2 (%)', placeholder: '98', value: spo2, set: setSpo2 },
                { label: 'Glasgow (/15)', placeholder: '15', value: glasgow, set: setGlasgow },
                { label: 'Douleur (/10)', placeholder: '0', value: douleur, set: setDouleur },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!motif.trim() || !categorie || submitting}
            className="flex-2 flex-grow-[2] py-3 rounded-xl font-bold text-white tracking-wide transition-all disabled:opacity-50"
            style={{ background: '#B71C1C' }}
          >
            🚨 ADMETTRE AUX URGENCES
          </button>
        </div>
      </div>
    </div>
  );
}
