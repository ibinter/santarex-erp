'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Tenant, TenantStatut } from '@/types';
import { Building2, Plus, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUT_CONFIG: Record<TenantStatut, { label: string; bg: string; text: string }> = {
  actif:       { label: 'Actif',      bg: '#DCFCE7', text: '#166534' },
  suspendu:    { label: 'Suspendu',   bg: '#FEE2E2', text: '#991B1B' },
  essai:       { label: 'Essai',      bg: '#DBEAFE', text: '#1E40AF' },
  expire:      { label: 'Expiré',     bg: '#F3F4F6', text: '#6B7280' },
  en_attente:  { label: 'En attente', bg: '#FEF9C3', text: '#854D0E' },
};

function Badge({ statut }: { statut: TenantStatut }) {
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.en_attente;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superadmin.getTenants({ page, limit: 20 });
      setTenants(res.data ?? res);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? tenants.filter(
        (t) =>
          t.nom.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase()) ||
          t.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : tenants;

  const handleAction = async (id: string, action: 'suspendre' | 'activer') => {
    setActionId(id);
    try {
      if (action === 'suspendre') await api.superadmin.suspendreTenant(id);
      else await api.superadmin.activerTenant(id);
      await load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-primary" /> Établissements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} tenant(s) enregistré(s)</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
          <Plus size={16} /> Nouveau tenant
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
        />
      </div>

      {/* Table */}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Établissement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-800">{t.nom}</div>
                      <div className="text-xs text-gray-400">{t.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="text-gray-600">{t.email ?? '—'}</div>
                      <div className="text-xs text-gray-400">{t.telephone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge statut={t.statut} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        {t.statut === 'actif' ? (
                          <button
                            onClick={() => handleAction(t.id, 'suspendre')}
                            disabled={actionId === t.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={13} /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(t.id, 'activer')}
                            disabled={actionId === t.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={13} /> Activer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      Aucun établissement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} résultats</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              ← Précédent
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
