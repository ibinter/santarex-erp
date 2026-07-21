'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, AlertTriangle, TrendingUp, Plus, Search,
  RefreshCw, Download, ChevronRight, Pill, BarChart3, ShieldAlert, FileSpreadsheet,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

type Medicament = {
  id: string; code: string; nom: string; nomCommercial?: string; dci?: string;
  forme?: string; dosage?: string; categorie?: string;
  stockActuel: number; stockMinimum: number;
  prixUnitaire: string; prixVente: string;
  actif: boolean; createdAt: string;
};

function fmtXOF(v: number) {
  return new Intl.NumberFormat('fr-FR').format(v)+' F';
}

type StockStatus = 'ok'|'alerte'|'rupture';
function stockStatus(m: Medicament): StockStatus {
  if (m.stockActuel<=0) return 'rupture';
  if (m.stockActuel<=m.stockMinimum) return 'alerte';
  return 'ok';
}
const STATUS_CFG: Record<StockStatus,{ color:string; bg:string; border:string; dot:string; barColor:string }> = {
  ok:      { color:'#15803D', bg:'#DCFCE7', border:'#86EFAC', dot:'#22C55E', barColor:'#4ADE80' },
  alerte:  { color:'#C2410C', bg:'#FFF7ED', border:'#FED7AA', dot:'#F97316', barColor:'#FB923C' },
  rupture: { color:'#DC2626', bg:'#FEE2E2', border:'#FCA5A5', dot:'#EF4444', barColor:'#EF4444' },
};

const FORME_ICON: Record<string,string> = {
  comprime:'💊', gelule:'💊', sirop:'🧴', injectable:'💉', pommade:'🧪',
  sachet:'📦', suppositoire:'🟤', collyre:'👁️', spray:'💨',
};
function formeIcon(f?: string) {
  if (!f) return '💊';
  const k=Object.keys(FORME_ICON).find(k=>f.toLowerCase().includes(k));
  return k?FORME_ICON[k]:'💊';
}

const CAT_COLORS: Record<string,[string,string]> = {
  antibiotique:      ['#1D4ED8','#DBEAFE'],
  antalgique:        ['#7C3AED','#EDE9FE'],
  antihypertenseur:  ['#0F766E','#CCFBF1'],
  antipaludeen:      ['#B45309','#FEF3C7'],
  antidiabetique:    ['#9D174D','#FCE7F3'],
  autre:             ['#475569','#F1F5F9'],
};
function catColor(c?: string): [string,string] {
  return CAT_COLORS[c??'autre']??CAT_COLORS.autre;
}

