'use client';

import { useState, useEffect } from 'react';
import { Scissors, Clock, User, CheckCircle, Plus, Calendar, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';

const SALLES = [
  { id:'S1', nom:'Salle 1', specialite:'Chirurgie générale',  statut:'EN_COURS',   intervention:'Appendicectomie',          medecin:'Dr. Koné Mamadou',    debut:'08:30', dureeMin:90,  patient:'Traoré Ibrahima',  debutTs: new Date(Date.now()-55*60000) },
  { id:'S2', nom:'Salle 2', specialite:'Orthopédie',          statut:'DISPONIBLE',  intervention:null,                       medecin:null,                  debut:null,    dureeMin:null, patient:null,              debutTs:null },
  { id:'S3', nom:'Salle 3', specialite:'Gynécologie',         statut:'PROGRAMMEE',  intervention:'Césarienne élective',      medecin:'Dr. Bah Fatoumata',   debut:'11:00', dureeMin:120, patient:'Diallo Mariam',    debutTs:null },
  { id:'S4', nom:'Salle 4', specialite:'Chirurgie cardiaque', statut:'NETTOYAGE',   intervention:null,                       medecin:null,                  debut:null,    dureeMin:null, patient:null,              debutTs:null },
];

const PROGRAMME = [
  { heure:'11:00', salleId:'S3', type:'Césarienne élective',       patient:'Diallo Mariam',    medecin:'Dr. Bah Fatoumata',   dureeMin:120, urgence:false, anesthesiste:'Dr. Diabaté K.' },
  { heure:'13:30', salleId:'S1', type:'Hernioplastie inguinale',   patient:'Ouédraogo Paul',   medecin:'Dr. Koné Mamadou',    dureeMin:75,  urgence:false, anesthesiste:'Dr. Camara M.' },
  { heure:'15:00', salleId:'S2', type:'Ostéosynthèse fracture',    patient:'Sanogo Kader',     medecin:'Dr. Touré Ibrahim',   dureeMin:180, urgence:true,  anesthesiste:'Dr. Diabaté K.' },
  { heure:'16:30', salleId:'S4', type:'Thyroïdectomie partielle',  patient:'Coulibaly Awa',    medecin:'Dr. Yao Emmanuel',    dureeMin:90,  urgence:false, anesthesiste:'Dr. Camara M.' },
];

const SALLE_CFG: Record<string,{ label:string; color:string; bg:string; border:string; dot:string; headerBg:string }> = {
  EN_COURS:   { label:'En cours',   color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', dot:'#3B82F6', headerBg:'linear-gradient(135deg,#1E40AF,#1D4ED8)' },
  DISPONIBLE: { label:'Disponible', color:'#15803D', bg:'#F0FDF4', border:'#86EFAC', dot:'#22C55E', headerBg:'linear-gradient(135deg,#166534,#15803D)' },
  PROGRAMMEE: { label:'Programmée', color:'#C2410C', bg:'#FFF7ED', border:'#FED7AA', dot:'#F97316', headerBg:'linear-gradient(135deg,#C2410C,#EA580C)' },
  NETTOYAGE:  { label:'Nettoyage',  color:'#475569', bg:'#F8FAFC', border:'#CBD5E1', dot:'#94A3B8', headerBg:'linear-gradient(135deg,#334155,#475569)' },
};

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#1E40AF','#DBEAFE'],
];
function aColor(name: string): [string,string] {
  let h=0; for (let i=0;i<name.length;i++) h=((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function inits(nom: string) {
  const p=nom.trim().split(' '); return (p[0]?.charAt(0)??'')+(p[p.length-1]?.charAt(0)??'');
}

function tempsEcoule(since: Date|null, dureeMin: number|null) {
  if (!since||!dureeMin) return null;
  const elapsed = Math.floor((Date.now()-since.getTime())/60000);
  const pct = Math.min(100, Math.round((elapsed/dureeMin)*100));
  return { elapsed, dureeMin, pct };
}

export default function BlocOperatoirePage() {
  const [tab, setTab] = useState<'salles'|'programme'>('salles');
  const [now, setNow] = useState(new Date());

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),10000); return()=>clearInterval(t); },[]);

  const disponibles = SALLES.filter(s=>s.statut==='DISPONIBLE').length;
  const enCours     = SALLES.filter(s=>s.statut==='EN_COURS').length;
  const programmees = PROGRAMME.length;
  const moyDuree    = Math.round(PROGRAMME.reduce((acc,p)=>acc+p.dureeMin,0)/PROGRAMME.length);

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .salle-card:hover{box-shadow:0 10px 28px rgba(0,0,0,0.14)!important;transform:translateY(-2px);}
        .prog-row:hover{background:#F0F4FF!important;}
        .bloc-kpi{cursor:pointer;transition:all .15s;}
        .bloc-kpi:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2)!important;}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1A237E 0%,#283593 50%,#0D47A1 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(26,35,126,0.35)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-70, right:200, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Scissors size={24} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Bloc Opératoire</h1>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600, marginTop:2 }}>
                  Gestion des salles et programme chirurgical
                </div>
              </div>
            </div>
            {/* Date/heure */}
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'5px 12px', width:'fit-content', border:'1px solid rgba(255,255,255,0.15)' }}>
              <Clock size={11} color="rgba(255,255,255,0.7)"/>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', fontFamily:'monospace' }}>
                {now.toLocaleString('fr-FR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', fontSize:13, color:'#fff', fontWeight:700 }}>
              <Calendar size={14}/> Programme
            </button>
            <button style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', fontSize:13, color:'#1A237E', fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> Nouvelle intervention
            </button>
          </div>
        </div>

        {/* KPIs inline */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:18, position:'relative', zIndex:1 }}>
          {[
            { label:'Salles disponibles', val:`${disponibles}/4`, icon:<CheckCircle size={16}/>, color:'#BBF7D0', tab:'salles' as const },
            { label:'En cours',           val:`${enCours}`,       icon:<Scissors size={16}/>,    color:'#BAE6FD', tab:'salles' as const },
            { label:'Programmées',        val:`${programmees}`,   icon:<Calendar size={16}/>,    color:'#FED7AA', tab:'programme' as const },
            { label:'Durée moyenne',      val:`${moyDuree}min`,   icon:<Clock size={16}/>,       color:'#E9D5FF', tab:'programme' as const },
          ].map((k,i)=>(
            <div key={i} className="bloc-kpi" title={`Voir : ${k.label}`} onClick={()=>setTab(k.tab)}
              style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.18)', backdropFilter:'blur(8px)' }}>
              <div style={{ color:k.color, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{k.val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:4, fontWeight:600 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:12, padding:5, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', width:'fit-content', marginBottom:16 }}>
        {[{id:'salles' as const,label:'État des salles'},{id:'programme' as const,label:`Programme du jour (${programmees})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:'9px 20px', borderRadius:9, border:'none', background:tab===t.id?'linear-gradient(135deg,#1A237E,#1D4ED8)':'transparent', color:tab===t.id?'#fff':'#546E7A', fontSize:13, fontWeight:tab===t.id?700:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VUE SALLES ──────────────────────────────────────────── */}
      {tab==='salles'&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, animation:'fadeUp .25s ease' }}>
          {SALLES.map(s=>{
            const cfg=SALLE_CFG[s.statut];
            const prog=tempsEcoule(s.debutTs, s.dureeMin);
            return (
              <div key={s.id} className="salle-card"
                style={{ borderRadius:16, border:`2px solid ${cfg.border}`, background:'#fff', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', transition:'all .2s', cursor:'default' }}>
                {/* Header salle */}
                <div style={{ background:cfg.headerBg, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.nom}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginTop:2 }}>{s.specialite}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.25)' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.statut==='EN_COURS'?'#4ADE80':'rgba(255,255,255,0.6)', display:'inline-block', animation:s.statut==='EN_COURS'?'pulse 1.5s infinite':'none' }}/>
                    <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{cfg.label}</span>
                  </div>
                </div>

                {/* Body salle */}
                <div style={{ padding:'16px 18px', minHeight:100 }}>
                  {s.statut==='DISPONIBLE'&&(
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:80, gap:8 }}>
                      <CheckCircle size={28} color="#22C55E"/>
                      <p style={{ margin:0, fontSize:13, color:'#15803D', fontWeight:700 }}>Salle disponible</p>
                      <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>Aucune intervention planifiée</p>
                    </div>
                  )}
                  {s.statut==='NETTOYAGE'&&(
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:80, gap:8 }}>
                      <RefreshCw size={24} color="#94A3B8" style={{ animation:'spin 3s linear infinite' }}/>
                      <p style={{ margin:0, fontSize:13, color:'#475569', fontWeight:700 }}>Nettoyage en cours</p>
                      <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>Disponible dans ~30 min</p>
                    </div>
                  )}
                  {(s.statut==='EN_COURS'||s.statut==='PROGRAMMEE')&&(
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Scissors size={16} color={cfg.color}/>
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:800, color:'#1A2332' }}>{s.intervention}</div>
                          <div style={{ fontSize:11, color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={10}/> {s.debut} — ~{s.dureeMin}min
                          </div>
                        </div>
                      </div>

                      {s.patient&&(()=>{
                        const [ac,ab]=aColor(s.patient!);
                        return (
                          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:ab, borderRadius:10, border:`1px solid ${ac}22` }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>{inits(s.patient!)}</div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>{s.patient}</div>
                              <div style={{ fontSize:10, color:'#6B7280' }}>{s.medecin}</div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Barre progression si EN_COURS */}
                      {prog&&(
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:9, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>Progression</span>
                            <span style={{ fontSize:10, fontWeight:800, color:prog.pct>90?'#DC2626':cfg.color }}>{prog.elapsed}min / {prog.dureeMin}min</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:'#E2E8F0', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${prog.pct}%`, background:prog.pct>90?'#EF4444':cfg.headerBg, borderRadius:3, transition:'width .5s' }}/>
                          </div>
                          <div style={{ fontSize:9, color:'#9CA3AF', textAlign:'right', marginTop:3 }}>{prog.pct}% écoulé</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VUE PROGRAMME ────────────────────────────────────────── */}
      {tab==='programme'&&(
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
          <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,#F0F4FF,#E8EEFF)', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #E8EEFA' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={16} color="#1A237E"/>
              <span style={{ fontSize:13, fontWeight:800, color:'#1A237E' }}>Programme du {now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#6B7280', background:'#fff', padding:'3px 10px', borderRadius:20, border:'1px solid #E0E8F0' }}>{programmees} interventions</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Heure','Salle','Intervention','Patient','Chirurgien','Anesthésiste','Durée','Priorité'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROGRAMME.map((p,i)=>{
                  const salle=SALLES.find(s=>s.id===p.salleId);
                  const scfg=SALLE_CFG[salle?.statut??'DISPONIBLE'];
                  const [ac,ab]=aColor(p.patient);
                  return (
                    <tr key={i} className="prog-row"
                      style={{ borderTop:'1px solid #F0F4FA', cursor:'pointer', transition:'background .1s' }}>
                      <td style={{ padding:'13px 14px', fontWeight:900, color:'#1A2332', fontSize:15, fontFamily:'monospace', whiteSpace:'nowrap' }}>{p.heure}</td>
                      <td style={{ padding:'13px 14px' }}>
                        <span style={{ fontWeight:700, fontSize:12, padding:'3px 10px', borderRadius:8, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}` }}>{p.salleId}</span>
                      </td>
                      <td style={{ padding:'13px 14px', fontSize:13, color:'#1A2332', fontWeight:700 }}>{p.type}</td>
                      <td style={{ padding:'13px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:ab, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:ac, flexShrink:0 }}>{inits(p.patient)}</div>
                          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{p.patient}</span>
                        </div>
                      </td>
                      <td style={{ padding:'13px 14px', fontSize:12, color:'#546E7A' }}>{p.medecin}</td>
                      <td style={{ padding:'13px 14px', fontSize:12, color:'#546E7A' }}>{p.anesthesiste}</td>
                      <td style={{ padding:'13px 14px', fontSize:12, fontWeight:700, color:'#374151', fontFamily:'monospace' }}>{p.dureeMin}min</td>
                      <td style={{ padding:'13px 14px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:p.urgence?'#FEE2E2':'#DCFCE7', color:p.urgence?'#DC2626':'#15803D' }}>
                          {p.urgence?<><AlertTriangle size={9}/> URGENCE</>:<><CheckCircle size={9}/> Programmé</>}
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
