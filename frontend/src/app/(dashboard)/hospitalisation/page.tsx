'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { LitHospitalier, SejourHospitalisation, ServiceHospitalisation } from '@/types';
import AdmissionHospitalisationModal from '@/components/hospitalisation/AdmissionHospitalisationModal';

// ── Couleurs statut lit ───────────────────────────────────
const LIT_CONFIG = {
  libre:      { bg: '#fff',     border: '#CBD5E1', text: '#64748B', label: 'Libre',       icon: '🛏️' },
  occupe:     { bg: '#E3F2FD',  border: '#1976D2', text: '#0D47A1', label: 'Occupé',      icon: '👤' },
  nettoyage:  { bg: '#F5F5F5',  border: '#90A4AE', text: '#546E7A', label: 'Nettoyage',  icon: '🧹' },
  reserve:    { bg: '#FFFDE7',  border: '#F9A825', text: '#E65100', label: 'Réservé',     icon: '📋' },
};

const SERVICES: ServiceHospitalisation[] = [
  'Médecine Générale', 'Chirurgie', 'Maternité', 'Pédiatrie',
  'Réanimation', 'Orthopédie', 'Ophtalmologie',
];

// ── Données mock ─────────────────────────────────────────
const LITS_MOCK: LitHospitalier[] = [
  { id: 'l1',  numero: 'MG-101', service: 'Médecine Générale', salle: 'Salle A', statut: 'occupe',    patientNom: 'Koffi Emmanuel',   joursHospitalisation: 3 },
  { id: 'l2',  numero: 'MG-102', service: 'Médecine Générale', salle: 'Salle A', statut: 'libre' },
  { id: 'l3',  numero: 'MG-103', service: 'Médecine Générale', salle: 'Salle A', statut: 'nettoyage' },
  { id: 'l4',  numero: 'MG-201', service: 'Médecine Générale', salle: 'Salle B', statut: 'occupe',    patientNom: 'Touré Fatima',     joursHospitalisation: 1 },
  { id: 'l5',  numero: 'MG-202', service: 'Médecine Générale', salle: 'Salle B', statut: 'libre' },
  { id: 'l6',  numero: 'MG-203', service: 'Médecine Générale', salle: 'Salle B', statut: 'reserve',   patientReserveNom: 'Coulibaly A.', dateAdmissionPrevue: '2026-07-12' },
  { id: 'l7',  numero: 'CH-101', service: 'Chirurgie', salle: 'Salle C', statut: 'occupe',    patientNom: 'Bamba Moussa',     joursHospitalisation: 5 },
  { id: 'l8',  numero: 'CH-102', service: 'Chirurgie', salle: 'Salle C', statut: 'libre' },
  { id: 'l9',  numero: 'MA-101', service: 'Maternité', salle: 'Salle D', statut: 'occupe',    patientNom: 'Diallo Aminata',   joursHospitalisation: 2 },
  { id: 'l10', numero: 'MA-102', service: 'Maternité', salle: 'Salle D', statut: 'libre' },
  { id: 'l11', numero: 'PE-101', service: 'Pédiatrie', salle: 'Salle E', statut: 'libre' },
  { id: 'l12', numero: 'PE-102', service: 'Pédiatrie', salle: 'Salle E', statut: 'libre' },
  { id: 'l13', numero: 'REA-01', service: 'Réanimation', salle: 'Réa', statut: 'occupe',    patientNom: 'Coulibaly Mariam', joursHospitalisation: 7 },
  { id: 'l14', numero: 'REA-02', service: 'Réanimation', salle: 'Réa', statut: 'occupe',    patientNom: 'Kra Serge',        joursHospitalisation: 4 },
  { id: 'l15', numero: 'OR-101', service: 'Orthopédie', salle: 'Salle F', statut: 'libre' },
  { id: 'l16', numero: 'OP-101', service: 'Ophtalmologie', salle: 'Salle G', statut: 'nettoyage' },
];

