'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Search, RefreshCw, Eye, Edit, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';

function exportPatients() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://santarex.ibigsoft.com/api/v1';
  const url = `${base}/exports/patients/xlsx`;
  const a = document.createElement('a');
  a.href = url + (token ? `?token=${encodeURIComponent(token)}` : '');
  a.download = 'patients.xlsx'; a.click();
}

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string;
  dateNaissance?: string; sexe?: string; telephone?: string;
  groupeSanguin?: string; statut?: string;
};

type PaginatedResponse = { items?: Patient[]; data?: Patient[]; total?: number; page?: number };

const SANG_COLORS: Record<string, { bg: string; color: string }> = {
  'A+': { bg: '#FFEBEE', color: '#C62828' }, 'A-': { bg: '#FFEBEE', color: '#C62828' },
  'B+': { bg: '#EFF6FF', color: '#1565C0' }, 'B-': { bg: '#EFF6FF', color: '#1565C0' },
  'AB+': { bg: '#F3E5F5', color: '#6A1B9A' }, 'AB-': { bg: '#F3E5F5', color: '#6A1B9A' },
  'O+': { bg: '#E8F5E9', color: '#2E7D32' }, 'O-': { bg: '#E8F5E9', color: '#2E7D32' },
};

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  actif:   { label: 'Actif',   bg: '#E8F5E9', color: '#2E7D32' },
  inactif: { label: 'Inactif', bg: '#F5F5F5', color: '#546E7A' },
  decede:  { label: 'Décédé',  bg: '#FFEBEE', color: '#C62828' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

function age(dateNaissance?: string): string {
  if (!dateNaissance) return '—';
  const diff = Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000));
  return `${diff} ans`;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT), ...(search ? { q: search } : {}) });
      const data = await apiClient<any>(`/patients?${qs}`);
      const list: Patient[] = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      const tot: number = data?.total ?? list.length;
      setPatients(list);
      setTotal(tot);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#1565C0" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Patients</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${total} patient(s) enregistré(s)`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={exportPatients} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#E8F5E9', border: '1px solid #A5D6A7', cursor: 'pointer', fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>
            <Download size={14} /> XLSX
          </button>
          <button onClick={() => router.push('/patients/nouveau')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <UserPlus size={14} /> Nouveau patient
          </button>
        </div>
      </div>

      {/* Recherche */}
      <form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(searchInput); }} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 420 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Rechercher par nom, IPP, téléphone…"
            style={{ width: '100%', padding: '9px 10px 9px 32px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #0D47A1', background: '#EFF6FF', color: '#0D47A1', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Rechercher
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Effacer
          </button>
        )}
      </form>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['IPP', 'Patient', 'Date de naissance', 'Âge', 'Téléphone', 'Groupe sanguin', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 130 : 70 }} /></td>
                  ))}
                </tr>
              )) : patients.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 60, color: '#90A4AE', fontSize: 13 }}>
                  <Users size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  {search ? 'Aucun patient correspondant à la recherche' : 'Aucun patient enregistré'}
                </td></tr>
              ) : patients.map(p => {
                const sc = SANG_COLORS[p.groupeSanguin || ''];
                const stCfg = STATUT_CONFIG[p.statut || 'actif'] ?? STATUT_CONFIG.actif;
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#546E7A', background: '#F8FAFC', whiteSpace: 'nowrap' }}>{p.ipp || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1565C0', flexShrink: 0 }}>
                          {p.prenom.charAt(0)}{p.nom.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{p.prenom} {p.nom}</div>
                          <div style={{ fontSize: 11, color: '#90A4AE' }}>{p.sexe === 'M' ? 'Homme' : p.sexe === 'F' ? 'Femme' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{fmtDate(p.dateNaissance)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', fontWeight: 600 }}>{age(p.dateNaissance)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{p.telephone || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {p.groupeSanguin ? (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc?.bg ?? '#F5F5F5', color: sc?.color ?? '#546E7A' }}>{p.groupeSanguin}</span>
                      ) : <span style={{ color: '#90A4AE', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: stCfg.bg, color: stCfg.color }}>{stCfg.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => router.push(`/patients/${p.id}`)} title="Voir le dossier"
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0' }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => router.push(`/patients/${p.id}/modifier`)} title="Modifier"
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#546E7A' }}>
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #F5F7FA', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#546E7A' }}>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} sur {total} patients
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${page === p ? '#1565C0' : '#E0E0E0'}`, background: page === p ? '#1565C0' : '#fff', color: page === p ? '#fff' : '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
