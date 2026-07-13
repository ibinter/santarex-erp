'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Search, RefreshCw, Filter, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';

type AuditLog = {
  id: string; action: string; ressource?: string; ressourceId?: string;
  details?: string; ipAddress?: string; userAgent?: string;
  createdAt: string;
  user?: { prenom?: string; nom?: string; email?: string; role?: string };
};

const ACTION_CONFIG: Record<string, [string, string, string]> = {
  CREATE:       ['#E8F5E9', '#2E7D32', 'Création'],
  UPDATE:       ['#EFF6FF', '#1565C0', 'Modification'],
  DELETE:       ['#FFEBEE', '#C62828', 'Suppression'],
  LOGIN:        ['#F3E5F5', '#6A1B9A', 'Connexion'],
  LOGOUT:       ['#F5F5F5', '#546E7A', 'Déconnexion'],
  LOGIN_FAILED: ['#FFF3E0', '#E65100', 'Échec connexion'],
  VIEW:         ['#F5F5F5', '#90A4AE', 'Consultation'],
  EXPORT:       ['#E0F7FA', '#00838F', 'Export'],
  ACTIVATE:     ['#E8F5E9', '#2E7D32', 'Activation'],
  SUSPEND:      ['#FFEBEE', '#C62828', 'Suspension'],
};

const RESSOURCE_LABELS: Record<string, string> = {
  patients: 'Patients', consultations: 'Consultations', facturation: 'Facturation',
  pharmacie: 'Pharmacie', laboratoire: 'Laboratoire', hospitalisation: 'Hospitalisation',
  users: 'Utilisateurs', auth: 'Authentification', ordonnances: 'Ordonnances',
  rendez_vous: 'Rendez-vous', settings: 'Paramètres',
};

function fmtDatetime(d: string) {
  try { return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return d; }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [ressourceFilter, setRessourceFilter] = useState('');
  const LIMIT = 50;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (actionFilter) qs.set('action', actionFilter);
      if (ressourceFilter) qs.set('ressource', ressourceFilter);
      const data = await apiClient<any>(`/audit-logs?${qs}`);
      const items = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      const tot = data?.total ?? data?.count ?? items.length;
      setLogs(items);
      setTotal(tot);
      setPage(p);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [actionFilter, ressourceFilter]);

  useEffect(() => { load(1); }, [load]);

  const filtered = search
    ? logs.filter(l =>
        l.action?.toLowerCase().includes(search.toLowerCase()) ||
        l.ressource?.toLowerCase().includes(search.toLowerCase()) ||
        l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        (l.user?.prenom + ' ' + l.user?.nom).toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: 20, maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EDE7F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="#4527A0" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#1A2332' }}>Journal d'audit</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#546E7A' }}>{total.toLocaleString('fr-FR')} entrée(s) au total</p>
          </div>
        </div>
        <button onClick={() => load(1)} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par utilisateur, action, ressource…"
            style={{ width: '100%', padding: '9px 10px 9px 30px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FAFAFA', color: '#37474F', boxSizing: 'border-box' }} />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); }}
          style={{ padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FAFAFA', color: '#37474F', cursor: 'pointer' }}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_CONFIG).map(([k, [,, l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={ressourceFilter} onChange={e => setRessourceFilter(e.target.value)}
          style={{ padding: '9px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#FAFAFA', color: '#37474F', cursor: 'pointer' }}>
          <option value="">Toutes les ressources</option>
          {Object.entries(RESSOURCE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E8EAED' }}>
                {['Date & Heure', 'Utilisateur', 'Action', 'Ressource', 'Détails', 'IP'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <div style={{ height: 16, background: '#F0F4F8', borderRadius: 4, width: j === 0 ? 120 : j === 2 ? 70 : 90 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Aucune entrée dans le journal</td></tr>
              ) : filtered.map((log, i) => {
                const [bg, col, label] = ACTION_CONFIG[log.action] ?? ['#F5F5F5', '#546E7A', log.action];
                const rLabel = RESSOURCE_LABELS[log.ressource ?? ''] ?? log.ressource ?? '—';
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F5F7FA', background: i % 2 === 0 ? '#fff' : '#FAFCFF' }}>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtDatetime(log.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {log.user ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{log.user.prenom} {log.user.nom}</div>
                          <div style={{ fontSize: 11, color: '#90A4AE' }}>{log.user.role}</div>
                        </div>
                      ) : <span style={{ fontSize: 12, color: '#90A4AE' }}>Système</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: bg, color: col, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', fontWeight: 600 }}>{rLabel}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A', maxWidth: 300 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details ?? ''}>{log.details ?? '—'}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#90A4AE', fontVariantNumeric: 'tabular-nums' }}>{log.ipAddress ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#90A4AE' }}>Page {page} / {totalPages} · {total.toLocaleString('fr-FR')} entrées</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => load(page - 1)} disabled={page === 1 || loading}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: page > 1 ? 'pointer' : 'default', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>←</button>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages || loading}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #E0E0E0', background: '#fff', cursor: page < totalPages ? 'pointer' : 'default', fontSize: 13, opacity: page >= totalPages ? 0.4 : 1 }}>→</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