const SEJOURS_MOCK: (SejourHospitalisation & { litNumero: string; medecinLabel: string })[] = [
  { id: 's1', numero: 'SEJ-001', patientId: 'p1', litId: 'l1', litNumero: 'MG-101', service: 'Médecine Générale', medecinId: 'm1', medecinLabel: 'Dr. Konan Ahoua', typeHospitalisation: 'urgente', diagnosticEntree: 'Crise hypertensive', dateAdmission: '2026-07-07T14:00:00Z', statut: 'actif', createdAt: '2026-07-07T14:00:00Z', patient: { id: 'p1', ipp: 'IPP001', nom: 'KOFFI', prenom: 'Emmanuel', dateNaissance: '1968-03-14', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' } },
  { id: 's2', numero: 'SEJ-002', patientId: 'p2', litId: 'l4', litNumero: 'MG-201', service: 'Médecine Générale', medecinId: 'm2', medecinLabel: 'Dr. Mensah Ama', typeHospitalisation: 'programmee', diagnosticEntree: 'Appendicite aiguë', dateAdmission: '2026-07-09T08:30:00Z', statut: 'actif', createdAt: '2026-07-09T08:30:00Z', patient: { id: 'p2', ipp: 'IPP002', nom: 'TOURÉ', prenom: 'Fatima', dateNaissance: '1990-07-22', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' } },
  { id: 's3', numero: 'SEJ-003', patientId: 'p3', litId: 'l7', litNumero: 'CH-101', service: 'Chirurgie', medecinId: 'm3', medecinLabel: 'Dr. Akoto Pierre', typeHospitalisation: 'urgente', diagnosticEntree: 'Fracture fémur droit', dateAdmission: '2026-07-05T16:00:00Z', statut: 'actif', createdAt: '2026-07-05T16:00:00Z', patient: { id: 'p3', ipp: 'IPP003', nom: 'BAMBA', prenom: 'Moussa', dateNaissance: '2010-01-05', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' } },
  { id: 's4', numero: 'SEJ-004', patientId: 'p4', litId: 'l13', litNumero: 'REA-01', service: 'Réanimation', medecinId: 'm1', medecinLabel: 'Dr. Konan Ahoua', typeHospitalisation: 'urgente', diagnosticEntree: 'AVC ischémique', dateAdmission: '2026-07-03T09:15:00Z', statut: 'actif', createdAt: '2026-07-03T09:15:00Z', patient: { id: 'p4', ipp: 'IPP004', nom: 'COULIBALY', prenom: 'Mariam', dateNaissance: '1955-11-30', sexe: 'F', pays: 'CI', assuranceTiersPayant: true, statut: 'actif', createdAt: '' } },
];

function joursDepuis(dateAdmission: string): number {
  return Math.floor((Date.now() - new Date(dateAdmission).getTime()) / (1000 * 60 * 60 * 24));
}

function LitCard({ lit, onClick }: { lit: LitHospitalier; onClick: () => void }) {
  const cfg = LIT_CONFIG[lit.statut];
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-xl border-2 p-3 text-left transition-all hover:shadow-md hover:scale-[1.02] flex flex-col justify-between"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div>
        <div className="text-xs font-bold" style={{ color: cfg.text }}>{lit.numero}</div>
        <div className="text-lg mt-1">{cfg.icon}</div>
      </div>
      {lit.statut === 'occupe' && (
        <div>
          <p className="text-[10px] font-semibold text-blue-800 leading-tight line-clamp-2">{lit.patientNom}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">{lit.joursHospitalisation}j</p>
        </div>
      )}
      {lit.statut === 'reserve' && (
        <div>
          <p className="text-[10px] font-semibold text-orange-700 leading-tight line-clamp-1">{lit.patientReserveNom}</p>
          <p className="text-[10px] text-orange-600 mt-0.5">{lit.dateAdmissionPrevue}</p>
        </div>
      )}
      {lit.statut === 'libre' && (
        <p className="text-[10px] text-gray-400">Disponible</p>
      )}
      {lit.statut === 'nettoyage' && (
        <p className="text-[10px] text-gray-400">En cours</p>
      )}
    </button>
  );
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  programmee:        { label: 'Programmée',        color: '#00838F' },
  urgente:           { label: 'Urgente',            color: '#C62828' },
  transfert_interne: { label: 'Transfert interne',  color: '#1565C0' },
  transfert_externe: { label: 'Transfert externe',  color: '#6A1B9A' },
};

export default function HospitalisationPage() {
  const [service, setService] = useState<ServiceHospitalisation | 'Tous'>('Tous');
  const [showAdmission, setShowAdmission] = useState(false);
  const [sejours, setSejours] = useState(SEJOURS_MOCK);
  const [lits] = useState(LITS_MOCK);

  const litsFiltered = service === 'Tous' ? lits : lits.filter(l => l.service === service);

  const stats = {
    occupes:    lits.filter(l => l.statut === 'occupe').length,
    libres:     lits.filter(l => l.statut === 'libre').length,
    total:      lits.length,
    sortiesJour: 2, // mock
  };
  const tauxOccupation = Math.round((stats.occupes / stats.total) * 100);

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#0D47A1' }}>🛏️ Hospitalisation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des lits et séjours</p>
        </div>
        <button
          onClick={() => setShowAdmission(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md hover:opacity-90 transition"
          style={{ background: '#0D47A1' }}
        >
          + Admettre un patient
        </button>
      </div>

      {/* StatsBar */}
      <div className="mx-6 mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Lits occupés',          value: stats.occupes,      color: '#1565C0', bg: '#E3F2FD', icon: '🔵' },
          { label: 'Lits disponibles',       value: stats.libres,       color: '#2E7D32', bg: '#E8F5E9', icon: '🟢' },
          { label: "Taux d'occupation",      value: `${tauxOccupation}%`, color: tauxOccupation > 85 ? '#C62828' : '#F57F17', bg: tauxOccupation > 85 ? '#FFEBEE' : '#FFFDE7', icon: '📊' },
          { label: 'Sorties prévues auj.',   value: stats.sortiesJour,  color: '#00838F', bg: '#E0F7FA', icon: '🚪' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-4 shadow-sm border border-gray-100" style={{ background: s.bg }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sélecteur service */}
      <div className="mx-6 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Tous', ...SERVICES] as const).map(s => (
            <button
              key={s}
              onClick={() => setService(s as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${service === s ? 'text-white shadow' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
              style={service === s ? { background: '#0D47A1', borderColor: '#0D47A1' } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Plan des lits */}
      <div className="mx-6 mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800">Plan des lits</h2>
          <div className="flex gap-3 text-xs">
            {Object.entries(LIT_CONFIG).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm border" style={{ background: v.bg, borderColor: v.border }}></span>
                {v.label}
              </span>
            ))}
          </div>
        </div>
        {litsFiltered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucun lit dans ce service</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {litsFiltered.map(lit => (
              <LitCard key={lit.id} lit={lit} onClick={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* Tableau séjours actifs */}
      <div className="mx-6 mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Séjours actifs</h2>
          <span className="text-sm text-gray-400">{sejours.length} séjour(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Lit</th>
                <th className="px-4 py-3">Médecin référent</th>
                <th className="px-4 py-3">Admission</th>
                <th className="px-4 py-3">Jours</th>
                <th className="px-4 py-3">Diagnostic</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sejours.map(sejour => {
                const badge = TYPE_BADGE[sejour.typeHospitalisation];
                const jours = joursDepuis(sejour.dateAdmission);
                return (
                  <tr key={sejour.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{sejour.numero}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{sejour.patient?.prenom} {sejour.patient?.nom}</div>
                      <div className="text-xs text-gray-400">{sejour.patient?.ipp}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sejour.service}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold">{sejour.litNumero}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sejour.medecinLabel}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(sejour.dateAdmission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${jours > 7 ? 'text-orange-600' : 'text-gray-700'}`}>{jours}j</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                      <span className="line-clamp-1 text-xs">{sejour.diagnosticEntree}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: badge?.color || '#546E7A' }}
                      >
                        {badge?.label || sejour.typeHospitalisation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/hospitalisation/${sejour.id}`}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Voir dossier →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdmission && (
        <AdmissionHospitalisationModal
          onClose={() => setShowAdmission(false)}
          onAdmit={(data) => {
            // En production, appeler api.admettreHospitalisation(data)
            setShowAdmission(false);
          }}
        />
      )}
    </div>
  );
}
