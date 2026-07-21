'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Scan, RefreshCw, Plus, Clock, CheckCircle, FileImage, Zap, ChevronRight, X, Calendar, User, AlertTriangle, Search, Save, Play } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type StatutExamen = 'EN_ATTENTE'|'EN_COURS'|'TERMINE'|'VALIDE'|string;
type Examen = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string };
  medecin?:  { id: string; nom: string; prenom: string };
  typeExamen?: string; type?: string;
  regionAnatomique?: string; region?: string;
  statut: StatutExamen;
  dateExamen?: string; date?: string; heure?: string;
  urgence?: boolean; resultat?: string|null;
};
type Stats = { total?: number; enAttente?: number; enCours?: number; termines?: number };
type TypeExamen = { id: string; code?: string; nom: string; modalite?: string; regionAnatomique?: string; prixUnitaire?: number };
type PatientLite = { id: string; ipp?: string; nom: string; prenom: string };

const STATUT_CFG: Record<string,{ label:string; color:string; bg:string; border:string; dot:string; icon:React.ReactNode }> = {
  EN_ATTENTE: { label:'En attente', color:'#C2410C', bg:'#FFF7ED', border:'#FED7AA', dot:'#F97316', icon:<Clock size={11}/> },
  EN_COURS:   { label:'En cours',   color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', dot:'#3B82F6', icon:<RefreshCw size={11}/> },
  TERMINE:    { label:'Terminé',    color:'#0F766E', bg:'#CCFBF1', border:'#99F6E4', dot:'#14B8A6', icon:<CheckCircle size={11}/> },
  VALIDE:     { label:'Validé',     color:'#15803D', bg:'#DCFCE7', border:'#86EFAC', dot:'#22C55E', icon:<CheckCircle size={11}/> },
};

const TYPE_ICONS: Record<string,string> = {
  'Radiographie':'🦴','Radio':'🦴','Scanner':'🔬','TDM':'🔬','IRM':'🧲',
  'Échographie':'〰️','Echo':'〰️','Mammographie':'🎗️','Ostéodensitométrie':'💉',
};

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
function typeLabel(e: Examen) { return e.typeExamen??e.type??'—'; }
function regionLabel(e: Examen) { return e.regionAnatomique??e.region??'—'; }
function patientName(e: Examen) { if(!e.patient) return '—'; return `${e.patient.prenom} ${e.patient.nom}`; }
function fmtDate(iso?: string) {
  if(!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}); } catch { return '—'; }
}
function typeIcon(type: string) {
  const k=Object.keys(TYPE_ICONS).find(k=>type.includes(k));
  return k?TYPE_ICONS[k]:'📷';
}

