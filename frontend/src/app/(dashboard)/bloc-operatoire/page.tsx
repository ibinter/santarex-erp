'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Scissors, Clock, CheckCircle, Plus, Calendar, AlertTriangle, RefreshCw, Play, Square, X, Loader2, Wrench } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

// ── Types (miroir des entités backend) ──────────────────────────────────────
type StatutSalle = 'disponible' | 'occupee' | 'nettoyage' | 'maintenance';
type StatutIntervention = 'programmee' | 'en_cours' | 'terminee' | 'annulee';

interface Salle {
  id: string;
  nom: string;
  type: string;
  statut: StatutSalle;
  estActive: boolean;
}
interface Intervention {
  id: string;
  numero: string;
  patientId: string;
  chirurgienId: string;
  anesthesisteId?: string | null;
  salleId: string;
  typeIntervention: string;
  dateHeurePrevue: string;
  dureeEstimee: number;
  urgence: boolean;
  statut: StatutIntervention;
  dateHeureDebut?: string | null;
  dateHeureFin?: string | null;
  compteRendu?: string | null;
}
interface Stats {
  salles: { total: number; disponibles: number; occupees: number; nettoyage: number; maintenance: number };
  interventions: { programmeesJour: number; enCours: number; dureeMoyenneMin: number };
}
interface NamedRef { id: string; nom: string; prenom: string }

const SALLE_CFG: Record<StatutSalle, { label: string; color: string; bg: string; border: string; headerBg: string }> = {
  occupee:     { label:'Occupée',    color:'#1D4ED8', bg:'#EFF6FF', border:'#93C5FD', headerBg:'linear-gradient(135deg,#1E40AF,#1D4ED8)' },
  disponible:  { label:'Disponible', color:'#15803D', bg:'#F0FDF4', border:'#86EFAC', headerBg:'linear-gradient(135deg,#166534,#15803D)' },
  nettoyage:   { label:'Nettoyage',  color:'#475569', bg:'#F8FAFC', border:'#CBD5E1', headerBg:'linear-gradient(135deg,#334155,#475569)' },
  maintenance: { label:'Maintenance',color:'#B45309', bg:'#FFFBEB', border:'#FCD34D', headerBg:'linear-gradient(135deg,#92400E,#B45309)' },
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
  const p=nom.trim().split(' '); return ((p[0]?.charAt(0)??'')+(p[p.length-1]?.charAt(0)??'')).toUpperCase() || '?';
}
function hhmm(iso?: string | null) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}
function progression(debut?: string | null, dureeMin?: number) {
  if (!debut || !dureeMin) return null;
  const elapsed = Math.floor((Date.now()-new Date(debut).getTime())/60000);
  const pct = Math.min(100, Math.max(0, Math.round((elapsed/dureeMin)*100)));
  return { elapsed, dureeMin, pct };
}

