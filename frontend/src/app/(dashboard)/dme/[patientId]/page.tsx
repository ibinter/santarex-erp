'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Droplets,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  FileText,
  Pill,
  Clock,
  Plus,
  ChevronRight,
  Heart,
  Scissors,
  Users,
  Baby,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { Antecedent } from '@/types';

// ─── Mock data (remplacé par l'API plus tard) ──────────────
const MOCK_PATIENT = {
  id: 'p1',
  ipp: 'IPP-2024-00142',
  nom: 'Kouassi',
  prenom: 'Ama Bernadette',
  dateNaissance: '1982-05-14',
  sexe: 'F' as const,
  groupeSanguin: 'A+',
  photoUrl: null,
  allergies: 'Pénicilline, Aspirine',
  pays: 'CI',
  assuranceTiersPayant: false,
  statut: 'actif' as const,
  createdAt: '2024-01-10',
};

const MOCK_ANTECEDENTS: Antecedent[] = [
  {
    id: 'a1', patientId: 'p1', type: 'medical', description: 'Hypertension artérielle',
    gravite: 'modere', traitement: 'Amlodipine 5mg/j', createdAt: '2022-03-10',
  },
  {
    id: 'a2', patientId: 'p1', type: 'allergie', description: 'Allergie à la Pénicilline',
    gravite: 'grave', reaction: 'Choc anaphylactique', createdAt: '2018-07-22',
  } as any,
  {
    id: 'a3', patientId: 'p1', type: 'chirurgical', description: 'Appendicectomie',
    date: '2015-09-01', gravite: 'leger', createdAt: '2015-09-10',
  },
  {
    id: 'a4', patientId: 'p1', type: 'familial', description: 'Diabète type 2 (mère)',
    gravite: 'modere', createdAt: '2022-03-10',
  },
];

const MOCK_CONSULTATIONS = [
  {
    id: 'c1', date: '2024-06-15', medecin: 'Dr. Koffi Ange', motif: 'Céphalées persistantes',
    diagnostic: 'Migraine sans aura', statut: 'terminee',
  },
  {
    id: 'c2', date: '2024-04-20', medecin: 'Dr. Koffi Ange', motif: 'Contrôle tension',
    diagnostic: 'HTA équilibrée', statut: 'facturee',
  },
  {
    id: 'c3', date: '2024-01-08', medecin: 'Dr. Diallo Mariam', motif: 'Douleurs abdominales',
    diagnostic: 'Gastrite', statut: 'facturee',
  },
];

const MOCK_ANALYSES = [
  { id: 'an1', date: '2024-06-10', examen: 'NFS complète', resultat: 'Normal', statut: 'disponible' },
  { id: 'an2', date: '2024-06-10', examen: 'Glycémie à jeun', resultat: '0.98 g/L', statut: 'disponible' },
  { id: 'an3', date: '2024-04-20', examen: 'Bilan lipidique', resultat: 'Cholestérol 2.1 g/L', statut: 'disponible' },
];

const MOCK_ORDONNANCES = [
  { id: 'o1', date: '2024-06-15', medecin: 'Dr. Koffi Ange', medicaments: ['Amlodipine 5mg', 'Paracétamol 1g'], statut: 'active' },
];

