'use client';

import { useState } from 'react';
import type { SejourHospitalisation, ServiceHospitalisation, TypeHospitalisation, LitHospitalier } from '@/types';

interface AdmissionHospitalisationModalProps {
  onClose: () => void;
  onAdmit: (data: Partial<SejourHospitalisation>) => void;
}

const SERVICES: ServiceHospitalisation[] = [
  'Médecine Générale', 'Chirurgie', 'Maternité', 'Pédiatrie',
  'Réanimation', 'Orthopédie', 'Ophtalmologie',
];

const TYPES_HOSPITALISATION: { value: TypeHospitalisation; label: string; icon: string }[] = [
  { value: 'programmee',        label: 'Programmée',         icon: '📅' },
  { value: 'urgente',           label: 'Urgente',            icon: '🚨' },
  { value: 'transfert_interne', label: 'Transfert interne',  icon: '🔄' },
  { value: 'transfert_externe', label: 'Transfert externe',  icon: '🏥' },
];

// Mock lits libres par service
const LITS_MOCK: Record<string, LitHospitalier[]> = {
  'Médecine Générale': [
    { id: 'l1', numero: 'MG-101', service: 'Médecine Générale', salle: 'Salle A', statut: 'libre' },
    { id: 'l2', numero: 'MG-102', service: 'Médecine Générale', salle: 'Salle A', statut: 'libre' },
    { id: 'l3', numero: 'MG-201', service: 'Médecine Générale', salle: 'Salle B', statut: 'libre' },
  ],
  'Chirurgie': [
    { id: 'l4', numero: 'CH-101', service: 'Chirurgie', salle: 'Salle C', statut: 'libre' },
    { id: 'l5', numero: 'CH-102', service: 'Chirurgie', salle: 'Salle C', statut: 'libre' },
  ],
  'Maternité': [
    { id: 'l6', numero: 'MA-101', service: 'Maternité', salle: 'Salle D', statut: 'libre' },
  ],
  'Pédiatrie': [
    { id: 'l7', numero: 'PE-101', service: 'Pédiatrie', salle: 'Salle E', statut: 'libre' },
    { id: 'l8', numero: 'PE-102', service: 'Pédiatrie', salle: 'Salle E', statut: 'libre' },
  ],
  'Réanimation': [
    { id: 'l9', numero: 'REA-01', service: 'Réanimation', salle: 'Réa', statut: 'libre' },
    { id: 'l10', numero: 'REA-02', service: 'Réanimation', salle: 'Réa', statut: 'libre' },
  ],
  'Orthopédie': [
    { id: 'l11', numero: 'OR-101', service: 'Orthopédie', salle: 'Salle F', statut: 'libre' },
  ],
  'Ophtalmologie': [
    { id: 'l12', numero: 'OP-101', service: 'Ophtalmologie', salle: 'Salle G', statut: 'libre' },
  ],
};

const MEDECINS_MOCK = [
  { id: 'm1', label: 'Dr. Konan Ahoua — Urgentiste' },
  { id: 'm2', label: 'Dr. Mensah Ama — Neurologue' },
  { id: 'm3', label: 'Dr. Akoto Pierre — Chirurgien' },
  { id: 'm4', label: 'Dr. Diallo Fatoumata — Pédiatre' },
  { id: 'm5', label: 'Dr. Brou Jean — Gynécologue' },
];

export default function AdmissionHospitalisationModal({ onClose, onAdmit }: AdmissionHospitalisationModalProps) {
  const [service, setService] = useState<ServiceHospitalisation | ''>('');
  const [litId, setLitId] = useState('');
  const [medecinId, setMedecinId] = useState('');
  const [typeHospitalisation, setTypeHospitalisation] = useState<TypeHospitalisation | ''>('');
  const [diagnosticEntree, setDiagnosticEntree] = useState('');
  const [dateAdmission, setDateAdmission] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');

  const litsDisponibles = service ? (LITS_MOCK[service] || []) : [];

  const handleSubmit = () => {
    if (!service || !litId || !medecinId || !diagnosticEntree || !typeHospitalisation) return;
    onAdmit({
      service: service as ServiceHospitalisation,
      litId,
      medecinId,
      typeHospitalisation: typeHospitalisation as TypeHospitalisation,
      diagnosticEntree,
      dateAdmission: new Date(dateAdmission).toISOString(),
      notes: notes || undefined,
      statut: 'actif',
    });
    onClose();
  };

  const isValid = service && litId && medecinId && diagnosticEntree && typeHospitalisation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl"
          style={{ background: '#0D47A1' }}
        >
          <h2 className="text-white font-bold text-lg">🛏️ Admission en Hospitalisation</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none font-light">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Recherche patient */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patient <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou IPP..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </section>

          {/* Type d'hospitalisation */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type d'hospitalisation <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_HOSPITALISATION.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeHospitalisation(t.value)}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-all ${typeHospitalisation === t.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Service */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service <span className="text-red-500">*</span></label>
            <select
              value={service}
              onChange={e => { setService(e.target.value as ServiceHospitalisation); setLitId(''); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Sélectionner un service --</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </section>

          {/* Lit */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lit <span className="text-red-500">*</span></label>
            <select
              value={litId}
              onChange={e => setLitId(e.target.value)}
              disabled={!service}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">{service ? `-- ${litsDisponibles.length} lit(s) disponible(s) --` : '-- Sélectionner un service d\'abord --'}</option>
              {litsDisponibles.map(l => (
                <option key={l.id} value={l.id}>{l.numero} — {l.salle}</option>
              ))}
            </select>
            {service && litsDisponibles.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Aucun lit disponible dans ce service.</p>
            )}
          </section>

          {/* Médecin référent */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Médecin référent <span className="text-red-500">*</span></label>
            <select
              value={medecinId}
              onChange={e => setMedecinId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-- Sélectionner un médecin --</option>
              {MEDECINS_MOCK.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </section>

          {/* Diagnostic */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnostic d'entrée <span className="text-red-500">*</span></label>
            <textarea
              rows={2}
              placeholder="Diagnostic principal..."
              value={diagnosticEntree}
              onChange={e => setDiagnosticEntree(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </section>

          {/* Date/heure */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date et heure d'admission</label>
            <input
              type="datetime-local"
              value={dateAdmission}
              onChange={e => setDateAdmission(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </section>

          {/* Notes */}
          <section>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
            <textarea
              rows={2}
              placeholder="Informations complémentaires..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            disabled={!isValid}
            className="flex-grow-[2] py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
            style={{ background: '#0D47A1' }}
          >
            🛏️ Admettre en hospitalisation
          </button>
        </div>
      </div>
    </div>
  );
}
