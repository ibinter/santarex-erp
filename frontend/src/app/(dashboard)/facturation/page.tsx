'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileText, TrendingUp, AlertCircle, Percent, Eye, CreditCard, X, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import StatsBar from '@/components/dashboard/StatsBar';
import type { Facture, StatutFacture } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const MOCK_FACTURES: Facture[] = [
  {
    id: 'f1', numero: 'FAC-2025-0412', patientId: 'p2',
    patient: { id: 'p2', ipp: 'IPP-00089', nom: 'TRAORÉ', prenom: 'Ibrahim', dateNaissance: '1972-07-22', sexe: 'M', pays: 'CI', assuranceTiersPayant: true, assuranceNom: 'CNPS', assuranceNumero: 'CNP-44521', statut: 'actif', createdAt: '' },
    statut: 'partiellement_payee', lignes: [],
    sousTotal: 45000, tva: 0, total: 45000, tiersPayant: true, assuranceNom: 'CNPS',
    partAssurance: 27000, partPatient: 18000, montantPaye: 10000, resteAPayer: 8000,
    dateEmission: '2025-07-09', createdAt: '2025-07-09',
  },
  {
    id: 'f2', numero: 'FAC-2025-0411', patientId: 'p1',
    patient: { id: 'p1', ipp: 'IPP-00145', nom: 'KOUASSI', prenom: 'Adjoua Marie', dateNaissance: '1985-03-12', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    statut: 'payee', lignes: [],
    sousTotal: 22000, tva: 0, total: 22000, tiersPayant: false, assuranceNom: undefined,
    partAssurance: 0, partPatient: 22000, montantPaye: 22000, resteAPayer: 0,
    dateEmission: '2025-07-09', createdAt: '2025-07-09',
  },
  {
    id: 'f3', numero: 'FAC-2025-0410', patientId: 'p3',
    patient: { id: 'p3', ipp: 'IPP-00213', nom: 'KONÉ', prenom: 'Fatoumata', dateNaissance: '1990-11-05', sexe: 'F', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    statut: 'emise', lignes: [],
    sousTotal: 35000, tva: 0, total: 35000, tiersPayant: false, assuranceNom: undefined,
    partAssurance: 0, partPatient: 35000, montantPaye: 0, resteAPayer: 35000,
    dateEmission: '2025-07-10', createdAt: '2025-07-10',
  },
  {
    id: 'f4', numero: 'FAC-2025-0409', patientId: 'p4',
    patient: { id: 'p4', ipp: 'IPP-00178', nom: 'OUATTARA', prenom: 'Seydou', dateNaissance: '1965-02-14', sexe: 'M', pays: 'CI', assuranceTiersPayant: false, statut: 'actif', createdAt: '' },
    statut: 'brouillon', lignes: [],
    sousTotal: 15000, tva: 0, total: 15000, tiersPayant: false, assuranceNom: undefined,
    partAssurance: 0, partPatient: 15000, montantPaye: 0, resteAPayer: 15000,
    dateEmission: undefined, createdAt: '2025-07-10',
  },
];

const STATUT_CONFIG: Record<StatutFacture, { label: string; variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; strikethrough?: boolean }> = {
  brouillon: { label: 'Brouillon', variant: 'neutral' },
  emise: { label: 'Émise', variant: 'info' },
  partiellement_payee: { label: 'Part. payée', variant: 'warning' },
  payee: { label: 'Payée', variant: 'success' },
  annulee: { label: 'Annulée', variant: 'danger', strikethrough: true },
};

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function FacturationPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const caJour = MOCK_FACTURES.filter(f => f.statut === 'payee' || f.statut === 'partiellement_payee')
    .reduce((acc, f) => acc + f.montantPaye, 0);
  const caMois = caJour * 22; // mock
  const impayees = MOCK_FACTURES.filter(f => f.resteAPayer > 0);
  const totalImpaye = impayees.reduce((acc, f) => acc + f.resteAPayer, 0);
  const tauxRecouvrement = Math.round((caJour / (caJour + totalImpaye)) * 100);

  const filtered = MOCK_FACTURES.filter(f => {
    const nom = `${f.patient?.nom} ${f.patient?.prenom}`.toLowerCase();
    const matchSearch = !search || nom.includes(search.toLowerCase()) || f.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !statutFilter || f.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Facturation</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gestion des factures et encaissements</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => router.push('/facturation/nouvelle')}>
          Nouvelle facture
        </Button>
      </div>

      {/* Stats Bar */}
      <StatsBar
        className="mb-6"
        stats={[
          { label: 'CA du jour', value: formatXOF(caJour), icon: <TrendingUp size={18} />, color: 'success' },
          { label: 'CA du mois', value: formatXOF(caMois), icon: <FileText size={18} />, color: 'primary' },
          { label: `Impayées (${impayees.length})`, value: formatXOF(totalImpaye), icon: <AlertCircle size={18} />, color: 'danger' },
          { label: 'Taux de recouvrement', value: `${tauxRecouvrement}%`, icon: <Percent size={18} />, color: 'secondary' },
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
            <option value="brouillon">Brouillon</option>
            <option value="emise">Émise</option>
            <option value="partiellement_payee">Partiellement payée</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Date début</label>
          <input type="date" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Date fin</label>
          <input type="date" className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={dateFin} onChange={e => setDateFin(e.target.value)} />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Numéro</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date émission</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Montant TTC</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Montant payé</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Reste à payer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Assurance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(f => {
              const cfg = STATUT_CONFIG[f.statut];
              return (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-semibold text-text-primary ${cfg.strikethrough ? 'line-through text-text-secondary' : ''}`}>
                      {f.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{f.patient?.nom} {f.patient?.prenom}</p>
                    <p className="text-xs text-text-secondary font-mono">{f.patient?.ipp}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">{formatXOF(f.total)}</td>
                  <td className="px-4 py-3 text-right font-medium text-success">{formatXOF(f.montantPaye)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${f.resteAPayer > 0 ? 'text-danger' : 'text-text-secondary'}`}>
                      {formatXOF(f.resteAPayer)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {f.tiersPayant ? (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{f.assuranceNom}</span>
                    ) : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => router.push(`/facturation/${f.id}`)}
                        title="Voir" className="p-1.5 rounded hover:bg-blue-50 text-primary transition-colors">
                        <Eye size={15} />
                      </button>
                      {f.resteAPayer > 0 && f.statut !== 'annulee' && (
                        <button onClick={() => router.push(`/facturation/${f.id}`)}
                          title="Payer" className="p-1.5 rounded hover:bg-green-50 text-success transition-colors">
                          <CreditCard size={15} />
                        </button>
                      )}
                      {f.statut !== 'annulee' && (
                        <button onClick={() => alert(`Annuler ${f.numero} ?`)}
                          title="Annuler" className="p-1.5 rounded hover:bg-red-50 text-danger transition-colors">
                          <X size={15} />
                        </button>
                      )}
                      <button onClick={() => alert(`Impression: ${f.numero}`)}
                        title="Imprimer" className="p-1.5 rounded hover:bg-gray-100 text-text-secondary transition-colors">
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <FileText size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aucune facture ne correspond aux filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
