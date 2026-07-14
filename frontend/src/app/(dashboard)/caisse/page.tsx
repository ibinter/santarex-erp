'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Receipt, Banknote, Smartphone, CreditCard,
  Shield, RefreshCw, Download, TrendingUp, Hash,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

const TODAY_STR = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const MODE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  especes:      { label: 'Espèces',      color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: <Banknote size={13}/> },
  mobile_money: { label: 'Mobile Money', color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: <Smartphone size={13}/> },
  carte:        { label: 'Carte',        color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE', icon: <CreditCard size={13}/> },
  assurance:    { label: 'Assurance',    color: '#5B21B6', bg: '#EDE9FE', border: '#DDD6FE', icon: <Shield size={13}/> },
  virement:     { label: 'Virement',     color: '#374151', bg: '#F3F4F6', border: '#E5E7EB', icon: <DollarSign size={13}/> },
};

function fmtXOF(val: number) { return val.toLocaleString('fr-FR') + ' XOF'; }
function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

interface StatsCaisse {
  totalJour: number;
  parMode: { modePaiement: string; total: string; count: string }[];
}
interface Paiement {
  id: string; reference: string; modePaiement: string; montant: number;
  statut: string; createdAt: string;
  patient?: { nomComplet?: string; nom?: string; prenom?: string };
  facture?: { reference?: string };
}

