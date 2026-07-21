'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PatientUrgence, CategorieManchester } from '@/types';
import AdmissionUrgenceModal from '@/components/urgences/AdmissionUrgenceModal';
import TriageModal from '@/components/urgences/TriageModal';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { RefreshCw, Plus, Activity, Clock, AlertTriangle, Stethoscope, Heart } from 'lucide-react';

const MAN_CFG: Record<CategorieManchester, { bg: string; border: string; text: string; badge: string; label: string; order: number; dot: string; headerBg: string }> = {
  ROUGE:  { bg:'#FFF1F2', border:'#F87171', text:'#7F1D1D', badge:'#DC2626', label:'ROUGE',  order:0, dot:'#EF4444', headerBg:'linear-gradient(135deg,#B91C1C,#DC2626)' },
  ORANGE: { bg:'#FFF7ED', border:'#FB923C', text:'#7C2D12', badge:'#EA580C', label:'ORANGE', order:1, dot:'#F97316', headerBg:'linear-gradient(135deg,#C2410C,#EA580C)' },
  JAUNE:  { bg:'#FEFCE8', border:'#FDE047', text:'#713F12', badge:'#CA8A04', label:'JAUNE',  order:2, dot:'#EAB308', headerBg:'linear-gradient(135deg,#A16207,#CA8A04)' },
  VERT:   { bg:'#F0FDF4', border:'#86EFAC', text:'#14532D', badge:'#16A34A', label:'VERT',   order:3, dot:'#22C55E', headerBg:'linear-gradient(135deg,#15803D,#16A34A)' },
  NOIR:   { bg:'#F9FAFB', border:'#6B7280', text:'#111827', badge:'#374151', label:'DÉCÉDÉ', order:4, dot:'#6B7280', headerBg:'linear-gradient(135deg,#1F2937,#374151)' },
};

const STATUT_CFG: Record<string,{label:string;color:string;bg:string}> = {
  attente_triage: { label:'Att. triage', color:'#475569', bg:'#F1F5F9' },
  en_triage:      { label:'En triage',   color:'#0F766E', bg:'#CCFBF1' },
  en_soins:       { label:'En soins',    color:'#1D4ED8', bg:'#DBEAFE' },
  en_observation: { label:'Observation', color:'#7E22CE', bg:'#F3E8FF' },
};

function tempsDepuis(h: string): string {
  const d = Math.floor((Date.now()-new Date(h).getTime())/60000);
  if (d<60) return `${d}min`;
  return `${Math.floor(d/60)}h${(d%60).toString().padStart(2,'0')}`;
}
function nomPatient(p: PatientUrgence, inconnu: string) {
  if (p.patient) return `${p.patient.prenom} ${p.patient.nom}`;
  return p.nomProvisoire||inconnu;
}
function getInits(m?: PatientUrgence['medecin']) {
  if (!m) return '?';
  return `${m.prenom.charAt(0)}${m.nom.charAt(0)}`.toUpperCase();
}