export default function ImagériePage() {
  const [examens, setExamens]   = useState<Examen[]>([]);
  const [stats, setStats]       = useState<Stats>({});
  const [loading, setLoading]   = useState(true);
  const [filtre, setFiltre]     = useState('TOUS');
  const [selected, setSelected] = useState<Examen|null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);
  const [search, setSearch]     = useState('');

  // ── Création de demande ──────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [types, setTypes]       = useState<TypeExamen[]>([]);
  const [pSearch, setPSearch]   = useState('');
  const [pResults, setPResults] = useState<PatientLite[]>([]);
  const [selPatient, setSelPatient] = useState<PatientLite|null>(null);
  const [selTypeId, setSelTypeId]   = useState('');
  const [region, setRegion]     = useState('');
  const [urgent, setUrgent]     = useState(false);
  const [indication, setIndication] = useState('');
  const [saving, setSaving]     = useState(false);
  const [createErr, setCreateErr] = useState<string|null>(null);
  const pTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Saisie du compte-rendu (panneau détail) ──────────────────────
  const [crConclusion, setCrConclusion] = useState('');
  const [crCompteRendu, setCrCompteRendu] = useState('');
  const [crSaving, setCrSaving] = useState(false);
  const [crErr, setCrErr]       = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eR,sR] = await Promise.allSettled([
        apiClient<any>('/imagerie/examens?limit=100'),
        apiClient<any>('/imagerie/stats/jour'),
      ]);
      if (eR.status==='fulfilled') { const d=eR.value; setExamens(Array.isArray(d)?d:d?.items??d?.data??[]); }
      if (sR.status==='fulfilled') setStats(sR.value??{});
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  // Réinitialise le formulaire de compte-rendu quand on change d'examen sélectionné
  useEffect(()=>{ setCrConclusion(''); setCrCompteRendu(''); setCrErr(null); },[selected?.id]);

  // Catalogue de types (pour le formulaire de création)
  useEffect(()=>{
    apiClient<any>('/imagerie/types-examen')
      .then(d=>setTypes(Array.isArray(d)?d:d?.items??d?.data??[]))
      .catch(()=>setTypes([]));
  },[]);

  // Recherche patient (debounce)
  const searchPatients = useCallback(async (q: string) => {
    try {
      const d = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=6`);
      setPResults(Array.isArray(d)?d:d?.items??d?.data??[]);
    } catch { setPResults([]); }
  }, []);
  useEffect(()=>{
    if (!showCreate) return;
    clearTimeout(pTimer.current);
    pTimer.current = setTimeout(()=>searchPatients(pSearch), 300);
    return ()=>clearTimeout(pTimer.current);
  },[pSearch, showCreate, searchPatients]);

  const resetCreate = () => {
    setSelPatient(null); setSelTypeId(''); setRegion(''); setUrgent(false);
    setIndication(''); setPSearch(''); setPResults([]); setCreateErr(null);
  };

  const openCreate = () => { resetCreate(); setShowCreate(true); searchPatients(''); };

  const submitCreate = async () => {
    if (!selPatient) { setCreateErr('Sélectionnez un patient.'); return; }
    if (!selTypeId)  { setCreateErr('Sélectionnez un type d\'examen.'); return; }
    const me = getCurrentUser();
    if (!me?.id) { setCreateErr('Session invalide, reconnectez-vous.'); return; }
    setSaving(true); setCreateErr(null);
    try {
      await apiClient('/imagerie/demandes', {
        method: 'POST',
        body: {
          patientId: selPatient.id,
          medecinPrescripteurId: me.id,
          typeExamenId: selTypeId,
          regionAnatomique: region || undefined,
          urgence: urgent,
          indicationClinique: indication || undefined,
        },
      });
      setShowCreate(false);
      await load();
    } catch (e: any) {
      setCreateErr(e?.message ?? 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  // Démarrer un examen (EN_ATTENTE → EN_COURS)
  const demarrer = async (ex: Examen) => {
    try {
      await apiClient(`/imagerie/demandes/${ex.id}/statut`, { method:'PATCH', body:{ statut:'EN_COURS' } });
      await load();
      setSelected(s => s && s.id===ex.id ? { ...s, statut:'EN_COURS' } : s);
    } catch { /* silencieux */ }
  };

  // Enregistrer le compte-rendu et valider
  const enregistrerCR = async (ex: Examen) => {
    if (!crConclusion.trim() && !crCompteRendu.trim()) { setCrErr('Saisissez une conclusion ou un compte-rendu.'); return; }
    setCrSaving(true); setCrErr(null);
    try {
      await apiClient(`/imagerie/demandes/${ex.id}/resultat`, {
        method:'POST',
        body:{ conclusion: crConclusion || undefined, compteRendu: crCompteRendu || undefined, valider: true },
      });
      setCrConclusion(''); setCrCompteRendu('');
      await load();
      setSelected(null);
    } catch (e: any) {
      setCrErr(e?.message ?? 'Erreur lors de l\'enregistrement');
    } finally { setCrSaving(false); }
  };

  const filtered = examens.filter(e =>
    (filtre==='TOUS'||e.statut===filtre) &&
    (!search || patientName(e).toLowerCase().includes(search.toLowerCase()) ||
      typeLabel(e).toLowerCase().includes(search.toLowerCase()) ||
      (e.numero??'').toLowerCase().includes(search.toLowerCase()))
  );

  const kpis = [
    { label:'Total du jour', val:stats.total??examens.length, color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', filtre:'TOUS' },
    { label:'En attente',    val:stats.enAttente??examens.filter(e=>e.statut==='EN_ATTENTE').length, color:'#C2410C', bg:'#FFF7ED', border:'#FED7AA', filtre:'EN_ATTENTE' },
    { label:'En cours',      val:stats.enCours??examens.filter(e=>e.statut==='EN_COURS').length, color:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE', filtre:'EN_COURS' },
    { label:'Terminés',      val:stats.termines??examens.filter(e=>['TERMINE','VALIDE'].includes(e.statut)).length, color:'#15803D', bg:'#DCFCE7', border:'#86EFAC', filtre:'TERMINE' },
  ];

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .exam-row:hover{background:#EFF6FF!important;}
        .exam-row.selected{background:#DBEAFE!important;}
        .img-kpi{cursor:pointer;transition:all .15s;}
        .img-kpi:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2)!important;}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#004D40 0%,#00695C 50%,#00897B 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(0,77,64,0.35)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-70, right:220, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Scan size={24} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Imagerie Médicale</h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>
                    {loading?'Chargement…':`${filtered.length} examen(s) affiché(s)`}
                  </span>
                  {lastRefresh&&<span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginLeft:4 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
                </div>
              </div>
            </div>

            {/* KPI pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {kpis.map(k=>{
                const active = filtre===k.filtre;
                return (
                <div key={k.label} className="img-kpi" title={`Filtrer : ${k.label}`}
                  onClick={()=>setFiltre(k.filtre)}
                  style={{ background:active?'rgba(255,255,255,0.24)':'rgba(255,255,255,0.12)', border:`1px solid ${active?'rgba(255,255,255,0.45)':'rgba(255,255,255,0.2)'}`, borderRadius:10, padding:'6px 14px', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18, fontWeight:900, color:'#fff' }}>{loading?'…':k.val}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>{k.label}</span>
                </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={load} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
              <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={openCreate}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', fontSize:13, color:'#004D40', fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> Nouvel examen
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH + FILTRES ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Scan size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher patient, type d'examen…"
            style={{ width:'100%', padding:'9px 12px 9px 32px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['TOUS','EN_ATTENTE','EN_COURS','TERMINE','VALIDE'].map(f=>{
            const cfg=f==='TOUS'?null:STATUT_CFG[f];
            const active=filtre===f;
            return (
              <button key={f} onClick={()=>setFiltre(f)}
                style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${active?(cfg?.border??'#00695C'):'#E0E8F0'}`, background:active?(cfg?.bg??'#CCFBF1'):'#fff', color:active?(cfg?.color??'#00695C'):'#546E7A', fontSize:11, fontWeight:active?800:500, cursor:'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:5 }}>
                {cfg&&active&&<span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>}
                {f==='TOUS'?'Tous':cfg?.label??f}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLE + DETAIL ───────────────────────────────────────── */}
      <div style={{ display:'grid', gap:14, gridTemplateColumns:selected?'1fr 360px':'1fr', alignItems:'start', animation:'fadeUp .25s ease' }}>
        {/* Table */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
              <thead>
                <tr style={{ background:'linear-gradient(135deg,#F0FFFE,#E6FAF7)' }}>
                  {['N°','Patient','Type d\'examen','Région','Médecin','Urgence','Statut',''].map(h=>(
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:6}).map((_,i)=>(
                  <tr key={i} style={{ borderTop:'1px solid #F0F4FA' }}>
                    {Array.from({length:8}).map((_,j)=>(
                      <td key={j} style={{ padding:'12px 14px' }}><div style={{ height:13, background:'#F0F4FA', borderRadius:4, width:j===1?120:70, animation:'pulse 1.5s ease infinite' }}/></td>
                    ))}
                  </tr>
                )) : filtered.length===0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'60px 20px', color:'#90A4AE' }}>
                    <FileImage size={36} style={{ display:'block', margin:'0 auto 12px', color:'#99F6E4' }}/>
                    <p style={{ margin:0, fontSize:13, fontWeight:600 }}>Aucun examen</p>
                  </td></tr>
                ) : filtered.map(e=>{
                  const cfg=STATUT_CFG[e.statut]??STATUT_CFG.EN_ATTENTE;
                  const isSelected=selected?.id===e.id;
                  const nom=patientName(e);
                  const [ac,ab]=aColor(nom);
                  const icon=typeIcon(typeLabel(e));
                  return (
                    <tr key={e.id} className={`exam-row${isSelected?' selected':''}`}
                      onClick={()=>setSelected(isSelected?null:e)}
                      style={{ borderTop:'1px solid #F0F4FA', cursor:'pointer', background:isSelected?'#DBEAFE':'transparent', transition:'background .1s' }}>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:800, color:'#00695C', background:'#CCFBF1', padding:'2px 8px', borderRadius:6 }}>
                          {e.numero??e.id.slice(0,8).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:32, height:32, borderRadius:10, background:ab, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:ac, flexShrink:0 }}>{inits(e.patient)}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{nom}</div>
                            {e.dateExamen&&<div style={{ fontSize:10, color:'#90A4AE', display:'flex', alignItems:'center', gap:3 }}><Calendar size={9}/> {fmtDate(e.dateExamen)}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:15 }}>{icon}</span>
                          <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{typeLabel(e)}</span>
                        </div>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:12, color:'#546E7A' }}>{regionLabel(e)}</td>
                      <td style={{ padding:'11px 14px', fontSize:12, color:'#546E7A', whiteSpace:'nowrap' }}>
                        {e.medecin?<><span style={{ fontWeight:700 }}>Dr.</span> {e.medecin.prenom} {e.medecin.nom}</>:'—'}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        {e.urgence&&(
                          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, fontWeight:800, color:'#DC2626' }}>
                            <Zap size={10} style={{ fill:'#DC2626' }}/> Urgent
                          </span>
                        )}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px' }}><ChevronRight size={13} color={isSelected?'#1D4ED8':'#CBD5E1'}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PANNEAU DÉTAIL ──────────────────────────────────── */}
        {selected&&(()=>{
          const cfg=STATUT_CFG[selected.statut]??STATUT_CFG.EN_ATTENTE;
          const nom=patientName(selected);
          const [ac,ab]=aColor(nom);
          const icon=typeIcon(typeLabel(selected));
          return (
            <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', overflow:'hidden', position:'sticky', top:76, animation:'slideIn .2s ease' }}>
              {/* Header détail */}
              <div style={{ background:'linear-gradient(135deg,#004D40,#00695C)', padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Détail examen</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22 }}>{icon}</span>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{typeLabel(selected)}</div>
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:4, display:'block' }}>
                    {selected.numero??selected.id.slice(0,8).toUpperCase()}
                  </span>
                </div>
                <button onClick={()=>setSelected(null)}
                  style={{ width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.15)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <X size={13}/>
                </button>
              </div>

              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
                {/* Patient */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:ab, borderRadius:10, border:`1px solid ${ac}22` }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{inits(selected.patient)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#1A2332' }}>{nom}</div>
                    <div style={{ fontSize:10, color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}><User size={9}/> Patient</div>
                  </div>
                </div>

                {/* Infos */}
                {[
                  { label:'Région anatomique', val:regionLabel(selected) },
                  { label:'Médecin prescripteur', val:selected.medecin?`Dr. ${selected.medecin.prenom} ${selected.medecin.nom}`:'—' },
                  { label:'Date', val:fmtDate(selected.dateExamen??selected.date) },
                  { label:'Urgence', val:selected.urgence?'Oui':'Non' },
                ].map(row=>(
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F0F4FA' }}>
                    <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:600 }}>{row.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#374151' }}>{row.val}</span>
                  </div>
                ))}

                {/* Statut */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:cfg.bg, borderRadius:10, border:`1px solid ${cfg.border}` }}>
                  <span style={{ fontSize:11, color:cfg.color, fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>Statut</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:800, color:cfg.color }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.dot, display:'inline-block' }}/>
                    {cfg.label}
                  </span>
                </div>

                {/* Résultat */}
                {selected.resultat ? (
                  <div style={{ padding:'12px 14px', background:'#F0FFFE', borderRadius:10, border:'1px solid #99F6E4', borderLeft:'4px solid #00695C' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#00695C', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                      <CheckCircle size={11}/> Résultat
                    </div>
                    <p style={{ margin:0, fontSize:12, color:'#374151', lineHeight:1.6 }}>{selected.resultat}</p>
                  </div>
                ) : (
                  <div style={{ padding:'12px 14px', background:'#FFF7ED', borderRadius:10, border:'1px solid #FED7AA', borderLeft:'4px solid #F97316', display:'flex', alignItems:'center', gap:8 }}>
                    <AlertTriangle size={14} color="#C2410C"/>
                    <span style={{ fontSize:12, color:'#C2410C', fontWeight:600 }}>Résultat en attente</span>
                  </div>
                )}

                {/* ── Actions / saisie du compte-rendu ─────────────── */}
                {selected.statut==='EN_ATTENTE' && (
                  <button onClick={()=>demarrer(selected)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:10, border:'none', background:'#1D4ED8', cursor:'pointer', fontSize:13, color:'#fff', fontWeight:700 }}>
                    <Play size={14}/> Démarrer l'examen
                  </button>
                )}

                {(selected.statut==='EN_COURS' || selected.statut==='TERMINE') && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'12px 14px', background:'#F8FAFC', borderRadius:10, border:'1px solid #E0E8F0' }}>
                    <div style={{ fontSize:10, fontWeight:800, color:'#00695C', textTransform:'uppercase', letterSpacing:'.5px' }}>Compte-rendu radiologique</div>
                    <textarea value={crCompteRendu} onChange={e=>setCrCompteRendu(e.target.value)} placeholder="Compte-rendu détaillé (technique, observations)…"
                      style={{ width:'100%', minHeight:70, padding:'9px 11px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:12, outline:'none', boxSizing:'border-box', color:'#1A2332', resize:'vertical', fontFamily:'inherit' }}/>
                    <textarea value={crConclusion} onChange={e=>setCrConclusion(e.target.value)} placeholder="Conclusion / synthèse…"
                      style={{ width:'100%', minHeight:50, padding:'9px 11px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:12, outline:'none', boxSizing:'border-box', color:'#1A2332', resize:'vertical', fontFamily:'inherit' }}/>
                    {crErr && <span style={{ fontSize:11, color:'#C2410C', fontWeight:600 }}>{crErr}</span>}
                    <button onClick={()=>enregistrerCR(selected)} disabled={crSaving}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px', borderRadius:8, border:'none', background:crSaving?'#94A3B8':'#00695C', cursor:crSaving?'default':'pointer', fontSize:13, color:'#fff', fontWeight:700 }}>
                      <Save size={14}/> {crSaving?'Enregistrement…':'Enregistrer et valider'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── MODALE NOUVEL EXAMEN ─────────────────────────────────── */}
      {showCreate && (
        <div onClick={()=>!saving && setShowCreate(false)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 16px', zIndex:1000, overflowY:'auto' }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:16, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', overflow:'hidden', animation:'fadeUp .2s ease' }}>
            <div style={{ background:'linear-gradient(135deg,#004D40,#00695C)', padding:'18px 22px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Scan size={20} color="#fff"/>
                <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:'#fff' }}>Nouvel examen d'imagerie</h2>
              </div>
              <button onClick={()=>setShowCreate(false)}
                style={{ width:28, height:28, borderRadius:8, border:'1px solid rgba(255,255,255,0.25)', background:'rgba(255,255,255,0.15)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={14}/>
              </button>
            </div>

            <div style={{ padding:'18px 22px', display:'flex', flexDirection:'column', gap:14 }}>
              {/* Patient */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#546E7A', display:'block', marginBottom:6 }}>Patient</label>
                {selPatient ? (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:10, background:'#EFF6FF', border:'1.5px solid #93C5FD' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{selPatient.prenom} {selPatient.nom}</div>
                      <div style={{ fontSize:11, color:'#90A4AE' }}>{selPatient.ipp ?? '—'}</div>
                    </div>
                    <button onClick={()=>setSelPatient(null)}
                      style={{ width:24, height:24, borderRadius:'50%', border:'1px solid #E0E8F0', background:'#fff', cursor:'pointer', color:'#546E7A', fontSize:14 }}>×</button>
                  </div>
                ) : (
                  <>
                    <div style={{ position:'relative', marginBottom:6 }}>
                      <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
                      <input value={pSearch} onChange={e=>setPSearch(e.target.value)} placeholder="Rechercher un patient…"
                        style={{ width:'100%', padding:'9px 11px 9px 30px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:180, overflowY:'auto' }}>
                      {pResults.slice(0,6).map(p=>(
                        <div key={p.id} onClick={()=>setSelPatient(p)}
                          style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #E0E8F0', cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontSize:13 }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background:'#00695C', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
                            {p.prenom.charAt(0)}{p.nom.charAt(0)}
                          </div>
                          <span style={{ fontWeight:600, color:'#1A2332' }}>{p.prenom} {p.nom}</span>
                          <span style={{ fontSize:11, color:'#90A4AE' }}>{p.ipp ?? ''}</span>
                        </div>
                      ))}
                      {pResults.length===0 && <div style={{ fontSize:12, color:'#90A4AE', padding:'8px 4px' }}>Aucun patient trouvé.</div>}
                    </div>
                  </>
                )}
              </div>

              {/* Type d'examen */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#546E7A', display:'block', marginBottom:6 }}>Type d'examen</label>
                <select value={selTypeId} onChange={e=>{
                    const id=e.target.value; setSelTypeId(id);
                    const t=types.find(x=>x.id===id); if(t&&!region) setRegion(t.regionAnatomique??'');
                  }}
                  style={{ width:'100%', padding:'9px 11px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332', background:'#fff' }}>
                  <option value="">— Sélectionner —</option>
                  {types.map(t=>(<option key={t.id} value={t.id}>{t.nom}</option>))}
                </select>
              </div>

              {/* Région */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#546E7A', display:'block', marginBottom:6 }}>Région anatomique</label>
                <input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Ex : Thorax, Crâne…"
                  style={{ width:'100%', padding:'9px 11px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
              </div>

              {/* Indication */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:'#546E7A', display:'block', marginBottom:6 }}>Indication clinique</label>
                <textarea value={indication} onChange={e=>setIndication(e.target.value)} placeholder="Motif / renseignements cliniques…"
                  style={{ width:'100%', minHeight:56, padding:'9px 11px', borderRadius:8, border:'1.5px solid #E0E8F0', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332', resize:'vertical', fontFamily:'inherit' }}/>
              </div>

              {/* Urgence */}
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <button type="button" onClick={()=>setUrgent(!urgent)}
                  style={{ width:44, height:24, borderRadius:12, border:'none', background:urgent?'#DC2626':'#CBD5E1', cursor:'pointer', position:'relative', flexShrink:0 }}>
                  <span style={{ position:'absolute', top:3, left:urgent?23:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                </button>
                <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:urgent?'#DC2626':'#37474F' }}>
                  <Zap size={13}/> Examen urgent
                </span>
              </label>

              {createErr && (
                <div style={{ padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, display:'flex', gap:8, alignItems:'center', color:'#DC2626', fontSize:12 }}>
                  <AlertTriangle size={13}/> {createErr}
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:2 }}>
                <button onClick={()=>setShowCreate(false)}
                  style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', cursor:'pointer', fontSize:13, color:'#546E7A', fontWeight:700 }}>
                  Annuler
                </button>
                <button onClick={submitCreate} disabled={saving}
                  style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px', borderRadius:10, border:'none', background:saving?'#94A3B8':'#00695C', cursor:saving?'default':'pointer', fontSize:13, color:'#fff', fontWeight:800 }}>
                  <Save size={15}/> {saving?'Création…':'Créer la demande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
