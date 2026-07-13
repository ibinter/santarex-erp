'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Plus, Search, RefreshCw, Eye, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutFacture = 'brouillon' | 'emise' | 'partiellement_payee' | 'payee' | 'annulee';

type Facture = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  statut: StatutFacture;
  total: number; montantPaye?: number; resteAPayer?: number;
  dateEmission?: string; createdAt: string;
  tiersPayant?: boolean; assuranceNom?: string;
};

type StatsFacturation = {
  totalEmises?: number; totalPayees?: number; totalEnAttente?: number; nbFactures?: number;
};

const STATUT_CONFIG: Record<StatutFacture, { label: string; bg: string; color: string }> = {
  brouillon:          { label: 'Brouillon',     bg: '#F5F5F5', color: '#546E7A' },
  emise:              { label: 'Émise',          bg: '#EFF6FF', color: '#1565C0' },
  partiellement_payee:{ label: 'Part. payée',   bg: '#FFF3E0', color: '#E65100' },
  payee:              { label: 'Payée',          bg: '#E8F5E9', color: '#2E7D32' },
  annulee:            { label: 'Annulée',        bg: '#FFEBEE', color: '#C62828' },
};

function fmtXOF(v: number) { return v.toLocaleString('fr-FR') + ' XOF'; }
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

export default function FacturationPage() {
  const router = useRouter();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [stats, setStats] = useState<StatsFacturation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [factRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/facturation?limit=100'),
        apiClient<StatsFacturation>('/facturation/stats'),
      ]);
      if (factRes.status === 'fulfilled') {
        const d = factRes.value;
        setFactures(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = factures.filter(f => {
    const q = search.toLowerCase();
    const nomPatient = f.patient ? `${f.patient.prenom} ${f.patient.nom}`.toLowerCase() : '';
    const matchSearch = !search || nomPatient.includes(q) || (f.numero || '').toLowerCase().includes(q) || (f.patient?.ipp || '').toLowerCase().includes(q);
    const matchStatut = !statutFilter || f.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const totalEmis = stats?.totalEmises ?? factures.filter(f => f.statut !== 'annulee').reduce((a, f) => a + (f.total || 0), 0);
  const totalEnAttente = stats?.totalEnAttente ?? factures.filter(f => ['emise', 'partiellement_payee'].includes(f.statut)).reduce((a, f) => a + (f.resteAPayer || f.total || 0), 0);
  const nbPayees = factures.filter(f => f.statut === 'payee').length;

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} color="#1565C0" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Facturation</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${factures.length} facture(s)`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <button onClick={() => router.push('/facturation/nouvelle')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouvelle facture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total émis', value: loading ? '…' : fmtXOF(totalEmis), icon: <TrendingUp size={18} color="#1565C0" />, color: '#1565C0', bg: '#EFF6FF' },
          { label: 'En attente', value: loading ? '…' : fmtXOF(totalEnAttente), icon: <AlertCircle size={18} color="#E65100" />, color: '#E65100', bg: '#FFF3E0' },
          { label: 'Factures payées', value: loading ? '…' : nbPayees, icon: <DollarSign size={18} color="#2E7D32" />, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Total factures', value: loading ? '…' : factures.length, icon: <Receipt size={18} color="#546E7A" />, color: '#546E7A', bg: '#F5F5F5' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F5F7FA', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher patient, N° facture…"
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, color: '#37474F', outline: 'none', background: '#fff' }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['N° Facture', 'Patient', 'Date', 'Total', 'Payé', 'Reste dû', 'Assurance', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 70 }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#90A4AE', fontSize: 13 }}>
                  <Receipt size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Aucune facture trouvée
                </td></tr>
              ) : displayed.map(f => {
                const cfg = STATUT_CONFIG[f.statut] ?? STATUT_CONFIG.brouillon;
                const annulee = f.statut === 'annulee';
                return (
                  <tr key={f.id} style={{ borderTop: '1px solid #F5F7FA', opacity: annulee ? 0.6 : 1 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#546E7A', fontFamily: 'monospace' }}>{f.numero || f.id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332', textDecoration: annulee ? 'line-through' : 'none' }}>
                        {f.patient ? `${f.patient.prenom} ${f.patient.nom}` : '—'}
                      </div>
                      {f.patient?.ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{f.patient.ipp}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(f.dateEmission || f.createdAt)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', whiteSpace: 'nowrap' }}>{fmtXOF(f.total)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#2E7D32', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtXOF(f.montantPaye ?? 0)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: (f.resteAPayer ?? 0) > 0 ? '#C62828' : '#90A4AE', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtXOF(f.resteAPayer ?? 0)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#546E7A' }}>{f.tiersPayant ? (f.assuranceNom || 'Tiers') : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => router.push(`/facturation/${f.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', color: '#546E7A', fontWeight: 600 }}>
                        <Eye size={12} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
