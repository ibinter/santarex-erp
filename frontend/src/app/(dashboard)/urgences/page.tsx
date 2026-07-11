'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PatientUrgence, CategorieManchester } from '@/types';
import AdmissionUrgenceModal from '@/components/urgences/AdmissionUrgenceModal';
import TriageModal from '@/components/urgences/TriageModal';

// ── Couleurs Manchester ──────────────────────────────────
const MANCHESTER_CONFIG: Record<CategorieManchester, { bg: string; border: string; text: string; badge: string; label: string; order: number }> = {
  ROUGE:  { bg: '#FFEBEE', border: '#C62828', text: '#B71C1C', badge: '#C62828', label: '🔴 ROUGE',  order: 0 },
  ORANGE: { bg: '#FFF3E0', border: '#E65100', text: '#BF360C', badge: '#E65100', label: '🟠 ORANGE', order: 1 },
  JAUNE:  { bg: '#FFFDE7', border: '#F57F17', text: '#E65100', badge: '#F57F17', label: '🟡 JAUNE',  order: 2 },
  VERT:   { bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20', badge: '#2E7D32', label: '🟢 VERT',   order: 3 },
  NOIR:   { bg: '#F5F5F5', border: '#212121', text: '#000000', badge: '#212121', label: '⬛ DÉCÉDÉ', order: 4 },
};

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  attente_triage: { label: 'Attente triage', color: '#546E7A' },
  en_triage:      { label: 'En triage',      color: '#00838F' },
  en_soins:       { label: 'En soins',        color: '#1565C0' },
  en_observation: { label: 'En observation', color: '#6A1B9A' },
};

