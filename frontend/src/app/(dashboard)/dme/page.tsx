'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, FileText, User, ChevronRight, RefreshCw,
  Heart, Stethoscope, Pill, FlaskConical, Calendar, Droplets,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string;
  dateNaissance?: string; sexe?: 'M'|'F'; groupeSanguin?: string; statut?: string;
  telephone?: string;
};

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#1E40AF','#DBEAFE'],
  ['#065F46','#D1FAE5'],['#7C2D12','#FEE2E2'],
];
function aColor(name: string): [string,string] {
  let h=0; for(let i=0;i<name.length;i++) h=((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function calcAge(d?: string) {
  if (!d) return null;
  return Math.floor((Date.now()-new Date(d).getTime())/(365.25*24*3600000));
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return '—'; }
}

const SANG_COLOR: Record<string,[string,string]> = {
  'A+':['#C62828','#FFEBEE'],'A-':['#C62828','#FFEBEE'],
  'B+':['#1565C0','#EFF6FF'],'B-':['#1565C0','#EFF6FF'],
  'AB+':['#6A1B9A','#F3E5F5'],'AB-':['#6A1B9A','#F3E5F5'],
  'O+':['#2E7D32','#E8F5E9'],'O-':['#2E7D32','#E8F5E9'],
};

export default function DMEIndexPage() {
  const router = useRouter();
  const t = useTranslations('dme');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sexeFilter, setSexeFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiClient<any>('/patients?limit=200&statut=actif');
      setPatients(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
    } catch { setPatients([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      (p.ipp??'').toLowerCase().includes(q) ||
      (p.telephone??'').includes(q);
    const matchS = !sexeFilter || p.sexe === sexeFilter;
    return matchQ && matchS;
  });

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .pat-card:hover{box-shadow:0 8px 24px rgba(0,0,0,0.12)!important;transform:translateY(-2px);}
        .dme-stat{cursor:pointer;transition:all .15s;}
        .dme-stat:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2)!important;}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0A2E6E 0%,#1565C0 50%,#00838F 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:20, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(13,71,161,0.3)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-60, right:220, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileText size={24} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('index.heroTitle')}</h1>
              <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                {t('index.heroSubtitle')}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:6 }}>
            {[
              { label:t('index.statPatientsActifs'), val:loading?'…':patients.length, icon:<User size={11}/>, reset:true },
              { label:t('index.statConsultations'), val:t('index.statConsultationsVal'), icon:<Stethoscope size={11}/>, reset:false },
              { label:t('index.statOrdonnances'), val:t('index.statOrdonnancesVal'), icon:<Pill size={11}/>, reset:false },
            ].map((s,i)=>(
              <div key={i} className={s.reset?'dme-stat':undefined}
                title={s.reset?t('index.showAllActive'):undefined}
                onClick={s.reset?()=>{ setSearch(''); setSexeFilter(''); load(); }:undefined}
                style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'5px 12px' }}>
                <span style={{ color:'rgba(255,255,255,0.7)' }}>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{s.val}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ICÔNES MODULE ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:20 }}>
        {[
          { label:t('index.modAntecedents'),   icon:<Heart size={20}/>,        color:'#C62828', bg:'#FFEBEE', border:'#FFCDD2' },
          { label:t('index.modConsultations'), icon:<Stethoscope size={20}/>,  color:'#1565C0', bg:'#EFF6FF', border:'#BBDEFB' },
          { label:t('index.modOrdonnances'),   icon:<Pill size={20}/>,          color:'#2E7D32', bg:'#E8F5E9', border:'#C8E6C9' },
          { label:t('index.modAnalysesLabo'), icon:<FlaskConical size={20}/>,  color:'#6A1B9A', bg:'#F3E5F5', border:'#E1BEE7' },
          { label:t('index.modDocuments'),     icon:<FileText size={20}/>,      color:'#00695C', bg:'#E0F2F1', border:'#80CBC4' },
          { label:t('index.modRendezVous'),   icon:<Calendar size={20}/>,      color:'#E65100', bg:'#FFF3E0', border:'#FFCC80' },
        ].map(m=>(
          <div key={m.label} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', border:`1.5px solid ${m.border}`, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:m.bg, display:'flex', alignItems:'center', justifyContent:'center', color:m.color, flexShrink:0 }}>{m.icon}</div>
            <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── SEARCH ───────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t('index.searchPlaceholder')}
            style={{ width:'100%', padding:'10px 14px 10px 36px', borderRadius:11, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}/>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[{val:'',label:t('index.filterAll')},{val:'M',label:t('index.filterMen')},{val:'F',label:t('index.filterWomen')}].map(s=>(
            <button key={s.val} onClick={()=>setSexeFilter(s.val)}
              style={{ padding:'8px 14px', borderRadius:20, border:`1.5px solid ${sexeFilter===s.val?'#1565C0':'#E0E8F0'}`, background:sexeFilter===s.val?'#1565C0':'#fff', color:sexeFilter===s.val?'#fff':'#546E7A', fontSize:12, fontWeight:sexeFilter===s.val?700:500, cursor:'pointer' }}>
              {s.label}
            </button>
          ))}
          <button onClick={load}
            style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', cursor:'pointer', color:'#546E7A', display:'flex', alignItems:'center' }}>
            <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
          </button>
        </div>
      </div>

      {/* Résultats count */}
      {!loading&&(
        <div style={{ fontSize:12, color:'#90A4AE', fontWeight:600, marginBottom:10 }}>
          {t('index.foundCount', { count: filtered.length })}
        </div>
      )}

      {/* ── GRILLE PATIENTS ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} style={{ height:120, background:'linear-gradient(135deg,#F0F4FA,#E8EEF6)', borderRadius:14, animation:'pulse 1.5s ease infinite' }}/>
          ))}
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
          <User size={40} style={{ color:'#BBDEFB', display:'block', margin:'0 auto 12px' }}/>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#37474F' }}>{t('index.emptyTitle')}</p>
          <p style={{ margin:'6px 0 0', fontSize:12, color:'#90A4AE' }}>
            {search ? t('index.emptyNoResult', { search }) : t('index.emptyNoActive')}
          </p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, animation:'fadeUp .25s ease' }}>
          {filtered.map(p=>{
            const [ac,ab]=aColor(`${p.prenom}${p.nom}`);
            const inits=`${p.prenom?.charAt(0)??''}${p.nom?.charAt(0)??''}`.toUpperCase();
            const age=calcAge(p.dateNaissance);
            const [sc,sb]=SANG_COLOR[p.groupeSanguin??'']??['#546E7A','#ECEFF1'];
            return (
              <div key={p.id} className="pat-card"
                onClick={()=>router.push(`/dme/${p.id}`)}
                style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 8px rgba(0,0,0,0.08)', cursor:'pointer', transition:'all .2s', border:'1.5px solid #E8EEFA', display:'flex', gap:14, alignItems:'flex-start' }}>

                {/* Avatar */}
                <div style={{ width:46, height:46, borderRadius:13, background:`linear-gradient(135deg,${ab},${ac}22)`, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, color:ac, flexShrink:0, letterSpacing:'.5px' }}>
                  {inits}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#1A2332', lineHeight:1.2 }}>
                      {p.prenom} {p.nom}
                    </div>
                    <ChevronRight size={15} color="#B0BEC5" style={{ flexShrink:0 }}/>
                  </div>

                  <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
                    {p.ipp&&(
                      <span style={{ fontSize:9, fontWeight:700, color:'#90A4AE', background:'#F8FAFC', padding:'2px 7px', borderRadius:5, border:'1px solid #E8EEFA', fontFamily:'monospace' }}>
                        {p.ipp}
                      </span>
                    )}
                    <span style={{ fontSize:10, fontWeight:600, color:'#546E7A' }}>
                      {p.sexe==='M'?'♂':'♀'} {age?t('index.ageYears', { age }):''}
                    </span>
                    {p.groupeSanguin&&(
                      <span style={{ fontSize:10, fontWeight:800, color:sc, background:sb, padding:'1px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:3 }}>
                        <Droplets size={8}/> {p.groupeSanguin}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop:8, display:'flex', gap:8 }}>
                    {[
                      { icon:<Stethoscope size={11}/>, label:t('index.badgeConsultations'), color:'#1565C0', bg:'#EFF6FF' },
                      { icon:<Pill size={11}/>,         label:t('index.badgeOrdonnances'),  color:'#2E7D32', bg:'#E8F5E9' },
                      { icon:<FlaskConical size={11}/>, label:t('index.badgeAnalyses'),     color:'#6A1B9A', bg:'#F3E5F5' },
                    ].map(m=>(
                      <span key={m.label} style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:8, background:m.bg, color:m.color }}>
                        {m.icon} {m.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