export default function CaissePage() {
  const [stats, setStats] = useState<StatsCaisse | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleExportXLSX = () => exportXLSX(
    paiements.map(p => ({
      'Référence': p.reference ?? p.id.slice(0,8),
      'Patient': p.patient?.nomComplet ?? (p.patient ? `${p.patient.prenom ?? ''} ${p.patient.nom ?? ''}`.trim() : '—'),
      'Facture': p.facture?.reference ?? '—',
      'Mode paiement': p.modePaiement ?? '—',
      'Montant (XOF)': p.montant ?? 0,
      'Statut': p.statut ?? '—',
      'Date': p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—',
    })),
    `caisse_${new Date().toISOString().slice(0,10)}`,
    'Paiements',
  );
  const handleExportPDF = () => exportPDF(
    [
      { header: 'Référence', dataKey: 'ref', width: 30 },
      { header: 'Patient', dataKey: 'patient', width: 42 },
      { header: 'Mode', dataKey: 'mode', width: 28 },
      { header: 'Montant XOF', dataKey: 'montant', width: 32 },
      { header: 'Statut', dataKey: 'statut', width: 22 },
      { header: 'Date', dataKey: 'date', width: 24 },
    ],
    paiements.map(p => ({
      ref: p.reference ?? p.id.slice(0,8),
      patient: p.patient?.nomComplet ?? (p.patient ? `${p.patient.prenom ?? ''} ${p.patient.nom ?? ''}`.trim() : '—'),
      mode: p.modePaiement ?? '—',
      montant: (p.montant ?? 0).toLocaleString('fr-FR'),
      statut: p.statut ?? '—',
      date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—',
    })),
    'Caisse — Paiements',
    `caisse_${new Date().toISOString().slice(0,10)}`,
    `${paiements.length} paiement(s) — ${new Date().toLocaleDateString('fr-FR')}`,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, paiementsData] = await Promise.allSettled([
        apiClient('/paiements/stats-caisse'),
        apiClient('/paiements?limit=50'),
      ]);
      if (statsData.status === 'fulfilled') setStats(statsData.value as StatsCaisse);
      if (paiementsData.status === 'fulfilled') {
        const d = paiementsData.value as any;
        setPaiements(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalJour = stats?.totalJour ?? 0;
  const getMode = (key: string) => Number(stats?.parMode?.find(m => m.modePaiement === key)?.total ?? 0);
  const totalEspeces = getMode('especes');
  const totalMobile  = getMode('mobile_money');
  const totalCarte   = getMode('carte');
  const nbTransactions = stats?.parMode?.reduce((acc, m) => acc + Number(m.count), 0) ?? 0;

  const filtered = paiements.filter(p => !modeFilter || p.modePaiement === modeFilter);
  const patientName = (p: Paiement) => p.patient?.nomComplet || (p.patient?.prenom && p.patient?.nom ? `${p.patient.prenom} ${p.patient.nom}` : '—');

  const repartition = (stats?.parMode ?? []).map(m => ({
    mode: m.modePaiement,
    label: MODE_CONFIG[m.modePaiement]?.label ?? m.modePaiement,
    montant: Number(m.total),
    count: Number(m.count),
    color: MODE_CONFIG[m.modePaiement]?.color ?? '#546E7A',
    bg: MODE_CONFIG[m.modePaiement]?.bg ?? '#F5F5F5',
  }));

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .tx-row:hover { background: #F0FDF4 !important; }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#047857 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(6,78,59,0.35)' }}>
        <div style={{ position: 'absolute', top: -60, right: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -50, right: 260, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Caisse du jour</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {TODAY_STR}
                  {lastRefresh && <span style={{ marginLeft: 8, opacity: 0.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Actualiser
              </button>
              <button onClick={handleExportPDF} disabled={loading || paiements.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(239,68,68,0.25)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                <Download size={13}/> PDF
              </button>
              <button onClick={handleExportXLSX} disabled={loading || paiements.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#065F46', fontWeight: 800 }}>
                <FileSpreadsheet size={13}/> XLSX
              </button>
            </div>
          </div>

          {/* KPI pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Total encaissé',   val: loading ? '…' : fmtXOF(totalJour),    icon: <TrendingUp size={11}/> },
              { label: 'Transactions',     val: loading ? '…' : nbTransactions,        icon: <Hash size={11}/> },
              { label: 'Espèces',          val: loading ? '…' : fmtXOF(totalEspeces),  icon: <Banknote size={11}/> },
              { label: 'Mobile Money',     val: loading ? '…' : fmtXOF(totalMobile),   icon: <Smartphone size={11}/> },
              { label: 'Carte',            val: loading ? '…' : fmtXOF(totalCarte),    icon: <CreditCard size={11}/> },
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

      {/* ── BODY: TABLE + RÉPARTITION ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 16, alignItems: 'start' }}>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          {/* Mode filter chips */}
          <div style={{ padding: '12px 16px', borderBottom: '1.5px solid #EEF2F8', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Mode :</span>
            {['', ...Object.keys(MODE_CONFIG)].map(mode => {
              const cfg = mode ? MODE_CONFIG[mode] : null;
              const active = modeFilter === mode;
              return (
                <button key={mode || 'all'} onClick={() => setModeFilter(mode)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? (cfg?.color ?? '#065F46') : '#E0E8F0'}`, background: active ? (cfg?.bg ?? '#D1FAE5') : '#fff', color: active ? (cfg?.color ?? '#065F46') : '#546E7A', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                  {cfg?.icon} {mode ? cfg?.label : 'Tous'}
                </button>
              );
            })}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Heure', 'Référence', 'Patient', 'Facture', 'Mode', 'Montant', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '13px 14px' }}>
                        <div style={{ height: 13, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', borderRadius: 4, width: j === 2 ? 110 : 60, animation: 'pulse 1.5s ease infinite' }}/>
                      </td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                      <Receipt size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}/>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>Aucune transaction</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>Aucun paiement pour ce filtre</div>
                    </td>
                  </tr>
                ) : filtered.map(t => {
                  const cfg = MODE_CONFIG[t.modePaiement] ?? MODE_CONFIG['especes'];
                  const annule = t.statut?.toLowerCase().includes('annul');
                  return (
                    <tr key={t.id} className="tx-row"
                      style={{ borderTop: '1px solid #F0F4FA', opacity: annule ? 0.55 : 1, transition: 'background .15s' }}>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtTime(t.createdAt)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{t.reference || '—'}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: '#37474F', fontWeight: 600 }}>{patientName(t)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#90A4AE' }}>{t.facture?.reference || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '3px 10px', borderRadius: 20 }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 800, color: annule ? '#90A4AE' : '#065F46', textDecoration: annule ? 'line-through' : 'none', whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtXOF(t.montant)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: annule ? '#FFEBEE' : '#D1FAE5', color: annule ? '#C62828' : '#065F46' }}>
                          {annule ? 'Annulé' : 'Validé'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Répartition panel */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '18px', animation: 'fadeUp .3s ease' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Répartition par mode</h3>

          {/* Total visuel */}
          <div style={{ background: 'linear-gradient(135deg,#064E3B,#047857)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total du jour</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '…' : fmtXOF(totalJour)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{nbTransactions} transaction{nbTransactions > 1 ? 's' : ''}</div>
          </div>

          {repartition.length === 0 ? (
            <p style={{ fontSize: 12, color: '#90A4AE', textAlign: 'center', margin: '20px 0' }}>Aucune donnée disponible</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {repartition.map(r => {
                const pct = totalJour > 0 ? Math.round((r.montant / totalJour) * 100) : 0;
                return (
                  <div key={r.mode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: r.color, fontWeight: 700 }}>
                        <span style={{ background: r.bg, padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{r.label}</span>
                      </span>
                      <span style={{ color: r.color, fontWeight: 800 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 7, background: '#F0F4FA', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 4, transition: 'width 0.6s ease' }}/>
                    </div>
                    <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{fmtXOF(r.montant)}</span>
                      <span>{r.count} tx</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
