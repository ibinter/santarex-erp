'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BedDouble, RefreshCw, Plus, Users, AlertTriangle, Activity,
  ChevronRight, Calendar, Stethoscope, Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutLit = 'libre' | 'occupe' | 'nettoyage' | 'reserve';
type Lit = {
  id: string; numero: string; service?: string; salle?: string; statut: StatutLit;
  patient?: { id: string; nom: string; prenom: string };
  patientNom?: string; joursHospitalisation?: number;
};
type Sejour = {
  id: string; numero?: string; service?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  lit?: { id: string; numero: string; service?: string };
  medecin?: { id: string; nom: string; prenom: string };
  diagnosticEntree?: string; dateAdmission: string; statut: string;
};

const LIT_CFG: Record<StatutLit, { bg: string; border: string; text: string; label: string; dot: string; headerBg: string }> = {
  libre:     { bg:'#F0FDF4', border:'#86EFAC', text:'#166534', label:'Libre',     dot:'#4ADE80', headerBg:'#22C55E' },
  occupe:    { bg:'#EFF6FF', border:'#93C5FD', text:'#1E40AF', label:'Occupé',    dot:'#3B82F6', headerBg:'#1D4ED8' },
  nettoyage: { bg:'#F8FAFC', border:'#CBD5E1', text:'#475569', label:'Nettoyage', dot:'#94A3B8', headerBg:'#64748B' },
  reserve:   { bg:'#FFFBEB', border:'#FCD34D', text:'#92400E', label:'Réservé',   dot:'#F59E0B', headerBg:'#D97706' },
};
const SERVICES_ORDER = ['Médecine Générale','Chirurgie','Maternité','Pédiatrie','Réanimation','Orthopédie','Ophtalmologie'];