export default function BlocOperatoirePage() {
  const t = useTranslations('blocOperatoire');
  const [tab, setTab] = useState<'salles'|'programme'>('salles');
  const [now, setNow] = useState(new Date());

  const [salles, setSalles] = useState<Salle[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [patientNames, setPatientNames] = useState<Record<string,string>>({});
  const [medecinNames, setMedecinNames] = useState<Record<string,string>>({});

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),10000); return()=>clearInterval(t); },[]);

  // ── Résolution des noms (patients via /patients, médecins via /users) ──────
  const resolveNames = useCallback(async (items: Intervention[]) => {
    const patientIds = Array.from(new Set(items.map(i=>i.patientId).filter(Boolean)));
    const userIds = Array.from(new Set(
      items.flatMap(i=>[i.chirurgienId, i.anesthesisteId]).filter((v): v is string => !!v)
    ));

    // Patients : résolution individuelle comme les autres modules
    await Promise.all(patientIds.map(async id => {
      try {
        const p = await apiClient<any>(`/patients/${id}`);
        const d = p?.data ?? p;
        if (d?.nom) setPatientNames(prev => ({ ...prev, [id]: `${d.prenom??''} ${d.nom}`.trim() }));
      } catch { /* nom non résolu : id tronqué affiché */ }
    }));

    // Médecins / anesthésistes : liste des utilisateurs (best-effort)
    if (userIds.length) {
      try {
        const u = await apiClient<any>(`/users?role=medecin`);
        const list: NamedRef[] = Array.isArray(u) ? u : (u?.items ?? u?.data ?? []);
        const map: Record<string,string> = {};
        list.forEach(m => { map[m.id] = `Dr. ${m.prenom??''} ${m.nom??''}`.trim(); });
        setMedecinNames(prev => ({ ...prev, ...map }));
      } catch { /* liste non accessible : id tronqué affiché */ }
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [planning, st] = await Promise.all([
        apiClient<{ salles: Salle[]; interventions: Intervention[] }>('/bloc-operatoire/planning'),
        apiClient<Stats>('/bloc-operatoire/stats'),
      ]);
      setSalles(planning.salles ?? []);
      setInterventions(planning.interventions ?? []);
      setStats(st);
      resolveNames(planning.interventions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('erreurChargement'));
    } finally {
      setLoading(false);
    }
  }, [resolveNames]);

  useEffect(()=>{ load(); }, [load]);

  const patientNom = (id: string) => patientNames[id] ?? t('patientFallback', { id: id.slice(0,6) });
  const medecinNom = (id?: string | null) => (id ? (medecinNames[id] ?? `Dr. ${id.slice(0,6)}`) : '—');

  // ── Actions ────────────────────────────────────────────────────────────────
  const changerStatut = async (interv: Intervention, statut: StatutIntervention) => {
    if (statut === 'annulee' && !window.confirm(t('confirmAnnuler', { numero: interv.numero }))) return;
    let compteRendu: string | undefined;
    if (statut === 'terminee') {
      const cr = window.prompt(t('promptCompteRendu'), '');
      if (cr === null) return; // annulé
      compteRendu = cr.trim() || undefined;
    }
    setBusyId(interv.id);
    try {
      await apiClient(`/bloc-operatoire/interventions/${interv.id}/statut`, {
        method: 'PATCH',
        body: compteRendu !== undefined ? { statut, compteRendu } : { statut },
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('actionImpossible'));
    } finally {
      setBusyId(null);
    }
  };

  const disponibles = stats?.salles.disponibles ?? salles.filter(s=>s.statut==='disponible').length;
  const enCours     = stats?.interventions.enCours ?? interventions.filter(i=>i.statut==='en_cours').length;
  const programmees = stats?.interventions.programmeesJour ?? interventions.filter(i=>i.statut==='programmee').length;
  const moyDuree    = stats?.interventions.dureeMoyenneMin ?? 0;
  const totalSalles = stats?.salles.total ?? salles.length;

  const interventionsSalle = (salleId: string) =>
    interventions.filter(i=>i.salleId===salleId);

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
        .bloc-btn:disabled{opacity:.5;cursor:not-allowed;}
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
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('title')}</h1>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:600, marginTop:2 }}>
                  {t('subtitle')}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(0,0,0,0.2)', borderRadius:8, padding:'5px 12px', width:'fit-content', border:'1px solid rgba(255,255,255,0.15)' }}>
              <Clock size={11} color="rgba(255,255,255,0.7)"/>
              <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', fontFamily:'monospace' }}>
                {now.toLocaleString('fr-FR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>{ setTab('programme'); load(); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', fontSize:13, color:'#fff', fontWeight:700 }}>
              <Calendar size={14}/> {t('programme')}
            </button>
            <button onClick={()=>setModalOpen(true)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', fontSize:13, color:'#1A237E', fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> {t('nouvelleIntervention')}
            </button>
          </div>
        </div>

        {/* KPIs inline */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:18, position:'relative', zIndex:1 }}>
          {[
            { label:t('kpiSallesDisponibles'), val:`${disponibles}/${totalSalles||0}`, icon:<CheckCircle size={16}/>, color:'#BBF7D0', tab:'salles' as const },
            { label:t('kpiEnCours'),           val:`${enCours}`,       icon:<Scissors size={16}/>,    color:'#BAE6FD', tab:'salles' as const },
            { label:t('kpiProgrammees'),        val:`${programmees}`,   icon:<Calendar size={16}/>,    color:'#FED7AA', tab:'programme' as const },
            { label:t('kpiDureeMoyenne'),      val:`${moyDuree}min`,   icon:<Clock size={16}/>,       color:'#E9D5FF', tab:'programme' as const },
          ].map((k,i)=>(
            <div key={i} className="bloc-kpi" title={t('voir',{label:k.label})} onClick={()=>setTab(k.tab)}
              style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.18)', backdropFilter:'blur(8px)' }}>
              <div style={{ color:k.color, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#fff', lineHeight:1 }}>{k.val}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:4, fontWeight:600 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS + refresh ───────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:12, padding:5, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', width:'fit-content' }}>
          {[{id:'salles' as const,label:t('tabSalles')},{id:'programme' as const,label:t('tabProgramme',{count:interventions.length})}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:'9px 20px', borderRadius:9, border:'none', background:tab===t.id?'linear-gradient(135deg,#1A237E,#1D4ED8)':'transparent', color:tab===t.id?'#fff':'#546E7A', fontSize:13, fontWeight:tab===t.id?700:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="bloc-btn" disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:10, border:'1px solid #E0E8F0', background:'#fff', cursor:'pointer', fontSize:12, color:'#1A237E', fontWeight:700 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> {t('actualiser')}
        </button>
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      {loading && !salles.length && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, color:'#90A4AE', gap:10 }}>
          <Loader2 size={22} style={{ animation:'spin 1s linear infinite' }}/> {t('chargement')}
        </div>
      )}

      {/* ── VUE SALLES ──────────────────────────────────────────── */}
      {tab==='salles' && !loading && !salles.length && (
        <div style={{ textAlign:'center', padding:60, color:'#90A4AE', background:'#fff', borderRadius:14, border:'1px dashed #CBD5E1' }}>
          <Scissors size={34} color="#CBD5E1" style={{ marginBottom:10 }}/>
          <p style={{ margin:0, fontWeight:700, color:'#546E7A' }}>{t('aucuneSalle')}</p>
          <p style={{ margin:'6px 0 0', fontSize:12 }}>{t('aucuneSalleAide')}</p>
        </div>
      )}

      {tab==='salles' && salles.length>0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, animation:'fadeUp .25s ease' }}>
          {salles.map(s=>{
            const cfg=SALLE_CFG[s.statut];
            const list=interventionsSalle(s.id);
            const enCoursInt=list.find(i=>i.statut==='en_cours');
            const prochaine=list.filter(i=>i.statut==='programmee').sort((a,b)=>+new Date(a.dateHeurePrevue)-+new Date(b.dateHeurePrevue))[0];
            const affiche=enCoursInt ?? (s.statut!=='nettoyage' && s.statut!=='maintenance' ? prochaine : undefined);
            const prog=enCoursInt ? progression(enCoursInt.dateHeureDebut, enCoursInt.dureeEstimee) : null;
            return (
              <div key={s.id} className="salle-card"
                style={{ borderRadius:16, border:`2px solid ${cfg.border}`, background:'#fff', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', transition:'all .2s' }}>
                <div style={{ background:cfg.headerBg, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>{s.nom}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginTop:2 }}>{s.type}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.25)' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.statut==='occupee'?'#4ADE80':'rgba(255,255,255,0.6)', display:'inline-block', animation:s.statut==='occupee'?'pulse 1.5s infinite':'none' }}/>
                    <span style={{ fontSize:11, fontWeight:800, color:'#fff' }}>{t(`statutSalle.${s.statut}`)}</span>
                  </div>
                </div>

                <div style={{ padding:'16px 18px', minHeight:100 }}>
                  {!affiche && s.statut==='disponible' && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:80, gap:8 }}>
                      <CheckCircle size={28} color="#22C55E"/>
                      <p style={{ margin:0, fontSize:13, color:'#15803D', fontWeight:700 }}>{t('salleDisponible')}</p>
                      <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{t('aucuneInterventionPlanifiee')}</p>
                    </div>
                  )}
                  {s.statut==='nettoyage' && !enCoursInt && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:80, gap:8 }}>
                      <RefreshCw size={24} color="#94A3B8" style={{ animation:'spin 3s linear infinite' }}/>
                      <p style={{ margin:0, fontSize:13, color:'#475569', fontWeight:700 }}>{t('nettoyageEnCours')}</p>
                      <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{t('salleBientotDisponible')}</p>
                    </div>
                  )}
                  {s.statut==='maintenance' && !enCoursInt && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:80, gap:8 }}>
                      <Wrench size={24} color="#B45309"/>
                      <p style={{ margin:0, fontSize:13, color:'#92400E', fontWeight:700 }}>{t('enMaintenance')}</p>
                      <p style={{ margin:0, fontSize:11, color:'#9CA3AF' }}>{t('salleIndisponible')}</p>
                    </div>
                  )}

                  {affiche && (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Scissors size={16} color={cfg.color}/>
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:800, color:'#1A2332' }}>{affiche.typeIntervention}</div>
                          <div style={{ fontSize:11, color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={10}/> {hhmm(affiche.dateHeurePrevue)} — ~{affiche.dureeEstimee}min
                          </div>
                        </div>
                      </div>

                      {(()=>{ const nom=patientNom(affiche.patientId); const [ac,ab]=aColor(nom);
                        return (
                          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:ab, borderRadius:10, border:`1px solid ${ac}22` }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:ac, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0 }}>{inits(nom)}</div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:'#1A2332' }}>{nom}</div>
                              <div style={{ fontSize:10, color:'#6B7280' }}>{medecinNom(affiche.chirurgienId)}</div>
                            </div>
                          </div>
                        );
                      })()}

                      {prog && (
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:9, color:'#6B7280', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px' }}>{t('progression')}</span>
                            <span style={{ fontSize:10, fontWeight:800, color:prog.pct>90?'#DC2626':cfg.color }}>{prog.elapsed}min / {prog.dureeMin}min</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:'#E2E8F0', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${prog.pct}%`, background:prog.pct>90?'#EF4444':cfg.headerBg, borderRadius:3, transition:'width .5s' }}/>
                          </div>
                          <div style={{ fontSize:9, color:'#9CA3AF', textAlign:'right', marginTop:3 }}>{t('pctEcoule',{pct:prog.pct})}</div>
                        </div>
                      )}

                      {/* Actions salle */}
                      {enCoursInt ? (
                        <button className="bloc-btn" disabled={busyId===enCoursInt.id} onClick={()=>changerStatut(enCoursInt,'terminee')}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'#15803D', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          {busyId===enCoursInt.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Square size={13}/>} {t('terminerIntervention')}
                        </button>
                      ) : affiche.statut==='programmee' && (
                        <button className="bloc-btn" disabled={busyId===affiche.id} onClick={()=>changerStatut(affiche,'en_cours')}
                          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:9, border:'none', background:'#1D4ED8', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                          {busyId===affiche.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Play size={13}/>} {t('demarrerIntervention')}
                        </button>
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
      {tab==='programme' && !loading && (
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
          <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,#F0F4FF,#E8EEFF)', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #E8EEFA' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Calendar size={16} color="#1A237E"/>
              <span style={{ fontSize:13, fontWeight:800, color:'#1A237E' }}>{t('programmeDu',{date:now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})})}</span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#6B7280', background:'#fff', padding:'3px 10px', borderRadius:20, border:'1px solid #E0E8F0' }}>{t('nbInterventions',{count:interventions.length})}</span>
          </div>
          {interventions.length===0 ? (
            <div style={{ textAlign:'center', padding:50, color:'#90A4AE' }}>
              <Calendar size={30} color="#CBD5E1" style={{ marginBottom:8 }}/>
              <p style={{ margin:0, fontWeight:700, color:'#546E7A' }}>{t('aucuneInterventionJour')}</p>
              <button onClick={()=>setModalOpen(true)} style={{ marginTop:12, padding:'8px 18px', borderRadius:9, border:'none', background:'#1A237E', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
                <Plus size={13}/> {t('programmerIntervention')}
              </button>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {[t('thHeure'),t('thSalle'),t('thIntervention'),t('thPatient'),t('thChirurgien'),t('thAnesthesiste'),t('thDuree'),t('thStatut'),t('thActions')].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...interventions].sort((a,b)=>+new Date(a.dateHeurePrevue)-+new Date(b.dateHeurePrevue)).map(p=>{
                    const salle=salles.find(s=>s.id===p.salleId);
                    const scfg=SALLE_CFG[salle?.statut ?? 'disponible'];
                    const nom=patientNom(p.patientId);
                    const [ac,ab]=aColor(nom);
                    const stCfg: Record<StatutIntervention,{label:string;bg:string;color:string}> = {
                      programmee:{label:t('statutIntervention.programmee'),bg:'#FFF7ED',color:'#C2410C'},
                      en_cours:  {label:t('statutIntervention.en_cours'),  bg:'#EFF6FF',color:'#1D4ED8'},
                      terminee:  {label:t('statutIntervention.terminee'),  bg:'#F0FDF4',color:'#15803D'},
                      annulee:   {label:t('statutIntervention.annulee'),   bg:'#FEF2F2',color:'#B91C1C'},
                    };
                    const st=stCfg[p.statut];
                    return (
                      <tr key={p.id} className="prog-row" style={{ borderTop:'1px solid #F0F4FA', transition:'background .1s' }}>
                        <td style={{ padding:'13px 14px', fontWeight:900, color:'#1A2332', fontSize:15, fontFamily:'monospace', whiteSpace:'nowrap' }}>{hhmm(p.dateHeurePrevue)}</td>
                        <td style={{ padding:'13px 14px' }}>
                          <span style={{ fontWeight:700, fontSize:12, padding:'3px 10px', borderRadius:8, background:scfg.bg, color:scfg.color, border:`1px solid ${scfg.border}` }}>{salle?.nom ?? '—'}</span>
                        </td>
                        <td style={{ padding:'13px 14px', fontSize:13, color:'#1A2332', fontWeight:700 }}>
                          {p.typeIntervention}
                          <span style={{ display:'block', fontSize:10, color:'#9CA3AF', fontWeight:600, fontFamily:'monospace' }}>{p.numero}</span>
                        </td>
                        <td style={{ padding:'13px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:8, background:ab, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:ac, flexShrink:0 }}>{inits(nom)}</div>
                            <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{nom}</span>
                          </div>
                        </td>
                        <td style={{ padding:'13px 14px', fontSize:12, color:'#546E7A' }}>{medecinNom(p.chirurgienId)}</td>
                        <td style={{ padding:'13px 14px', fontSize:12, color:'#546E7A' }}>{medecinNom(p.anesthesisteId)}</td>
                        <td style={{ padding:'13px 14px', fontSize:12, fontWeight:700, color:'#374151', fontFamily:'monospace' }}>{p.dureeEstimee}min</td>
                        <td style={{ padding:'13px 14px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:st.bg, color:st.color }}>
                            {p.urgence && p.statut==='programmee' ? <><AlertTriangle size={9}/> {t('urgence')}</> : st.label}
                          </span>
                        </td>
                        <td style={{ padding:'13px 14px', whiteSpace:'nowrap' }}>
                          {p.statut==='programmee' && (
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="bloc-btn" disabled={busyId===p.id} onClick={()=>changerStatut(p,'en_cours')}
                                style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'none', background:'#1D4ED8', color:'#fff', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                                <Play size={11}/> {t('demarrer')}
                              </button>
                              <button className="bloc-btn" disabled={busyId===p.id} onClick={()=>changerStatut(p,'annulee')}
                                style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'1px solid #FECACA', background:'#fff', color:'#B91C1C', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                                <X size={11}/> {t('annulerAction')}
                              </button>
                            </div>
                          )}
                          {p.statut==='en_cours' && (
                            <button className="bloc-btn" disabled={busyId===p.id} onClick={()=>changerStatut(p,'terminee')}
                              style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:7, border:'none', background:'#15803D', color:'#fff', fontWeight:700, fontSize:11, cursor:'pointer' }}>
                              <Square size={11}/> {t('terminer')}
                            </button>
                          )}
                          {(p.statut==='terminee'||p.statut==='annulee') && (
                            <span style={{ fontSize:11, color:'#9CA3AF' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <NouvelleInterventionModal
          salles={salles.filter(s=>s.statut!=='maintenance')}
          onClose={()=>setModalOpen(false)}
          onCreated={()=>{ setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modale : Nouvelle intervention
// ─────────────────────────────────────────────────────────────────────────────
interface PatientLite { id: string; nom: string; prenom: string; ipp?: string }
interface MedecinLite { id: string; nom: string; prenom: string; specialite?: string }

function NouvelleInterventionModal({ salles, onClose, onCreated }: {
  salles: Salle[]; onClose: ()=>void; onCreated: ()=>void;
}) {
  const t = useTranslations('blocOperatoire');
  const [patientQ, setPatientQ] = useState('');
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [patient, setPatient] = useState<PatientLite | null>(null);

  const [medecinQ, setMedecinQ] = useState('');
  const [medecins, setMedecins] = useState<MedecinLite[]>([]);
  const [chirurgien, setChirurgien] = useState<MedecinLite | null>(null);
  const [anesthesiste, setAnesthesiste] = useState<MedecinLite | null>(null);

  const [salleId, setSalleId] = useState('');
  const [typeIntervention, setTypeIntervention] = useState('');
  const [dateHeurePrevue, setDateHeurePrevue] = useState('');
  const [dureeEstimee, setDureeEstimee] = useState('60');
  const [urgence, setUrgence] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pTimer = useRef<ReturnType<typeof setTimeout>>();
  const mTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchPatients = useCallback(async (q: string) => {
    try {
      const d = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=8`);
      const list = Array.isArray(d) ? d : (d?.items ?? d?.data ?? []);
      setPatients(list);
    } catch { setPatients([]); }
  }, []);
  const searchMedecins = useCallback(async (q: string) => {
    try {
      const d = await apiClient<any>(`/users?role=medecin&q=${encodeURIComponent(q)}&limit=8`);
      const list = Array.isArray(d) ? d : (d?.items ?? d?.data ?? []);
      setMedecins(list);
    } catch { setMedecins([]); }
  }, []);

  useEffect(()=>{ clearTimeout(pTimer.current); pTimer.current=setTimeout(()=>searchPatients(patientQ),300); return()=>clearTimeout(pTimer.current); },[patientQ,searchPatients]);
  useEffect(()=>{ clearTimeout(mTimer.current); mTimer.current=setTimeout(()=>searchMedecins(medecinQ),300); return()=>clearTimeout(mTimer.current); },[medecinQ,searchMedecins]);
  useEffect(()=>{ searchPatients(''); searchMedecins(''); },[searchPatients,searchMedecins]);

  const canSubmit = patient && chirurgien && salleId && typeIntervention.trim() && dateHeurePrevue && Number(dureeEstimee)>0;

  const submit = async () => {
    if (!canSubmit || !patient || !chirurgien) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient('/bloc-operatoire/interventions', {
        method:'POST',
        body: {
          patientId: patient.id,
          chirurgienId: chirurgien.id,
          anesthesisteId: anesthesiste?.id,
          salleId,
          typeIntervention: typeIntervention.trim(),
          dateHeurePrevue: new Date(dateHeurePrevue).toISOString(),
          dureeEstimee: Number(dureeEstimee),
          urgence,
        },
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('creationImpossible'));
    } finally {
      setSubmitting(false);
    }
  };

  const lbl: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 };
  const inp: React.CSSProperties = { width:'100%', border:'1px solid #D1D9E6', borderRadius:9, padding:'9px 12px', fontSize:13, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(3px)', padding:16 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:640, maxHeight:'94vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', background:'linear-gradient(135deg,#1A237E,#1D4ED8)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Scissors size={20} color="#fff"/>
            <h2 style={{ margin:0, color:'#fff', fontSize:16, fontWeight:800 }}>{t('nouvelleIntervention')}</h2>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
        </div>

        <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
          {err && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'10px 14px', borderRadius:9, fontSize:12, fontWeight:600 }}>{err}</div>}

          {/* Patient */}
          <div>
            <label style={lbl}>{t('labelPatient')} <span style={{ color:'#DC2626' }}>*</span></label>
            {patient ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', border:'1px solid #93C5FD', background:'#EFF6FF', borderRadius:9 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{patient.prenom} {patient.nom}{patient.ipp?` · ${patient.ipp}`:''}</span>
                <button onClick={()=>setPatient(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><X size={15}/></button>
              </div>
            ) : (
              <>
                <input style={inp} placeholder={t('rechercherPatientIpp')} value={patientQ} onChange={e=>setPatientQ(e.target.value)} />
                {patients.length>0 && (
                  <div style={{ marginTop:6, border:'1px solid #E5E9F0', borderRadius:9, maxHeight:150, overflowY:'auto' }}>
                    {patients.map(p=>(
                      <div key={p.id} onClick={()=>{ setPatient(p); setPatientQ(''); }} style={{ padding:'8px 12px', cursor:'pointer', fontSize:13, borderBottom:'1px solid #F1F5F9' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#F0F4FF')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                        <b>{p.prenom} {p.nom}</b>{p.ipp?<span style={{ color:'#9CA3AF' }}> · {p.ipp}</span>:null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Chirurgien */}
          <div>
            <label style={lbl}>{t('labelChirurgien')} <span style={{ color:'#DC2626' }}>*</span></label>
            {chirurgien ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', border:'1px solid #93C5FD', background:'#EFF6FF', borderRadius:9 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>Dr. {chirurgien.prenom} {chirurgien.nom}</span>
                <button onClick={()=>setChirurgien(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><X size={15}/></button>
              </div>
            ) : (
              <>
                <input style={inp} placeholder={t('rechercherMedecin')} value={medecinQ} onChange={e=>setMedecinQ(e.target.value)} />
                {medecins.length>0 && (
                  <div style={{ marginTop:6, border:'1px solid #E5E9F0', borderRadius:9, maxHeight:130, overflowY:'auto' }}>
                    {medecins.map(m=>(
                      <div key={m.id} onClick={()=>{ setChirurgien(m); setMedecinQ(''); }} style={{ padding:'8px 12px', cursor:'pointer', fontSize:13, borderBottom:'1px solid #F1F5F9' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#F0F4FF')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>
                        <b>Dr. {m.prenom} {m.nom}</b>{m.specialite?<span style={{ color:'#9CA3AF' }}> · {m.specialite}</span>:null}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Anesthésiste (optionnel) */}
          <div>
            <label style={lbl}>{t('labelAnesthesiste')} <span style={{ color:'#9CA3AF', fontWeight:500 }}>{t('optionnel')}</span></label>
            {anesthesiste ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', border:'1px solid #C4B5FD', background:'#F5F3FF', borderRadius:9 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>Dr. {anesthesiste.prenom} {anesthesiste.nom}</span>
                <button onClick={()=>setAnesthesiste(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><X size={15}/></button>
              </div>
            ) : (
              <select style={inp} value="" onChange={e=>{ const m=medecins.find(x=>x.id===e.target.value); if(m) setAnesthesiste(m); }}>
                <option value="">{t('selectionnerMedecin')}</option>
                {medecins.map(m=><option key={m.id} value={m.id}>Dr. {m.prenom} {m.nom}</option>)}
              </select>
            )}
          </div>

          {/* Salle + type */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={lbl}>{t('labelSalle')} <span style={{ color:'#DC2626' }}>*</span></label>
              <select style={inp} value={salleId} onChange={e=>setSalleId(e.target.value)}>
                <option value="">{t('choisirSalle')}</option>
                {salles.map(s=><option key={s.id} value={s.id}>{s.nom} · {s.type}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>{t('labelTypeIntervention')} <span style={{ color:'#DC2626' }}>*</span></label>
              <input style={inp} placeholder={t('placeholderType')} value={typeIntervention} onChange={e=>setTypeIntervention(e.target.value)} />
            </div>
          </div>

          {/* Date + durée */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 130px', gap:14 }}>
            <div>
              <label style={lbl}>{t('labelDateHeure')} <span style={{ color:'#DC2626' }}>*</span></label>
              <input type="datetime-local" style={inp} value={dateHeurePrevue} onChange={e=>setDateHeurePrevue(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>{t('labelDuree')} <span style={{ color:'#DC2626' }}>*</span></label>
              <input type="number" min={1} style={inp} value={dureeEstimee} onChange={e=>setDureeEstimee(e.target.value)} />
            </div>
          </div>

          {/* Urgence */}
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#374151', fontWeight:600 }}>
            <input type="checkbox" checked={urgence} onChange={e=>setUrgence(e.target.checked)} style={{ width:16, height:16 }} />
            <AlertTriangle size={14} color="#DC2626" /> {t('marquerUrgente')}
          </label>
        </div>

        <div style={{ display:'flex', gap:10, padding:'16px 22px', borderTop:'1px solid #EEF2F7' }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1.5px solid #D1D9E6', background:'#fff', color:'#546E7A', fontWeight:700, fontSize:13, cursor:'pointer' }}>{t('annuler')}</button>
          <button onClick={submit} disabled={!canSubmit||submitting}
            style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background: (!canSubmit||submitting) ? '#9FA8DA' : 'linear-gradient(135deg,#1A237E,#1D4ED8)', color:'#fff', fontWeight:800, fontSize:13, cursor:(!canSubmit||submitting)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {submitting ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> {t('programmation')}</> : <><Plus size={15}/> {t('programmerLIntervention')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
