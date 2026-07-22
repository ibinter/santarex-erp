'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw,
  Clock, User, CheckCircle, XCircle, AlertCircle, LayoutGrid, List,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

type StatutRdv = 'planifie' | 'confirme' | 'annule' | 'absent' | 'honore';

type Rdv = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?: { id: string; nom: string; prenom: string };
  dateHeure: string; duree?: number; motif?: string; statut: StatutRdv;
};

const STATUT_CFG: Record<StatutRdv, { label: string; bg: string; color: string; border: string; dot: string }> = {
  planifie: { label:'Planifié',  bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB', dot:'#3B82F6' },
  confirme: { label:'Confirmé',  bg:'#E8F5E9', color:'#2E7D32', border:'#C8E6C9', dot:'#4ADE80' },
  annule:   { label:'Annulé',    bg:'#F5F5F5', color:'#9E9E9E', border:'#E0E0E0', dot:'#BDBDBD' },
  absent:   { label:'Absent',    bg:'#FFEBEE', color:'#C62828', border:'#FFCDD2', dot:'#C62828' },
  honore:   { label:'Honoré',    bg:'#F3E5F5', color:'#6A1B9A', border:'#E1BEE7', dot:'#A855F7' },
};

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const JOURS_C = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

function getWeekStart(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0,0,0,0);
  return r;
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate()+n); return r; }
function fmtH(iso: string) {
  try { return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
  catch { return '—'; }
}

const AVATAR_COLORS = [
  ['#6A1B9A','#F3E5F5'],['#1565C0','#E3F2FD'],['#00838F','#E0F7FA'],
  ['#2E7D32','#E8F5E9'],['#E65100','#FFF3E0'],['#C62828','#FFEBEE'],
];
function avColor(n: string): [string,string] {
  return AVATAR_COLORS[(n.charCodeAt(0)+(n.charCodeAt(1)||0))%AVATAR_COLORS.length] as [string,string];
}

export default function RendezVousPage() {
  const t = useTranslations('rendezVous');
  const router = useRouter();
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [view, setView] = useState<'semaine'|'liste'>('semaine');
  const [statutFilter, setStatutFilter] = useState<'all'|'confirme'|'planifie'|'honore'|'annuleabs'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const deb = weekStart.toISOString().split('T')[0];
      const fin = addDays(weekStart,6).toISOString().split('T')[0];
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
      const [rdvRes, patRes, usrRes] = await Promise.all([
        apiClient<any>(`/rendez-vous?dateDebut=${deb}&dateFin=${fin}&limit=100`),
        apiClient<any>('/patients?limit=100'),
        apiClient<any>('/users'),
      ]);
      const pMap: Record<string, any> = Object.fromEntries(unwrap(patRes).map((p: any) => [p.id, p]));
      const uMap: Record<string, any> = Object.fromEntries(unwrap(usrRes).map((u: any) => [u.id, u]));
      const list = unwrap(rdvRes).map((r: any) => {
        const p = pMap[r.patientId];
        const u = uMap[r.medecinId];
        return {
          ...r,
          patient: r.patient ?? (p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : undefined),
          medecin: r.medecin ?? (u ? { id: u.id, nom: u.lastName, prenom: u.firstName } : undefined),
        };
      });
      setRdvs(list);
      setLastRefresh(new Date());
    } catch { setRdvs([]); }
    finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const days = Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const todayStr = new Date().toDateString();
  const getRdvsDay = (d: Date) => rdvs.filter(r=>r.dateHeure.startsWith(d.toISOString().split('T')[0])).sort((a,b)=>a.dateHeure.localeCompare(b.dateHeure));
  const counts = {
    total:    rdvs.length,
    confirme: rdvs.filter(r=>r.statut==='confirme').length,
    planifie: rdvs.filter(r=>r.statut==='planifie').length,
    honore:   rdvs.filter(r=>r.statut==='honore').length,
    annule:   rdvs.filter(r=>r.statut==='annule'||r.statut==='absent').length,
  };
  const pName = (r: Rdv) => r.patient?`${r.patient.prenom} ${r.patient.nom}`:'—';
  const rdvsListe = rdvs.filter(r => {
    if (statutFilter==='all') return true;
    if (statutFilter==='annuleabs') return r.statut==='annule'||r.statut==='absent';
    return r.statut===statutFilter;
  });

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
        .rdv-card{transition:all .15s;cursor:pointer;}
        .rdv-card:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.15)!important;opacity:.9;}
        .rdv-row:hover{background:#F5F0FF!important;}
        .view-btn{transition:all .15s;}
        .rdv-kpi{cursor:pointer;transition:all .15s;}
        .rdv-kpi:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,0.12)!important;}
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#4A148C 0%,#6A1B9A 55%,#8E24AA 100%)', borderRadius:18, padding:'22px 28px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, boxShadow:'0 8px 28px rgba(106,27,154,0.35)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, right:260, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:16, zIndex:1 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Calendar size={26} color="#fff"/>
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('title')}</h1>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.75)' }}>
              {loading?'…':t('rdvSemaine',{count:counts.total})}
              {lastRefresh&&<span style={{ marginLeft:10, opacity:.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, zIndex:1 }}>
          {/* Vue toggle */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.15)', borderRadius:10, padding:3, border:'1px solid rgba(255,255,255,0.25)' }}>
            {(['semaine','liste'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className="view-btn"
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:8, border:'none', background:view===v?'#fff':'transparent', color:view===v?'#6A1B9A':'rgba(255,255,255,0.8)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {v==='semaine'?<LayoutGrid size={13}/>:<List size={13}/>}
                {v==='semaine'?t('vueSemaine'):t('vueListe')}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading}
            style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={16} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
          </button>
          <button onClick={()=>router.push('/rendez-vous/nouveau')}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:10, background:'#fff', border:'none', color:'#6A1B9A', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 2px 10px rgba(0,0,0,0.15)' }}>
            <Plus size={15}/> {t('nouveauRdv')}
          </button>
        </div>
      </div>

      {/* ── KPI ──────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:t('kpiTotalSemaine'), value:counts.total,    icon:<Calendar size={18} color="#6A1B9A"/>,  bg:'#F3E5F5', color:'#6A1B9A', border:'#E1BEE7', filtre:'all' as const },
          { label:t('kpiConfirmes'),     value:counts.confirme, icon:<CheckCircle size={18} color="#2E7D32"/>,bg:'#E8F5E9', color:'#2E7D32', border:'#C8E6C9', filtre:'confirme' as const },
          { label:t('kpiPlanifies'),     value:counts.planifie, icon:<Clock size={18} color="#1565C0"/>,     bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB', filtre:'planifie' as const },
          { label:t('kpiHonores'),       value:counts.honore,   icon:<User size={18} color="#8E24AA"/>,      bg:'#F3E5F5', color:'#8E24AA', border:'#CE93D8', filtre:'honore' as const },
          { label:t('kpiAnnulesAbs'),  value:counts.annule,   icon:<XCircle size={18} color="#C62828"/>,   bg:'#FFEBEE', color:'#C62828', border:'#FFCDD2', filtre:'annuleabs' as const },
        ].map((k,i)=>{
          const active = statutFilter===k.filtre && view==='liste';
          return (
          <div key={i} className="rdv-kpi" title={t('voirListe',{label:k.label})}
            onClick={()=>{ setView('liste'); setStatutFilter(k.filtre); }}
            style={{ background:'#fff', borderRadius:12, padding:'13px 15px', boxShadow:active?`0 4px 14px ${k.color}44`:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:10, border:`1px solid ${active?k.color:k.border}`, borderLeft:`4px solid ${k.color}` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:k.color, lineHeight:1 }}>{loading?<span style={{display:'inline-block',width:24,height:18,background:k.bg,borderRadius:4}}/>:k.value}</div>
              <div style={{ fontSize:10, color:'#546E7A', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginTop:2 }}>{k.label}</div>
            </div>
          </div>
          );
        })}
      </div>

      {/* ── NAV SEMAINE ──────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', flexWrap:'wrap' }}>
        <button onClick={()=>setWeekStart(d=>addDays(d,-7))}
          style={{ width:34, height:34, borderRadius:9, border:'1.5px solid #E0E0E0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6A1B9A' }}>
          <ChevronLeft size={17}/>
        </button>
        <div style={{ flex:1, textAlign:'center' }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#1A2332' }}>
            {weekStart.toLocaleDateString('fr-FR',{day:'2-digit',month:'long'})} — {addDays(weekStart,6).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}
          </span>
        </div>
        <button onClick={()=>setWeekStart(d=>addDays(d,7))}
          style={{ width:34, height:34, borderRadius:9, border:'1.5px solid #E0E0E0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6A1B9A' }}>
          <ChevronRight size={17}/>
        </button>
        <button onClick={()=>setWeekStart(getWeekStart(new Date()))}
          style={{ padding:'6px 14px', borderRadius:9, border:'1.5px solid #6A1B9A', background:'#F3E5F5', color:'#6A1B9A', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          {t('aujourdhui')}
        </button>
      </div>

      {/* ── VUE SEMAINE ──────────────────────────────────────────── */}
      {view==='semaine' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10 }}>
          {days.map((day,i)=>{
            const dayRdvs = getRdvsDay(day);
            const isToday = day.toDateString()===todayStr;
            return (
              <div key={i} style={{ background:'#fff', borderRadius:14, overflow:'hidden', border:`2px solid ${isToday?'#6A1B9A':'#EEF0F5'}`, boxShadow:isToday?'0 4px 16px rgba(106,27,154,0.2)':'0 1px 6px rgba(0,0,0,0.06)' }}>
                {/* Entête jour */}
                <div style={{ padding:'10px 12px', background:isToday?'linear-gradient(135deg,#6A1B9A,#8E24AA)':'#F8FAFC', borderBottom:`1px solid ${isToday?'transparent':'#EEF0F5'}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:isToday?'rgba(255,255,255,0.8)':'#90A4AE', textTransform:'uppercase', letterSpacing:'.6px' }}>{t(`joursCourts.${i}`)}</div>
                  <div style={{ fontSize:20, fontWeight:900, color:isToday?'#fff':'#1A2332', lineHeight:1.1 }}>{day.getDate()}</div>
                  {dayRdvs.length>0&&<div style={{ fontSize:9, fontWeight:700, color:isToday?'rgba(255,255,255,0.7)':'#90A4AE', marginTop:2 }}>{t('nbRdv',{count:dayRdvs.length})}</div>}
                </div>
                {/* RDVs du jour */}
                <div style={{ padding:'6px', minHeight:100 }}>
                  {loading?(
                    <div style={{ height:44, background:'#F3E5F5', borderRadius:8, margin:'4px 2px', opacity:.5 }}/>
                  ):dayRdvs.length===0?(
                    <p style={{ fontSize:10, color:'#CFD8DC', textAlign:'center', marginTop:20, fontStyle:'italic' }}>{t('libre')}</p>
                  ):dayRdvs.map(r=>{
                    const cfg=STATUT_CFG[r.statut]??STATUT_CFG.planifie;
                    const [ac,ab]=avColor(pName(r));
                    return (
                      <div key={r.id} className="rdv-card" onClick={()=>router.push(`/rendez-vous/${r.id}`)}
                        style={{ padding:'6px 8px', borderRadius:8, background:cfg.bg, borderLeft:`3px solid ${cfg.color}`, marginBottom:5, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ fontSize:10, fontWeight:800, color:cfg.color, marginBottom:2 }}>{fmtH(r.dateHeure)}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#1A2332', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pName(r)}</div>
                        {r.motif&&<div style={{ fontSize:9, color:'#90A4AE', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>{r.motif}</div>}
                        {r.duree&&<div style={{ fontSize:9, color:cfg.color, marginTop:2, fontWeight:600 }}>⏱ {r.duree} min</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VUE LISTE ────────────────────────────────────────────── */}
      {view==='liste'&&statutFilter!=='all'&&(
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:12, color:'#546E7A', fontWeight:600 }}>{t('filtreActif')}</span>
          <span style={{ fontSize:11, fontWeight:800, padding:'3px 12px', borderRadius:20, background:'#F3E5F5', color:'#6A1B9A' }}>
            {statutFilter==='annuleabs'?t('annulesAbsents'):(STATUT_CFG[statutFilter as StatutRdv]?t(`statut.${statutFilter}`):statutFilter)}
          </span>
          <button onClick={()=>setStatutFilter('all')} style={{ fontSize:11, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>{t('toutVoir')}</button>
        </div>
      )}
      {view==='liste'&&(
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:640 }}>
              <thead>
                <tr style={{ background:'linear-gradient(90deg,#F8FAFC,#F5F0FF)' }}>
                  {[t('thDateHeure'),t('thPatient'),t('thMedecin'),t('thMotif'),t('thDuree'),t('thStatut')].map(h=>(
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.7px', whiteSpace:'nowrap', borderBottom:'2px solid #E1BEE7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading?Array.from({length:5}).map((_,i)=>(
                  <tr key={i} style={{ borderTop:'1px solid #F5F7FA' }}>
                    {[100,130,100,140,60,80].map((w,j)=>(
                      <td key={j} style={{ padding:'14px 16px' }}><div style={{ height:12, background:'#F0F4FA', borderRadius:4, width:w }}/></td>
                    ))}
                  </tr>
                )):rdvsListe.length===0?(
                  <tr><td colSpan={6} style={{ padding:'50px 20px', textAlign:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <div style={{ width:56, height:56, borderRadius:'50%', background:'#F3E5F5', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Calendar size={28} color="#E1BEE7"/>
                      </div>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#546E7A' }}>{t('aucunRdv')}</p>
                    </div>
                  </td></tr>
                ):rdvsListe.map(r=>{
                  const cfg=STATUT_CFG[r.statut]??STATUT_CFG.planifie;
                  const [ac,ab]=avColor(pName(r));
                  const initials=r.patient?`${r.patient.prenom?.charAt(0)??''}${r.patient.nom?.charAt(0)??''}`:' ';
                  const d=new Date(r.dateHeure);
                  return (
                    <tr key={r.id} className="rdv-row" onClick={()=>router.push(`/rendez-vous/${r.id}`)}
                      style={{ borderTop:'1px solid #F0F4FA', cursor:'pointer', transition:'background .1s', background:'transparent' }}>
                      <td style={{ padding:'13px 16px', whiteSpace:'nowrap' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>{d.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'})}</div>
                        <div style={{ fontSize:11, color:'#6A1B9A', fontWeight:600, marginTop:1, display:'flex', alignItems:'center', gap:3 }}>
                          <Clock size={10}/> {fmtH(r.dateHeure)}
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${ab},${ac}22)`, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ac, flexShrink:0 }}>{initials}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{pName(r)}</div>
                            {r.patient?.ipp&&<div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{r.patient.ipp}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px', fontSize:12, color:'#546E7A' }}>{r.medecin?`Dr. ${r.medecin.prenom} ${r.medecin.nom}`:'—'}</td>
                      <td style={{ padding:'13px 16px', fontSize:12, color:'#37474F', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.motif||'—'}</td>
                      <td style={{ padding:'13px 16px', fontSize:12, color:'#546E7A', whiteSpace:'nowrap' }}>{r.duree?`${r.duree} min`:'—'}</td>
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                          {t(`statut.${r.statut}`)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