function joursDepuis(d: string) { return Math.max(0, Math.floor((Date.now()-new Date(d).getTime())/86400000)); }
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return '—'; }
}
function initiales(nom?: string, prenom?: string) {
  return `${prenom?.charAt(0)??''}${nom?.charAt(0)??''}`.toUpperCase();
}

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#1E40AF','#DBEAFE'],
];
function avatarColor(name: string): [string,string] {
  let h = 0; for (let i=0; i<name.length; i++) h = ((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}

export default function HospitalisationPage() {
  const router = useRouter();
  const [lits, setLits] = useState<Lit[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutLit|''>('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'lits'|'sejours'>('lits');
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lR, sR] = await Promise.allSettled([
        apiClient<any>('/hospitalisation/lits'),
        apiClient<any>('/hospitalisation/sejours/actifs'),
      ]);
      if (lR.status==='fulfilled') { const d=lR.value; setLits(Array.isArray(d)?d:d?.items??d?.data??[]); }
      if (sR.status==='fulfilled') { const d=sR.value; setSejours(Array.isArray(d)?d:d?.items??d?.data??[]); }
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const services = Array.from(new Set(lits.map(l=>l.service).filter(Boolean) as string[])).sort((a,b) => {
    const ia=SERVICES_ORDER.indexOf(a); const ib=SERVICES_ORDER.indexOf(b);
    return (ia===-1?99:ia)-(ib===-1?99:ib);
  });

  const libres  = lits.filter(l=>l.statut==='libre').length;
  const occupes = lits.filter(l=>l.statut==='occupe').length;
  const reserve = lits.filter(l=>l.statut==='reserve').length;
  const taux    = lits.length>0 ? Math.round((occupes/lits.length)*100) : 0;

  const litsAffiches = lits.filter(l =>
    (!serviceFilter || l.service===serviceFilter) &&
    (!statutFilter || l.statut===statutFilter) &&
    (!search || l.numero.toLowerCase().includes(search.toLowerCase()) ||
      (l.patientNom??'').toLowerCase().includes(search.toLowerCase()) ||
      (l.patient ? `${l.patient.prenom} ${l.patient.nom}`.toLowerCase().includes(search.toLowerCase()) : false))
  );

  const sejoursFiltered = sejours.filter(s => !search ||
    (s.patient ? `${s.patient.prenom} ${s.patient.nom}`.toLowerCase().includes(search.toLowerCase()) : false) ||
    (s.numero??'').toLowerCase().includes(search.toLowerCase())
  );

  const tauxColor = taux>90?'#C62828':taux>75?'#E65100':'#2E7D32';

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .lit-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.14)!important;transform:translateY(-2px);}
        .sej-row:hover{background:#EFF6FF!important;}
        .hero-stat{cursor:pointer;transition:all .15s;}
        .hero-stat:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2)!important;}
      `}</style>

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0A2E6E 0%,#1565C0 50%,#01579B 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(13,71,161,0.3)' }}>
        <div style={{ position:'absolute', top:-60, right:60,  width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-80, right:240, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        <div style={{ position:'absolute', top:20, right:120, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <BedDouble size={24} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Hospitalisation</h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>
                    {loading ? 'Chargement…' : `${lits.length} lits — ${occupes} occupés — Taux ${taux}%`}
                  </span>
                  {lastRefresh&&<span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:6 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
                </div>
              </div>
            </div>

            {/* Mini stats inline */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:'Libres', val:libres,  dot:'#4ADE80', statut:'libre' as StatutLit },
                { label:'Occupés', val:occupes, dot:'#3B82F6', statut:'occupe' as StatutLit },
                { label:'Réservés', val:reserve, dot:'#F59E0B', statut:'reserve' as StatutLit },
              ].map(s=>{
                const active = statutFilter===s.statut;
                return (
                <div key={s.label} className="hero-stat" title={`Filtrer : ${s.label}`}
                  onClick={()=>{ setTab('lits'); setStatutFilter(active?'':s.statut); }}
                  style={{ display:'flex', alignItems:'center', gap:5, background:active?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.1)', borderRadius:8, padding:'5px 12px', border:`1px solid ${active?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.15)'}` }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:700 }}>{loading?'…':s.val}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>{s.label}</span>
                </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <button onClick={load} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, backdropFilter:'blur(8px)' }}>
              <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={()=>router.push('/hospitalisation/admettre')}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', color:'#1565C0', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={15}/> Admettre un patient
            </button>
          </div>
        </div>

        {/* Taux occupation bar */}
        <div style={{ marginTop:16, position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Taux d'occupation</span>
            <span style={{ fontSize:13, fontWeight:900, color:taux>90?'#FCA5A5':taux>75?'#FCD34D':'#86EFAC' }}>{taux}%</span>
          </div>
          <div style={{ height:6, borderRadius:4, background:'rgba(255,255,255,0.15)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${taux}%`, background:taux>90?'#EF4444':taux>75?'#F59E0B':'#4ADE80', borderRadius:4, transition:'width .6s ease' }}/>
          </div>
        </div>
      </div>

      {/* ── SEARCH + TABS ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher lit, patient…"
            style={{ width:'100%', padding:'9px 12px 9px 32px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
        </div>
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:10, padding:4, boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
          {[{id:'lits' as const, label:'Plan des lits', icon:<BedDouble size={13}/>},{id:'sejours' as const, label:`Séjours actifs${sejours.length?` (${sejours.length})`:''}`, icon:<Users size={13}/>}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:tab===t.id?'linear-gradient(135deg,#0D47A1,#1565C0)':'transparent', color:tab===t.id?'#fff':'#546E7A', fontSize:12, fontWeight:tab===t.id?700:500, cursor:'pointer', whiteSpace:'nowrap' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── VUE LITS ─────────────────────────────────────────────── */}
      {tab==='lits'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          {/* Filtres service */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'#90A4AE', fontWeight:700, alignSelf:'center', marginRight:4 }}>SERVICE</span>
            {['', ...services].map(s=>(
              <button key={s||'tous'} onClick={()=>setServiceFilter(s)}
                style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${serviceFilter===s?'#1565C0':'#E0E8F0'}`, background:serviceFilter===s?'#1565C0':'#fff', color:serviceFilter===s?'#fff':'#546E7A', fontSize:11, fontWeight:serviceFilter===s?700:500, cursor:'pointer' }}>
                {s||'Tous'}
              </button>
            ))}
          </div>

          {/* Légende */}
          <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
            {Object.entries(LIT_CFG).map(([k,v])=>(
              <div key={k} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#546E7A', fontWeight:600 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:v.dot, display:'inline-block' }}/>
                {v.label}
              </div>
            ))}
          </div>

          {/* Grille lits */}
          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
              {Array.from({length:16}).map((_,i)=>(
                <div key={i} style={{ height:110, background:'linear-gradient(135deg,#F0F4FA,#E8EEF6)', borderRadius:12, animation:'pulse 1.5s ease infinite' }}/>
              ))}
            </div>
          ) : litsAffiches.length===0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
              <BedDouble size={40} style={{ color:'#BBDEFB', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, color:'#90A4AE', fontSize:13, fontWeight:600 }}>Aucun lit trouvé</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
              {litsAffiches.map(l=>{
                const cfg=LIT_CFG[l.statut]??LIT_CFG.libre;
                const nomP=l.patientNom||(l.patient?`${l.patient.prenom} ${l.patient.nom}`:null);
                const inits=l.patient?initiales(l.patient.nom,l.patient.prenom):'';
                const [ac,ab]= nomP ? avatarColor(nomP) : ['#90A4AE','#ECEFF1'];
                return (
                  <div key={l.id} className="lit-card"
                    style={{ borderRadius:12, border:`1.5px solid ${cfg.border}`, background:cfg.bg, overflow:'hidden', cursor:'pointer', transition:'all .2s', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
                    {/* Bande couleur */}
                    <div style={{ height:4, background:cfg.headerBg }}/>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:800, color:cfg.text, letterSpacing:'.3px' }}>Lit {l.numero}</span>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block', flexShrink:0 }}/>
                      </div>
                      {l.service&&<div style={{ fontSize:9, color:'#90A4AE', fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:8 }}>{l.service}</div>}
                      {nomP ? (
                        <div>
                          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${ab},${ac}22)`, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ac, marginBottom:5 }}>{inits}</div>
                          <div style={{ fontSize:11, fontWeight:700, color:cfg.text, lineHeight:1.2 }}>{nomP}</div>
                          {l.joursHospitalisation!==undefined&&<div style={{ fontSize:10, color:'#90A4AE', marginTop:2 }}>{l.joursHospitalisation}j</div>}
                        </div>
                      ) : (
                        <div style={{ fontSize:11, color:cfg.text, fontWeight:600, opacity:.7 }}>{cfg.label}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VUE SÉJOURS ──────────────────────────────────────────── */}
      {tab==='sejours'&&(
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'linear-gradient(135deg,#F0F6FF,#E8EEFA)' }}>
                  {['N° Séjour','Patient','Lit / Service','Médecin','Admission','Durée','Statut',''].map(h=>(
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i)=>(
                  <tr key={i} style={{ borderTop:'1px solid #F5F7FA' }}>
                    {Array.from({length:8}).map((_,j)=>(
                      <td key={j} style={{ padding:'13px 14px' }}><div style={{ height:13, background:'#F0F4FA', borderRadius:4, width:j===1?120:70, animation:'pulse 1.5s ease infinite' }}/></td>
                    ))}
                  </tr>
                )) : sejoursFiltered.length===0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'50px 20px', color:'#90A4AE' }}>
                    <BedDouble size={36} style={{ display:'block', margin:'0 auto 12px', color:'#BBDEFB' }}/>
                    <span style={{ fontSize:13, fontWeight:600 }}>Aucun séjour actif</span>
                  </td></tr>
                ) : sejoursFiltered.map(s=>{
                  const nomPat=s.patient?`${s.patient.prenom} ${s.patient.nom}`:'—';
                  const [ac,ab]=avatarColor(nomPat);
                  const inits=s.patient?initiales(s.patient.nom,s.patient.prenom):'?';
                  const jours=joursDepuis(s.dateAdmission);
                  return (
                    <tr key={s.id} className="sej-row" onClick={()=>router.push(`/hospitalisation/${s.id}`)}
                      style={{ borderTop:'1px solid #F0F4FA', cursor:'pointer', transition:'background .1s' }}>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:800, color:'#1565C0', background:'#EFF6FF', padding:'2px 8px', borderRadius:6 }}>
                          {s.numero||s.id.slice(0,8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${ab},${ac}22)`, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:ac, flexShrink:0 }}>{inits}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{nomPat}</div>
                            {s.patient?.ipp&&<div style={{ fontSize:10, color:'#90A4AE', fontFamily:'monospace' }}>IPP: {s.patient.ipp}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1565C0' }}>{s.lit?.numero||'—'}</div>
                        <div style={{ fontSize:10, color:'#90A4AE' }}>{s.service||s.lit?.service||'—'}</div>
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:12, color:'#546E7A', whiteSpace:'nowrap' }}>
                        {s.medecin?<><span style={{ fontWeight:700, color:'#1A2332' }}>Dr.</span> {s.medecin.prenom} {s.medecin.nom}</>:'—'}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:12, color:'#546E7A', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
                        <Calendar size={11} color="#90A4AE"/> {fmtDate(s.dateAdmission)}
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontSize:13, fontWeight:800, color:jours>7?'#C62828':jours>3?'#E65100':'#2E7D32' }}>{jours}j</span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:'#EFF6FF', color:'#1565C0' }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:'#3B82F6', display:'inline-block', animation:'pulse 2s infinite' }}/>
                          Actif
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
      )}
    </div>
  );
}
