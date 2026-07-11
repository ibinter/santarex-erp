'use client';

import { useState } from 'react';
import { DollarSign, Receipt, Banknote, Smartphone, CreditCard, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatsBar from '@/components/dashboard/StatsBar';
import type { ModePaiement } from '@/types';

// ─── Mock data ───────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

interface Transaction {
  id: string;
  heure: string;
  reference: string;
  patient: string;
  facture: string;
  mode: ModePaiement;
  montant: number;
  statut: 'valide' | 'annule';
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', heure: '08:15', reference: 'PAY-2025-0891', patient: 'KOUASSI Adjoua', facture: 'FAC-2025-0408', mode: 'especes', montant: 22000, statut: 'valide' },
  { id: 't2', heure: '09:30', reference: 'PAY-2025-0892', patient: 'TRAORÉ Ibrahim', facture: 'FAC-2025-0409', mode: 'mobile_money', montant: 5000, statut: 'valide' },
  { id: 't3', heure: '10:00', reference: 'PAY-2025-0893', patient: 'KONÉ Fatoumata', facture: 'FAC-2025-0410', mode: 'carte', montant: 35000, statut: 'valide' },
  { id: 't4', heure: '11:20', reference: 'PAY-2025-0894', patient: 'OUATTARA Seydou', facture: 'FAC-2025-0411', mode: 'assurance', montant: 27000, statut: 'valide' },
  { id: 't5', heure: '13:45', reference: 'PAY-2025-0895', patient: 'BAMBA Mariam', facture: 'FAC-2025-0412', mode: 'mobile_money', montant: 8500, statut: 'valide' },
  { id: 't6', heure: '14:30', reference: 'PAY-2025-0896', patient: 'DIALLO Moussa', facture: 'FAC-2025-0413', mode: 'especes', montant: 12000, statut: 'valide' },
  { id: 't7', heure: '15:10', reference: 'PAY-2025-0897', patient: 'COULIBALY Awa', facture: 'FAC-2025-0414', mode: 'virement', montant: 45000, statut: 'valide' },
  { id: 't8', heure: '15:55', reference: 'PAY-2025-0898', patient: 'SANOGO Daouda', facture: 'FAC-2025-0415', mode: 'especes', montant: 3000, statut: 'annule' },
];

const MODE_CONFIG: Record<ModePaiement, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  especes: { label: 'Espèces', badgeClass: 'bg-green-100 text-green-800 border border-green-200', icon: <Banknote size={14} /> },
  mobile_money: { label: 'Mobile Money', badgeClass: 'bg-orange-100 text-orange-800 border border-orange-200', icon: <Smartphone size={14} /> },
  carte: { label: 'Carte', badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200', icon: <CreditCard size={14} /> },
  assurance: { label: 'Assurance', badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200', icon: <Shield size={14} /> },
  virement: { label: 'Virement', badgeClass: 'bg-gray-100 text-gray-800 border border-gray-200', icon: <DollarSign size={14} /> },
};

function formatXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

export default function CaissePage() {
  const [modeFilter, setModeFilter] = useState<ModePaiement | ''>('');

  const valides = MOCK_TRANSACTIONS.filter(t => t.statut === 'valide');
  const totalEncaisse = valides.reduce((acc, t) => acc + t.montant, 0);
  const totalEspeces = valides.filter(t => t.mode === 'especes').reduce((acc, t) => acc + t.montant, 0);
  const totalMobile = valides.filter(t => t.mode === 'mobile_money').reduce((acc, t) => acc + t.montant, 0);
  const totalCarte = valides.filter(t => t.mode === 'carte').reduce((acc, t) => acc + t.montant, 0);
  const totalAssurance = valides.filter(t => t.mode === 'assurance').reduce((acc, t) => acc + t.montant, 0);

  const repartition = [
    { mode: 'especes' as ModePaiement, label: 'Espèces', montant: totalEspeces, color: '#2E7D32', barClass: 'bg-green-600' },
    { mode: 'mobile_money' as ModePaiement, label: 'Mobile Money', montant: totalMobile, color: '#E65100', barClass: 'bg-orange-500' },
    { mode: 'carte' as ModePaiement, label: 'Carte', montant: totalCarte, color: '#0D47A1', barClass: 'bg-blue-700' },
    { mode: 'assurance' as ModePaiement, label: 'Assurance', montant: totalAssurance, color: '#6A1B9A', barClass: 'bg-purple-700' },
  ];

  const filtered = MOCK_TRANSACTIONS.filter(t => !modeFilter || t.mode === modeFilter);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Caisse du jour</h1>
          <p className="text-sm text-text-secondary mt-0.5 capitalize">{TODAY}</p>
        </div>
        <Button variant="secondary" onClick={() => alert('Clôture de caisse...')} leftIcon={<Receipt size={16} />}>
          Clôturer la caisse
        </Button>
      </div>

      {/* KPI Row */}
      <StatsBar
        className="mb-6"
        stats={[
          { label: 'Total encaissé', value: formatXOF(totalEncaisse), icon: <DollarSign size={18} />, color: 'success' },
          { label: 'Nb transactions', value: valides.length, icon: <Receipt size={18} />, color: 'primary' },
          { label: 'Espèces', value: formatXOF(totalEspeces), icon: <Banknote size={18} />, color: 'secondary' },
          { label: 'Mobile Money', value: formatXOF(totalMobile), icon: <Smartphone size={18} />, color: 'warning' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Graphique répartition */}
        <div className="bg-white border border-border rounded-card p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Répartition par mode</h2>
          <div className="space-y-3">
            {repartition.filter(r => r.montant > 0).map(r => {
              const pct = totalEncaisse > 0 ? Math.round((r.montant / totalEncaisse) * 100) : 0;
              return (
                <div key={r.mode}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">{r.label}</span>
                    <span className="font-semibold text-text-primary">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${r.barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{formatXOF(r.montant)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Autres KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
          {[
            { label: 'Carte bancaire', value: totalCarte, icon: <CreditCard size={18} />, cls: 'bg-blue-50', iconCls: 'text-blue-700' },
            { label: 'Assurance', value: totalAssurance, icon: <Shield size={18} />, cls: 'bg-purple-50', iconCls: 'text-purple-700' },
            { label: 'Virements', value: MOCK_TRANSACTIONS.filter(t => t.mode === 'virement').reduce((a, t) => a + t.montant, 0), icon: <DollarSign size={18} />, cls: 'bg-gray-50', iconCls: 'text-gray-600' },
            { label: 'Annulations', value: MOCK_TRANSACTIONS.filter(t => t.statut === 'annule').length, icon: <Receipt size={18} />, cls: 'bg-red-50', iconCls: 'text-red-600' },
          ].map((k, i) => (
            <div key={i} className="bg-white border border-border rounded-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${k.cls}`}>
                <span className={k.iconCls}>{k.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{typeof k.value === 'number' && k.value > 999 ? formatXOF(k.value) : k.value}</p>
                <p className="text-xs text-text-secondary">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtre mode */}
      <div className="bg-white border border-border rounded-card p-4 mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-text-secondary">Filtrer par mode :</span>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModeFilter('')}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${!modeFilter ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary'}`}
          >
            Tous
          </button>
          {Object.entries(MODE_CONFIG).map(([mode, cfg]) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode as ModePaiement)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors flex items-center gap-1 ${modeFilter === mode ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary'}`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau transactions */}
      <div className="bg-white border border-border rounded-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Heure</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Référence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Facture</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Mode</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Montant</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(t => {
              const cfg = MODE_CONFIG[t.mode];
              return (
                <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${t.statut === 'annule' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.heure}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{t.reference}</td>
                  <td className="px-4 py-3 text-text-primary">{t.patient}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.facture}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badgeClass}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${t.statut === 'annule' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {formatXOF(t.montant)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={t.statut === 'valide' ? 'success' : 'danger'} dot>
                      {t.statut === 'valide' ? 'Validé' : 'Annulé'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary">
            <Receipt size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aucune transaction pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
