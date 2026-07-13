'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Receipt, Banknote, Smartphone, CreditCard, Shield, RefreshCw, Download } from 'lucide-react';
import { api, apiClient } from '@/lib/api';
import type { ModePaiement } from '@/types';

const TODAY_STR = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const MODE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  especes:      { label: 'Espèces',      color: '#2E7D32', bg: '#E8F5E9', icon: <Banknote size={14} /> },
  mobile_money: { label: 'Mobile Money', color: '#E65100', bg: '#FFF3E0', icon: <Smartphone size={14} /> },
  carte:        { label: 'Carte',        color: '#0D47A1', bg: '#EFF6FF', icon: <CreditCard size={14} /> },
  assurance:    { label: 'Assurance',    color: '#6A1B9A', bg: '#F3E5F5', icon: <Shield size={14} /> },
  virement:     { label: 'Virement',     color: '#37474F', bg: '#ECEFF1', icon: <DollarSign size={14} /> },
};

function fmtXOF(val: number) {
  return val.toLocaleString('fr-FR') + ' XOF';
}

function fmtTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

interface StatsCaisse {
  totalJour: number;
  parMode: { modePaiement: string; total: string; count: string }[];
}

interface Paiement {
  id: string;
  reference: string;
  modePaiement: string;
  montant: number;
  statut: string;
  createdAt: string;
  patient?: { nomComplet?: string; nom?: string; prenom?: string };
  facture?: { reference?: string };
}

export default function CaissePage() {
  const [stats, setStats] = useState<StatsCaisse | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalJour = stats?.totalJour ?? 0;
  const totalEspeces = stats?.parMode?.find(m => m.modePaiement === 'especes') ? Number(stats.parMode.find(m => m.modePaiement === 'especes')!.total) : 0;
  const totalMobile = stats?.parMode?.find(m => m.modePaiement === 'mobile_money') ? Number(stats.parMode.find(m => m.modePaiement === 'mobile_money')!.total) : 0;
  const totalCarte = stats?.parMode?.find(m => m.modePaiement === 'carte') ? Number(stats.parMode.find(m => m.modePaiement === 'carte')!.total) : 0;
  const nbTransactions = stats?.parMode?.reduce((acc, m) => acc + Number(m.count), 0) ?? 0;

  const filtered = paiements.filter(p => !modeFilter || p.modePaiement === modeFilter);

  const patientName = (p: Paiement) => p.patient?.nomComplet || (p.patient?.prenom && p.patient?.nom ? `${p.patient.prenom} ${p.patient.nom}` : '—');

  const repartition = (stats?.parMode ?? []).map(m => ({
    mode: m.modePaiement,
    label: MODE_CONFIG[m.modePaiement]?.label ?? m.modePaiement,
    montant: Number(m.total),
    count: Number(m.count),
    color: MODE_CONFIG[m.modePaiement]?.color ?? '#546E7A',
  }));

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={20} color="#2E7D32" />
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A2332' }}>Caisse du jour</h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#546E7A', textTransform: 'capitalize' }}>
            {TODAY_STR}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: '13px', color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#0D47A1', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#fff', fontWeight: 600 }}>
            <Download size={14} />
            Exporter
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total encaissé', value: loading ? '…' : fmtXOF(totalJour), icon: <DollarSign size={18} color="#2E7D32" />, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Nb transactions', value: loading ? '…' : nbTransactions, icon: <Receipt size={18} color="#0D47A1" />, color: '#0D47A1', bg: '#EFF6FF' },
          { label: 'Espèces', value: loading ? '…' : fmtXOF(totalEspeces), icon: <Banknote size={18} color="#2E7D32" />, color: '#2E7D32', bg: '#F1F8E9' },
          { label: 'Mobile Money', value: loading ? '…' : fmtXOF(totalMobile), icon: <Smartphone size={18} color="#E65100" />, color: '#E65100', bg: '#FFF3E0' },
          { label: 'Carte bancaire', value: loading ? '…' : fmtXOF(totalCarte), icon: <CreditCard size={18} color="#0D47A1" />, color: '#0D47A1', bg: '#E3F2FD' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>{k.icon}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '16px', marginBottom: '16px', alignItems: 'start' }}>

        {/* Tableau */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {/* Filtres */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F7FA', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#546E7A', fontWeight: 600 }}>Mode :</span>
            {['', ...Object.keys(MODE_CONFIG)].map(mode => (
              <button key={mode || 'all'} onClick={() => setModeFilter(mode)}
                style={{ padding: '4px 12px', borderRadius: '20px', border: `1px solid ${modeFilter === mode ? '#0D47A1' : '#E0E0E0'}`, background: modeFilter === mode ? '#0D47A1' : '#fff', color: modeFilter === mode ? '#fff' : '#546E7A', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                {mode ? MODE_CONFIG[mode]?.label : 'Tous'}
              </button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  {['Heure', 'Référence', 'Patient', 'Facture', 'Mode', 'Montant', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} style={{ padding: '12px 14px' }}>
                          <div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 2 ? 100 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#90A4AE', fontSize: '13px' }}>
                      <Receipt size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                      Aucune transaction pour ce filtre
                    </td>
                  </tr>
                ) : filtered.map(t => {
                  const cfg = MODE_CONFIG[t.modePaiement] ?? MODE_CONFIG['especes'];
                  const annule = t.statut?.toLowerCase().includes('annul');
                  return (
                    <tr key={t.id} style={{ borderTop: '1px solid #F5F7FA', opacity: annule ? 0.55 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#546E7A', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtTime(t.createdAt)}</td>
                      <td style={{ padding: '11px 14px', fontSize: '11px', fontWeight: 700, color: '#1A2332', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{t.reference || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#37474F' }}>{patientName(t)}</td>
                      <td style={{ padding: '11px 14px', fontSize: '11px', color: '#546E7A' }}>{t.facture?.reference || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: '20px' }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 700, color: annule ? '#90A4AE' : '#1A2332', textDecoration: annule ? 'line-through' : 'none', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {fmtXOF(t.montant)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: annule ? '#FFEBEE' : '#E8F5E9', color: annule ? '#C62828' : '#2E7D32' }}>
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

        {/* Répartition */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#37474F', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Répartition</h3>
          {repartition.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#90A4AE', textAlign: 'center', margin: '20px 0' }}>Aucune donnée</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {repartition.map(r => {
                const pct = totalJour > 0 ? Math.round((r.montant / totalJour) * 100) : 0;
                return (
                  <div key={r.mode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#37474F', fontWeight: 600 }}>{r.label}</span>
                      <span style={{ color: r.color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#90A4AE', marginTop: '2px' }}>{fmtXOF(r.montant)} • {r.count} transaction(s)</div>
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
