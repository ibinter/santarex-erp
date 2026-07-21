'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Users, UserPlus, Search, RefreshCw, Eye, Edit,
  Download, ChevronLeft, ChevronRight, Filter, X,
  TrendingUp, UserCheck, Heart, Activity, FileSpreadsheet, Upload,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string;
  dateNaissance?: string; sexe?: string; telephone?: string;
  groupeSanguin?: string; statut?: string; adresse?: string;
};

const SANG_CFG: Record<string, { bg: string; color: string; border: string }> = {
  'A+':  { bg:'#FFF0F0', color:'#C62828', border:'#FFCDD2' },
  'A-':  { bg:'#FFF0F0', color:'#C62828', border:'#FFCDD2' },
  'B+':  { bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB' },
  'B-':  { bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB' },
  'AB+': { bg:'#F5F0FF', color:'#6A1B9A', border:'#E1BEE7' },
  'AB-': { bg:'#F5F0FF', color:'#6A1B9A', border:'#E1BEE7' },
  'O+':  { bg:'#F0FFF4', color:'#2E7D32', border:'#C8E6C9' },
  'O-':  { bg:'#F0FFF4', color:'#2E7D32', border:'#C8E6C9' },
};

const STATUT_CFG: Record<string, { labelKey: string; bg: string; color: string; dot: string }> = {
  actif:   { labelKey:'statutActif',   bg:'#E8F5E9', color:'#2E7D32', dot:'#4ADE80' },
  inactif: { labelKey:'statutInactif', bg:'#F5F5F5', color:'#546E7A', dot:'#B0BEC5' },
  decede:  { labelKey:'statutDecede',  bg:'#FFEBEE', color:'#C62828', dot:'#C62828' },
};

const AVATAR_COLORS = [
  ['#1565C0','#E3F2FD'], ['#00838F','#E0F7FA'], ['#6A1B9A','#F3E5F5'],
  ['#2E7D32','#E8F5E9'], ['#E65100','#FFF3E0'], ['#C62828','#FFEBEE'],
  ['#0288D1','#E1F5FE'], ['#37474F','#ECEFF1'],
];

function avatarColor(name: string) {
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }); }
  catch { return '—'; }
}

const FILTRES_STATUT = [
  { key: '', labelKey: 'filterAll' },
  { key: 'actif', labelKey: 'filterActifs' },
  { key: 'inactif', labelKey: 'filterInactifs' },
  { key: 'decede', labelKey: 'filterDecedes' },
];

const FILTRES_SEXE = [
  { key: '', labelKey: 'filterAll' },
  { key: 'M', labelKey: 'filterHommes' },
  { key: 'F', labelKey: 'filterFemmes' },
];