// ── Données mock ─────────────────────────────────────────
const MOCK_PATIENTS: PatientUrgence[] = [
  {
    id: '1', numero: 'URG-20240001', categorieManchester: 'ROUGE', statut: 'en_soins',
    modeArrivee: 'ambulance', motif: 'Douleur thoracique intense, dyspnée sévère',
    constantes: { tensionArterielle: '170/110', frequenceCardiaque: 112, temperature: 37.2, spo2: 88, glasgow: 14 },
    heureArrivee: new Date(Date.now() - 155 * 60000).toISOString(), createdAt: new Date().toISOString(),
    medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua', specialite: 'Urgentiste' },
    nomProvisoire: undefined,
    patient: { id: 'p1', ipp: 'IPP001', nom: 'KOFFI', prenom: 'Emmanuel', dateNaissance: '1968-03-14', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
  },
  {
    id: '2', numero: 'URG-20240002', categorieManchester: 'ORANGE', statut: 'en_triage',
    modeArrivee: 'pompiers', motif: 'Traumatisme crânien suite à accident de la route',
    constantes: { tensionArterielle: '145/95', frequenceCardiaque: 98, temperature: 36.8, spo2: 95, glasgow: 12 },
    heureArrivee: new Date(Date.now() - 22 * 60000).toISOString(), createdAt: new Date().toISOString(),
    nomProvisoire: 'Patient non identifié',
    medecin: { id: 'm2', nom: 'Mensah', prenom: 'Dr. Ama', specialite: 'Neurologie' },
  },
  {
    id: '3', numero: 'URG-20240003', categorieManchester: 'JAUNE', statut: 'attente_triage',
    modeArrivee: 'propre_pied', motif: 'Douleurs abdominales modérées depuis 6h',
    constantes: { tensionArterielle: '118/76', frequenceCardiaque: 82, temperature: 37.8, spo2: 98 },
    heureArrivee: new Date(Date.now() - 45 * 60000).toISOString(), createdAt: new Date().toISOString(),
    patient: { id: 'p2', ipp: 'IPP002', nom: 'TOURÉ', prenom: 'Fatima', dateNaissance: '1990-07-22', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
  },
  {
    id: '4', numero: 'URG-20240004', categorieManchester: 'VERT', statut: 'attente_triage',
    modeArrivee: 'accompagne', motif: 'Fièvre légère et toux depuis 3 jours',
    constantes: { temperature: 38.1, frequenceCardiaque: 76, spo2: 99 },
    heureArrivee: new Date(Date.now() - 15 * 60000).toISOString(), createdAt: new Date().toISOString(),
    patient: { id: 'p3', ipp: 'IPP003', nom: 'BAMBA', prenom: 'Moussa', dateNaissance: '2010-01-05', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
  },
  {
    id: '5', numero: 'URG-20240005', categorieManchester: 'ROUGE', statut: 'en_observation',
    modeArrivee: 'smur', motif: 'AVC ischémique — déficit moteur hémicorps gauche',
    constantes: { tensionArterielle: '185/120', frequenceCardiaque: 88, temperature: 37.5, spo2: 91, glasgow: 10 },
    heureArrivee: new Date(Date.now() - 90 * 60000).toISOString(), createdAt: new Date().toISOString(),
    patient: { id: 'p4', ipp: 'IPP004', nom: 'COULIBALY', prenom: 'Mariam', dateNaissance: '1955-11-30', sexe: 'F', pays: 'CI', assuranceTiersPayant: true, statut: 'actif', createdAt: '' },
    medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua', specialite: 'Urgentiste' },
  },
];

// ── Utilitaires ───────────────────────────────────────────
function tempsDepuisArrivee(heureArrivee: string): string {
  const diff = Math.floor((Date.now() - new Date(heureArrivee).getTime()) / 60000);
  if (diff < 60) return `${diff}min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

function getInitiales(medecin?: PatientUrgence['medecin']): string {
  if (!medecin) return '?';
  return `${medecin.prenom.charAt(0)}${medecin.nom.charAt(0)}`.toUpperCase();
}

function getNomPatient(p: PatientUrgence): string {
  if (p.patient) return `${p.patient.prenom} ${p.patient.nom}`;
  return p.nomProvisoire || 'Patient non identifié';
}

// ── Composant Card Patient ────────────────────────────────
function PatientCard({
  patient,
  onTriage,
  onDossier,
  onPriseEnCharge,
}: {
  patient: PatientUrgence;
  onTriage: () => void;
  onDossier: () => void;
  onPriseEnCharge: () => void;
}) {
  const cfg = MANCHESTER_CONFIG[patient.categorieManchester];
  const statutCfg = STATUT_LABELS[patient.statut] || { label: patient.statut, color: '#546E7A' };

  return (
    <div
      className="rounded-2xl border-2 p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: cfg.border }}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-xs tracking-widest">{patient.numero}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            {cfg.label.split(' ')[1]}
          </span>
        </div>
        <span className="text-white/90 text-xs font-semibold tabular-nums">
          ⏱ {tempsDepuisArrivee(patient.heureArrivee)}
        </span>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-sm" style={{ color: cfg.text }}>{getNomPatient(patient)}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{patient.motif}</p>
          </div>
          {/* Statut badge */}
          <span
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
            style={{ backgroundColor: statutCfg.color }}
          >
            {statutCfg.label}
          </span>
        </div>

        {/* Constantes */}
        {patient.constantes && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 border-t pt-2" style={{ borderColor: `${cfg.border}30` }}>
            {patient.constantes.tensionArterielle && <span><span className="font-semibold">TA</span> {patient.constantes.tensionArterielle}</span>}
            {patient.constantes.frequenceCardiaque && <span><span className="font-semibold">FC</span> {patient.constantes.frequenceCardiaque} bpm</span>}
            {patient.constantes.temperature && <span><span className="font-semibold">T°</span> {patient.constantes.temperature}°C</span>}
            {patient.constantes.spo2 && (
              <span className={patient.constantes.spo2 < 92 ? 'text-red-600 font-bold' : ''}>
                <span className="font-semibold">SpO2</span> {patient.constantes.spo2}%
              </span>
            )}
            {patient.constantes.glasgow && <span><span className="font-semibold">GCS</span> {patient.constantes.glasgow}/15</span>}
          </div>
        )}

        {/* Footer: médecin + actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {patient.medecin ? (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: '#1565C0' }}
                >
                  {getInitiales(patient.medecin)}
                </div>
                <span className="text-xs text-gray-500">{patient.medecin.prenom} {patient.medecin.nom}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Médecin non assigné</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onTriage}
              className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors hover:opacity-80"
              style={{ borderColor: cfg.border, color: cfg.text, background: 'rgba(255,255,255,0.7)' }}
            >
              Triage
            </button>
            <button
              onClick={onPriseEnCharge}
              className="text-xs px-2.5 py-1 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: cfg.border }}
            >
              Prendre en charge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function UrgencesPage() {
  const [patients, setPatients] = useState<PatientUrgence[]>(MOCK_PATIENTS);
  const [heure, setHeure] = useState(new Date());
  const [showAdmission, setShowAdmission] = useState(false);
  const [triagePatient, setTriagePatient] = useState<PatientUrgence | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mise à jour heure + refresh simulé toutes les 30s
  useEffect(() => {
    const tick = setInterval(() => setHeure(new Date()), 1000);
    const refresh = setInterval(() => setLastRefresh(new Date()), 30000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, []);

  const patientsActifs = patients.filter(p => !['sorti', 'hospitalise', 'decede'].includes(p.statut));
  const patientsTries = [...patientsActifs].sort((a, b) =>
    MANCHESTER_CONFIG[a.categorieManchester].order - MANCHESTER_CONFIG[b.categorieManchester].order
  );

  const stats = {
    rouge:  patientsActifs.filter(p => p.categorieManchester === 'ROUGE').length,
    orange: patientsActifs.filter(p => p.categorieManchester === 'ORANGE').length,
    jaune:  patientsActifs.filter(p => p.categorieManchester === 'JAUNE').length,
    vert:   patientsActifs.filter(p => p.categorieManchester === 'VERT').length,
    total:  patientsActifs.length,
  };

  const handleAdmit = useCallback((data: Partial<PatientUrgence>) => {
    const nouveau: PatientUrgence = {
      id: String(Date.now()),
      numero: `URG-${Date.now().toString().slice(-8)}`,
      categorieManchester: data.categorieManchester || 'VERT',
      statut: 'attente_triage',
      modeArrivee: data.modeArrivee || 'propre_pied',
      motif: data.motif || '',
      constantes: data.constantes,
      nomProvisoire: data.nomProvisoire,
      heureArrivee: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setPatients(prev => [...prev, nouveau]);
  }, []);

  const handleUpdateTriage = useCallback((id: string, data: Partial<PatientUrgence>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>
      {/* Header urgent */}
      <div className="sticky top-0 z-20" style={{ background: '#B71C1C' }}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-black text-xl tracking-wider">🚨 URGENCES</h1>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-white/90 text-sm font-mono tabular-nums">
                {heure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-white/60 text-xs">
              Actualisation : {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <button
            onClick={() => setShowAdmission(true)}
            className="flex items-center gap-2 bg-white text-red-800 font-bold px-5 py-2.5 rounded-xl shadow-lg hover:bg-red-50 transition-colors text-sm"
          >
            + Admettre un patient
          </button>
        </div>

        {/* StatsBar */}
        <div className="flex border-t border-white/20">
          {[
            { label: 'Critiques', value: stats.rouge,  color: '#EF9A9A', dot: '#EF5350' },
            { label: 'Urgences',  value: stats.orange, color: '#FFCC80', dot: '#FF9800' },
            { label: 'Semi-urg.', value: stats.jaune,  color: '#FFF176', dot: '#FFEB3B' },
            { label: 'Non urg.',  value: stats.vert,   color: '#A5D6A7', dot: '#4CAF50' },
            { label: 'Total actifs', value: stats.total, color: 'rgba(255,255,255,0.9)', dot: '#fff' },
          ].map((s, i) => (
            <div key={i} className="flex-1 px-4 py-2.5 flex items-center gap-2 border-r border-white/10 last:border-r-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }}></span>
              <div>
                <div className="text-white/70 text-[10px] uppercase tracking-wider">{s.label}</div>
                <div className="font-black text-xl leading-tight" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grille patients */}
      <div className="p-6">
        {patientsTries.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold">Aucun patient en urgences</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {patientsTries.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onTriage={() => setTriagePatient(patient)}
                onDossier={() => {}}
                onPriseEnCharge={() => {
                  handleUpdateTriage(patient.id, { statut: 'en_soins' });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdmission && (
        <AdmissionUrgenceModal
          onClose={() => setShowAdmission(false)}
          onAdmit={handleAdmit}
        />
      )}
      {triagePatient && (
        <TriageModal
          patient={triagePatient}
          onClose={() => setTriagePatient(null)}
          onUpdate={handleUpdateTriage}
        />
      )}
    </div>
  );
}
