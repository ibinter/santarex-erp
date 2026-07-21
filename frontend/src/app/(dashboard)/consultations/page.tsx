'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Plus, Search, RefreshCw, Eye,
  Clock, CheckCircle, Receipt, ChevronRight, Calendar,
  TrendingUp, Activity, User, Download, FileSpreadsheet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

type Consultation = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?: { id: string; nom: string; prenom: string };
  dateHeure: string; motif?: string; diagnostic?: string;
  statut: 'en_cours' | 'terminee' | 'facturee';
};

const STATUT_CFG: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
  en_cours: { label:'En cours',  bg:'#EFF6FF', color:'#1565C0', dot:'#3B82F6', border:'#BBDEFB' },
  terminee: { label:'Terminée',  bg:'#E8F5E9', color:'#2E7D32', dot:'#4ADE80', border:'#C8E6C9' },
  facturee: { label:'Facturée',  bg:'#F3E5F5', color:'#6A1B9A', dot:'#A855F7', border:'#E1BEE7' },
};

const AVATAR_COLORS = [
  ['#00838F','#E0F7FA'], ['#1565C0','#E3F2FD'], ['#6A1B9A','#F3E5F5'],
  ['#2E7D32','#E8F5E9'], ['#C62828','#FFEBEE'], ['#E65100','#FFF3E0'],
  ['#0288D1','#E1F5FE'], ['#37474F','#ECEFF1'],
];

function avatarColor(name: string): [string, string] {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx] as [string, string];
}

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }),
      time: d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }),
    };
  } catch { return { date:'—', time:'' }; }
}

