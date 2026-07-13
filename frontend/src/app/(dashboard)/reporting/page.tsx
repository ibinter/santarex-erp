'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Users, CreditCard, Activity, Download, RefreshCw, Bed } from 'lucide-react';
import { apiClient } from '@/lib/api';

type FactureStats = { totalHT?: number; totalTTC?: number; totalPaye?: number; nbFactures?: number; tauxRecouvrement?: number; parStatut?: Record<string, number> };
type HospStats = { totalSejours?: number; sejoursActifs?: number; totalLits?: number; litsOccupes?: number; tauxOccupation?: number };
type LaboStats = { totalDemandes?: number; demandesUrgentes?: number; demandesTraitees?: number };

function fmtXOF(v?: number) { if (v == null) return '—'; if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M XOF'; return v.toLocaleString('fr-FR') + ' XOF'; }
function pct(v?: number) { return v != null ? v.toFixed(1) + '%' : '—'; }

const SERVICES_COLORS = ['#0D47A1','#1565C0','#00838F','#6A1B9A','#00695C'];

const RAPPORT_ITEMS = [
  { titre: "Rapport d'activité médicale", desc: 'Consultations, actes, diagnostics', color: '#0D47A1', bg: '#EFF6FF' },
  { titre: 'Rapport financier mensuel', desc: 'Recettes, dépenses, résultat', color: '#2E7D32', bg: '#E8F5E9' },
  { titre: 'Tableau de bord DRH', desc: 'Personnel, absences, heures sup.', color: '#37474F', bg: '#ECEFF1' },
  { titre: 'Rapport pharmacie & stocks', desc: 'Mouvements, ruptures, valorisation', color: '#E65100', bg: '#FFF3E0' },
  { titre: 'Rapport épidémiologique', desc: 'Maladies, tendances, alertes', color: '#6A1B9A', bg: '#F3E5F5' },
  { titre: 'Rapport qualité soins', desc: 'Satisfaction, incidents, indicateurs', color: '#00695C', bg: '#E0F2F1' },
];

export default function ReportingPage() {
  const [factureStats, setFactureStats] = useState<FactureStats | null>(null);
  const [hospStats, setHospStats] = useState<HospStats | null>(null);
  const [laboStats, setLaboStats] = useState<LaboStats | null>(null);
  const [nbPatients, setNbPatients] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [f, h, l, p] = await Promise.allSettled([
      apiClient<FactureStats>('/facturation/stats'),
      apiClient<HospStats>('/hospitalisation/sejours/stats'),
      apiClient<LaboStats>('/laboratoire/stats/jour'),
      apiClient<any>('/patients?limit=1'),
    ]);
    if (f.status === 'fulfilled') setFactureStats(f.value);
    if (h.status === 'fulfilled') setHospStats(h.value);
    if (l.status === 'fulfilled') setLaboStats(l.value);
    if (p.status === 'fulfilled') {
      const v = p.value;
      setNbPatients(v?.total ?? v?.count ?? (Array.isArray(v) ? v.length : null));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    {
      label: 'Total patients',
      value: nbPatients != null ? nbPatients.toLocaleString('fr-FR') : '—',
      sub: 'dossiers enregistrés',
      color: '#0D47A1', bg: '#EFF6FF',
      icon: <Users size={20} color="#0D47A1" />,
    },
    {
      label: 'Recettes totales',
      value: fmtXOF(factureStats?.totalTTC ?? factureStats?.totalHT),
      sub: `${nbFactures(factureStats)} factures · ${pct(factureStats?.tauxRecouvrement)} recouvrés`,
      color: '#2E7D32', bg: '#E8F5E9',
      icon: <CreditCard size={20} color="#2E7D32" />,
    },
    {
      label: "Taux d'occupation",
      value: hospStats?.tauxOccupation != null ? pct(hospStats.tauxOccupation) : '—',
      sub: hospStats ? `${hospStats.litsOccupes ?? '—'} / ${hospStats.totalLits ?? '—'} lits` : 'Hospitalisation',
      color: '#1565C0', bg: '#E3F2FD',
      icon: <Bed size={20} color="#1565C0" />,
    },
    {
      label: 'Analyses du jour',
      value: laboStats?.totalDemandes != null ? laboStats.totalDemandes.toString() : '—',
      sub: laboStats?.demandesUrgentes ? `${laboStats.demandesUrgentes} urgente(s)` : 'Laboratoire',
      color: '#6A1B9A', bg: '#F3E5F5',
      icon: <Activity size={20} color="#6A1B9A" />,
    },
  ];

  const parStatut = factureStats?.parStatut ?? {};
  const statuts = Object.entries(parStatut);
  const totalStatuts = statuts.reduce((s, [, v]) => s + v, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={22} color="#1565C0" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A2332' }}>Reporting & Indicateurs</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#546E7A' }}>Tableaux de bord et indicateurs clés d'activité</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 12, color: '#546E7A', fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{k.icon}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? <span style={{ display: 'inline-block', width: 80, height: 28, background: '#F0F4F8', borderRadius: 6 }} /> : k.value}
            </div>
            <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Répartition factures par statut */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Factures par statut
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 32, background: '#F0F4F8', borderRadius: 6, marginBottom: 10 }} />)
          ) : statuts.length === 0 ? (
            <p style={{ color: '#CFD8DC', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
          ) : statuts.map(([s, n], i) => {
            const p = totalStatuts > 0 ? (n / totalStatuts) * 100 : 0;
            const col = SERVICES_COLORS[i % SERVICES_COLORS.length];
            const labelMap: Record<string, string> = { payee: 'Payée', partielle: 'Partielle', impayee: 'Impayée', annulee: 'Annulée', en_attente: 'En attente' };
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#37474F' }}>{labelMap[s] ?? s}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{n} ({p.toFixed(0)}%)</span>
                </div>
                <div style={{ height: 8, background: '#F5F7FA', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: col, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
          {factureStats?.totalPaye != null && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#E8F5E9', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600 }}>Total encaissé</span>
              <span style={{ fontSize: 13, color: '#2E7D32', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(factureStats.totalPaye)}</span>
            </div>
          )}
        </div>

        {/* Hospitalisation */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hospitalisation
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 40, background: '#F0F4F8', borderRadius: 6, marginBottom: 10 }} />)
          ) : hospStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { l: 'Séjours actifs', v: hospStats.sejoursActifs, color: '#1565C0', bg: '#EFF6FF' },
                { l: 'Total lits', v: hospStats.totalLits, color: '#37474F', bg: '#ECEFF1' },
                { l: 'Lits occupés', v: hospStats.litsOccupes, color: '#E65100', bg: '#FFF3E0' },
                { l: "Taux d'occupation", v: hospStats.tauxOccupation != null ? pct(hospStats.tauxOccupation) : '—', color: '#00695C', bg: '#E0F2F1' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: 10, background: item.bg, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.v ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#546E7A', marginTop: 4 }}>{item.l}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#CFD8DC', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Rapports disponibles */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exports disponibles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {RAPPORT_ITEMS.map((r, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, background: r.bg, border: `1px solid ${r.color}22`, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: r.color, marginBottom: 4 }}>{r.titre}</div>
              <div style={{ fontSize: 11, color: '#546E7A', marginBottom: 10 }}>{r.desc}</div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: r.color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                <Download size={11} /> Générer PDF
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function nbFactures(s: FactureStats | null) {
  if (!s?.nbFactures) return '0';
  return s.nbFactures.toString();
}
