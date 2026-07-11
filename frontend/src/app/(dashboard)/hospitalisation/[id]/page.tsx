'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SejourHospitalisation, NoteMedicale, PrescriptionHospitalisation, SoinInfirmier, TypeSortie } from '@/types';

// ── Données mock pour la démo ─────────────────────────────
const SEJOUR_MOCK: SejourHospitalisation & {
  litNumero: string;
  medecinLabel: string;
  notesMedicales: NoteMedicale[];
  prescriptions: PrescriptionHospitalisation[];
  soinsInfirmiers: SoinInfirmier[];
} = {
  id: 's1',
  numero: 'SEJ-001',
  patientId: 'p1',
  litId: 'l1',
  litNumero: 'MG-101',
  service: 'Médecine Générale',
  medecinId: 'm1',
  medecinLabel: 'Dr. Konan Ahoua — Urgentiste',
  typeHospitalisation: 'urgente',
  diagnosticEntree: 'Crise hypertensive avec complications cardiovasculaires',
  dateAdmission: '2026-07-07T14:00:00Z',
  statut: 'actif',
  createdAt: '2026-07-07T14:00:00Z',
  patient: {
    id: 'p1', ipp: 'IPP001', nom: 'KOFFI', prenom: 'Emmanuel',
    dateNaissance: '1968-03-14', sexe: 'M', pays: 'CI',
    telephone: '+225 07 12 34 56 78', assuranceTiersPayant: true,
    assuranceNom: 'MUGEF-CI', statut: 'actif', createdAt: '',
  },
  notesMedicales: [
    {
      id: 'n1', sejourId: 's1', medecinId: 'm1',
      medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua' },
      contenu: 'Patient stable. TA contrôlée à 145/90 sous traitement. Douleurs thoraciques en régression. Plan : continuer Amlodipine 10mg + Ramipril 10mg. Surveillance rapprochée.',
      constantes: { tensionArterielle: '145/90', frequenceCardiaque: 78, temperature: 36.8, spo2: 97, poids: 82 },
      createdAt: '2026-07-10T08:00:00Z',
    },
    {
      id: 'n2', sejourId: 's1', medecinId: 'm1',
      medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua' },
      contenu: 'Nuit agitée. TA à 170/105 à 2h du matin. Administration IV Nicardipine. Résolution en 30 min. ECG : pas de modification par rapport à la veille.',
      constantes: { tensionArterielle: '170/105', frequenceCardiaque: 95, temperature: 37.1, spo2: 94 },
      createdAt: '2026-07-09T08:30:00Z',
    },
    {
      id: 'n3', sejourId: 's1', medecinId: 'm1',
      medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua' },
      contenu: 'Admission urgences. Patient présentant une crise hypertensive sévère (TA 185/120). Conscience conservée, pas de signe de focalisation neurologique. Bilan biologique en cours.',
      constantes: { tensionArterielle: '185/120', frequenceCardiaque: 112, temperature: 37.2, spo2: 91 },
      createdAt: '2026-07-07T14:00:00Z',
    },
  ],
  prescriptions: [
    { id: 'rx1', sejourId: 's1', medecinId: 'm1', medicamentNom: 'Amlodipine', dosage: '10 mg', posologie: '1 cp/jour le matin', duree: '30 jours', statut: 'dispense', dateDebut: '2026-07-07', createdAt: '2026-07-07T14:00:00Z' },
    { id: 'rx2', sejourId: 's1', medecinId: 'm1', medicamentNom: 'Ramipril', dosage: '10 mg', posologie: '1 cp/jour le soir', duree: '30 jours', statut: 'dispense', dateDebut: '2026-07-07', createdAt: '2026-07-07T14:00:00Z' },
    { id: 'rx3', sejourId: 's1', medecinId: 'm1', medicamentNom: 'Furosémide', dosage: '40 mg', posologie: '1 cp/jour le matin', duree: '7 jours', statut: 'en_attente', dateDebut: '2026-07-09', createdAt: '2026-07-09T09:00:00Z' },
    { id: 'rx4', sejourId: 's1', medecinId: 'm1', medicamentNom: 'Aspirine', dosage: '100 mg', posologie: '1 cp/jour pendant repas', duree: '30 jours', statut: 'en_attente', dateDebut: '2026-07-10', createdAt: '2026-07-10T08:00:00Z' },
  ],
  soinsInfirmiers: [
    { id: 'si1', sejourId: 's1', description: 'Prise des constantes (TA, FC, T°, SpO2)', effectue: true, equipe: 'matin', date: '2026-07-10', heureEffectue: '07:30', infirmier: { id: 'i1', nom: 'Brou', prenom: 'Céleste' } },
    { id: 'si2', sejourId: 's1', description: 'Administration Amlodipine 10mg PO', effectue: true, equipe: 'matin', date: '2026-07-10', heureEffectue: '08:00', infirmier: { id: 'i1', nom: 'Brou', prenom: 'Céleste' } },
    { id: 'si3', sejourId: 's1', description: 'Contrôle diurèse sur 24h', effectue: false, equipe: 'matin', date: '2026-07-10' },
    { id: 'si4', sejourId: 's1', description: 'Prise des constantes (TA, FC, T°, SpO2)', effectue: false, equipe: 'apres_midi', date: '2026-07-10' },
    { id: 'si5', sejourId: 's1', description: 'Administration Ramipril 10mg PO', effectue: false, equipe: 'apres_midi', date: '2026-07-10' },
    { id: 'si6', sejourId: 's1', description: 'Surveillance neurologique', effectue: false, equipe: 'nuit', date: '2026-07-10' },
  ],
};

