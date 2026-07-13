'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Plus, Search, RefreshCw, Eye, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutDemande = 'attente_prelevement' | 'preleve' | 'en_analyse' | 'termine' | 'valide';

type DemandeAnalyse = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?: { id: string; nom: string; prenom: string };
  urgence: boolean; statut: StatutDemande;
  typesAnalyse?: { id: string; code: string; nom: string; prix?: number }[];
  createdAt: string; datePrelevement?: string;
};

type StatsLabo = { demandesJour?: number; terminees?: number; enCours?: number; urgentes?: number };

const STATUT_CONFIG: Record<StatutDemande, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  attente_prelevement: { label: 'Attente prélèvement', bg: '#FFF3E0', color: '#E65100', icon: <Clock size={12} /> },
  preleve:             { label: 'Prélevé',              bg: '#EFF6FF', color: '#1565C0', icon: <Clock size={12} /> },
  en_analyse:          { label: 'En analyse',           bg: '#E8EAF6', color: '#3949AB', icon: <FlaskConical size={12} /> },
  termine:             { label: 'Terminé',              bg: '#E8F5E9', color: '#2E7D32', icon: <CheckCircle size={12} /> },
  valide:              { label: 'Validé',               bg: '#E8F5E9', color: '#1B5E20', icon: <CheckCircle size={12} /> },
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function LaboratoirePage() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<DemandeAnalyse[]>([]);
  const [stats, setStats] = useState<StatsLabo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [demandesRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/laboratoire/demandes?limit=100'),
        apiClient<StatsLabo>('/laboratoire/stats/jour'),
      ]);
      if (demandesRes.status === 'fulfilled') {
        const d = demandesRes.value;
        setDemandes(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = demandes.filter(d => {
    const q = search.toLowerCase();
    const nomPatient = d.patient ? `${d.patient.prenom} ${d.patient.nom}`.toLowerCase() : '';
    const matchSearch = !search || nomPatient.includes(q) || (d.numero || '').toLowerCase().includes(q) || (d.patient?.ipp || '').toLowerCase().includes(q);
    const matchStatut = !statutFilter || d.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const enCours = demandes.filter(d => !['termine', 'valide'].includes(d.statut)).length;
  const urgentes = demandes.filter(d => d.urgence && !['termine', 'valide'].includes(d.statut)).length;
  const terminees = demandes.filter(d => ['termine', 'valide'].includes(d.statut)).length;

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E8EAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} color="#3949AB" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Laboratoire</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${demandes.length} demande(s) d'analyse`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <button onClick={() => router.push('/laboratoire/demandes/nouvelle')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#3949AB', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouvelle demande
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total demandes', value: loading ? '…' : demandes.length, color: '#3949AB', bg: '#E8EAF6', icon: <FlaskConical size={18} color="#3949AB" /> },
          { label: 'En cours', value: loading ? '…' : enCours, color: '#E65100', bg: '#FFF3E0', icon: <Clock size={18} color="#E65100" /> },
          { label: 'Urgentes actives', value: loading ? '…' : urgentes, color: '#C62828', bg: '#FFEBEE', icon: <AlertTriangle size={18} color="#C62828" /> },
          { label: 'Terminées', value: loading ? '…' : terminees, color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={18} color="#2E7D32" /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F5F7FA', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher patient, N° demande…"
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, color: '#37474F', outline: 'none', background: '#fff' }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['N° Demande', 'Patient', 'Médecin', 'Date', 'Analyses', 'Urgence', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 70 }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#90A4AE', fontSize: 13 }}>
                  <FlaskConical size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Aucune demande trouvée
                </td></tr>
              ) : displayed.map(d => {
                const cfg = STATUT_CONFIG[d.statut] ?? STATUT_CONFIG.attente_prelevement;
                return (
                  <tr key={d.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#546E7A', fontFamily: 'monospace' }}>{d.numero || d.id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—'}</div>
                      {d.patient?.ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{d.patient.ipp}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{d.medecin ? `Dr. ${d.medecin.prenom} ${d.medecin.nom}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(d.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {(d.typesAnalyse || []).slice(0, 2).map(t => (
                        <span key={t.id} style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: '#E8EAF6', color: '#3949AB', marginRight: 4, marginBottom: 2 }}>{t.code}</span>
                      ))}
                      {(d.typesAnalyse || []).length > 2 && <span style={{ fontSize: 10, color: '#90A4AE' }}>+{(d.typesAnalyse || []).length - 2}</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {d.urgence ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#FFEBEE', color: '#C62828' }}>URGENT</span>
                        : <span style={{ fontSize: 12, color: '#90A4AE' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => router.push(`/laboratoire/demandes/${d.id}`)}
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
