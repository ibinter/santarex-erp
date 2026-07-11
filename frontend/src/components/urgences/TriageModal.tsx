'use client';

import { useState } from 'react';
import type { PatientUrgence, CategorieManchester } from '@/types';

interface TriageModalProps {
  patient: PatientUrgence;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<PatientUrgence>) => void;
}

const CATEGORIES_TRIAGE: { value: CategorieManchester; label: string; desc: string; bg: string; border: string }[] = [
  { value: 'ROUGE', label: 'ROUGE', desc: 'Détresse vitale — 0-15 min', bg: '#C62828', border: '#B71C1C' },
  { value: 'ORANGE', label: 'ORANGE', desc: 'Urgence vraie — 15-30 min', bg: '#E65100', border: '#BF360C' },
  { value: 'JAUNE', label: 'JAUNE', desc: 'Urgence relative — 30-60 min', bg: '#F57F17', border: '#E65100' },
  { value: 'VERT', label: 'VERT', desc: 'Non urgent — 2-4h', bg: '#2E7D32', border: '#1B5E20' },
  { value: 'NOIR', label: 'NOIR', desc: 'Décédé', bg: '#212121', border: '#000' },
];

const STATUTS = [
  { value: 'attente_triage', label: 'En attente de triage' },
  { value: 'en_triage', label: 'En cours de triage' },
  { value: 'en_soins', label: 'En soins' },
  { value: 'en_observation', label: 'En observation' },
];

const MEDECINS_MOCK = [
  { id: 'm1', label: 'Dr. Konan Kouassi' },
  { id: 'm2', label: 'Dr. Ama Mensah' },
  { id: 'm3', label: 'Dr. Pierre Akoto' },
];

export default function TriageModal({ patient, onClose, onUpdate }: TriageModalProps) {
  const [categorie, setCategorie] = useState<CategorieManchester>(patient.categorieManchester);
  const [statut, setStatut] = useState(patient.statut);
  const [medecinId, setMedecinId] = useState(patient.medecinId || '');
  const [ta, setTa] = useState(patient.constantes?.tensionArterielle || '');
  const [fc, setFc] = useState(String(patient.constantes?.frequenceCardiaque || ''));
  const [temp, setTemp] = useState(String(patient.constantes?.temperature || ''));
  const [spo2, setSpo2] = useState(String(patient.constantes?.spo2 || ''));
  const [glasgow, setGlasgow] = useState(String(patient.constantes?.glasgow || ''));
  const [douleur, setDouleur] = useState(String(patient.constantes?.douleur || 0));
  const [notes, setNotes] = useState(patient.notes || '');

  const handleSubmit = () => {
    const constantes: Record<string, any> = {};
    if (ta) constantes.tensionArterielle = ta;
    if (fc) constantes.frequenceCardiaque = Number(fc);
    if (temp) constantes.temperature = Number(temp);
    if (spo2) constantes.spo2 = Number(spo2);
    if (glasgow) constantes.glasgow = Number(glasgow);
    if (douleur !== '') constantes.douleur = Number(douleur);

    onUpdate(patient.id, {
      categorieManchester: categorie,
      statut: statut as any,
      medecinId: medecinId || undefined,
      constantes,
      notes,
    });
    onClose();
  };

  const catCurrent = CATEGORIES_TRIAGE.find(c => c.value === categorie);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl"
          style={{ background: catCurrent?.bg || '#1565C0' }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">Mise à jour du triage</h2>
            <p className="text-white/80 text-sm mt-0.5">{patient.numero} — {patient.patient ? `${patient.patient.prenom} ${patient.patient.nom}` : patient.nomProvisoire || 'Patient non identifié'}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none font-light">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Catégorie Manchester */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Catégorie de triage</h3>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES_TRIAGE.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategorie(cat.value)}
                  style={{
                    backgroundColor: categorie === cat.value ? cat.bg : '#f9fafb',
                    borderColor: categorie === cat.value ? cat.border : '#e5e7eb',
                    color: categorie === cat.value ? '#fff' : '#374151',
                  }}
                  className="py-3 rounded-xl border-2 transition-all font-bold text-sm hover:opacity-90 flex flex-col items-center gap-1"
                >
                  {cat.label}
                  <span className={`text-[10px] font-normal ${categorie === cat.value ? 'text-white/80' : 'text-gray-400'}`}>
                    {cat.desc.split('—')[1]?.trim()}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Statut */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Statut actuel</h3>
            <div className="grid grid-cols-2 gap-2">
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatut(s.value as any)}
                  className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${statut === s.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Constantes vitales */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Constantes vitales</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TA (mmHg)', placeholder: '120/80', value: ta, set: setTa },
                { label: 'FC (bpm)', placeholder: '80', value: fc, set: setFc },
                { label: 'Temp. (°C)', placeholder: '37.0', value: temp, set: setTemp },
                { label: 'SpO2 (%)', placeholder: '98', value: spo2, set: setSpo2 },
                { label: 'Glasgow (/15)', placeholder: '15', value: glasgow, set: setGlasgow },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              ))}
            </div>

            {/* Échelle douleur slider */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-2">
                Échelle douleur : <span className="font-bold text-gray-800">{douleur}/10</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={douleur}
                  onChange={e => setDouleur(e.target.value)}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2E7D32 0%, #F57F17 50%, #C62828 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  {Array.from({ length: 11 }, (_, i) => <span key={i}>{i}</span>)}
                </div>
              </div>
            </div>
          </section>

          {/* Médecin responsable */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Médecin responsable</h3>
            <select
              value={medecinId}
              onChange={e => setMedecinId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">-- Sélectionner un médecin --</option>
              {MEDECINS_MOCK.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
            <textarea
              rows={3}
              placeholder="Notes cliniques, observations..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </section>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-grow-[2] py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: catCurrent?.bg || '#1565C0' }}
          >
            Mettre à jour le triage
          </button>
        </div>
      </div>
    </div>
  );
}