export default function PatientsPage() {
  const router = useRouter();
  const t = useTranslations('patients');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreSexe, setFiltreSexe] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        ...(search ? { q: search } : {}),
        ...(filtreStatut ? { statut: filtreStatut } : {}),
        ...(filtreSexe ? { sexe: filtreSexe } : {}),
      });
      const data = await apiClient<any>(`/patients?${qs}`);
      const list: Patient[] = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      setPatients(list);
      setTotal(data?.total ?? list.length);
      setLastRefresh(new Date());
    } catch { setPatients([]); }
    finally { setLoading(false); }
  }, [page, search, filtreStatut, filtreSexe]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilters = !!search || !!filtreStatut || !!filtreSexe;

  const hommes = patients.filter(p => p.sexe === 'M').length;
  const femmes = patients.filter(p => p.sexe === 'F').length;
  const actifs = patients.filter(p => !p.statut || p.statut === 'actif').length;

  const clearFilters = () => { setSearch(''); setSearchInput(''); setFiltreStatut(''); setFiltreSexe(''); setPage(1); };

  const handleExportXLSX = () => exportXLSX(
    patients.map(p => ({
      [t('list.expIpp')]: p.ipp ?? '—',
      [t('list.expNom')]: p.nom,
      [t('list.expPrenom')]: p.prenom,
      [t('list.expDateNaissance')]: p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString('fr-FR') : '—',
      [t('list.expSexe')]: p.sexe === 'M' ? t('common.man') : p.sexe === 'F' ? t('common.woman') : '—',
      [t('list.expTelephone')]: p.telephone ?? '—',
      [t('list.expGroupe')]: p.groupeSanguin ?? '—',
      [t('list.expStatut')]: p.statut ?? 'actif',
    })),
    `patients_${new Date().toISOString().slice(0, 10)}`, 'Patients',
  );

  const handleExportPDF = () => exportPDF(
    [
      { header: t('list.expIpp'), dataKey: 'ipp', width: 28 },
      { header: t('list.expNom'), dataKey: 'nom', width: 36 },
      { header: t('list.expPrenom'), dataKey: 'prenom', width: 36 },
      { header: t('list.pdfNaissance'), dataKey: 'naissance', width: 28 },
      { header: t('list.expSexe'), dataKey: 'sexe', width: 18 },
      { header: t('list.expTelephone'), dataKey: 'tel', width: 30 },
      { header: t('list.pdfGroupe'), dataKey: 'groupe', width: 18 },
      { header: t('list.expStatut'), dataKey: 'statut', width: 18 },
    ],
    patients.map(p => ({
      ipp: p.ipp ?? '—',
      nom: p.nom,
      prenom: p.prenom,
      naissance: p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString('fr-FR') : '—',
      sexe: p.sexe === 'M' ? t('list.pdfSexeH') : p.sexe === 'F' ? t('list.pdfSexeF') : '—',
      tel: p.telephone ?? '—',
      groupe: p.groupeSanguin ?? '—',
      statut: p.statut ?? 'actif',
    })),
    t('list.pdfTitle'),
    `patients_${new Date().toISOString().slice(0, 10)}`,
    t('list.pdfSubtitle', { count: total, page, date: new Date().toLocaleDateString('fr-FR') }),
  );

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .pat-row:hover { background:#F0F6FF!important; }
        .pat-row:hover .pat-actions { opacity:1!important; }
        .pat-actions { opacity:0; transition:opacity .15s; }
        .act-btn:hover { background:#EFF6FF!important; border-color:#1565C0!important; }
        .act-btn-edit:hover { background:#FFF3E0!important; border-color:#E65100!important; }
        .filt-chip { transition:all .15s; }
        .filt-chip:hover { opacity:.8; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0A2E6E 0%,#1565C0 60%,#0288D1 100%)', borderRadius:18, padding:'22px 28px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14, boxShadow:'0 8px 28px rgba(13,71,161,0.3)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:100, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, right:280, width:110, height:110, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:16, zIndex:1 }}>
          <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Users size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('list.title')}</h1>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>
              {loading ? '…' : t('list.registered', { count: total.toLocaleString('fr-FR') })}
              {lastRefresh && <span style={{ marginLeft:10, opacity:.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, zIndex:1 }}>
          <button onClick={load} disabled={loading} title={t('list.refresh')}
            style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <RefreshCw size={16} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
          </button>
          <button onClick={handleExportPDF} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(239,68,68,0.35)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <Download size={14}/> {t('list.pdf')}
          </button>
          <button onClick={handleExportXLSX} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(46,125,50,0.85)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <FileSpreadsheet size={14}/> {t('list.xlsx')}
          </button>
          <button onClick={() => router.push('/patients/import')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:10, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            <Upload size={14}/> {t('list.import')}
          </button>
          <button onClick={() => router.push('/patients/nouveau')}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:10, background:'#fff', border:'none', color:'#1565C0', cursor:'pointer', fontSize:13, fontWeight:800, boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
            <UserPlus size={15}/> {t('list.new')}
          </button>
        </div>
      </div>

      {/* ── KPI MINI-STATS ────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:t('list.kpiTotal'), value: total, sub:t('list.kpiTotalSub'), icon:<Users size={18} color="#1565C0"/>, bg:'#EFF6FF', color:'#1565C0', border:'#BBDEFB' },
          { label:t('list.kpiActive'), value: loading?'…':actifs, sub:t('list.kpiActiveSub'), icon:<UserCheck size={18} color="#2E7D32"/>, bg:'#E8F5E9', color:'#2E7D32', border:'#C8E6C9' },
          { label:t('list.kpiMen'), value: loading?'…':hommes, sub:t('list.kpiListPct', { pct: patients.length?Math.round(hommes/patients.length*100):0 }), icon:<Activity size={18} color="#0288D1"/>, bg:'#E1F5FE', color:'#0288D1', border:'#B3E5FC' },
          { label:t('list.kpiWomen'), value: loading?'…':femmes, sub:t('list.kpiListPct', { pct: patients.length?Math.round(femmes/patients.length*100):0 }), icon:<Heart size={18} color="#AD1457"/>, bg:'#FCE4EC', color:'#AD1457', border:'#F48FB1' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'14px 16px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', display:'flex', alignItems:'center', gap:12, border:`1px solid ${k.border}`, borderLeft:`4px solid ${k.color}` }}>
            <div style={{ width:38, height:38, borderRadius:10, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:k.color, lineHeight:1 }}>{loading&&i>0?<span style={{display:'inline-block',width:32,height:18,background:k.bg,borderRadius:4}}/>:k.value}</div>
              <div style={{ fontSize:10, color:'#546E7A', marginTop:2, fontWeight:600, textTransform:'uppercase', letterSpacing:'.4px' }}>{k.label}</div>
              <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BARRE RECHERCHE + FILTRES ──────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16, boxShadow:'0 1px 6px rgba(0,0,0,0.06)' }}>
        <form onSubmit={e=>{ e.preventDefault(); setPage(1); setSearch(searchInput); }} style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 300px' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE', pointerEvents:'none' }}/>
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
              placeholder={t('list.searchPlaceholder')}
              style={{ width:'100%', padding:'10px 10px 10px 36px', border:'1.5px solid #E0E8F0', borderRadius:10, fontSize:13, outline:'none', background:'#F8FAFC', boxSizing:'border-box', color:'#1A2332' }}
              onFocus={e=>(e.currentTarget.style.borderColor='#1565C0')}
              onBlur={e=>(e.currentTarget.style.borderColor='#E0E8F0')}/>
          </div>
          <button type="submit" style={{ padding:'10px 20px', borderRadius:10, background:'#1565C0', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {t('list.search')}
          </button>
          <button type="button" onClick={()=>setShowFilters(v=>!v)}
            style={{ padding:'10px 16px', borderRadius:10, background: showFilters?'#EFF6FF':'#F5F7FA', border:`1.5px solid ${showFilters?'#1565C0':'#E0E0E0'}`, color: showFilters?'#1565C0':'#546E7A', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <Filter size={14}/> {t('list.filters')} {hasFilters && <span style={{ background:'#1565C0', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{[search,filtreStatut,filtreSexe].filter(Boolean).length}</span>}
          </button>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              style={{ padding:'10px 14px', borderRadius:10, background:'#FFEBEE', border:'1px solid #FFCDD2', color:'#C62828', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <X size={13}/> {t('list.clear')}
            </button>
          )}
        </form>

        {showFilters && (
          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #F0F4FA', display:'flex', flexWrap:'wrap', gap:20, animation:'fadeUp .2s ease' }}>
            <div>
              <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('list.filterStatutLabel')}</p>
              <div style={{ display:'flex', gap:6 }}>
                {FILTRES_STATUT.map(f => (
                  <button key={f.key} onClick={()=>{setFiltreStatut(f.key);setPage(1);}} className="filt-chip"
                    style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${filtreStatut===f.key?'#1565C0':'#E0E0E0'}`, background:filtreStatut===f.key?'#1565C0':'#fff', color:filtreStatut===f.key?'#fff':'#546E7A', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {t(`list.${f.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('list.filterSexeLabel')}</p>
              <div style={{ display:'flex', gap:6 }}>
                {FILTRES_SEXE.map(f => (
                  <button key={f.key} onClick={()=>{setFiltreSexe(f.key);setPage(1);}} className="filt-chip"
                    style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${filtreSexe===f.key?'#1565C0':'#E0E0E0'}`, background:filtreSexe===f.key?'#1565C0':'#fff', color:filtreSexe===f.key?'#fff':'#546E7A', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {t(`list.${f.labelKey}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── TABLE ─────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'linear-gradient(90deg,#F8FAFC,#F0F6FF)' }}>
                {[t('list.colIpp'),t('list.colPatient'),t('list.colAgeSexe'),t('list.colTelephone'),t('list.colGroupe'),t('list.colStatut'),t('list.colActions')].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, fontWeight:800, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.7px', whiteSpace:'nowrap', borderBottom:'2px solid #E8EEFA' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => (
                <tr key={i} style={{ borderTop:'1px solid #F5F7FA' }}>
                  <td style={{ padding:'14px 16px' }}><div style={{ height:12, background:'#F0F4FA', borderRadius:4, width:60 }}/></td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background:'#E8EEFA' }}/>
                      <div>
                        <div style={{ height:13, background:'#F0F4FA', borderRadius:4, width:130, marginBottom:5 }}/>
                        <div style={{ height:10, background:'#F5F7FA', borderRadius:4, width:80 }}/>
                      </div>
                    </div>
                  </td>
                  {[60,80,60,60,70].map((w,j)=>(
                    <td key={j} style={{ padding:'14px 16px' }}><div style={{ height:12, background:'#F0F4FA', borderRadius:4, width:w }}/></td>
                  ))}
                </tr>
              )) : patients.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'60px 20px', textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Users size={32} color="#BBDEFB"/>
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:14, fontWeight:700, color:'#37474F' }}>
                        {search ? t('list.emptyNoResult') : t('list.emptyNoPatient')}
                      </p>
                      <p style={{ margin:'4px 0 0', fontSize:12, color:'#90A4AE' }}>
                        {search ? t('list.emptyTryOther') : t('list.emptyClickNew')}
                      </p>
                    </div>
                    {!search && (
                      <button onClick={() => router.push('/patients/nouveau')}
                        style={{ padding:'9px 20px', borderRadius:10, background:'#1565C0', color:'#fff', border:'none', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                        <UserPlus size={14}/> {t('list.new')}
                      </button>
                    )}
                  </div>
                </td></tr>
              ) : patients.map((p, idx) => {
                const sc = SANG_CFG[p.groupeSanguin || ''];
                const stCfg = STATUT_CFG[p.statut || 'actif'] ?? STATUT_CFG.actif;
                const [aColor, aBg] = avatarColor(`${p.prenom}${p.nom}`);
                const initials = `${p.prenom?.charAt(0)??''}${p.nom?.charAt(0)??''}`;
                return (
                  <tr key={p.id} className="pat-row" onClick={() => router.push(`/patients/${p.id}`)}
                    style={{ borderTop:'1px solid #F0F4FA', cursor:'pointer', transition:'background .1s', background:'transparent' }}>
                    <td style={{ padding:'13px 16px', fontFamily:'monospace', fontSize:11, fontWeight:700, color:'#90A4AE', whiteSpace:'nowrap' }}>
                      <span style={{ background:'#F8FAFC', padding:'2px 8px', borderRadius:6, border:'1px solid #E8EEFA' }}>{p.ipp || '—'}</span>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${aBg},${aColor}22)`, border:`1.5px solid ${aColor}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:aColor, flexShrink:0, letterSpacing:'.5px' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#1A2332', lineHeight:1.2 }}>{p.prenom} {p.nom}</div>
                          <div style={{ fontSize:11, color:'#90A4AE', marginTop:2 }}>{fmtDate(p.dateNaissance)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#37474F' }}>{p.dateNaissance ? t('common.years', { n: Math.floor((Date.now() - new Date(p.dateNaissance).getTime()) / (365.25 * 24 * 3600 * 1000)) }) : '—'}</div>
                      <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{p.sexe==='M'?t('list.genderMan'):p.sexe==='F'?t('list.genderWoman'):'—'}</div>
                    </td>
                    <td style={{ padding:'13px 16px', fontSize:13, color:'#546E7A' }}>{p.telephone || '—'}</td>
                    <td style={{ padding:'13px 16px' }}>
                      {p.groupeSanguin ? (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:800, padding:'3px 10px', borderRadius:20, background:sc?.bg??'#F5F5F5', color:sc?.color??'#546E7A', border:`1px solid ${sc?.border??'#E0E0E0'}` }}>
                          {p.groupeSanguin}
                        </span>
                      ) : <span style={{ color:'#C0CAD4', fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20, background:stCfg.bg, color:stCfg.color }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:stCfg.dot, display:'inline-block', flexShrink:0 }}/>
                        {t(`list.${stCfg.labelKey}`)}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <div className="pat-actions" style={{ display:'flex', gap:5 }}>
                        <button onClick={e=>{e.stopPropagation();router.push(`/patients/${p.id}`);}} title={t('list.viewFile')} className="act-btn"
                          style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #E0E8F0', background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1565C0', transition:'all .15s' }}>
                          <Eye size={14}/>
                        </button>
                        <button onClick={e=>{e.stopPropagation();router.push(`/patients/${p.id}/modifier`);}} title={t('list.edit')} className="act-btn act-btn-edit"
                          style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #E0E8F0', background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#E65100', transition:'all .15s' }}>
                          <Edit size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ──────────────────────────────────────────────── */}
        {(totalPages > 1 || total > 0) && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'2px solid #F0F4FA', flexWrap:'wrap', gap:10, background:'#FAFBFC' }}>
            <span style={{ fontSize:12, color:'#546E7A', fontWeight:500 }}>
              <strong style={{ color:'#1A2332' }}>{Math.min((page-1)*LIMIT+1, total)}–{Math.min(page*LIMIT, total)}</strong> {t('list.paginationOf')} <strong style={{ color:'#1A2332' }}>{total}</strong> {t('list.paginationPatients')}
            </span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #E0E8F0', background: page===1?'#F5F7FA':'#fff', color: page===1?'#B0BEC5':'#1565C0', cursor:page===1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChevronLeft size={16}/>
              </button>
              {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                const pg = totalPages <= 7 ? i+1 : page <= 4 ? i+1 : page >= totalPages-3 ? totalPages-6+i : page-3+i;
                return (
                  <button key={pg} onClick={()=>setPage(pg)}
                    style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${page===pg?'#1565C0':'#E0E8F0'}`, background:page===pg?'#1565C0':'#fff', color:page===pg?'#fff':'#546E7A', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .15s' }}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ width:32, height:32, borderRadius:8, border:'1.5px solid #E0E8F0', background:page===totalPages?'#F5F7FA':'#fff', color:page===totalPages?'#B0BEC5':'#1565C0', cursor:page===totalPages?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
