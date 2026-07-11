'use client';

import { useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const MOCK_PATIENTS = [
  { id: 'p1', ipp: 'IPP-00142', nom: 'Kouassi', prenom: 'Ama Bernadette', age: 42, allergies: 'Pénicilline' },
  { id: 'p2', ipp: 'IPP-00087', nom: 'Traoré', prenom: 'Moussa', age: 35, allergies: '' },
  { id: 'p3', ipp: 'IPP-00215', nom: 'N\'Guessan', prenom: 'Brice', age: 28, allergies: 'Latex' },
];

const MOCK_MEDECINS = [
  { id: 'm1', nom: 'Koffi Ange', specialite: 'Médecine générale' },
  { id: 'm2', nom: 'Diallo Mariam', specialite: 'Cardiologie' },
  { id: 'm3', nom: 'Soro Jean', specialite: 'Pédiatrie' },
];

const CRENEAUX = Array.from({ length: 25 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});

const TYPES_RDV = ['consultation', 'suivi', 'urgence', 'examen', 'chirurgie'] as const;
const DUREES = [30, 45, 60, 90] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave?: (data: any) => void;
}

export default function NouveauRdvModal({ isOpen, onClose, defaultDate, onSave }: Props) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<typeof MOCK_PATIENTS>([]);
  const [selectedPatient, setSelectedPatient] = useState<typeof MOCK_PATIENTS[0] | null>(null);
  const [showResults, setShowResults] = useState(false);

  const [form, setForm] = useState({
    medecinId: '',
    date: defaultDate || '',
    heure: '08:00',
    duree: 30 as typeof DUREES[number],
    motif: '',
    type: 'consultation' as typeof TYPES_RDV[number],
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const searchPatients = (q: string) => {
    setPatientSearch(q);
    if (q.length < 2) { setPatientResults([]); setShowResults(false); return; }
    const results = MOCK_PATIENTS.filter(p =>
      `${p.prenom} ${p.nom} ${p.ipp}`.toLowerCase().includes(q.toLowerCase())
    );
    setPatientResults(results);
    setShowResults(true);
  };

  const selectPatient = (p: typeof MOCK_PATIENTS[0]) => {
    setSelectedPatient(p);
    setPatientSearch(`${p.prenom} ${p.nom}`);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !form.medecinId || !form.date || !form.motif) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSave?.({ patientId: selectedPatient.id, ...form });
    setLoading(false);
    onClose();
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setForm({ medecinId: '', date: defaultDate || '', heure: '08:00', duree: 30, motif: '', type: 'consultation', notes: '' });
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouveau Rendez-Vous"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedPatient || !form.medecinId || !form.date || !form.motif}
          >
            Enregistrer le RDV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Patient */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Patient <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <Input
              placeholder="Rechercher par nom ou IPP..."
              value={patientSearch}
              onChange={e => searchPatients(e.target.value)}
              leftIcon={<Search size={16} />}
            />
            {showResults && patientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-lg z-30 overflow-hidden">
                {patientResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {p.prenom[0]}{p.nom[0]}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-text-secondary">{p.ipp} • {p.age} ans</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="mt-2 flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
              </div>
              <div className="flex-1">
                <span className="font-medium">{selectedPatient.prenom} {selectedPatient.nom}</span>
                <span className="text-text-secondary ml-2 text-xs">{selectedPatient.ipp}</span>
                {selectedPatient.allergies && (
                  <span className="ml-2 text-danger text-xs font-medium">
                    ⚠ {selectedPatient.allergies}
                  </span>
                )}
              </div>
              <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); }} className="text-text-secondary hover:text-danger text-xs">✕</button>
            </div>
          )}
        </div>

        {/* Médecin */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Médecin <span className="text-danger">*</span>
          </label>
          <select
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.medecinId}
            onChange={e => setForm(f => ({ ...f, medecinId: e.target.value }))}
          >
            <option value="">Sélectionner un médecin...</option>
            {MOCK_MEDECINS.map(m => (
              <option key={m.id} value={m.id}>Dr. {m.nom} — {m.specialite}</option>
            ))}
          </select>
        </div>

        {/* Date + Heure */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date *"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Heure *</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.heure}
              onChange={e => setForm(f => ({ ...f, heure: e.target.value }))}
            >
              {CRENEAUX.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        {/* Durée + Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Durée</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.duree}
              onChange={e => setForm(f => ({ ...f, duree: Number(e.target.value) as typeof DUREES[number] }))}
            >
              {DUREES.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
            >
              {TYPES_RDV.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Motif */}
        <Input
          label="Motif *"
          placeholder="Motif du rendez-vous..."
          value={form.motif}
          onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Notes (optionnel)</label>
          <textarea
            rows={2}
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Informations complémentaires..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>
    </Modal>
  );
}
