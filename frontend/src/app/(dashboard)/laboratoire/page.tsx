'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, FlaskConical, Clock, Microscope, AlertTriangle, CheckCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import StatsBar from '@/components/dashboard/StatsBar';
import type { DemandeAnalyse, StatutDemandeAnalyse } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_DEMANDES: DemandeAnalyse[] = [
  {
    id: 'd1', numero: 'LAB-2025-0312', patientId: 'p1',
    patient: { id: 'p1', ipp: 'IPP-00145', nom: 'KOUASSI', prenom: 'Adjoua Marie', dateNaissance: '1985-03-12', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    medecinId: 'm1', medecin: { id: 'm1', nom: 'DIALLO', prenom: 'Mamadou', specialite: 'Médecine Générale' },
    urgence: true, statut: 'attente_prelevement',
    typesAnalyse: [
      { id: 'ta1', code: 'NFS', nom: 'Numération Formule Sanguine', categorie: 'hematologie', prix: 3500, parametres: [], actif: true },
      { id: 'ta2', code: 'GLYC', nom: 'Glycémie', categorie: 'biochimie', prix: 2000, parametres: [], actif: true },
    ],
    createdAt: '2025-07-10T08:15:00',
  },
  {
    id: 'd2', numero: 'LAB-2025-0311', patientId: 'p2',
    patient: { id: 'p2', ipp: 'IPP-00089', nom: 'TRAORÉ', prenom: 'Ibrahim', dateNaissance: '1972-07-22', sexe: 'M', pays: 'CI', assuranceTiersPayant: true, assuranceNom: 'CNPS', assuranceNumero: 'CNP-44521', statut: 'actif', createdAt: '' },
    medecinId: 'm2', medecin: { id: 'm2', nom: 'BAMBA', prenom: 'Salimata', specialite: 'Cardiologie' },
    urgence: false, statut: 'preleve',
    typesAnalyse: [
      { id: 'ta3', code: 'BILI', nom: 'Bilan lipidique', categorie: 'biochimie', prix: 5000, parametres: [], actif: true },
      { id: 'ta4', code: 'CRP', nom: 'CRP', categorie: 'biochimie', prix: 2500, parametres: [], actif: true },
    ],
    createdAt: '2025-07-10T07:45:00',
    datePrelevement: '2025-07-10T09:00:00',
  },
  {
    id: 'd3', numero: 'LAB-2025-0310', patientId: 'p3',
    patient: { id: 'p3', ipp: 'IPP-00213', nom: 'KONÉ', prenom: 'Fatoumata', dateNaissance: '1990-11-05', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    medecinId: 'm1', medecin: { id: 'm1', nom: 'DIALLO', prenom: 'Mamadou', specialite: 'Médecine Générale' },
    urgence: false, statut: 'en_analyse',
    typesAnalyse: [
      { id: 'ta5', code: 'TSH', nom: 'TSH', categorie: 'hormonologie', prix: 7500, parametres: [], actif: true },
    ],
    createdAt: '2025-07-10T06:30:00',
    datePrelevement: '2025-07-10T07:00:00',
  },
  {
    id: 'd4', numero: 'LAB-2025-0309', patientId: 'p4',
    patient: { id: 'p4', ipp: 'IPP-00178', nom: 'OUATTARA', prenom: 'Seydou', dateNaissance: '1965-02-14', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    medecinId: 'm2', medecin: { id: 'm2', nom: 'BAMBA', prenom: 'Salimata', specialite: 'Cardiologie' },
    urgence: true, statut: 'termine',
    typesAnalyse: [
      { id: 'ta6', code: 'HIV', nom: 'Sérologie HIV', categorie: 'serologie', prix: 8000, parametres: [], actif: true },
      { id: 'ta7', code: 'HBA1C', nom: 'HbA1c', categorie: 'biochimie', prix: 6000, parametres: [], actif: true },
    ],
    createdAt: '2025-07-09T14:00:00',
    datePrelevement: '2025-07-09T14:30:00',
    dateResultats: '2025-07-09T17:00:00',
  },
];

const STATUT_CONFIG: Record<StatutDemandeAnalyse, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'secondary'; dot?: boolean }> = {
  attente_prelevement: { label: 'Attente prélèvement', variant: 'default', dot: true },
  preleve: { label: 'Prélevé', variant: 'secondary', dot: true },
  en_analyse: { label: 'En analyse', variant: 'primary', dot: true },
  termine: { label: 'Terminé', variant: 'success', dot: true },
  annule: { label: 'Annulé', variant: 'danger', dot: true },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function LaboratoirePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState('');

  const critiques = MOCK_DEMANDES.filter(d => d.urgence && d.statut !== 'termine');
  const enAttente = MOCK_DEMANDES.filter(d => d.statut === 'attente_prelevement');
  const enAnalyse = MOCK_DEMANDES.filter(d => d.statut === 'en_analyse' || d.statut === 'preleve');

  const filtered = MOCK_DEMANDES.filter(d => {
    const nom = `${d.patient?.nom} ${d.patient?.prenom}`.toLowerCase();
    const matchSearch = !search || nom.includes(search.toLowerCase()) || d.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || d.statut === statutFilter;
    const matchUrgence = !urgenceFilter || (urgenceFilter === 'urgent' ? d.urgence : !d.urgence);
    return matchSearch && matchStatut && matchUrgence;
  });

  const getActions = (d: DemandeAnalyse) => {
    const actions = [];
    if (d.statut === 'attente_prelevement') {
      actions.push(
        <button key="prelev" onClick={() => alert(`Marquer prélevé: ${d.numero}`)}
          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
          Marquer prélevé
        </button>
      );
    }
    if (d.statut === 'preleve' || d.statut === 'en_analyse') {
      actions.push(
        <button key="saisir" onClick={() => router.push(`/laboratoire/demandes/${d.id}`)}
          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
          Saisir résultats
        </button>
      );
    }
    if (d.statut === 'termine') {
      actions.push(
        <button key="voir" onClick={() => router.push(`/laboratoire/demandes/${d.id}`)}
          className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium">
          Voir résultats
        </button>
      );
    }
    return actions;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Laboratoire</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gestion des demandes d'analyses et résultats</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => router.push('/laboratoire/demandes/nouvelle')}>
          Nouvelle demande d'analyse
        </Button>
      </div>

      {/* Stats Bar */}
      <StatsBar
        className="mb-6"
        stats={[
          { label: 'Demandes du jour', value: MOCK_DEMANDES.length, icon: <FlaskConical size={18} />, color: 'primary' },
          { label: 'Attente prélèvement', value: enAttente.length, icon: <Clock size={18} />, color: 'warning' },
          { label: 'En cours d\'analyse', value: enAnalyse.length, icon: <Microscope size={18} />, color: 'secondary' },
          { label: 'Résultats critiques', value: critiques.length, icon: <AlertTriangle size={18} />, color: 'danger' },
        ]}
      />

      {/* Filtres */}
      <div className="bg-white border border-border rounded-card p-4 mb-5 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher patient, numéro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Statut</label>
          <select className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={statutFilter} onChange={e => setStatutFilter(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="attente_prelevement">Attente prélèvement</option>
            <option value="preleve">Prélevé</option>
            <option value="en_analyse">En analyse</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Urgence</label>
          <select className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={urgenceFilter} onChange={e => setUrgenceFilter(e.target.value)}>
            <option value="">Tout</option>
            <option value="urgent">Urgent uniquement</option>
            <option value="normal">Normal uniquement</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Numéro</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Prescripteur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Analyses demandées</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Urgence</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(d => {
              const cfg = STATUT_CONFIG[d.statut];
              return (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-text-primary">{d.numero}</span>
                    <p className="text-xs text-text-secondary mt-0.5">{formatDate(d.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{d.patient?.nom} {d.patient?.prenom}</p>
                    <p className="text-xs text-text-secondary font-mono">{d.patient?.ipp}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-text-primary">Dr. {d.medecin?.prenom} {d.medecin?.nom}</p>
                    {d.medecin?.specialite && <p className="text-xs text-text-secondary">{d.medecin.specialite}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.typesAnalyse.map(ta => (
                        <span key={ta.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {ta.code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {d.urgence ? (
                      <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        URGENT
                      </span>
                    ) : (
                      <span className="text-xs text-text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={cfg.variant} dot={cfg.dot}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {getActions(d)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <FlaskConical size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aucune demande ne correspond aux filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
