'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  Users, Search, TrendingUp, CalendarClock, Target, RefreshCw, ChevronRight,
} from 'lucide-react';

// ── Pipeline ────────────────────────────────────────────────────────────────
type ProspectStatut =
  | 'nouveau' | 'a_contacter' | 'contacte' | 'qualifie' | 'demo_prevue'
  | 'demo_realisee' | 'offre_envoyee' | 'negociation' | 'gagne' | 'perdu';

const STATUT_CONFIG: Record<ProspectStatut, { label: string; bg: string; text: string }> = {
  nouveau:       { label: 'Nouveau',        bg: '#DBEAFE', text: '#1E40AF' },
  a_contacter:   { label: 'À contacter',    bg: '#E0F2FE', text: '#075985' },
  contacte:      { label: 'Contacté',       bg: '#EDE9FE', text: '#5B21B6' },
  qualifie:      { label: 'Qualifié',       bg: '#FAE8FF', text: '#86198F' },
  demo_prevue:   { label: 'Démo prévue',    bg: '#FEF3C7', text: '#92400E' },
  demo_realisee: { label: 'Démo réalisée',  bg: '#FEF9C3', text: '#854D0E' },
  offre_envoyee: { label: 'Offre envoyée',  bg: '#FFEDD5', text: '#9A3412' },
  negociation:   { label: 'Négociation',    bg: '#FCE7F3', text: '#9D174D' },
  gagne:         { label: 'Gagné',          bg: '#DCFCE7', text: '#166534' },
  perdu:         { label: 'Perdu',          bg: '#FEE2E2', text: '#991B1B' },
};

const STATUT_ORDRE: ProspectStatut[] = [
  'nouveau', 'a_contacter', 'contacte', 'qualifie', 'demo_prevue',
  'demo_realisee', 'offre_envoyee', 'negociation', 'gagne', 'perdu',
];

interface Prospect {
  id: string;
  nom: string;
  prenom?: string | null;
  entreprise?: string | null;
  email: string;
  telephone?: string | null;
  pays?: string | null;
  origine: string;
  statut: ProspectStatut;
  score: number;
  createdAt: string;
}

interface DemandeDemo {
  id: string;
  prospectId: string;
  dateSouhaitee?: string | null;
  modeDemo: string;
  statut: string;
  createdAt: string;
}

interface Stats {
  funnel: Array<{ statut: ProspectStatut; count: number }>;
  totalProspects: number;
  demosAPlanifier: number;
  demosPlanifiees: number;
  tauxConversion: number;
}

function Badge({ statut }: { statut: ProspectStatut }) {
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.nouveau;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; accent: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: accent + '1A', color: accent }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function CrmPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [demandes, setDemandes] = useState<DemandeDemo[]>([]);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<ProspectStatut | ''>('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, d] = await Promise.all([
        apiClient<Stats>('/crm/stats'),
        apiClient<Prospect[]>('/crm/prospects'),
        apiClient<DemandeDemo[]>('/crm/demandes-demo?statut=demandee'),
      ]);
      setStats(s);
      setProspects(p);
      setDemandes(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changerStatut = async (id: string, statut: ProspectStatut) => {
    setActionId(id);
    try {
      await apiClient(`/crm/prospects/${id}/statut`, { method: 'PATCH', body: { statut } });
      await load();
    } finally {
      setActionId(null);
    }
  };

  const filtered = prospects.filter((p) => {
    if (filtreStatut && p.statut !== filtreStatut) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nom.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.entreprise ?? '').toLowerCase().includes(q)
    );
  });

  const funnelMap = new Map(stats?.funnel.map((f) => [f.statut, f.count]) ?? []);
  const maxFunnel = Math.max(1, ...(stats?.funnel.map((f) => f.count) ?? [1]));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={22} className="text-primary" /> CRM — Prospects & Démos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Pipeline commercial IBIG SOFT</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50">
          <RefreshCw size={15} /> Rafraîchir
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} />} label="Prospects" accent="#0D47A1"
          value={stats?.totalProspects ?? '—'} />
        <StatCard icon={<CalendarClock size={18} />} label="Démos à planifier" accent="#B45309"
          value={stats?.demosAPlanifier ?? '—'} />
        <StatCard icon={<CalendarClock size={18} />} label="Démos planifiées" accent="#00838F"
          value={stats?.demosPlanifiees ?? '—'} />
        <StatCard icon={<TrendingUp size={18} />} label="Taux de conversion" accent="#166534"
          value={stats ? `${stats.tauxConversion}%` : '—'} />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Funnel du pipeline</h2>
        <div className="space-y-2">
          {STATUT_ORDRE.map((statut) => {
            const count = funnelMap.get(statut) ?? 0;
            const c = STATUT_CONFIG[statut];
            return (
              <button key={statut}
                onClick={() => setFiltreStatut(filtreStatut === statut ? '' : statut)}
                className={`w-full flex items-center gap-3 group ${filtreStatut === statut ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}>
                <div className="w-28 text-right text-xs font-medium text-gray-600 flex-shrink-0">{c.label}</div>
                <div className="flex-1 h-6 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full rounded flex items-center justify-end px-2 transition-all"
                    style={{ width: `${Math.max(6, (count / maxFunnel) * 100)}%`, background: c.text }}>
                    <span className="text-[11px] font-semibold text-white">{count}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {filtreStatut && (
          <p className="text-xs text-gray-400 mt-3">
            Filtre actif : <b>{STATUT_CONFIG[filtreStatut].label}</b> —{' '}
            <button className="text-primary underline" onClick={() => setFiltreStatut('')}>réinitialiser</button>
          </p>
        )}
      </div>

      {/* Démos à planifier */}
      {demandes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarClock size={16} className="text-amber-600" /> Demandes de démo à planifier ({demandes.length})
          </h2>
          <div className="space-y-2">
            {demandes.map((d) => {
              const p = prospects.find((x) => x.id === d.prospectId);
              return (
                <div key={d.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-amber-50/50 border border-amber-100">
                  <div>
                    <span className="font-medium text-gray-800">
                      {p ? `${p.prenom ?? ''} ${p.nom}`.trim() : 'Prospect'}
                    </span>
                    <span className="text-gray-400"> · {p?.entreprise ?? '—'} · {d.modeDemo}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {d.dateSouhaitee ? new Date(d.dateSouhaitee).toLocaleDateString('fr-FR') : 'date libre'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un prospect…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
        />
      </div>

      {/* Liste prospects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prospect</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Origine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Faire avancer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const idx = STATUT_ORDRE.indexOf(p.statut);
                  const suivant = idx >= 0 && idx < STATUT_ORDRE.length - 2 ? STATUT_ORDRE[idx + 1] : null;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-gray-800">
                          {`${p.prenom ?? ''} ${p.nom}`.trim()}
                        </div>
                        <div className="text-xs text-gray-400">{p.entreprise ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="text-gray-600">{p.email}</div>
                        <div className="text-xs text-gray-400">{p.telephone ?? p.pays ?? ''}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell capitalize">{p.origine}</td>
                      <td className="px-4 py-3.5"><Badge statut={p.statut} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {suivant ? (
                            <button
                              onClick={() => changerStatut(p.id, suivant)}
                              disabled={actionId === p.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-primary bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors">
                              {STATUT_CONFIG[suivant].label} <ChevronRight size={13} />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                          {p.statut !== 'perdu' && p.statut !== 'gagne' && (
                            <button
                              onClick={() => changerStatut(p.id, 'perdu')}
                              disabled={actionId === p.id}
                              className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
                              Perdu
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">Aucun prospect trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