const TYPE_SORTIE_OPTIONS: { value: TypeSortie; label: string }[] = [
  { value: 'gueri', label: 'Guéri / Amélioré' },
  { value: 'transfert', label: 'Transfert vers un autre établissement' },
  { value: 'deces', label: 'Décès' },
  { value: 'contre_avis_medical', label: 'Contre avis médical (AMA)' },
];

type TabType = 'evolution' | 'prescriptions' | 'soins' | 'documents';

function joursDepuis(dateAdmission: string): number {
  return Math.floor((Date.now() - new Date(dateAdmission).getTime()) / (1000 * 60 * 60 * 24));
}

// ── Modal de sortie ───────────────────────────────────────
function ModalSortie({ onClose, onConfirm }: { onClose: () => void; onConfirm: (data: { typeSortie: TypeSortie; dateSortie: string; instructions: string }) => void }) {
  const [typeSortie, setTypeSortie] = useState<TypeSortie>('gueri');
  const [dateSortie, setDateSortie] = useState(() => new Date().toISOString().slice(0, 16));
  const [instructions, setInstructions] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b rounded-t-2xl" style={{ background: '#B71C1C' }}>
          <h2 className="text-white font-bold text-lg">Sortie du patient</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-light">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type de sortie</label>
            <div className="space-y-2">
              {TYPE_SORTIE_OPTIONS.map(o => (
                <label key={o.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${typeSortie === o.value ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={o.value} checked={typeSortie === o.value} onChange={() => setTypeSortie(o.value)} className="text-red-600" />
                  <span className={`text-sm font-medium ${typeSortie === o.value ? 'text-red-700' : 'text-gray-700'}`}>{o.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date et heure de sortie</label>
            <input type="datetime-local" value={dateSortie} onChange={e => setDateSortie(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions post-hospitalisation</label>
            <textarea rows={3} placeholder="Médicaments à prendre, rendez-vous de suivi, restrictions..."
              value={instructions} onChange={e => setInstructions(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50">Annuler</button>
          <button onClick={() => onConfirm({ typeSortie, dateSortie, instructions })}
            className="flex-grow-[2] py-3 rounded-xl font-bold text-white" style={{ background: '#B71C1C' }}>
            Confirmer la sortie
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal nouvelle note ───────────────────────────────────
function ModalNoteEvolution({ onClose, onAdd }: { onClose: () => void; onAdd: (note: string) => void }) {
  const [contenu, setContenu] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b rounded-t-2xl" style={{ background: '#0D47A1' }}>
          <h2 className="text-white font-bold">Ajouter une note d'évolution</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-light">&times;</button>
        </div>
        <div className="p-6">
          <textarea rows={5} placeholder="Rédiger la note d'évolution médicale..."
            value={contenu} onChange={e => setContenu(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50">Annuler</button>
          <button onClick={() => { if (contenu.trim()) { onAdd(contenu); onClose(); } }}
            disabled={!contenu.trim()}
            className="flex-grow-[2] py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: '#0D47A1' }}>
            Enregistrer la note
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function SejourDetailPage({ params }: { params: { id: string } }) {
  const sejour = SEJOUR_MOCK;
  const [activeTab, setActiveTab] = useState<TabType>('evolution');
  const [showSortie, setShowSortie] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [notes, setNotes] = useState(sejour.notesMedicales);
  const [soins, setSoins] = useState(sejour.soinsInfirmiers);
  const [sorti, setSorti] = useState(false);

  const jours = joursDepuis(sejour.dateAdmission);
  const derniereNote = notes[0];

  const TABS: { id: TabType; label: string }[] = [
    { id: 'evolution',     label: 'Évolution' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'soins',         label: 'Soins infirmiers' },
    { id: 'documents',     label: 'Documents' },
  ];

  const EQUIPES: { id: SoinInfirmier['equipe']; label: string; icon: string }[] = [
    { id: 'matin',     label: 'Équipe matin',       icon: '🌅' },
    { id: 'apres_midi', label: 'Équipe après-midi', icon: '☀️' },
    { id: 'nuit',      label: 'Équipe nuit',         icon: '🌙' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA' }}>
      {/* Breadcrumb */}
      <div className="px-6 pt-4">
        <Link href="/hospitalisation" className="text-xs text-blue-600 hover:underline">← Hospitalisation</Link>
      </div>

      {/* Header séjour */}
      <div className="mx-6 mt-3 mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-start justify-between" style={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)' }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white/70 text-sm font-mono">{sejour.numero}</span>
              {sorti ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">Sorti</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-400 text-white">En cours</span>
              )}
            </div>
            <h1 className="text-white font-black text-2xl">{sejour.patient?.prenom} {sejour.patient?.nom}</h1>
            <p className="text-white/80 text-sm mt-1">{sejour.patient?.ipp} — {sejour.patient?.sexe === 'M' ? 'Homme' : 'Femme'} — né le {new Date(sejour.patient!.dateNaissance).toLocaleDateString('fr-FR')}</p>
          </div>
          {!sorti && (
            <button onClick={() => setShowSortie(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-white/30">
              Sortie du patient
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {[
            { label: 'Service',          value: sejour.service },
            { label: 'Lit',              value: sejour.litNumero },
            { label: 'Médecin référent', value: sejour.medecinLabel },
            { label: 'Durée',            value: `${jours} jour(s) — admission ${new Date(sejour.dateAdmission).toLocaleDateString('fr-FR')}` },
          ].map((info, i) => (
            <div key={i} className="px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{info.label}</p>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">{info.value}</p>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-500 uppercase tracking-wider mb-0.5">Diagnostic d'entrée</p>
          <p className="font-semibold text-blue-900 text-sm">{sejour.diagnosticEntree}</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="mx-6 mb-4 flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
            style={activeTab === tab.id ? { background: '#0D47A1' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      <div className="mx-6 mb-8">
        {/* ── Évolution ─────────────────────── */}
        {activeTab === 'evolution' && (
          <div className="space-y-4">
            {/* Dernières constantes */}
            {derniereNote?.constantes && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Dernières constantes vitales</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { label: 'TA', value: derniereNote.constantes.tensionArterielle, unit: '', alert: false },
                    { label: 'FC', value: derniereNote.constantes.frequenceCardiaque, unit: 'bpm', alert: (derniereNote.constantes.frequenceCardiaque || 0) > 100 },
                    { label: 'Temp.', value: derniereNote.constantes.temperature, unit: '°C', alert: (derniereNote.constantes.temperature || 0) >= 38 },
                    { label: 'SpO2', value: derniereNote.constantes.spo2, unit: '%', alert: (derniereNote.constantes.spo2 || 100) < 95 },
                    { label: 'Poids', value: derniereNote.constantes.poids, unit: 'kg', alert: false },
                  ].map((c, i) => c.value !== undefined ? (
                    <div key={i} className={`rounded-xl p-3 text-center border ${c.alert ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{c.label}</p>
                      <p className={`text-lg font-black ${c.alert ? 'text-red-600' : 'text-gray-800'}`}>{c.value}{c.unit}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            {/* Timeline notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Notes d'évolution</h3>
                <button onClick={() => setShowNoteModal(true)}
                  className="text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90"
                  style={{ background: '#0D47A1' }}>
                  + Ajouter une note
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {notes.map(note => (
                  <div key={note.id} className="px-5 py-4 flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: '#1565C0' }}>
                        {note.medecin?.prenom.charAt(0)}{note.medecin?.nom.charAt(0)}
                      </div>
                      <div className="w-0.5 bg-gray-100 mx-auto mt-1 h-full min-h-[20px]"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-800">{note.medecin?.prenom} {note.medecin?.nom}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString('fr-FR')} à {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{note.contenu}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Prescriptions ─────────────────── */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Prescriptions en cours</h3>
              <button className="text-sm font-semibold text-white px-4 py-2 rounded-lg hover:opacity-90" style={{ background: '#0D47A1' }}>
                + Nouvelle prescription
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {sejour.prescriptions.map(rx => (
                <div key={rx.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-800">{rx.medicamentNom}</span>
                      <span className="text-sm text-gray-500">{rx.dosage}</span>
                    </div>
                    <p className="text-xs text-gray-500">{rx.posologie} — {rx.duree}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Depuis le {new Date(rx.dateDebut).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    {rx.statut === 'dispense' ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#2E7D32' }}>
                        Dispensé
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#F57F17' }}>
                        En attente pharmacie
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Soins infirmiers ───────────────── */}
        {activeTab === 'soins' && (
          <div className="space-y-4">
            {EQUIPES.map(equipe => {
              const soinEquipe = soins.filter(s => s.equipe === equipe.id);
              if (soinEquipe.length === 0) return null;
              const effectues = soinEquipe.filter(s => s.effectue).length;
              return (
                <div key={equipe.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between" style={{ background: '#F5F7FA' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{equipe.icon}</span>
                      <h3 className="font-bold text-gray-800">{equipe.label}</h3>
                    </div>
                    <span className="text-xs text-gray-500">{effectues}/{soinEquipe.length} soins effectués</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {soinEquipe.map(soin => (
                      <label key={soin.id} className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={soin.effectue}
                          onChange={() => setSoins(prev => prev.map(s => s.id === soin.id ? { ...s, effectue: !s.effectue } : s))}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${soin.effectue ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {soin.description}
                          </span>
                          {soin.effectue && soin.infirmier && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Par {soin.infirmier.prenom} {soin.infirmier.nom} à {soin.heureEffectue}
                            </p>
                          )}
                        </div>
                        {soin.effectue && (
                          <span className="text-green-600 text-lg">✓</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Documents ─────────────────────── */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
            <div className="text-5xl mb-3">📄</div>
            <p className="font-semibold">Aucun document disponible</p>
            <p className="text-sm mt-1">Les documents médicaux apparaîtront ici.</p>
            <button className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#0D47A1' }}>
              Ajouter un document
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSortie && (
        <ModalSortie
          onClose={() => setShowSortie(false)}
          onConfirm={({ typeSortie, dateSortie, instructions }) => {
            setSorti(true);
            setShowSortie(false);
          }}
        />
      )}
      {showNoteModal && (
        <ModalNoteEvolution
          onClose={() => setShowNoteModal(false)}
          onAdd={(contenu) => {
            const nouvelleNote: NoteMedicale = {
              id: String(Date.now()),
              sejourId: sejour.id,
              medecinId: 'm1',
              medecin: { id: 'm1', nom: 'Konan', prenom: 'Dr. Ahoua' },
              contenu,
              createdAt: new Date().toISOString(),
            };
            setNotes(prev => [nouvelleNote, ...prev]);
          }}
        />
      )}
    </div>
  );
}
