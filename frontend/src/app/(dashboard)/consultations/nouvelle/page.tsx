'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, User, AlertTriangle, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

// ─── Mock data ─────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: 'p1', ipp: 'IPP-00142', nom: 'Kouassi', prenom: 'Ama Bernadette', age: 42, groupeSanguin: 'A+', allergies: 'Pénicilline, Aspirine' },
  { id: 'p2', ipp: 'IPP-00087', nom: 'Traoré', prenom: 'Moussa', age: 35, groupeSanguin: 'O+', allergies: '' },
  { id: 'p3', ipp: 'IPP-00215', nom: 'N\'Guessan', prenom: 'Brice', age: 28, groupeSanguin: 'B-', allergies: 'Latex' },
];

const MOCK_MEDECINS = [
  { id: 'm1', nom: 'Koffi', prenom: 'Ange', specialite: 'Médecine générale' },
  { id: 'm2', nom: 'Diallo', prenom: 'Mariam', specialite: 'Cardiologie' },
  { id: 'm3', nom: 'Soro', prenom: 'Jean', specialite: 'Pédiatrie' },
];

// ─── Progress Bar ──────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const done = stepNum < step;
          const active = stepNum === step;
          return (
            <div key={stepNum} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                done ? 'bg-primary text-white' : active ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-100 text-text-secondary'
              }`}>
                {done ? <Check size={16} /> : stepNum}
              </div>
              {i < total - 1 && (
                <div className={`flex-1 h-1 mx-2 rounded ${done ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-text-secondary">
        <span className={step === 1 ? 'font-semibold text-primary' : ''}>Patient & Médecin</span>
        <span className={step === 2 ? 'font-semibold text-primary' : ''}>Examen clinique</span>
        <span className={step === 3 ? 'font-semibold text-primary' : ''}>Diagnostic & Plan</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function NouvelleConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<typeof MOCK_PATIENTS>([]);
  const [selectedPatient, setSelectedPatient] = useState<typeof MOCK_PATIENTS[0] | null>(null);
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Step 2 state
  const [motif, setMotif] = useState('');
  const [constantes, setConstantes] = useState({
    ta: '', fc: '', temperature: '', poids: '', taille: '', spo2: '',
  });
  const [anamnese, setAnamnese] = useState('');
  const [examenClinique, setExamenClinique] = useState('');

  // Step 3 state
  const [diagnostic, setDiagnostic] = useState('');
  const [codeCIM10, setCodeCIM10] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [planSoins, setPlanSoins] = useState('');
  const [prochainRdv, setProchainRdv] = useState('');
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

  const handleSubmit = async (draft = false) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    router.push('/consultations');
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-3 transition-colors"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Nouvelle Consultation</h1>
          <p className="text-sm text-text-secondary mt-0.5">Étape {step} sur 3</p>
        </div>

        {/* Progress */}
        <ProgressBar step={step} total={3} />

        {/* Form Card */}
        <div className="bg-white rounded-card border border-border p-6">

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-text-primary">Patient & Médecin</h2>

              {/* Recherche patient */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Patient <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Rechercher par nom, prénom ou IPP..."
                    value={patientSearch}
                    onChange={e => searchPatients(e.target.value)}
                    leftIcon={<Search size={16} />}
                    onFocus={() => patientResults.length > 0 && setShowResults(true)}
                  />
                  {showResults && patientResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-card shadow-lg z-20 overflow-hidden">
                      {patientResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => selectPatient(p)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
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

                {/* Résumé patient sélectionné */}
                {selectedPatient && (
                  <div className="mt-3 border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                        {selectedPatient.prenom[0]}{selectedPatient.nom[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">
                          {selectedPatient.prenom} {selectedPatient.nom}
                        </p>
                        <p className="text-xs text-text-secondary">{selectedPatient.ipp} • {selectedPatient.age} ans</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                            {selectedPatient.groupeSanguin}
                          </span>
                          {selectedPatient.allergies && (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                              <AlertTriangle size={12} className="text-danger" />
                              <span className="text-xs text-danger font-medium">
                                Allergies : {selectedPatient.allergies}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                        className="text-text-secondary hover:text-danger text-xs"
                      >
                        ✕
                      </button>
                    </div>
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
                  value={selectedMedecin}
                  onChange={e => setSelectedMedecin(e.target.value)}
                >
                  <option value="">Sélectionner un médecin...</option>
                  {MOCK_MEDECINS.map(m => (
                    <option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom} — {m.specialite}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-text-primary">Examen Clinique</h2>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Motif de consultation <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Motif principal de la consultation..."
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                />
              </div>

              {/* Constantes vitales */}
              <div>
                <p className="text-sm font-medium text-text-primary mb-3">Constantes vitales</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'ta', label: 'Tension artérielle', unit: 'mmHg', placeholder: '120/80' },
                    { key: 'fc', label: 'Fréquence cardiaque', unit: 'bpm', placeholder: '72' },
                    { key: 'temperature', label: 'Température', unit: '°C', placeholder: '37.2' },
                    { key: 'poids', label: 'Poids', unit: 'kg', placeholder: '70' },
                    { key: 'taille', label: 'Taille', unit: 'cm', placeholder: '170' },
                    { key: 'spo2', label: 'SpO₂', unit: '%', placeholder: '98' },
                  ].map(({ key, label, unit, placeholder }) => (
                    <div key={key} className="bg-gray-50 border border-border rounded-lg p-3">
                      <label className="block text-xs text-text-secondary mb-1.5">{label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder={placeholder}
                          className="flex-1 bg-white border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 min-w-0"
                          value={(constantes as any)[key]}
                          onChange={e => setConstantes(c => ({ ...c, [key]: e.target.value }))}
                        />
                        <span className="text-xs text-text-secondary font-medium flex-shrink-0">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anamnèse */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Anamnèse</label>
                <textarea
                  rows={4}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Histoire de la maladie, évolution des symptômes..."
                  value={anamnese}
                  onChange={e => setAnamnese(e.target.value)}
                />
              </div>

              {/* Examen clinique */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Examen clinique</label>
                <textarea
                  rows={4}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Résultats de l'examen physique..."
                  value={examenClinique}
                  onChange={e => setExamenClinique(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-text-primary">Diagnostic & Plan de soins</h2>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Diagnostic <span className="text-danger">*</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Diagnostic principal..."
                  value={diagnostic}
                  onChange={e => setDiagnostic(e.target.value)}
                />
              </div>

              <Input
                label="Code CIM-10"
                placeholder="Ex: J18.9, I10, E11.9..."
                value={codeCIM10}
                onChange={e => setCodeCIM10(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Conclusion</label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Conclusion de la consultation..."
                  value={conclusion}
                  onChange={e => setConclusion(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Plan de soins</label>
                <textarea
                  rows={3}
                  className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Prescriptions, examens complémentaires, références..."
                  value={planSoins}
                  onChange={e => setPlanSoins(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Input
                  label="Prochain RDV dans"
                  type="number"
                  min="1"
                  placeholder="Ex: 30"
                  value={prochainRdv}
                  onChange={e => setProchainRdv(e.target.value)}
                  containerClassName="w-40"
                />
                <span className="text-sm text-text-secondary mt-5">jours</span>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {step > 1 && (
                <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} onClick={() => setStep(s => s - 1)}>
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {step === 3 && (
                <Button
                  variant="secondary"
                  onClick={() => handleSubmit(true)}
                  loading={loading}
                >
                  Enregistrer comme brouillon
                </Button>
              )}
              {step < 3 ? (
                <Button
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && (!selectedPatient || !selectedMedecin)}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubmit(false)}
                  loading={loading}
                >
                  Terminer la consultation
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