function timeSince(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.floor(diff/60)}h`;
  return `il y a ${Math.floor(diff/1440)}j`;
}

const TABS = [
  { key: '', labelKey: 'list.tabAll', icon: Activity },
  { key: 'en_cours', labelKey: 'list.tabEnCours', icon: Clock },
  { key: 'terminee', labelKey: 'list.tabTerminees', icon: CheckCircle },
  { key: 'facturee', labelKey: 'list.tabFacturees', icon: Receipt },
];

export default function ConsultationsPage() {
  const router = useRouter();
  const t = useTranslations('consultations');
  const statutLabel = (s: string) => (({
    en_cours: t('common.statutEnCours'),
    terminee: t('common.statutTerminee'),
    facturee: t('common.statutFacturee'),
  }) as Record<string, string>)[s] ?? s;
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleExportXLSX = () => exportXLSX(
    consultations.map(c => ({
      [t('list.expNumero')]: c.numero ?? c.id.slice(0,8),
      [t('list.expPatient')]: c.patient ? `${c.patient.prenom} ${c.patient.nom}` : '—',
      [t('list.expIpp')]: c.patient?.ipp ?? '—',
      [t('list.expMedecin')]: c.medecin ? `Dr ${c.medecin.prenom} ${c.medecin.nom}` : '—',
      [t('list.expDate')]: c.dateHeure ? new Date(c.dateHeure).toLocaleString('fr-FR') : '—',
      [t('list.expMotif')]: c.motif ?? '—',
      [t('list.expDiagnostic')]: c.diagnostic ?? '—',
      [t('list.expStatut')]: statutLabel(c.statut),
    })),
    `consultations_${new Date().toISOString().slice(0,10)}`,
    t('list.title'),
  );
  const handleExportPDF = () => exportPDF(
    [
      { header: t('list.pdfNumero'), dataKey: 'numero', width: 24 },
      { header: t('list.expPatient'), dataKey: 'patient', width: 38 },
      { header: t('list.expMedecin'), dataKey: 'medecin', width: 34 },
      { header: t('list.expDate'), dataKey: 'date', width: 30 },
      { header: t('list.expMotif'), dataKey: 'motif', width: 44 },
      { header: t('list.expStatut'), dataKey: 'statut', width: 22 },
    ],
    consultations.map(c => ({
      numero: c.numero ?? c.id.slice(0,8),
      patient: c.patient ? `${c.patient.prenom} ${c.patient.nom}` : '—',
      medecin: c.medecin ? `Dr ${c.medecin.prenom} ${c.medecin.nom}` : '—',
      date: c.dateHeure ? new Date(c.dateHeure).toLocaleString('fr-FR') : '—',
      motif: c.motif ?? '—',
      statut: statutLabel(c.statut),
    })),
    t('list.pdfTitle'),
    `consultations_${new Date().toISOString().slice(0,10)}`,
    t('list.pdfSubtitle', { count: consultations.length, date: new Date().toLocaleDateString('fr-FR') }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
      const [conRes, patRes, usrRes] = await Promise.all([
        apiClient<any>('/consultations?limit=100'),
        apiClient<any>('/patients?limit=100'),
        apiClient<any>('/users'),
      ]);
      const pMap: Record<string, any> = Object.fromEntries(unwrap(patRes).map((p: any) => [p.id, p]));
      const uMap: Record<string, any> = Object.fromEntries(unwrap(usrRes).map((u: any) => [u.id, u]));
      // L'API liste ne renvoie que patientId / medecinId : on résout les noms.
      const list = unwrap(conRes).map((c: any) => {
        const p = pMap[c.patientId];
        const u = uMap[c.medecinId];
        return {
          ...c,
          patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : undefined,
          medecin: u ? { id: u.id, nom: u.lastName, prenom: u.firstName } : undefined,
        };
      });
      setConsultations(list);
      setLastRefresh(new Date());
    } catch { setConsultations([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = consultations.filter(c => {
    const q = search.toLowerCase();
    const nom = c.patient ? `${c.patient.prenom} ${c.patient.nom}`.toLowerCase() : '';
    const matchQ = !search || nom.includes(q) || (c.patient?.ipp||'').toLowerCase().includes(q) || (c.numero||'').toLowerCase().includes(q) || (c.motif||'').toLowerCase().includes(q);
    const matchTab = !activeTab || c.statut === activeTab;
    return matchQ && matchTab;
  });

  const counts = {
    total:    consultations.length,
    en_cours: consultations.filter(c=>c.statut==='en_cours').length,
    terminee: consultations.filter(c=>c.statut==='terminee').length,
    facturee: consultations.filter(c=>c.statut==='facturee').length,
  };

  const patName = (c: Consultation) => c.patient ? `${c.patient.prenom} ${c.patient.nom}` : '—';
  const drName  = (c: Consultation) => c.medecin ? `Dr. ${c.medecin.prenom} ${c.medecin.nom}` : '—';

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.5)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cons-row { cursor:pointer; transition:background .12s; }
        .cons-row:hover { background:#F0FBF9!important; }
        .cons-row:hover .cons-eye { opacity:1!important; transform:translateX(0)!important; }
        .cons-eye { opacity:0; transform:translateX(-4px); transition:all .15s; }
        .tab-btn { transition:all .2s; }
        .tab-btn:hover { background:#E0F7FA!important; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#00695C 0%,#00838F 50%,#0097A7 100%)', borderRadius:18, padding:'22px 28px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, boxShadow:'0 8px 28px rgba(0,131,143,0.35)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:80, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, right:260, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:16, zIndex:1 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Stethoscope size={26} color="#fff"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('list.title')}</h1>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>
              {loading ? '…' : t('list.totalCount', { count: counts.total })}
              {lastRefresh && <span style={{ marginLeft:10, opacity:.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, zIndex:1, flexWrap:'wrap' }}>
          <button onClick={load} disabled={loading}
            style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={16} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
          </button>
          <button onClick={handleExportPDF} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 13px', borderRadius:10, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(239,68,68,0.25)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <Download size={13}/> {t('list.pdf')}
          </button>
          <button onClick={handleExportXLSX} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 13px', borderRadius:10, border:'1px solid rgba(255,255,255,0.3)', background:'rgba(34,197,94,0.25)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <FileSpreadsheet size={13}/> {t('list.xlsx')}
          </button>
          <button onClick={() => router.push('/consultations/nouvelle')}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:10, background:'#fff', border:'none', color:'#00838F', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 2px 10px rgba(0,0,0,0.15)' }}>
            <Plus size={15}/> {t('list.new')}
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:t('list.kpiTotal'), value:counts.total, icon:<Activity size={18} color="#00838F"/>, bg:'#E0F7FA', color:'#00838F', border:'#B2EBF2', sub:t('list.kpiTotalSub') },
          { label:t('list.kpiEnCours'), value:counts.en_cours, icon:<Clock size={18} color="#1565C0"/>, bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB', sub:t('list.kpiEnCoursSub') },
          { label:t('list.kpiTerminees'), value:counts.terminee, icon:<CheckCircle size={18} color="#2E7D32"/>, bg:'#E8F5E9', color:'#2E7D32', border:'#C8E6C9', sub:t('list.kpiTermineesSub') },
          { label:t('list.kpiFacturees'), value:counts.facturee, icon:<Receipt size={18} color="#6A1B9A"/>, bg:'#F3E5F5', color:'#6A1B9A', border:'#E1BEE7', sub:t('list.kpiFactureesSub') },
        ].map((k,i) => (
          <div key={i} onClick={()=>setActiveTab(i===0?'':['','en_cours','terminee','facturee'][i])}
            style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', cursor:'pointer', display:'flex', alignItems:'center', gap:12, borderLeft:`4px solid ${k.color}`, border:`1px solid ${k.border}`, borderLeftWidth:4, transition:'transform .15s,box-shadow .15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 1px 6px rgba(0,0,0,0.07)';}}>
            <div style={{ width:38, height:38, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:k.color, lineHeight:1 }}>{loading?<span style={{display:'inline-block',width:28,height:20,background:k.bg,borderRadius:4}}/>:k.value}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>{k.label}</div>
              <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH + TABS ─────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 260px' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE', pointerEvents:'none' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={t('list.searchPlaceholder')}
              style={{ width:'100%', padding:'10px 10px 10px 36px', border:'1.5px solid #E0E8F0', borderRadius:10, fontSize:13, outline:'none', background:'#F8FAFC', boxSizing:'border-box', color:'#1A2332' }}
              onFocus={e=>(e.currentTarget.style.borderColor='#00838F')}
              onBlur={e=>(e.currentTarget.style.borderColor='#E0E8F0')}/>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)} className="tab-btn"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:20, border:`1.5px solid ${active?'#00838F':'#E0E8F0'}`, background:active?'#00838F':'#fff', color:active?'#fff':'#546E7A', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  <Icon size={13}/> {t(tab.labelKey)}
                  {tab.key && <span style={{ background:active?'rgba(255,255,255,0.25)':'#F0F4FA', color:active?'#fff':'#546E7A', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:10, minWidth:18, textAlign:'center' }}>
                    {counts[tab.key as keyof typeof counts] ?? 0}
                  </span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TABLE ─────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:720 }}>
            <thead>
              <tr style={{ background:'linear-gradient(90deg,#F8FAFC,#F0FBF9)' }}>
                {[t('list.colNumero'),t('list.colPatient'),t('list.colMedecin'),t('list.colDate'),t('list.colMotif'),t('list.colDiagnostic'),t('list.colStatut'),''].map((h,hi)=>(
                  <th key={hi} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.7px', whiteSpace:'nowrap', borderBottom:'2px solid #E0F7FA' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i)=>(
                <tr key={i} style={{ borderTop:'1px solid #F5F7FA' }}>
                  <td style={{ padding:'14px 16px' }}><div style={{ height:12, background:'#F0F4FA', borderRadius:4, width:80 }}/></td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:'#E0F7FA', flexShrink:0 }}/>
                      <div><div style={{ height:13, background:'#F0F4FA', borderRadius:4, width:120, marginBottom:5 }}/><div style={{ height:10, background:'#F5F7FA', borderRadius:4, width:70 }}/></div>
                    </div>
                  </td>
                  {[90,100,80,120,100,60,28].map((w,j)=>(
                    <td key={j} style={{ padding:'14px 16px' }}><div style={{ height:12, background:'#F0F4FA', borderRadius:4, width:w }}/></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'60px 20px', textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', background:'#E0F7FA', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Stethoscope size={30} color="#B2EBF2"/>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#37474F' }}>{t('list.emptyTitle')}</p>
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'#90A4AE' }}>
                        {search ? t('list.emptyTryOther') : t('list.emptyCreateFirst')}
                      </p>
                    </div>
                    {!search && (
                      <button onClick={()=>router.push('/consultations/nouvelle')}
                        style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:10, background:'#00838F', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                        <Plus size={14}/> {t('list.new')}
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : displayed.map(c => {
                const cfg = STATUT_CFG[c.statut] ?? STATUT_CFG.terminee;
                const pName = patName(c);
                const [avColor, avBg] = avatarColor(pName);
                const initials = c.patient ? `${c.patient.prenom?.charAt(0)??''}${c.patient.nom?.charAt(0)??''}` : '??';
                const { date, time } = fmtDate(c.dateHeure);
                return (
                  <tr key={c.id} className="cons-row" onClick={()=>router.push(`/consultations/${c.id}`)}
                    style={{ borderTop:'1px solid #F0F4FA', background:'transparent' }}>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#00838F', background:'#E0F7FA', padding:'2px 8px', borderRadius:6, border:'1px solid #B2EBF2', whiteSpace:'nowrap' }}>
                        {c.numero || `#${c.id.slice(0,7).toUpperCase()}`}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${avBg},${avColor}22)`, border:`1.5px solid ${avColor}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:avColor, flexShrink:0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{pName}</div>
                          {c.patient?.ipp && <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{c.patient.ipp}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:'#E0F7FA', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <User size={13} color="#00838F"/>
                        </div>
                        <span style={{ fontSize:12, color:'#37474F', fontWeight:500 }}>{drName(c)}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#1A2332' }}>{date}</div>
                      <div style={{ fontSize:11, color:'#90A4AE', marginTop:1, display:'flex', alignItems:'center', gap:3 }}>
                        <Clock size={10}/> {time}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', maxWidth:160 }}>
                      <div style={{ fontSize:12, color:'#37474F', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={c.motif||''}>
                        {c.motif || <span style={{color:'#B0BEC5'}}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', maxWidth:160 }}>
                      <div style={{ fontSize:12, color: c.diagnostic?'#1A2332':'#B0BEC5', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontStyle:c.diagnostic?'normal':'italic' }} title={c.diagnostic||''}>
                        {c.diagnostic || (c.statut==='en_cours' ? t('list.diagnosticInProgress') : '—')}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block', animation:c.statut==='en_cours'?'pulse 2s infinite':undefined }}/>
                        {statutLabel(c.statut)}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div className="cons-eye" style={{ width:30, height:30, borderRadius:8, background:'#E0F7FA', border:'1px solid #B2EBF2', display:'flex', alignItems:'center', justifyContent:'center', color:'#00838F' }}>
                        <ChevronRight size={14}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {displayed.length > 0 && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid #F0F4FA', background:'#FAFBFC', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'#546E7A' }}>
              <strong style={{ color:'#1A2332' }}>{displayed.length}</strong> {t('list.resultsShownSuffix')}
              {activeTab && <span style={{ marginLeft:6, color:'#90A4AE' }}>{t('list.filterLabel', { label: statutLabel(activeTab) })}</span>}
            </span>
            <span style={{ fontSize:11, color:'#90A4AE' }}>{t('list.clickRowHint')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
