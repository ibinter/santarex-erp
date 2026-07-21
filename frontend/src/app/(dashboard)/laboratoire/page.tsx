'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical, Plus, Search, RefreshCw, ChevronRight,
  Clock, CheckCircle, AlertTriangle, Zap, Calendar, Stethoscope,
  Download, FileSpreadsheet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

type StatutDemande = 'attente_prelevement'|'preleve'|'en_analyse'|'termine'|'valide';
type DemandeAnalyse = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?:  { id: string; nom: string; prenom: string };
  urgence: boolean; statut: StatutDemande;
  typesAnalyse?: { id: string; code: string; nom: string; prix?: number }[];
  createdAt: string; datePrelevement?: string;
};

const STATUT_CFG: Record<StatutDemande,{ bg:string; color:string; border:string; dot:string; icon:React.ReactNode }> = {
  attente_prelevement: { bg:'#FFF7ED', color:'#C2410C', border:'#FED7AA', dot:'#F97316', icon:<Clock size={11}/> },
  preleve:             { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE', dot:'#3B82F6', icon:<FlaskConical size={11}/> },
  en_analyse:          { bg:'#EDE9FE', color:'#6D28D9', border:'#DDD6FE', dot:'#8B5CF6', icon:<FlaskConical size={11}/> },
  termine:             { bg:'#CCFBF1', color:'#0F766E', border:'#99F6E4', dot:'#14B8A6', icon:<CheckCircle size={11}/> },
  valide:              { bg:'#DCFCE7', color:'#15803D', border:'#86EFAC', dot:'#22C55E', icon:<CheckCircle size={11}/> },
};

const ANALYSE_COLORS = ['#EDE9FE','#DBEAFE','#CCFBF1','#FEF3C7','#FCE7F3','#E0E7FF'];
const ANALYSE_TEXT   = ['#6D28D9','#1D4ED8','#0F766E','#B45309','#9D174D','#3730A3'];

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#1E40AF','#DBEAFE'],
];
function aColor(name: string): [string,string] {
  let h=0; for(let i=0;i<name.length;i++) h=((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function inits(p?: {nom:string;prenom:string}) {
  if (!p) return '?'; return `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }
  catch { return '—'; }
}

export default function LaboratoirePage() {
  const router = useRouter();
  const t = useTranslations('laboratoire');
  const [demandes, setDemandes]   = useState<DemandeAnalyse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filtre, setFiltre]       = useState<StatutDemande|''>('');
  const [urgOnly, setUrgOnly]     = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);

  const statutLabel = (s: string) => t(`statut.${s}` as any);
  const handleExportXLSX = () => exportXLSX(
    demandes.map(d => ({
      [t('export.colNumero')]: d.numero ?? d.id.slice(0,8),
      [t('export.colPatient')]: d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—',
      [t('export.colIpp')]: d.patient?.ipp ?? '—',
      [t('export.colMedecin')]: d.medecin ? `Dr ${d.medecin.prenom} ${d.medecin.nom}` : '—',
      [t('export.colAnalyses')]: d.typesAnalyse?.map((a: any) => a.code).join(', ') ?? '—',
      [t('export.colUrgence')]: d.urgence ? t('export.yes') : t('export.no'),
      [t('export.colStatut')]: d.statut ? statutLabel(d.statut) : '—',
      [t('export.colDateDemande')]: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '—',
      [t('export.colDatePrelevement')]: d.datePrelevement ? new Date(d.datePrelevement).toLocaleDateString('fr-FR') : '—',
    })),
    `laboratoire_${new Date().toISOString().slice(0,10)}`,
    t('export.sheetName'),
  );
  const handleExportPDF = () => exportPDF(
    [
      { header: t('export.colNumero'), dataKey: 'numero', width: 28 },
      { header: t('export.colPatient'), dataKey: 'patient', width: 38 },
      { header: t('export.colMedecin'), dataKey: 'medecin', width: 34 },
      { header: t('export.colAnalyses'), dataKey: 'analyses', width: 48 },
      { header: t('export.colUrgence'), dataKey: 'urgence', width: 18 },
      { header: t('export.colStatut'), dataKey: 'statut', width: 24 },
      { header: t('export.colDate'), dataKey: 'date', width: 22 },
    ],
    demandes.map(d => ({
      numero: d.numero ?? d.id.slice(0,8),
      patient: d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—',
      medecin: d.medecin ? `Dr ${d.medecin.prenom} ${d.medecin.nom}` : '—',
      analyses: d.typesAnalyse?.map((a: any) => a.code).join(', ') ?? '—',
      urgence: d.urgence ? t('export.yes') : t('export.no'),
      statut: d.statut ? statutLabel(d.statut) : '—',
      date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '—',
    })),
    t('export.pdfTitle'),
    `laboratoire_${new Date().toISOString().slice(0,10)}`,
    t('export.pdfSubtitle', { count: demandes.length, date: new Date().toLocaleDateString('fr-FR') }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
      const [demRes, patRes, usrRes, typRes] = await Promise.all([
        apiClient<any>('/laboratoire/demandes?limit=100'),
        apiClient<any>('/patients?limit=100'),
        apiClient<any>('/users'),
        apiClient<any>('/laboratoire/types-analyse'),
      ]);
      const rawDem = unwrap(demRes);
      const pMap: Record<string, any> = Object.fromEntries(unwrap(patRes).map((p: any) => [p.id, p]));
      const uMap: Record<string, any> = Object.fromEntries(unwrap(usrRes).map((u: any) => [u.id, u]));
      const tMap: Record<string, any> = Object.fromEntries(unwrap(typRes).map((t: any) => [t.id, t]));
      // L'API liste ne renvoie que les IDs : on résout patient / médecin / analyses.
      const enriched = rawDem.map((d: any) => {
        const p = pMap[d.patientId];
        const u = uMap[d.medecinId];
        return {
          ...d,
          patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : undefined,
          medecin: u ? { id: u.id, nom: u.lastName, prenom: u.firstName } : undefined,
          typesAnalyse: (d.analyses || [])
            .map((id: string) => tMap[id])
            .filter(Boolean)
            .map((t: any) => ({ id: t.id, code: t.code, nom: t.nom, prix: t.prixUnitaire })),
          statut: d.statutPrelevement ?? d.statut,
          createdAt: d.dateHeureDemande ?? d.createdAt,
          datePrelevement: d.dateHeurePrelevement ?? d.datePrelevement,
        };
      });
      setDemandes(enriched);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const displayed = demandes.filter(d => {
    const q = search.toLowerCase();
    const nom = d.patient?`${d.patient.prenom} ${d.patient.nom}`.toLowerCase():'';
    const matchQ = !search || nom.includes(q)||(d.numero??'').toLowerCase().includes(q)||(d.patient?.ipp??'').toLowerCase().includes(q);
    const matchS = !filtre || d.statut===filtre;
    const matchU = !urgOnly || d.urgence;
    return matchQ&&matchS&&matchU;
  });

  const total    = demandes.length;
  const enCours  = demandes.filter(d=>!['termine','valide'].includes(d.statut)).length;
  const urgentes = demandes.filter(d=>d.urgence&&!['termine','valide'].includes(d.statut)).length;
  const termines = demandes.filter(d=>['termine','valide'].includes(d.statut)).length;

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .dem-row:hover{background:#F5F0FF!important;}
        .kpi-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)!important;}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1E1B4B 0%,#3730A3 50%,#4F46E5 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(55,48,163,0.4)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-70, right:200, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        <div style={{ position:'absolute', top:20, right:320, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FlaskConical size={24} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('list.heroTitle')}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>
                    {loading?t('list.loading'):t('list.summary', { total, enCours })}
                  </span>
                  {lastRefresh&&<span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginLeft:4 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
              <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={handleExportPDF} disabled={loading}
              style={{ padding:'10px 13px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(239,68,68,0.25)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
              <Download size={13}/> PDF
            </button>
            <button onClick={handleExportXLSX} disabled={loading}
              style={{ padding:'10px 13px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(34,197,94,0.25)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
              <FileSpreadsheet size={13}/> XLSX
            </button>
            <button onClick={()=>router.push('/laboratoire/demandes/nouvelle')}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', color:'#3730A3', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> {t('list.newRequest')}
            </button>
          </div>
        </div>

        {/* KPI inline */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16, position:'relative', zIndex:1 }}>
          {[
            { label:t('list.kpiTotal'),     val:total,    dot:'rgba(255,255,255,0.7)', valColor:'#fff' },
            { label:t('list.kpiEnCours'),   val:enCours,  dot:'#FCD34D',              valColor:'#FCD34D' },
            { label:t('list.kpiUrgentes'),  val:urgentes, dot:'#FCA5A5',              valColor:'#FCA5A5' },
            { label:t('list.kpiTerminees'), val:termines, dot:'#BBF7D0',              valColor:'#BBF7D0' },
          ].map((k,i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:k.dot, display:'inline-block' }}/>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize:26, fontWeight:900, color:k.valColor, lineHeight:1 }}>{loading?'…':k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH + FILTRES ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button onClick={()=>setUrgOnly(!urgOnly)}
            style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${urgOnly?'#DC2626':'#E0E8F0'}`, background:urgOnly?'#FEE2E2':'#fff', color:urgOnly?'#DC2626':'#546E7A', fontSize:11, fontWeight:urgOnly?800:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Zap size={11} style={{ fill:urgOnly?'#DC2626':'none' }}/> {t('list.filterUrgentes')}
          </button>
          <button onClick={()=>setFiltre('')}
            style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${filtre===''?'#3730A3':'#E0E8F0'}`, background:filtre===''?'#3730A3':'#fff', color:filtre===''?'#fff':'#546E7A', fontSize:11, fontWeight:filtre===''?800:500, cursor:'pointer' }}>
            {t('list.filterAll')}
          </button>
          {(Object.keys(STATUT_CFG) as StatutDemande[]).map(s=>{
            const cfg=STATUT_CFG[s];
            return (
              <button key={s} onClick={()=>setFiltre(filtre===s?'':s)}
                style={{ padding:'7px 12px', borderRadius:20, border:`1.5px solid ${filtre===s?cfg.border:'#E0E8F0'}`, background:filtre===s?cfg.bg:'#fff', color:filtre===s?cfg.color:'#546E7A', fontSize:11, fontWeight:filtre===s?800:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                {statutLabel(s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Résumé filtres */}
      {!loading&&<div style={{ fontSize:11, color:'#90A4AE', fontWeight:600, marginBottom:10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* ── TABLE ────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'linear-gradient(135deg,#F0EEFF,#EDE9FE)' }}>
                {[t('list.colDemande'),t('list.colPatient'),t('list.colMedecin'),t('list.colDate'),t('list.colAnalyses'),t('list.colUrgence'),t('list.colStatut'),''].map((h,hi)=>(
                  <th key={hi} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#4C1D95', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:6}).map((_,i)=>(
                <tr key={i} style={{ borderTop:'1px solid #F5F0FF' }}>
                  {Array.from({length:8}).map((_,j)=>(
                    <td key={j} style={{ padding:'13px 14px' }}><div style={{ height:13, background:'#EDE9FE', borderRadius:4, width:j===1?130:70, animation:'pulse 1.5s ease infinite' }}/></td>
                  ))}
                </tr>
              )) : displayed.length===0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'60px 20px', color:'#90A4AE' }}>
                  <FlaskConical size={38} style={{ display:'block', margin:'0 auto 12px', color:'#DDD6FE' }}/>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{t('list.emptyTitle')}</p>
                </td></tr>
              ) : displayed.map(d=>{
                const cfg=STATUT_CFG[d.statut]??STATUT_CFG.attente_prelevement;
                const nom=d.patient?`${d.patient.prenom} ${d.patient.nom}`:'—';
                const [ac,ab]=aColor(nom);
                const ii=inits(d.patient);
                return (
                  <tr key={d.id} className="dem-row" onClick={()=>router.push(`/laboratoire/demandes/${d.id}`)}
                    style={{ borderTop:'1px solid #F5F0FF', cursor:'pointer', transition:'background .1s' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:800, color:'#4F46E5', background:'#EDE9FE', padding:'2px 8px', borderRadius:6 }}>
                        {d.numero||d.id.slice(0,8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:ab, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ac, flexShrink:0 }}>{ii}</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{nom}</div>
                          {d.patient?.ipp&&<div style={{ fontSize:10, color:'#90A4AE', fontFamily:'monospace' }}>{t('list.ippLabel')} {d.patient.ipp}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:'#546E7A', whiteSpace:'nowrap' }}>
                      {d.medecin?<><span style={{ fontWeight:700 }}>{t('list.doctorPrefix')}</span> {d.medecin.prenom} {d.medecin.nom}</>:'—'}
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:11, color:'#546E7A', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={10} color="#B0BEC5"/> {fmtDate(d.createdAt)}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {(d.typesAnalyse||[]).slice(0,3).map((t,idx)=>(
                          <span key={t.id} style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:8, background:ANALYSE_COLORS[idx%ANALYSE_COLORS.length], color:ANALYSE_TEXT[idx%ANALYSE_TEXT.length] }}>{t.code}</span>
                        ))}
                        {(d.typesAnalyse||[]).length>3&&<span style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', padding:'2px 6px', background:'#F1F5F9', borderRadius:8 }}>+{(d.typesAnalyse||[]).length-3}</span>}
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      {d.urgence?(
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:'#FEE2E2', color:'#DC2626' }}>
                          <Zap size={10} style={{ fill:'#DC2626' }}/> {t('list.urgentBadge')}
                        </span>
                      ):(<span style={{ fontSize:12, color:'#D1D5DB' }}>—</span>)}
                    </td>
                    <td style={{ padding:'12px 14px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                        {statutLabel(d.statut)}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px' }}><ChevronRight size={14} color="#B0BEC5"/></td>
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
