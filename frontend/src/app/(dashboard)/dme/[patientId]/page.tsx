'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, AlertTriangle, Stethoscope, FlaskConical, FileText,
  Pill, Heart, Scissors, Users, Baby, RefreshCw, ChevronRight, Calendar,
  Phone, Droplets, Activity, ClipboardList, Plus, CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string;
  dateNaissance?: string; sexe?: 'M'|'F'; groupeSanguin?: string;
  allergies?: string; statut?: string; telephone?: string; adresse?: string;
};
type Antecedent = {
  id: string; type: string; description: string;
  gravite?: string; traitement?: string; date?: string; createdAt?: string;
};
type ConsultationSummary = {
  id: string; dateHeure?: string; motif?: string; diagnostic?: string; statut?: string;
  medecin?: { nom: string; prenom: string };
};
type AnalyseSummary = { id: string; dateCreation?: string; typeAnalyse?: string; statut?: string };
type OrdonnanceSummary = { id: string; dateCreation?: string; statut?: string; lignes?: string[] };

const GRAVITE_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  leger:  { label:'Léger',   color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9' },
  modere: { label:'Modéré',  color:'#E65100', bg:'#FFF3E0', border:'#FFCC80' },
  grave:  { label:'Grave',   color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2' },
};
const TYPE_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  medical:       { label:'Médical',        color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2', icon:<Heart size={15}/> },
  chirurgical:   { label:'Chirurgical',    color:'#0D47A1', bg:'#EFF6FF', border:'#BBDEFB', icon:<Scissors size={15}/> },
  familial:      { label:'Familial',       color:'#6A1B9A', bg:'#F3E5F5', border:'#E1BEE7', icon:<Users size={15}/> },
  allergie:      { label:'Allergie',       color:'#E65100', bg:'#FFF3E0', border:'#FFCC80', icon:<AlertTriangle size={15}/> },
  gynecologique: { label:'Gynécologique',  color:'#AD1457', bg:'#FCE4EC', border:'#F48FB1', icon:<Baby size={15}/> },
  autre:         { label:'Autre',          color:'#546E7A', bg:'#ECEFF1', border:'#CFD8DC', icon:<FileText size={15}/> },
};
const STATUT_CONS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  en_cours:  { label:'En cours', color:'#1565C0', bg:'#EFF6FF', dot:'#3B82F6' },
  terminee:  { label:'Terminée', color:'#2E7D32', bg:'#E8F5E9', dot:'#4ADE80' },
  facturee:  { label:'Facturée', color:'#6A1B9A', bg:'#F3E5F5', dot:'#A855F7' },
};
const SANG_COLORS: Record<string, [string,string]> = {
  'A+':['#C62828','#FFEBEE'],'A-':['#C62828','#FFEBEE'],
  'B+':['#1565C0','#EFF6FF'],'B-':['#1565C0','#EFF6FF'],
  'AB+':['#6A1B9A','#F3E5F5'],'AB-':['#6A1B9A','#F3E5F5'],
  'O+':['#2E7D32','#E8F5E9'],'O-':['#2E7D32','#E8F5E9'],
};

function calcAge(d?: string) {
  if (!d) return 0;
  return Math.floor((Date.now()-new Date(d).getTime())/(365.25*24*3600000));
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return '—'; }
}

const TABS = [
  { id:'resume',        labelKey:'detail.tabResume',       icon:<Activity size={14}/> },
  { id:'antecedents',   labelKey:'detail.tabAntecedents',  icon:<Heart size={14}/> },
  { id:'consultations', labelKey:'detail.tabConsultations', icon:<Stethoscope size={14}/> },
  { id:'ordonnances',   labelKey:'detail.tabOrdonnances',   icon:<Pill size={14}/> },
  { id:'analyses',      labelKey:'detail.tabAnalyses',      icon:<FlaskConical size={14}/> },
];