// ─── Helpers ────────────────────────────────────────────────
function getAge(dateNaissance: string): number {
  const today = new Date();
  const dob = new Date(dateNaissance);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function graviteVariant(g: Antecedent['gravite']): 'success' | 'warning' | 'danger' {
  return g === 'leger' ? 'success' : g === 'modere' ? 'warning' : 'danger';
}

const TYPE_META: Record<Antecedent['type'], { label: string; icon: React.ReactNode; color: string }> = {
  medical: { label: 'Médical', icon: <Heart size={16} />, color: 'text-red-600' },
  chirurgical: { label: 'Chirurgical', icon: <Scissors size={16} />, color: 'text-blue-600' },
  familial: { label: 'Familial', icon: <Users size={16} />, color: 'text-purple-600' },
  allergie: { label: 'Allergie', icon: <AlertTriangle size={16} />, color: 'text-orange-600' },
  gynecologique: { label: 'Gynécologique', icon: <Baby size={16} />, color: 'text-pink-600' },
  autre: { label: 'Autre', icon: <FileText size={16} />, color: 'text-gray-600' },
};

const TABS = [
  { id: 'resume', label: 'Résumé', icon: <User size={15} /> },
  { id: 'antecedents', label: 'Antécédents', icon: <Heart size={15} /> },
  { id: 'consultations', label: 'Consultations', icon: <Stethoscope size={15} /> },
  { id: 'ordonnances', label: 'Ordonnances', icon: <Pill size={15} /> },
  { id: 'analyses', label: 'Analyses', icon: <FlaskConical size={15} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Modal Antécédent ───────────────────────────────────────
function AntecedentModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Antecedent>) => void;
}) {
  const [form, setForm] = useState({
    type: 'medical' as Antecedent['type'],
    description: '',
    gravite: 'leger' as Antecedent['gravite'],
    date: '',
    traitement: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un antécédent"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Type *</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as Antecedent['type'] }))}
            >
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Gravité *</label>
            <select
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.gravite}
              onChange={e => setForm(f => ({ ...f, gravite: e.target.value as Antecedent['gravite'] }))}
            >
              <option value="leger">Léger</option>
              <option value="modere">Modéré</option>
              <option value="grave">Grave</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Description *</label>
          <textarea
            required
            rows={3}
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description de l'antécédent..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date (si connue)"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <Input
            label="Traitement en cours"
            value={form.traitement}
            onChange={e => setForm(f => ({ ...f, traitement: e.target.value }))}
            placeholder="Ex: Metformine 500mg/j"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Notes complémentaires</label>
          <textarea
            rows={2}
            className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Informations supplémentaires..."
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function DmePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [activeTab, setActiveTab] = useState<TabId>('resume');
  const [antecedents, setAntecedents] = useState<Antecedent[]>(MOCK_ANTECEDENTS);
  const [showAntecedentModal, setShowAntecedentModal] = useState(false);

  const patient = MOCK_PATIENT;
  const age = getAge(patient.dateNaissance);
  const allergiesActives = patient.allergies?.split(', ') || [];

  const handleAddAntecedent = (data: Partial<Antecedent>) => {
    const newItem: Antecedent = {
      id: `a-${Date.now()}`,
      patientId,
      type: data.type || 'medical',
      description: data.description || '',
      gravite: data.gravite || 'leger',
      traitement: data.traitement,
      notes: data.notes,
      date: data.date,
      createdAt: new Date().toISOString(),
    };
    setAntecedents(prev => [newItem, ...prev]);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Patient Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Retour à la liste
        </button>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {patient.prenom[0]}{patient.nom[0]}
          </div>

          {/* Infos patient */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">
                {patient.prenom} {patient.nom}
              </h1>
              <Badge variant="info">{patient.ipp}</Badge>
              <Badge variant={patient.statut === 'actif' ? 'success' : 'neutral'}>
                {patient.statut}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary flex-wrap">
              <span>{patient.sexe === 'F' ? 'Femme' : patient.sexe === 'M' ? 'Homme' : 'Autre'}</span>
              <span>•</span>
              <span>{age} ans</span>
              <span>•</span>
              <span>Né(e) le {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}</span>
            </div>

            {/* Groupe sanguin + allergies */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {patient.groupeSanguin && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  <Droplets size={12} /> {patient.groupeSanguin}
                </span>
              )}
              {allergiesActives.map(a => (
                <Badge key={a} variant="danger" dot>
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Stethoscope size={14} />}
              onClick={() => router.push('/consultations/nouvelle')}
            >
              Nouvelle consultation
            </Button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mt-4 -mb-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 max-w-6xl mx-auto">

        {/* ── RÉSUMÉ ── */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Informations vitales */}
            <div className="bg-white rounded-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Droplets size={16} className="text-red-500" /> Informations vitales
              </h3>
              <dl className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <dt className="text-text-secondary">Groupe sanguin</dt>
                  <dd className="font-semibold text-red-700">{patient.groupeSanguin || '—'}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-text-secondary">Allergies critiques</dt>
                  <dd className="flex gap-1 flex-wrap justify-end">
                    {allergiesActives.length > 0
                      ? allergiesActives.map(a => <Badge key={a} variant="danger">{a}</Badge>)
                      : <span className="text-success text-xs font-medium">Aucune</span>
                    }
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-text-secondary">Traitement chronique</dt>
                  <dd className="font-medium">Amlodipine 5mg/j</dd>
                </div>
              </dl>
            </div>

            {/* Dernière consultation */}
            <div className="bg-white rounded-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Stethoscope size={16} className="text-primary" /> Dernière consultation
              </h3>
              {MOCK_CONSULTATIONS[0] ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Date</span>
                    <span>{new Date(MOCK_CONSULTATIONS[0].date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Médecin</span>
                    <span className="font-medium">{MOCK_CONSULTATIONS[0].medecin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Motif</span>
                    <span>{MOCK_CONSULTATIONS[0].motif}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Diagnostic</span>
                    <span className="font-medium text-right max-w-[200px]">{MOCK_CONSULTATIONS[0].diagnostic}</span>
                  </div>
                  <button
                    onClick={() => router.push(`/consultations/${MOCK_CONSULTATIONS[0].id}`)}
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Voir le détail <ChevronRight size={12} />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Aucune consultation enregistrée.</p>
              )}
            </div>

            {/* Derniers résultats d'analyses */}
            <div className="bg-white rounded-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <FlaskConical size={16} className="text-purple-600" /> Derniers résultats d'analyses
              </h3>
              <div className="space-y-2">
                {MOCK_ANALYSES.slice(0, 3).map(a => (
                  <div key={a.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium">{a.examen}</p>
                      <p className="text-xs text-text-secondary">{new Date(a.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="text-primary font-medium text-xs">{a.resultat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordonnances actives */}
            <div className="bg-white rounded-card border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Pill size={16} className="text-green-600" /> Ordonnances actives
              </h3>
              {MOCK_ORDONNANCES.filter(o => o.statut === 'active').map(o => (
                <div key={o.id} className="text-sm border border-green-100 bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{new Date(o.date).toLocaleDateString('fr-FR')}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="text-text-secondary text-xs">{o.medecin}</p>
                  <ul className="mt-2 space-y-1">
                    {o.medicaments.map(m => (
                      <li key={m} className="text-xs flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-green-500 inline-block" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANTÉCÉDENTS ── */}
        {activeTab === 'antecedents' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Antécédents médicaux</h2>
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAntecedentModal(true)}
              >
                Ajouter un antécédent
              </Button>
            </div>
            <div className="space-y-3">
              {antecedents.map(ant => {
                const meta = TYPE_META[ant.type];
                return (
                  <div key={ant.id} className="bg-white rounded-card border border-border p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${meta.color}`}>{meta.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                            {meta.label}
                          </span>
                          <Badge variant={graviteVariant(ant.gravite)}>
                            {ant.gravite.charAt(0).toUpperCase() + ant.gravite.slice(1)}
                          </Badge>
                          {ant.date && (
                            <span className="text-xs text-text-secondary">
                              {new Date(ant.date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-text-primary mt-0.5">{ant.description}</p>
                        {ant.traitement && (
                          <p className="text-sm text-text-secondary mt-1">
                            Traitement : <span className="font-medium text-primary">{ant.traitement}</span>
                          </p>
                        )}
                        {ant.notes && (
                          <p className="text-xs text-text-secondary mt-1 italic">{ant.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {antecedents.length === 0 && (
                <div className="text-center py-10 text-text-secondary">
                  <Heart size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Aucun antécédent enregistré.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONSULTATIONS ── */}
        {activeTab === 'consultations' && (
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-5">Historique des consultations</h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {MOCK_CONSULTATIONS.map(c => (
                  <div key={c.id} className="flex gap-4">
                    {/* Dot */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0 z-10 bg-white">
                      <Stethoscope size={16} className="text-primary" />
                    </div>
                    {/* Card */}
                    <div
                      className="flex-1 bg-white rounded-card border border-border p-4 cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => router.push(`/consultations/${c.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <Badge variant={c.statut === 'terminee' ? 'success' : c.statut === 'facturee' ? 'neutral' : 'info'}>
                              {c.statut}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">{c.medecin}</p>
                        </div>
                        <ChevronRight size={16} className="text-text-secondary mt-0.5" />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-text-secondary text-xs">Motif :</span>
                          <p className="font-medium">{c.motif}</p>
                        </div>
                        <div>
                          <span className="text-text-secondary text-xs">Diagnostic :</span>
                          <p className="font-medium">{c.diagnostic}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDONNANCES ── */}
        {activeTab === 'ordonnances' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Ordonnances</h2>
              <Button leftIcon={<Plus size={14} />} onClick={() => router.push('/consultations/nouvelle')}>
                Nouvelle ordonnance
              </Button>
            </div>
            <div className="space-y-4">
              {MOCK_ORDONNANCES.map(o => (
                <div key={o.id} className="bg-white rounded-card border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Pill size={16} className="text-green-600" />
                      <span className="font-semibold text-sm text-text-primary">
                        {new Date(o.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-xs text-text-secondary">— {o.medecin}</span>
                    </div>
                    <Badge variant={o.statut === 'active' ? 'success' : 'neutral'}>
                      {o.statut === 'active' ? 'Active' : 'Expirée'}
                    </Badge>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Médicaments prescrits</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {o.medicaments.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                          <span className="w-5 h-5 rounded-full bg-green-200 text-green-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-text-primary">{m}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs text-primary hover:underline flex items-center gap-1">
                        <FileText size={12} /> Imprimer l'ordonnance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {MOCK_ORDONNANCES.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  <Pill size={36} className="mx-auto mb-2 opacity-30" />
                  <p>Aucune ordonnance pour ce patient.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYSES ── */}
        {activeTab === 'analyses' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Résultats d'analyses</h2>
              <Button leftIcon={<Plus size={14} />} onClick={() => router.push('/laboratoire/demandes/nouvelle')}>
                Demander une analyse
              </Button>
            </div>
            <div className="bg-white rounded-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Examen</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Résultat</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_ANALYSES.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">{a.examen}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${a.resultat === 'Normal' ? 'text-success' : 'text-primary'}`}>
                          {a.resultat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={a.statut === 'disponible' ? 'success' : 'warning'} dot>
                          {a.statut === 'disponible' ? 'Disponible' : 'En attente'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {MOCK_ANALYSES.length === 0 && (
                <div className="text-center py-12 text-text-secondary">
                  <FlaskConical size={36} className="mx-auto mb-2 opacity-30" />
                  <p>Aucune analyse pour ce patient.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-card border border-border p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-text-secondary opacity-30" />
            <p className="text-text-secondary">Aucun document disponible pour ce patient.</p>
            <Button className="mt-4" variant="secondary" leftIcon={<Plus size={14} />}>
              Ajouter un document
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AntecedentModal
        isOpen={showAntecedentModal}
        onClose={() => setShowAntecedentModal(false)}
        onSave={handleAddAntecedent}
      />
    </div>
  );
}