function PatientCard({ patient, onTriage, onDossier: _onDossier, onPriseEnCharge }: {
  patient: PatientUrgence; onTriage:()=>void; onDossier?:()=>void; onPriseEnCharge:()=>void|Promise<void>;
}) {
  const t = useTranslations('urgences');
  const cfg = MAN_CFG[patient.categorieManchester];
  const stt = STATUT_CFG[patient.statut]??{ label:patient.statut, color:'#546E7A', bg:'#ECEFF1' };
  const sttLabel = STATUT_CFG[patient.statut] ? t(`statut.${patient.statut}`) : patient.statut;
  const temps = tempsDepuis(patient.heureArrivee);
  const tempsMin = Math.floor((Date.now()-new Date(patient.heureArrivee).getTime())/60000);
  const alerte = (patient.categorieManchester==='ROUGE' && tempsMin>15) ||
                 (patient.categorieManchester==='ORANGE' && tempsMin>30);

  return (
    <div style={{ borderRadius:14, border:`2px solid ${cfg.border}`, background:cfg.bg, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.09)', transition:'all .2s', display:'flex', flexDirection:'column' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 10px rgba(0,0,0,0.09)';}}>

      {/* Header coloré */}
      <div style={{ background:cfg.headerBg, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:900, color:'#fff', fontFamily:'monospace', letterSpacing:'.5px' }}>{patient.numero}</span>
          <span style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.95)', textTransform:'uppercase', letterSpacing:'.5px' }}>{t(`manchester.${patient.categorieManchester}`)}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {alerte&&<span style={{ fontSize:9, fontWeight:800, color:'#fff', background:'rgba(255,255,255,0.25)', padding:'2px 6px', borderRadius:10, animation:'pulse 1s infinite', textTransform:'uppercase' }}>⚠ {t('delai')}</span>}
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', fontFamily:'monospace', background:'rgba(0,0,0,0.2)', padding:'2px 8px', borderRadius:6 }}>⏱ {temps}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'12px 14px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, color:cfg.text, lineHeight:1.2 }}>{nomPatient(patient, t('patientInconnu'))}</div>
            <div style={{ fontSize:11, color:'#6B7280', marginTop:3, lineHeight:1.4 }}>{patient.motif}</div>
          </div>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, background:stt.bg, color:stt.color, whiteSpace:'nowrap', flexShrink:0 }}>{sttLabel}</span>
        </div>

        {/* Constantes */}
        {patient.constantes&&(
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 12px', padding:'8px 10px', background:'rgba(255,255,255,0.6)', borderRadius:8, border:`1px solid ${cfg.border}40` }}>
            {patient.constantes.tensionArterielle&&<span style={{ fontSize:11, color:cfg.text }}><b>TA</b> {patient.constantes.tensionArterielle}</span>}
            {patient.constantes.frequenceCardiaque&&<span style={{ fontSize:11, color:cfg.text }}><b>FC</b> {patient.constantes.frequenceCardiaque} bpm</span>}
            {patient.constantes.temperature&&<span style={{ fontSize:11, color:cfg.text }}><b>T°</b> {patient.constantes.temperature}°C</span>}
            {patient.constantes.spo2&&<span style={{ fontSize:11, fontWeight:patient.constantes.spo2<92?800:400, color:patient.constantes.spo2<92?'#DC2626':cfg.text }}><b>SpO2</b> {patient.constantes.spo2}%</span>}
            {patient.constantes.glasgow&&<span style={{ fontSize:11, color:cfg.text }}><b>GCS</b> {patient.constantes.glasgow}/15</span>}
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {patient.medecin ? (
              <>
                <div style={{ width:26, height:26, borderRadius:8, background:cfg.badge, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff' }}>{getInits(patient.medecin)}</div>
                <span style={{ fontSize:11, color:'#6B7280' }}>Dr. {patient.medecin.prenom} {patient.medecin.nom}</span>
              </>
            ) : (
              <span style={{ fontSize:11, color:'#9CA3AF', fontStyle:'italic' }}>{t('nonAssigne')}</span>
            )}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={onTriage}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:8, border:`1.5px solid ${cfg.border}`, background:'rgba(255,255,255,0.7)', color:cfg.text, cursor:'pointer', fontWeight:700 }}>
              {t('triage')}
            </button>
            <button onClick={onPriseEnCharge}
              style={{ fontSize:11, padding:'5px 11px', borderRadius:8, border:'none', background:cfg.badge, color:'#fff', cursor:'pointer', fontWeight:700 }}>
              {t('prendreEnCharge')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UrgencesPage() {
  const t = useTranslations('urgences');
  const [patients, setPatients]       = useState<PatientUrgence[]>([]);
  const [loading, setLoading]         = useState(true);
  const [heure, setHeure]             = useState(new Date());
  const [showAdmission, setShowAdmission] = useState(false);
  const [triagePatient, setTriagePatient] = useState<PatientUrgence|null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filtreMan, setFiltreMan]     = useState<CategorieManchester|'TOUS'>('TOUS');

  const load = useCallback(async () => {
    try {
      const data = await apiClient<PatientUrgence[]>('/urgences/actifs');
      setPatients(Array.isArray(data)?data:(data as any)?.items??[]);
      setLastRefresh(new Date());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const tick    = setInterval(()=>setHeure(new Date()), 1000);
    const refresh = setInterval(()=>load(), 30000);
    return ()=>{ clearInterval(tick); clearInterval(refresh); };
  }, [load]);

  const actifs = patients.filter(p=>!['sorti','hospitalise','decede'].includes(p.statut));
  const trie   = [...actifs].sort((a,b)=>MAN_CFG[a.categorieManchester].order-MAN_CFG[b.categorieManchester].order);
  const affich = filtreMan==='TOUS' ? trie : trie.filter(p=>p.categorieManchester===filtreMan);

  const stats = {
    rouge:  actifs.filter(p=>p.categorieManchester==='ROUGE').length,
    orange: actifs.filter(p=>p.categorieManchester==='ORANGE').length,
    jaune:  actifs.filter(p=>p.categorieManchester==='JAUNE').length,
    vert:   actifs.filter(p=>p.categorieManchester==='VERT').length,
    total:  actifs.length,
  };

  const handleAdmit = useCallback(async (data: Partial<PatientUrgence>) => {
    try { await apiClient('/urgences/admettre',{method:'POST',body:data}); } catch {}
    load();
  }, [load]);

  const handleTriage = useCallback(async (id: string, data: Partial<PatientUrgence>) => {
    try {
      if (data.categorieManchester||data.constantes) await apiClient(`/urgences/${id}/triage`,{method:'PATCH',body:data});
      else if (data.statut==='en_soins') await apiClient(`/urgences/${id}/soins`,{method:'PATCH',body:data});
    } catch {}
    load();
  }, [load]);

  return (
    <div style={{ background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tickBlink{0%,100%{opacity:1}49%{opacity:1}50%{opacity:.3}99%{opacity:.3}}
        .urg-stat:hover{filter:brightness(1.25);}
      `}</style>

      {/* ── HERO URGENCES ────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#7F1D1D 0%,#B91C1C 45%,#DC2626 100%)', padding:'0', position:'sticky', top:0, zIndex:30, boxShadow:'0 4px 20px rgba(185,28,28,0.5)' }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', flexWrap:'wrap', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertTriangle size={20} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'.5px', textTransform:'uppercase' }}>{t('title')}</h1>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:600, letterSpacing:'.5px' }}>{t('subtitle')}</div>
              </div>
            </div>

            {/* Horloge */}
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'6px 12px', border:'1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
              <span style={{ fontSize:14, fontWeight:800, color:'#fff', fontFamily:'monospace', letterSpacing:'1px' }}>
                {heure.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
              </span>
            </div>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>
              {t('actualise',{time:lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})})}
            </span>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>load()}
              style={{ padding:'8px 12px', borderRadius:9, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
              <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={()=>setShowAdmission(true)}
              style={{ display:'flex', alignItems:'center', gap:8, background:'#fff', color:'#B91C1C', fontWeight:800, padding:'9px 18px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> {t('admettre')}
            </button>
          </div>
        </div>

        {/* Stats bar Manchester */}
        <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.12)' }}>
          {[
            { label:t('statCritiques'), value:stats.rouge,  color:'#FCA5A5', dot:'#EF4444', man:'ROUGE'  as CategorieManchester },
            { label:t('statUrgences'),  value:stats.orange, color:'#FED7AA', dot:'#F97316', man:'ORANGE' as CategorieManchester },
            { label:t('statSemiUrg'), value:stats.jaune,  color:'#FEF08A', dot:'#EAB308', man:'JAUNE'  as CategorieManchester },
            { label:t('statNonUrg'),  value:stats.vert,   color:'#BBF7D0', dot:'#22C55E', man:'VERT'   as CategorieManchester },
            { label:t('statTotal'),     value:stats.total,  color:'rgba(255,255,255,0.9)', dot:'#fff', man:'TOUS' as any },
          ].map((s,i)=>(
            <button key={i} className="urg-stat" title={t('filtrer',{label:s.label})} onClick={()=>setFiltreMan(filtreMan===s.man?'TOUS':s.man)}
              style={{ flex:1, padding:'10px 12px', display:'flex', alignItems:'center', gap:8, borderRight:i<4?'1px solid rgba(255,255,255,0.1)':'none', background:filtreMan===s.man?'rgba(255,255,255,0.15)':'transparent', border:'none', cursor:'pointer', transition:'background .15s' }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:s.dot, flexShrink:0, boxShadow:`0 0 6px ${s.dot}` }}/>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1, fontFamily:'monospace' }}>{loading?'…':s.value}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── GRILLE PATIENTS ──────────────────────────────────────── */}
      <div style={{ padding:'18px', animation:'fadeUp .3s ease' }}>
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} style={{ height:180, background:'linear-gradient(135deg,#FFE4E1,#FFEBEE)', borderRadius:14, animation:'pulse 1.5s ease infinite' }}/>
            ))}
          </div>
        ) : affich.length===0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'#E8F5E9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Heart size={40} color="#4ADE80"/>
            </div>
            <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#374151' }}>{t('aucunPatient')}</p>
            <p style={{ margin:'6px 0 0', fontSize:13, color:'#9CA3AF' }}>{t('salleCalme')}</p>
          </div>
        ) : (
          <>
            {filtreMan!=='TOUS'&&(
              <div style={{ marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#546E7A', fontWeight:600 }}>{t('filtreActif')}</span>
                <span style={{ fontSize:11, fontWeight:800, padding:'3px 12px', borderRadius:20, background:MAN_CFG[filtreMan].badge, color:'#fff' }}>{t(`manchester.${filtreMan}`)}</span>
                <button onClick={()=>setFiltreMan('TOUS')} style={{ fontSize:11, color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>{t('toutVoir')}</button>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {affich.map(p=>(
                <PatientCard key={p.id} patient={p}
                  onTriage={()=>setTriagePatient(p)}
                  onDossier={()=>{}}
                  onPriseEnCharge={()=>handleTriage(p.id,{statut:'en_soins'})}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showAdmission&&<AdmissionUrgenceModal onClose={()=>setShowAdmission(false)} onAdmit={handleAdmit}/>}
      {triagePatient&&<TriageModal patient={triagePatient} onClose={()=>setTriagePatient(null)} onUpdate={handleTriage}/>}
    </div>
  );
}
