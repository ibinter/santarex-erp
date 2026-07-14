'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Users, CreditCard, Activity, Download,
  RefreshCw, Bed, FileText, AlertTriangle, CheckCircle,
  ShieldCheck, Package, Heart,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type FactureStats = {
  totalHT?: number; totalTTC?: number; totalPaye?: number;
  nbFactures?: number; tauxRecouvrement?: number;
  parStatut?: Record<string, number>;
};
type HospStats = {
  totalSejours?: number; sejoursActifs?: number;
  totalLits?: number; litsOccupes?: number; tauxOccupation?: number;
};
type LaboStats = { totalDemandes?: number; demandesUrgentes?: number; demandesTraitees?: number };

function fmtXOF(v?: number) {
  if (v == null) return '—';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'k';
  return v.toLocaleString('fr-FR');
}
function pct(v?: number) { return v != null ? v.toFixed(1) + '%' : '—'; }
function nbFactures(s: FactureStats | null) {
  return s?.nbFactures?.toString() ?? '0';
}

const STATUT_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  payee:      { label: 'Payée',      color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  partielle:  { label: 'Partielle',  color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
  impayee:    { label: 'Impayée',    color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
  en_attente: { label: 'En attente', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  annulee:    { label: 'Annulée',    color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' },
};

const RAPPORT_ITEMS = [
  { titre: "Activité médicale",        desc: 'Consultations, actes, diagnostics', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', icon: <Heart size={16} color="#1E40AF"/> },
  { titre: 'Rapport financier',        desc: 'Recettes, dépenses, résultat net',  color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', icon: <CreditCard size={16} color="#065F46"/> },
  { titre: 'Tableau de bord DRH',      desc: 'Personnel, absences, heures sup.',  color: '#374151', bg: '#F3F4F6', border: '#D1D5DB', icon: <Users size={16} color="#374151"/> },
  { titre: 'Pharmacie & stocks',       desc: 'Mouvements, ruptures, valorisation',color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: <Package size={16} color="#92400E"/> },
  { titre: 'Rapport épidémiologique',  desc: 'Maladies, tendances, alertes',      color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD', icon: <AlertTriangle size={16} color="#5B21B6"/> },
  { titre: 'Qualité des soins',        desc: 'Satisfaction, incidents, KPIs',     color: '#0F766E', bg: '#CCFBF1', border: '#5EEAD4', icon: <ShieldCheck size={16} color="#0F766E"/> },
];

export default function ReportingPage() {
  const [factureStats, setFactureStats] = useState<FactureStats | null>(null);
  const [hospStats,    setHospStats]    = useState<HospStats | null>(null);
  const [laboStats,    setLaboStats]    = useState<LaboStats | null>(null);
  const [nbPatients,   setNbPatients]   = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);

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

  const parStatut    = factureStats?.parStatut ?? {};
  const statuts      = Object.entries(parStatut);
  const totalStatuts = statuts.reduce((s, [, v]) => s + v, 0);

  const kpis = [
    {
      label: 'Total patients',
      value: nbPatients != null ? nbPatients.toLocaleString('fr-FR') : '—',
      unit:  'dossiers',
      sub:   'enregistrés',
      color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD',
      icon: <Users size={20} color="#1D4ED8"/>,
    },
    {
      label: 'Recettes (TTC)',
      value: fmtXOF(factureStats?.totalTTC ?? factureStats?.totalHT),
      unit:  'XOF',
      sub:   `${nbFactures(factureStats)} factures`,
      color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',
      icon: <CreditCard size={20} color="#065F46"/>,
    },
    {
      label: "Taux d'occupation",
      value: hospStats?.tauxOccupation != null ? pct(hospStats.tauxOccupation) : '—',
      unit:  '',
      sub:   hospStats ? `${hospStats.litsOccupes ?? '—'} / ${hospStats.totalLits ?? '—'} lits` : 'Hospitalisation',
      color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD',
      icon: <Bed size={20} color="#1E40AF"/>,
    },
    {
      label: 'Analyses du jour',
      value: laboStats?.totalDemandes != null ? laboStats.totalDemandes.toString() : '—',
      unit:  'demandes',
      sub:   laboStats?.demandesUrgentes ? `${laboStats.demandesUrgentes} urgente(s)` : 'Laboratoire',
      color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD',
      icon: <Activity size={20} color="#5B21B6"/>,
    },
  ];

  const Skeleton = ({ w = 80, h = 16 }: { w?: number; h?: number }) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', animation: 'pulse 1.5s ease infinite', display: 'inline-block' }}/>
  );

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .rpt-card:hover  { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.12) !important; }
        .rpt-export:hover{ transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,0.12) !important; }
        .dl-btn:hover    { opacity:.88; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#0A0F1E 0%,#0D2137 50%,#0F3460 100%)',
        backgroundImage: 'linear-gradient(135deg,#0A0F1E 0%,#0D2137 50%,#0F3460 100%), repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.015) 40px,rgba(255,255,255,0.015) 41px), repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.015) 40px,rgba(255,255,255,0.015) 41px)',
        borderRadius: 18, padding: '22px 26px 18px', marginBottom: 18,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(10,15,30,0.55)',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:40,  width:220, height:220, borderRadius:'50%', background:'rgba(29,78,216,0.12)' }}/>
        <div style={{ position:'absolute', bottom:-60, right:200, width:140, height:140, borderRadius:'50%', background:'rgba(91,33,182,0.1)' }}/>
        <div style={{ position:'absolute', top:10, right:260, width:80, height:80, borderRadius:'50%', background:'rgba(99,179,237,0.06)' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.14)', border:'1.5px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <BarChart2 size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:21, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Reporting & Indicateurs</h1>
                <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>
                  Tableau de bord transversal — {new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
                </p>
              </div>
            </div>
            <button onClick={load} disabled={loading}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700 }}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Actualiser
            </button>
          </div>

          {/* Hero pills — live KPI summary */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:16 }}>
            {[
              { label:'Recouvrement', val: pct(factureStats?.tauxRecouvrement), ok: (factureStats?.tauxRecouvrement ?? 0) >= 70 },
              { label:'Encaissé',     val: fmtXOF(factureStats?.totalPaye) + ' XOF', ok: true },
              { label:'Séjours actifs', val: hospStats?.sejoursActifs?.toString() ?? '—', ok: true },
              { label:'Urgences labo', val: laboStats?.demandesUrgentes?.toString() ?? '—', ok: (laboStats?.demandesUrgentes ?? 0) < 10 },
            ].map((p,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:8, padding:'4px 12px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background: p.ok ? '#34D399' : '#F87171', display:'inline-block', flexShrink:0 }}/>
                <span style={{ fontSize:12, fontWeight:800, color:'#fff' }}>
                  {loading ? '…' : p.val}
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12, marginBottom:18 }}>
        {kpis.map((k,i) => (
          <div key={i} className="rpt-card" style={{
            background:'#fff', borderRadius:14, padding:'18px 20px',
            boxShadow:'0 1px 8px rgba(0,0,0,0.08)',
            border:`1.5px solid ${k.border}`,
            transition:'all .2s ease', cursor:'default',
            animation:`fadeUp .25s ease ${i*0.05}s both`,
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {k.icon}
              </div>
              <TrendingUp size={12} color={k.color} style={{ opacity:.5 }}/>
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:k.color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
              {loading ? <Skeleton w={90} h={28}/> : k.value}
              {!loading && k.unit && <span style={{ fontSize:13, fontWeight:700, marginLeft:4 }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize:13, color:'#1A2332', fontWeight:700, marginTop:6 }}>{k.label}</div>
            <div style={{ fontSize:11, color:'#90A4AE', marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PANELS ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

        {/* Factures par statut */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #EEF2F8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1A2332', textTransform:'uppercase', letterSpacing:'0.5px' }}>Factures par statut</span>
            {factureStats?.nbFactures && (
              <span style={{ fontSize:11, fontWeight:700, color:'#1E40AF', background:'#DBEAFE', padding:'2px 10px', borderRadius:20, border:'1px solid #93C5FD' }}>
                {factureStats.nbFactures} total
              </span>
            )}
          </div>
          <div style={{ padding:'18px 20px' }}>
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <Skeleton w={80}/> <Skeleton w={50}/>
                  </div>
                  <div style={{ height:8, background:'#F0F4FA', borderRadius:4 }}/>
                </div>
              ))
            ) : statuts.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#90A4AE', fontSize:13 }}>
                <FileText size={28} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }}/> Aucune donnée
              </div>
            ) : (
              <>
                {statuts.map(([s, n]) => {
                  const cfg = STATUT_CFG[s] ?? { label: s, color:'#546E7A', bg:'#F3F4F6', border:'#E5E7EB' };
                  const perc = totalStatuts > 0 ? (n / totalStatuts) * 100 : 0;
                  return (
                    <div key={s} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:800, padding:'2px 9px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize:12, fontWeight:800, color:cfg.color, fontVariantNumeric:'tabular-nums' }}>{n} ({perc.toFixed(0)}%)</span>
                      </div>
                      <div style={{ height:7, background:'#F0F4FA', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${perc}%`, background:`linear-gradient(90deg,${cfg.color},${cfg.color}cc)`, borderRadius:4, transition:'width .5s ease' }}/>
                      </div>
                    </div>
                  );
                })}
                {factureStats?.totalPaye != null && (
                  <div style={{ marginTop:14, padding:'10px 14px', background:'linear-gradient(135deg,#D1FAE5,#ECFDF5)', borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #6EE7B7' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <CheckCircle size={14} color="#065F46"/>
                      <span style={{ fontSize:12, color:'#065F46', fontWeight:700 }}>Total encaissé</span>
                    </div>
                    <span style={{ fontSize:14, color:'#065F46', fontWeight:900, fontVariantNumeric:'tabular-nums' }}>{fmtXOF(factureStats.totalPaye)} XOF</span>
                  </div>
                )}
                {factureStats?.tauxRecouvrement != null && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4, color:'#78909C', fontWeight:600 }}>
                      <span>Taux de recouvrement</span>
                      <span style={{ color:'#065F46', fontWeight:800 }}>{pct(factureStats.tauxRecouvrement)}</span>
                    </div>
                    <div style={{ height:6, background:'#F0F4FA', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(factureStats.tauxRecouvrement, 100)}%`, background:'linear-gradient(90deg,#065F46,#10B981)', borderRadius:3 }}/>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Hospitalisation */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #EEF2F8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1A2332', textTransform:'uppercase', letterSpacing:'0.5px' }}>Hospitalisation</span>
            {hospStats?.tauxOccupation != null && (
              <span style={{ fontSize:11, fontWeight:700, color: hospStats.tauxOccupation >= 80 ? '#991B1B' : '#065F46', background: hospStats.tauxOccupation >= 80 ? '#FEE2E2' : '#D1FAE5', padding:'2px 10px', borderRadius:20, border:`1px solid ${hospStats.tauxOccupation >= 80 ? '#FECACA' : '#6EE7B7'}` }}>
                {pct(hospStats.tauxOccupation)} occupation
              </span>
            )}
          </div>
          <div style={{ padding:'18px 20px' }}>
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height:80, background:'#F0F4FA', borderRadius:10, animation:'pulse 1.5s ease infinite' }}/>)}
              </div>
            ) : hospStats ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  {[
                    { l:'Séjours actifs',  v:hospStats.sejoursActifs,   color:'#1E40AF', bg:'#DBEAFE', border:'#93C5FD' },
                    { l:'Total séjours',   v:hospStats.totalSejours,    color:'#374151', bg:'#F3F4F6', border:'#D1D5DB' },
                    { l:'Lits occupés',    v:hospStats.litsOccupes,     color:'#991B1B', bg:'#FEE2E2', border:'#FECACA' },
                    { l:'Total lits',      v:hospStats.totalLits,       color:'#0F766E', bg:'#CCFBF1', border:'#5EEAD4' },
                  ].map((item,i) => (
                    <div key={i} style={{ padding:'14px 16px', borderRadius:11, background:item.bg, border:`1.5px solid ${item.border}`, textAlign:'center' }}>
                      <div style={{ fontSize:24, fontWeight:900, color:item.color, fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{item.v ?? '—'}</div>
                      <div style={{ fontSize:11, color:'#546E7A', marginTop:5, fontWeight:600 }}>{item.l}</div>
                    </div>
                  ))}
                </div>
                {/* Occupation bar */}
                {hospStats.tauxOccupation != null && hospStats.totalLits && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#78909C', fontWeight:600, marginBottom:6 }}>
                      <span>Capacité utilisée</span>
                      <span style={{ color: hospStats.tauxOccupation >= 80 ? '#991B1B' : '#065F46', fontWeight:800 }}>{hospStats.litsOccupes ?? '—'} / {hospStats.totalLits} lits</span>
                    </div>
                    <div style={{ height:10, background:'#F0F4FA', borderRadius:5, overflow:'hidden', position:'relative' }}>
                      <div style={{ height:'100%', width:`${Math.min(hospStats.tauxOccupation, 100)}%`, background: hospStats.tauxOccupation >= 80 ? 'linear-gradient(90deg,#991B1B,#EF4444)' : 'linear-gradient(90deg,#1E40AF,#3B82F6)', borderRadius:5, transition:'width .5s ease' }}/>
                    </div>
                    {hospStats.tauxOccupation >= 80 && (
                      <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#991B1B', fontWeight:700, background:'#FEE2E2', padding:'5px 10px', borderRadius:8, border:'1px solid #FECACA' }}>
                        <AlertTriangle size={11}/> Capacité élevée — surveiller les admissions
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#90A4AE', fontSize:13 }}>
                <Bed size={28} style={{ display:'block', margin:'0 auto 8px', opacity:.3 }}/> Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LABORATOIRE MINI-PANEL ─────────────────────────── */}
      {(laboStats || loading) && (
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden', marginBottom:14 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #EEF2F8' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#1A2332', textTransform:'uppercase', letterSpacing:'0.5px' }}>Laboratoire — activité du jour</span>
          </div>
          <div style={{ padding:'16px 20px', display:'flex', gap:14, flexWrap:'wrap' }}>
            {[
              { l:'Total demandes',   v:laboStats?.totalDemandes,    color:'#5B21B6', bg:'#EDE9FE', border:'#C4B5FD' },
              { l:'Urgentes',         v:laboStats?.demandesUrgentes, color:'#991B1B', bg:'#FEE2E2', border:'#FECACA' },
              { l:'Traitées',         v:laboStats?.demandesTraitees, color:'#065F46', bg:'#D1FAE5', border:'#6EE7B7' },
            ].map((s,i) => (
              <div key={i} style={{ flex:'1 1 140px', padding:'14px 16px', borderRadius:11, background:s.bg, border:`1.5px solid ${s.border}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:22, fontWeight:900, color:s.color, fontVariantNumeric:'tabular-nums' }}>
                  {loading ? <Skeleton w={40} h={24}/> : (s.v ?? '—')}
                </div>
                <div style={{ fontSize:12, color:'#546E7A', fontWeight:600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXPORTS DISPONIBLES ────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #EEF2F8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#1A2332', textTransform:'uppercase', letterSpacing:'0.5px' }}>Exports disponibles</span>
          <span style={{ fontSize:11, color:'#90A4AE', fontWeight:600 }}>{RAPPORT_ITEMS.length} rapports</span>
        </div>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {RAPPORT_ITEMS.map((r,i) => (
              <div key={i} className="rpt-export" style={{
                padding:'16px 18px', borderRadius:12,
                background:'#FAFBFC', border:`1.5px solid ${r.border}`,
                cursor:'pointer', transition:'all .18s ease',
                animation:`fadeUp .25s ease ${i*0.04}s both`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:r.bg, border:`1px solid ${r.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {r.icon}
                  </div>
                  <div style={{ fontWeight:800, fontSize:13, color:'#1A2332', lineHeight:1.3 }}>{r.titre}</div>
                </div>
                <div style={{ fontSize:12, color:'#546E7A', marginBottom:12, lineHeight:1.5 }}>{r.desc}</div>
                <button className="dl-btn" style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, background:r.color, color:'#fff', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, transition:'opacity .15s' }}>
                  <Download size={11}/> Générer PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
