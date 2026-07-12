'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ScrollText, Search } from 'lucide-react';

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  LOGIN:        { bg: '#DCFCE7', text: '#166534' },
  LOGIN_FAILED: { bg: '#FEE2E2', text: '#991B1B' },
  CREATE:       { bg: '#DBEAFE', text: '#1E40AF' },
  UPDATE:       { bg: '#FEF9C3', text: '#854D0E' },
  DELETE:       { bg: '#FEE2E2', text: '#991B1B' },
  ACTIVATE:     { bg: '#DCFCE7', text: '#166534' },
  SUSPEND:      { bg: '#FEF9C3', text: '#854D0E' },
  EXPORT:       { bg: '#F3E8FF', text: '#6B21A8' },
  VIEW:         { bg: '#F3F4F6', text: '#6B7280' },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterTenant, setFilterTenant] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (filterAction) params.action = filterAction;
      if (filterTenant) params.tenantId = filterTenant;
      const res = await api.superadmin.getAuditLogs(params);
      setLogs(res.data ?? res);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterTenant]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText size={22} className="text-indigo-500" /> Journal d'audit
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} événements enregistrés</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary"
        >
          <option value="">Toutes les actions</option>
          {['LOGIN','LOGIN_FAILED','CREATE','UPDATE','DELETE','ACTIVATE','SUSPEND','EXPORT','VIEW'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filterTenant}
            onChange={(e) => { setFilterTenant(e.target.value); setPage(1); }}
            placeholder="Filtrer par tenant…"
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Ressource</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Utilisateur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const s = ACTION_STYLES[log.action] ?? { bg: '#F3F4F6', text: '#6B7280' };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                          style={{ background: s.bg, color: s.text }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        <span>{log.ressource}</span>
                        {log.ressourceId && (
                          <span className="ml-1 text-xs text-gray-400 font-mono">
                            #{log.ressourceId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                        {log.userEmail ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {log.tenantId ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden lg:table-cell">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  );
                })}
                {!logs.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Aucun événement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} événements</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              ← Précédent
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= total}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