export default function DMEPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('dme');
  const graviteLabel = (g?: string) => (({
    leger: t('detail.graviteLeger'), modere: t('detail.graviteModere'), grave: t('detail.graviteGrave'),
  }) as Record<string, string>)[g ?? 'leger'] ?? t('detail.graviteLeger');
  const typeLabel = (ty: string) => (({
    medical: t('detail.typeMedical'), chirurgical: t('detail.typeChirurgical'), familial: t('detail.typeFamilial'),
    allergie: t('detail.typeAllergie'), gynecologique: t('detail.typeGynecologique'), autre: t('detail.typeAutre'),
  }) as Record<string, string>)[ty] ?? t('detail.typeAutre');
  const consStatutLabel = (s?: string) => (({
    en_cours: t('detail.statutEnCours'), terminee: t('detail.statutTerminee'), facturee: t('detail.statutFacturee'),
  }) as Record<string, string>)[s ?? ''] ?? s;
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient|null>(null);
  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [analyses, setAnalyses] = useState<AnalyseSummary[]>([]);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [tab, setTab] = useState('resume');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [patR,antR,conR,anaR,ordR] = await Promise.allSettled([
        apiClient<Patient>(`/patients/${patientId}`),
        apiClient<any>(`/patients/${patientId}/antecedents`),
        apiClient<any>(`/consultations?patientId=${patientId}&limit=20`),
        apiClient<any>(`/laboratoire/demandes?patientId=${patientId}&limit=20`),
        apiClient<any>(`/ordonnances?patientId=${patientId}&limit=20`),
      ]);
      if (patR.status==='fulfilled') setPatient(patR.value);
      else { setError(t('detail.patientNotFound')); setLoading(false); return; }
      if (antR.status==='fulfilled') { const d=antR.value; setAntecedents(Array.isArray(d)?d:d?.items??[]); }
      if (conR.status==='fulfilled') { const d=conR.value; setConsultations(Array.isArray(d)?d:d?.items??[]); }
      if (anaR.status==='fulfilled') { const d=anaR.value; setAnalyses(Array.isArray(d)?d:d?.items??[]); }
      if (ordR.status==='fulfilled') { const d=ordR.value; setOrdonnances(Array.isArray(d)?d:d?.items??[]); }
    } catch(e:any) { setError(e?.message??t('detail.loadError')); }
    finally { setLoading(false); }
  },[patientId, t]);

  useEffect(()=>{ load(); },[load]);

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', background:'#F4F6FA', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#0D47A1,#00838F)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <RefreshCw size={24} color="#fff" style={{ animation:'spin 1s linear infinite' }}/>
      </div>
      <p style={{ fontSize:14, color:'#546E7A', margin:0, fontWeight:600 }}>{t('detail.loading')}</p>
    </div>
  );

  if (error) return (
    <div style={{ padding:20, background:'#F4F6FA', minHeight:'100vh' }}>
      <button onClick={()=>router.push('/patients')} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:10, border:'1px solid #E0E0E0', background:'#fff', cursor:'pointer', fontSize:13, color:'#546E7A', marginBottom:20, fontWeight:600 }}>
        <ArrowLeft size={14}/> {t('detail.backPatients')}
      </button>
      <div style={{ background:'#FFEBEE', border:'1px solid #FFCDD2', borderRadius:14, padding:28, color:'#C62828', display:'flex', alignItems:'center', gap:12 }}>
        <AlertTriangle size={24}/> <span style={{ fontSize:14, fontWeight:600 }}>{error}</span>
      </div>
    </div>
  );

  if (!patient) return null;

  const age = calcAge(patient.dateNaissance);
  const [sangColor, sangBg] = SANG_COLORS[patient.groupeSanguin||'']??['#546E7A','#ECEFF1'];
  const initials = `${patient.prenom?.charAt(0)??''}${patient.nom?.charAt(0)??''}`;

  const tabCounts: Record<string,number> = {
    resume: 0, antecedents: antecedents.length,
    consultations: consultations.length, ordonnances: ordonnances.length, analyses: analyses.length,
  };

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ant-card:hover{background:#F5F0FF!important;transform:translateX(3px);}
        .con-card:hover{background:#E8F5E9!important;}
        .ana-card:hover{background:#F0FBF9!important;}
      `}</style>

      {/* ── RETOUR ───────────────────────────────────────────────── */}
      <button onClick={()=>router.push('/patients')}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', cursor:'pointer', fontSize:13, color:'#546E7A', marginBottom:18, fontWeight:600, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <ArrowLeft size={14}/> {t('detail.backPatients')}
      </button>

      {/* ── BANNER PATIENT ───────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0A2E6E 0%,#1565C0 50%,#00838F 100%)', borderRadius:18, padding:'24px 28px', marginBottom:20, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(13,71,161,0.3)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, right:220, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap', zIndex:1, position:'relative' }}>
          {/* Avatar */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <div style={{ width:72, height:72, borderRadius:18, background:'rgba(255,255,255,0.2)', border:'2.5px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'1px' }}>
              {initials}
            </div>
            <div style={{ position:'absolute', bottom:2, right:2, width:16, height:16, borderRadius:'50%', background: patient.statut==='actif'?'#4ADE80':'#B0BEC5', border:'2.5px solid #1565C0' }}/>
          </div>

          {/* Infos principales */}
          <div style={{ flex:1, minWidth:200 }}>
            <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>
              {patient.prenom} {patient.nom}
            </h1>
            <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8 }}>
              {patient.ipp&&(
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontFamily:'monospace', background:'rgba(255,255,255,0.1)', padding:'3px 10px', borderRadius:6 }}>
                  {t('detail.ippLabel', { value: patient.ipp })}
                </span>
              )}
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:600 }}>
                {patient.sexe==='M'?t('detail.male'):patient.sexe==='F'?t('detail.female'):'—'} • {t('detail.ageYears', { age })}
              </span>
              {patient.dateNaissance&&(
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:4 }}>
                  <Calendar size={11}/> {t('detail.bornOn', { date: fmtDate(patient.dateNaissance) })}
                </span>
              )}
              {patient.telephone&&(
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:4 }}>
                  <Phone size={11}/> {patient.telephone}
                </span>
              )}
            </div>
          </div>

          {/* Badges cliniques */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {patient.groupeSanguin&&(
              <div style={{ padding:'10px 16px', borderRadius:12, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.25)', textAlign:'center' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                  <Droplets size={10}/> {t('detail.groupeSanguin')}
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:'#fff', lineHeight:1 }}>{patient.groupeSanguin}</div>
              </div>
            )}
            {patient.allergies&&(
              <div style={{ padding:'10px 16px', borderRadius:12, background:'rgba(198,40,40,0.45)', border:'1px solid rgba(255,255,255,0.2)', backdropFilter:'blur(8px)' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                  <AlertTriangle size={10}/> {t('detail.allergies')}
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:'#fff', maxWidth:140 }}>{patient.allergies}</div>
              </div>
            )}
            <button onClick={()=>router.push(`/consultations/nouvelle?patientId=${patient.id}`)}
              style={{ padding:'10px 16px', borderRadius:12, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
              <Plus size={13}/> {t('detail.newConsultation')}
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, marginBottom:16, background:'#fff', borderRadius:12, padding:5, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflowX:'auto' }}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, border:'none', background:tab===tb.id?'linear-gradient(135deg,#0D47A1,#1565C0)':'transparent', color:tab===tb.id?'#fff':'#546E7A', fontSize:13, fontWeight:tab===tb.id?700:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s', position:'relative' }}>
            {tb.icon} {t(tb.labelKey)}
            {tabCounts[tb.id]>0&&(
              <span style={{ background:tab===tb.id?'rgba(255,255,255,0.25)':'#EFF6FF', color:tab===tb.id?'#fff':'#1565C0', fontSize:10, fontWeight:800, padding:'1px 6px', borderRadius:10, marginLeft:2 }}>
                {tabCounts[tb.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENU TABS ─────────────────────────────────────────── */}

      {/* RÉSUMÉ */}
      {tab==='resume'&&(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, animation:'fadeUp .25s ease' }}>
          {[
            { label:t('detail.cardConsultations'), count:consultations.length, icon:<Stethoscope size={20}/>, color:'#1565C0', bg:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border:'#BBDEFB', tab:'consultations' },
            { label:t('detail.cardAntecedents'),   count:antecedents.length,   icon:<Heart size={20}/>,       color:'#C62828', bg:'linear-gradient(135deg,#FFEBEE,#FFCDD2)', border:'#FFCDD2', tab:'antecedents' },
            { label:t('detail.cardAnalysesLabo'), count:analyses.length,      icon:<FlaskConical size={20}/>, color:'#6A1B9A', bg:'linear-gradient(135deg,#F3E5F5,#E1BEE7)', border:'#E1BEE7', tab:'analyses' },
            { label:t('detail.cardOrdonnances'),   count:ordonnances.length,   icon:<Pill size={20}/>,         color:'#2E7D32', bg:'linear-gradient(135deg,#E8F5E9,#C8E6C9)', border:'#C8E6C9', tab:'ordonnances' },
          ].map(s=>(
            <div key={s.label} onClick={()=>setTab(s.tab)}
              style={{ padding:'20px 22px', borderRadius:14, background:s.bg, border:`1.5px solid ${s.border}`, cursor:'pointer', transition:'all .2s', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.07)';}}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ color:s.color }}>{s.icon}</div>
                <ChevronRight size={16} color={s.color} style={{ opacity:.6 }}/>
              </div>
              <div style={{ fontSize:36, fontWeight:900, color:s.color, lineHeight:1 }}>{s.count}</div>
              <div style={{ fontSize:12, color:s.color, fontWeight:700, marginTop:6, opacity:.8 }}>{s.label}</div>
            </div>
          ))}

          {/* Infos patient */}
          <div style={{ padding:'20px 22px', borderRadius:14, background:'#fff', border:'1.5px solid #E8EEFA', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', gridColumn:'span 2' }}>
            <h3 style={{ margin:'0 0 14px', fontSize:13, fontWeight:800, color:'#1A2332', textTransform:'uppercase', letterSpacing:'.6px', display:'flex', alignItems:'center', gap:8 }}>
              <ClipboardList size={15} color="#1565C0"/> {t('detail.generalInfo')}
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
              {[
                { label:t('detail.infoStatut'), value: patient.statut==='actif'?t('detail.statutActif'):t('detail.statutInactif'), color: patient.statut==='actif'?'#2E7D32':'#546E7A' },
                { label:t('detail.infoSexe'), value: patient.sexe==='M'?t('detail.male'):patient.sexe==='F'?t('detail.female'):'—' },
                { label:t('detail.infoAge'), value:t('detail.ageYears', { age }) },
                { label:t('detail.infoGroupeSanguin'), value:patient.groupeSanguin||'—', color:sangColor },
                { label:t('detail.infoTelephone'), value:patient.telephone||'—' },
                { label:t('detail.infoDateNaissance'), value:fmtDate(patient.dateNaissance) },
              ].map(info=>(
                <div key={info.label} style={{ padding:'10px 12px', background:'#F8FAFC', borderRadius:10, border:'1px solid #EEF0F5' }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'#90A4AE', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{info.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:info.color||'#37474F' }}>{info.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANTÉCÉDENTS */}
      {tab==='antecedents'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          {antecedents.length===0?(
            <div style={{ background:'#fff', borderRadius:14, padding:'50px 20px', textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
              <Heart size={36} style={{ color:'#FFCDD2', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, color:'#90A4AE', fontSize:13, fontWeight:600 }}>{t('detail.emptyAntecedents')}</p>
            </div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {antecedents.map(a=>{
                const cfg=TYPE_CFG[a.type]??TYPE_CFG.autre;
                const gcfg=GRAVITE_CFG[a.gravite??'leger']??GRAVITE_CFG.leger;
                return (
                  <div key={a.id} className="ant-card"
                    style={{ background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', gap:14, alignItems:'flex-start', transition:'all .15s', borderLeft:`4px solid ${cfg.color}` }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>{cfg.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>{typeLabel(a.type)}</span>
                        <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, background:gcfg.bg, color:gcfg.color, border:`1px solid ${gcfg.border}` }}>{graviteLabel(a.gravite)}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1A2332', marginBottom:a.traitement?4:0 }}>{a.description}</div>
                      {a.traitement&&<div style={{ fontSize:12, color:'#546E7A', display:'flex', alignItems:'center', gap:5 }}><Pill size={11} color="#546E7A"/> {t('detail.traitement', { value: a.traitement })}</div>}
                    </div>
                    <div style={{ fontSize:11, color:'#90A4AE', flexShrink:0, fontWeight:600 }}>{fmtDate(a.date??a.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONSULTATIONS */}
      {tab==='consultations'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          {consultations.length===0?(
            <div style={{ background:'#fff', borderRadius:14, padding:'50px 20px', textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
              <Stethoscope size={36} style={{ color:'#BBDEFB', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, color:'#90A4AE', fontSize:13, fontWeight:600 }}>{t('detail.emptyConsultations')}</p>
            </div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {consultations.map(c=>{
                const scfg=STATUT_CONS[c.statut??'en_cours']??STATUT_CONS.en_cours;
                return (
                  <div key={c.id} className="con-card" onClick={()=>router.push(`/consultations/${c.id}`)}
                    style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all .15s', borderLeft:`3px solid ${scfg.color}` }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:scfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Stethoscope size={16} color={scfg.color}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{c.motif??t('detail.consultationDefault')}</div>
                      <div style={{ fontSize:11, color:'#90A4AE', marginTop:2, display:'flex', gap:10 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:3 }}><Calendar size={10}/> {fmtDate(c.dateHeure)}</span>
                        {c.medecin&&<span>Dr. {c.medecin.prenom} {c.medecin.nom}</span>}
                      </div>
                      {c.diagnostic&&<div style={{ fontSize:11, color:'#546E7A', marginTop:4, fontStyle:'italic' }}>{t('detail.diagnostic', { value: c.diagnostic })}</div>}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:scfg.bg, color:scfg.color }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:scfg.dot, display:'inline-block' }}/>
                        {consStatutLabel(c.statut)}
                      </span>
                      <ChevronRight size={15} color="#B0BEC5"/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ORDONNANCES */}
      {tab==='ordonnances'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          {ordonnances.length===0?(
            <div style={{ background:'#fff', borderRadius:14, padding:'50px 20px', textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
              <Pill size={36} style={{ color:'#C8E6C9', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, color:'#90A4AE', fontSize:13, fontWeight:600 }}>{t('detail.emptyOrdonnances')}</p>
            </div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {ordonnances.map(o=>(
                <div key={o.id} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', borderLeft:'4px solid #2E7D32' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:'#2E7D32', fontFamily:'monospace', background:'#E8F5E9', padding:'3px 10px', borderRadius:6 }}>ORD-{o.id.slice(0,8).toUpperCase()}</span>
                    <span style={{ fontSize:11, color:'#90A4AE' }}>{fmtDate(o.dateCreation)}</span>
                  </div>
                  {o.lignes?.map((l,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:i<(o.lignes?.length??0)-1?'1px solid #F5F7FA':'none' }}>
                      <Pill size={12} color="#2E7D32"/>
                      <span style={{ fontSize:12, color:'#37474F' }}>{l}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYSES */}
      {tab==='analyses'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          {analyses.length===0?(
            <div style={{ background:'#fff', borderRadius:14, padding:'50px 20px', textAlign:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
              <FlaskConical size={36} style={{ color:'#E1BEE7', display:'block', margin:'0 auto 12px' }}/>
              <p style={{ margin:0, color:'#90A4AE', fontSize:13, fontWeight:600 }}>{t('detail.emptyAnalyses')}</p>
            </div>
          ):(
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {analyses.map(a=>{
                const done=a.statut==='disponible'||a.statut==='valide';
                return (
                  <div key={a.id} className="ana-card"
                    style={{ background:'#fff', borderRadius:12, padding:'14px 18px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:14, transition:'all .15s', cursor:'pointer', borderLeft:`3px solid ${done?'#2E7D32':'#6A1B9A'}` }}
                    onClick={()=>router.push(`/laboratoire/demandes/${a.id}`)}>
                    <div style={{ width:38, height:38, borderRadius:10, background:done?'#E8F5E9':'#F3E5F5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FlaskConical size={16} color={done?'#2E7D32':'#6A1B9A'}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{a.typeAnalyse??t('detail.analyseDefault')}</div>
                      <div style={{ fontSize:11, color:'#90A4AE', marginTop:2, display:'flex', alignItems:'center', gap:3 }}>
                        <Calendar size={10}/> {fmtDate(a.dateCreation)}
                      </div>
                    </div>
                    {a.statut&&(
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:done?'#E8F5E9':'#F3E5F5', color:done?'#2E7D32':'#6A1B9A' }}>
                        {done?<CheckCircle size={10}/>:<FlaskConical size={10}/>}
                        {a.statut}
                      </span>
                    )}
                    <ChevronRight size={14} color="#B0BEC5"/>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
