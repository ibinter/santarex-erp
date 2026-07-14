'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Receipt, Plus, Search, RefreshCw, Eye,
  TrendingUp, AlertCircle, CheckCircle, FileText,
  ChevronRight, Shield,
} from 'lucide-react';
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

const STATUT_CONFIG: Record<StatutFacture, { label: string; bg: string; color: string; dot: string }> = {
  brouillon:           { label: 'Brouillon',    bg: '#F5F5F5', color: '#546E7A', dot: '#90A4AE' },
  emise:               { label: 'Émise',         bg: '#EFF6FF', color: '#1565C0', dot: '#1565C0' },
  partiellement_payee: { label: 'Part. payée',  bg: '#FFF8E1', color: '#F57F17', dot: '#FBC02D' },
  payee:               { label: 'Payée',         bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047' },
  annulee:             { label: 'Annulée',       bg: '#FFEBEE', color: '#C62828', dot: '#EF5350' },
};

const AVATAR_COLORS: [string, string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#065F46','#D1FAE5'],
  ['#7C2D12','#FEE2E2'],['#1E40AF','#DBEAFE'],
];
function avatarColor(name: string): [string, string] {
  let h = 0; for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function fmtXOF(v: number) { return v.toLocaleString('fr-FR') + ' XOF'; }
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = factures.filter(f => {
    const q = search.toLowerCase();
    const nomP = f.patient ? `${f.patient.prenom} ${f.patient.nom}`.toLowerCase() : '';
    const matchS = !search || nomP.includes(q) || (f.numero || '').toLowerCase().includes(q) || (f.patient?.ipp || '').toLowerCase().includes(q);
    const matchSt = !statutFilter || f.statut === statutFilter;
    return matchS && matchSt;
  });

  const totalEmis = stats?.totalEmises ?? factures.filter(f => f.statut !== 'annulee').reduce((a, f) => a + (f.total || 0), 0);
  const totalEnAttente = stats?.totalEnAttente ?? factures.filter(f => ['emise', 'partiellement_payee'].includes(f.statut)).reduce((a, f) => a + (f.resteAPayer || f.total || 0), 0);
  const nbPayees = factures.filter(f => f.statut === 'payee').length;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fact-row:hover { background: #F8FAFF !important; }
        .fact-row:hover .fact-arrow { opacity:1 !important; }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0D3B6E 0%,#1565C0 55%,#0288D1 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,59,110,0.35)' }}>
        <div style={{ position: 'absolute', top: -60, right: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -50, right: 240, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Facturation</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {loading ? '…' : `${factures.length} facture(s)`}
                  {lastRefresh && <span style={{ marginLeft: 8, opacity: 0.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Actualiser
              </button>
              <button onClick={() => router.push('/facturation/nouvelle')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#1565C0', fontWeight: 800 }}>
                <Plus size={14}/> Nouvelle facture
              </button>
            </div>
          </div>

          {/* KPI mini-pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Total émis',      val: loading ? '…' : fmtXOF(totalEmis),      icon: <TrendingUp size={11}/> },
              { label: 'En attente',      val: loading ? '…' : fmtXOF(totalEnAttente), icon: <AlertCircle size={11}/> },
              { label: 'Factures payées', val: loading ? '…' : nbPayees,               icon: <CheckCircle size={11}/> },
              { label: 'Total factures',  val: loading ? '…' : factures.length,        icon: <FileText size={11}/> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.val}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTRES ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher patient, N° facture, IPP…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 11, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ val: '', label: 'Tous' }, ...Object.entries(STATUT_CONFIG).map(([k, v]) => ({ val: k, label: v.label }))].map(s => (
            <button key={s.val} onClick={() => setStatutFilter(s.val)}
              style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${statutFilter === s.val ? '#1565C0' : '#E0E8F0'}`, background: statutFilter === s.val ? '#1565C0' : '#fff', color: statutFilter === s.val ? '#fff' : '#546E7A', fontSize: 12, fontWeight: statutFilter === s.val ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>
          {displayed.length} facture{displayed.length > 1 ? 's' : ''} trouvée{displayed.length > 1 ? 's' : ''}
        </div>
      )}

      {/* ── TABLE ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['N° Facture', 'Patient', 'Date', 'Total', 'Payé', 'Reste dû', 'Assurance', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}>
                      <div style={{ height: 13, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', borderRadius: 4, width: j === 1 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }}/>
                    </td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                    <Receipt size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}/>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>Aucune facture trouvée</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{search ? `Aucun résultat pour "${search}"` : 'Aucune facture dans la base'}</div>
                  </td>
                </tr>
              ) : displayed.map(f => {
                const cfg = STATUT_CONFIG[f.statut] ?? STATUT_CONFIG.brouillon;
                const annulee = f.statut === 'annulee';
                const name = f.patient ? `${f.patient.prenom} ${f.patient.nom}` : '?';
                const [ac, ab] = avatarColor(name);
                const inits = f.patient ? `${f.patient.prenom?.charAt(0) ?? ''}${f.patient.nom?.charAt(0) ?? ''}`.toUpperCase() : '?';
                const reste = f.resteAPayer ?? 0;
                return (
                  <tr key={f.id} className="fact-row"
                    style={{ borderTop: '1px solid #F0F4FA', opacity: annulee ? 0.6 : 1, cursor: 'pointer', transition: 'background .15s' }}
                    onClick={() => router.push(`/facturation/${f.id}`)}>

                    {/* N° */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1565C0', background: '#EFF6FF', padding: '3px 9px', borderRadius: 6, fontFamily: 'monospace' }}>
                        {f.numero || f.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    {/* Patient */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${ab},${ac}22)`, border: `1.5px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: ac, flexShrink: 0 }}>
                          {inits}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332', textDecoration: annulee ? 'line-through' : 'none' }}>{f.patient ? `${f.patient.prenom} ${f.patient.nom}` : '—'}</div>
                          {f.patient?.ipp && <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{f.patient.ipp}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(f.dateEmission || f.createdAt)}</td>

                    {/* Total */}
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#1A2332', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(f.total)}</td>

                    {/* Payé */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#2E7D32', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(f.montantPaye ?? 0)}</td>

                    {/* Reste */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {reste > 0 ? (
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#C62828', background: '#FFEBEE', padding: '2px 8px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(reste)}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#90A4AE' }}>—</span>
                      )}
                    </td>

                    {/* Assurance */}
                    <td style={{ padding: '12px 14px' }}>
                      {f.tiersPayant ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#6A1B9A', background: '#F3E5F5', padding: '2px 8px', borderRadius: 6 }}>
                          <Shield size={9}/> {f.assuranceNom || 'Tiers'}
                        </span>
                      ) : <span style={{ fontSize: 12, color: '#CFD8DC' }}>—</span>}
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }}/>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td style={{ padding: '12px 10px' }}>
                      <ChevronRight size={15} color="#B0BEC5" className="fact-arrow" style={{ opacity: 0, transition: 'opacity .15s' }}/>
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