export default function PharmaciePage() {
  const router = useRouter();
  const t = useTranslations('pharmacie');
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [tab, setTab]                 = useState<'tous'|'rupture'|'alerte'>('tous');
  const [lastRefresh, setLastRefresh] = useState<Date|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiClient<any>('/pharmacie/medicaments?limit=200');
      setMedicaments(Array.isArray(d)?d:d?.items??d?.data??[]);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const ruptures     = medicaments.filter(m=>m.stockActuel<=0).length;
  const alertes      = medicaments.filter(m=>m.stockActuel>0&&m.stockActuel<=m.stockMinimum).length;
  const enStock      = medicaments.filter(m=>m.stockActuel>m.stockMinimum).length;
  const valeurTotale = medicaments.reduce((acc,m)=>acc+m.stockActuel*(parseFloat(m.prixVente)||0),0);

  const statutLabel = (s: StockStatus) => t(`statut.${s}` as any);
  const exportStatut = (m: Medicament) => m.stockActuel <= 0 ? t('export.statutRupture') : m.stockActuel <= m.stockMinimum ? t('export.statutAlerte') : t('export.statutEnStock');

  const handleExportXLSX = () => exportXLSX(
    medicaments.map(m => ({
      [t('export.colCode')]: m.code,
      [t('export.colMedicament')]: m.nom,
      [t('export.colForme')]: m.forme ?? '—',
      [t('export.colDosage')]: m.dosage ?? '—',
      [t('export.colCategorie')]: m.categorie ?? '—',
      [t('export.colStockActuel')]: m.stockActuel,
      [t('export.colStockMinimum')]: m.stockMinimum,
      [t('export.colPrixVenteXof')]: parseFloat(m.prixVente) || 0,
      [t('export.colStatut')]: exportStatut(m),
    })),
    `pharmacie_stock_${new Date().toISOString().slice(0, 10)}`, t('export.sheetName'),
  );

  const handleExportPDF = () => exportPDF(
    [
      { header: t('export.colCode'), dataKey: 'code', width: 24 },
      { header: t('export.colMedicament'), dataKey: 'nom', width: 44 },
      { header: t('export.colForme'), dataKey: 'forme', width: 24 },
      { header: t('export.colCategorie'), dataKey: 'categorie', width: 30 },
      { header: t('export.colStock'), dataKey: 'stock', width: 18 },
      { header: t('export.colMin'), dataKey: 'min', width: 14 },
      { header: t('export.colPrixVente'), dataKey: 'prix', width: 26 },
      { header: t('export.colStatut'), dataKey: 'statut', width: 22 },
    ],
    medicaments.map(m => ({
      code: m.code,
      nom: m.nom,
      forme: m.forme ?? '—',
      categorie: m.categorie ?? '—',
      stock: m.stockActuel,
      min: m.stockMinimum,
      prix: `${(parseFloat(m.prixVente) || 0).toLocaleString('fr-FR')} F`,
      statut: exportStatut(m),
    })),
    t('export.pdfTitle'),
    `pharmacie_stock_${new Date().toISOString().slice(0, 10)}`,
    t('export.pdfSubtitle', { count: medicaments.length, date: new Date().toLocaleDateString('fr-FR') }),
  );

  const displayed = medicaments.filter(m => {
    const q = search.toLowerCase();
    const matchQ = !search || m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || (m.dci??'').toLowerCase().includes(q) || (m.nomCommercial??'').toLowerCase().includes(q);
    if (!matchQ) return false;
    if (tab==='rupture') return m.stockActuel<=0;
    if (tab==='alerte')  return m.stockActuel>0&&m.stockActuel<=m.stockMinimum;
    return true;
  });

  const TABS = [
    { id:'tous'    as const, label:t('list.tabTous'),     count:medicaments.length, color:'#1D4ED8', bg:'#EFF6FF' },
    { id:'rupture' as const, label:t('list.tabRuptures'), count:ruptures,           color:'#DC2626', bg:'#FEE2E2' },
    { id:'alerte'  as const, label:t('list.tabAlertes'),  count:alertes,            color:'#C2410C', bg:'#FFF7ED' },
  ];

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .med-row:hover{background:#F0FDF4!important;}
        .med-row.rupture:hover{background:#FEF2F2!important;}
        .med-row.alerte:hover{background:#FFFBEB!important;}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#064E3B 0%,#065F46 45%,#047857 100%)', borderRadius:18, padding:'24px 28px 20px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 28px rgba(6,78,59,0.4)' }}>
        <div style={{ position:'absolute', top:-50, right:80,  width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
        <div style={{ position:'absolute', bottom:-70, right:200, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>

        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.18)', border:'1.5px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Pill size={24} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>{t('list.heroTitle')}</h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', display:'inline-block', animation:'pulse 2s infinite' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>
                    {loading?t('list.loading'):t('list.summary', { count: medicaments.length, value: fmtXOF(valeurTotale) })}
                  </span>
                  {lastRefresh&&<span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', marginLeft:4 }}>• {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>}
                </div>
              </div>
            </div>

            {/* Alertes urgentes */}
            {(ruptures>0||alertes>0)&&!loading&&(
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                {ruptures>0&&(
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(239,68,68,0.25)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:8, padding:'5px 12px' }}>
                    <ShieldAlert size={12} color="#FCA5A5"/>
                    <span style={{ fontSize:11, fontWeight:800, color:'#FCA5A5' }}>{t('list.ruptureBadge', { count: ruptures })}</span>
                  </div>
                )}
                {alertes>0&&(
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(251,146,60,0.2)', border:'1px solid rgba(251,146,60,0.35)', borderRadius:8, padding:'5px 12px' }}>
                    <AlertTriangle size={12} color="#FCD34D"/>
                    <span style={{ fontSize:11, fontWeight:800, color:'#FCD34D' }}>{t('list.alerteBadge', { count: alertes })}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
              <RefreshCw size={14} style={{ animation:loading?'spin 1s linear infinite':'none' }}/>
            </button>
            <button onClick={handleExportPDF} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(239,68,68,0.3)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
              <Download size={13}/> PDF
            </button>
            <button onClick={handleExportXLSX} disabled={loading}
              style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.12)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}>
              <FileSpreadsheet size={13}/> XLSX
            </button>
            <button onClick={()=>router.push('/pharmacie/medicaments/nouveau')}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', color:'#065F46', display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:800, boxShadow:'0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14}/> {t('list.new')}
            </button>
          </div>
        </div>

        {/* Mini KPI bar */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:16, position:'relative', zIndex:1 }}>
          {[
            { label:t('list.kpiEnStock'),       val:enStock,      color:'#BBF7D0' },
            { label:t('list.kpiAlertes'),       val:alertes,      color:'#FCD34D' },
            { label:t('list.kpiRuptures'),      val:ruptures,     color:'#FCA5A5' },
            { label:t('list.kpiValeurTotale'),  val:fmtXOF(valeurTotale), color:'rgba(255,255,255,0.9)' },
          ].map((k,i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:i===3?14:26, fontWeight:900, color:k.color, lineHeight:1 }}>{loading?'…':k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS + SEARCH ────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:0, background:'#fff', borderRadius:11, padding:4, boxShadow:'0 1px 6px rgba(0,0,0,0.07)' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:9, border:'none', background:tab===t.id?`linear-gradient(135deg,${t.color},${t.color}dd)`:'transparent', color:tab===t.id?'#fff':'#546E7A', fontSize:12, fontWeight:tab===t.id?700:500, cursor:'pointer', whiteSpace:'nowrap', transition:'all .2s' }}>
              {t.label}
              <span style={{ background:tab===t.id?'rgba(255,255,255,0.25)':t.bg, color:tab===t.id?'#fff':t.color, fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:10 }}>{loading?'…':t.count}</span>
            </button>
          ))}
        </div>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:10, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
        </div>
        {!loading&&<span style={{ fontSize:11, color:'#90A4AE', fontWeight:600, whiteSpace:'nowrap' }}>{t('list.countLabel', { count: displayed.length })}</span>}
      </div>

      {/* ── TABLE ────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp .25s ease' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'linear-gradient(135deg,#F0FDF4,#DCFCE7)' }}>
                {[t('list.colCode'),t('list.colMedicament'),t('list.colDciForme'),t('list.colCategorie'),t('list.colStock'),t('list.colMin'),t('list.colPrixVente'),t('list.colStatut'),''].map((h,hi)=>(
                  <th key={hi} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:800, color:'#065F46', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:7}).map((_,i)=>(
                <tr key={i} style={{ borderTop:'1px solid #F0FDF4' }}>
                  {Array.from({length:9}).map((_,j)=>(
                    <td key={j} style={{ padding:'13px 14px' }}><div style={{ height:13, background:'#DCFCE7', borderRadius:4, width:j===1?140:70, animation:'pulse 1.5s ease infinite' }}/></td>
                  ))}
                </tr>
              )) : displayed.length===0 ? (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'60px 20px', color:'#90A4AE' }}>
                  <Package size={38} style={{ display:'block', margin:'0 auto 12px', color:'#BBF7D0' }}/>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{t('list.emptyTitle')}</p>
                </td></tr>
              ) : displayed.map(m=>{
                const st  = stockStatus(m);
                const cfg = STATUS_CFG[st];
                const pct = m.stockMinimum>0 ? Math.min(100,Math.round((m.stockActuel/(m.stockMinimum*3))*100)) : m.stockActuel>0?100:0;
                const [cc,cb] = catColor(m.categorie);
                const icon = formeIcon(m.forme);
                return (
                  <tr key={m.id} className={`med-row ${st}`}
                    onClick={()=>router.push(`/pharmacie/medicaments/${m.id}`)}
                    style={{ borderTop:'1px solid #F0F4F8', cursor:'pointer', transition:'background .1s', borderLeft:`3px solid ${st==='ok'?'transparent':cfg.border}` }}>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:800, color:'#065F46', background:'#DCFCE7', padding:'2px 8px', borderRadius:6 }}>{m.code}</span>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{m.nom}</div>
                          {m.nomCommercial&&<div style={{ fontSize:10, color:'#90A4AE' }}>{m.nomCommercial}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {m.dci&&<div style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{m.dci}</div>}
                      {m.forme&&<div style={{ fontSize:10, color:'#9CA3AF', textTransform:'capitalize' }}>{m.forme}{m.dosage?` • ${m.dosage}`:''}</div>}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      {m.categorie&&(
                        <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:12, background:cb, color:cc }}>
                          {m.categorie}
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontSize:16, fontWeight:900, color:cfg.color, lineHeight:1 }}>{m.stockActuel}</div>
                      <div style={{ marginTop:5, height:4, background:'#E2E8F0', borderRadius:2, width:56, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:cfg.barColor, borderRadius:2, transition:'width .4s' }}/>
                      </div>
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#6B7280', fontWeight:600 }}>{m.stockMinimum}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, fontWeight:700, color:'#1A2332', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>
                      {fmtXOF(parseFloat(m.prixVente)||0)}
                    </td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, display:'inline-block', animation:st!=='ok'?'pulse 2s infinite':'none' }}/>
                        {statutLabel(st)}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px' }}><ChevronRight size={14} color="#B0BEC5"/></td>
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
