'use client';

import { useState } from 'react';
import {
  UserCog, Plus, Search, Users, Calendar, Clock,
  TrendingUp, CheckCircle, XCircle, Download, Banknote, FileSpreadsheet,
} from 'lucide-react';
import { exportXLSX, exportPDF } from '@/lib/export';

const EMPLOYES = [
  { id:'EMP-001', nom:'Dr. Koné Mamadou',       poste:'Chirurgien',          service:'Chirurgie',      type:'CDI', statut:'ACTIF',  conge:false, salaire:650_000, dateEntree:'2019-03-15', contact:'+225 07 12 34 56' },
  { id:'EMP-002', nom:'Dr. Bah Fatoumata',       poste:'Gynécologue',         service:'Gynécologie',    type:'CDI', statut:'ACTIF',  conge:false, salaire:620_000, dateEntree:'2020-06-01', contact:'+225 07 23 45 67' },
  { id:'EMP-003', nom:'Sanogo Awa',              poste:'Infirmière chef',     service:'Soins intensifs',type:'CDI', statut:'CONGE',  conge:true,  salaire:280_000, dateEntree:'2018-09-10', contact:'+225 07 34 56 78' },
  { id:'EMP-004', nom:'Traoré Célestine',        poste:'Caissière',           service:'Finance',        type:'CDD', statut:'ACTIF',  conge:false, salaire:180_000, dateEntree:'2022-01-20', contact:'+225 07 45 67 89' },
  { id:'EMP-005', nom:'Dr. Ouédraogo Moussa',    poste:'Biologiste',          service:'Laboratoire',    type:'CDI', statut:'ACTIF',  conge:false, salaire:580_000, dateEntree:'2017-11-05', contact:'+225 07 56 78 90' },
  { id:'EMP-006', nom:'Coulibaly Ahmed',         poste:'Pharmacien',          service:'Pharmacie',      type:'CDI', statut:'ACTIF',  conge:false, salaire:420_000, dateEntree:'2021-04-12', contact:'+225 07 67 89 01' },
  { id:'EMP-007', nom:'Diallo Nathalie',         poste:'Secrétaire médicale', service:'Accueil',        type:'CDD', statut:'ACTIF',  conge:false, salaire:160_000, dateEntree:'2023-07-01', contact:'+225 07 78 90 12' },
  { id:'EMP-008', nom:'Yao Emmanuel',            poste:'Technicien imagerie', service:'Imagerie',       type:'CDI', statut:'ACTIF',  conge:false, salaire:320_000, dateEntree:'2020-02-28', contact:'+225 07 89 01 23' },
];

const CONGES = [
  { employe:'Sanogo Awa',           type:'Congé annuel',     debut:'2026-07-10', fin:'2026-07-24', statut:'APPROUVE',  jours:15 },
  { employe:'Dr. Koné Mamadou',     type:'Formation médicale',debut:'2026-07-20', fin:'2026-07-22', statut:'EN_ATTENTE', jours:3 },
  { employe:'Traoré Célestine',     type:'Congé maladie',    debut:'2026-07-08', fin:'2026-07-12', statut:'APPROUVE',  jours:5 },
];

const SERVICE_COLORS: Record<string,[string,string]> = {
  'Chirurgie':      ['#1E40AF','#DBEAFE'],
  'Gynécologie':    ['#9D174D','#FCE7F3'],
  'Soins intensifs':['#991B1B','#FEE2E2'],
  'Finance':        ['#065F46','#D1FAE5'],
  'Laboratoire':    ['#5B21B6','#EDE9FE'],
  'Pharmacie':      ['#92400E','#FEF3C7'],
  'Accueil':        ['#374151','#F3F4F6'],
  'Imagerie':       ['#0F766E','#CCFBF1'],
};

const AVATAR_COLORS: [string,string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#065F46','#D1FAE5'],
  ['#7C2D12','#FEE2E2'],['#1E40AF','#DBEAFE'],
];
function avatarColor(name: string): [string,string] {
  let h=0; for(let i=0;i<name.length;i++) h=((h<<5)-h+name.charCodeAt(i))|0;
  return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length];
}
function initials(nom: string) {
  return nom.replace(/^Dr\.\s*/,'').split(' ').filter(Boolean).map(w => w[0]).slice(0,2).join('').toUpperCase();
}
function fmtXOF(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }
function anciennete(d: string) {
  const yrs = Math.floor((Date.now() - new Date(d).getTime()) / (365.25*24*3600000));
  return yrs < 1 ? '< 1 an' : `${yrs} an${yrs>1?'s':''}`;
}

const TABS = [
  { key:'personnel', label:'Personnel',        icon:'👥' },
  { key:'conges',    label:'Congés & Absences',icon:'🌴' },
  { key:'paie',      label:'Paie',             icon:'💳' },
] as const;

export default function RHPage() {
  const [tab, setTab] = useState<'personnel'|'conges'|'paie'>('personnel');
  const [search, setSearch] = useState('');

  const handleExportXLSX = () => exportXLSX(
    EMPLOYES.map(e => ({
      'ID': e.id, 'Nom': e.nom, 'Poste': e.poste, 'Service': e.service,
      'Type contrat': e.type, 'Statut': e.statut,
      'Salaire (XOF)': e.salaire, "Date d'entrée": e.dateEntree, 'Contact': e.contact,
    })),
    `rh_personnel_${new Date().toISOString().slice(0,10)}`, 'Personnel',
  );
  const handleExportPDF = () => exportPDF(
    [
      { header: 'ID', dataKey: 'id', width: 20 },
      { header: 'Nom', dataKey: 'nom', width: 50 },
      { header: 'Poste', dataKey: 'poste', width: 40 },
      { header: 'Service', dataKey: 'service', width: 34 },
      { header: 'Contrat', dataKey: 'type', width: 18 },
      { header: 'Statut', dataKey: 'statut', width: 18 },
      { header: 'Salaire XOF', dataKey: 'salaire', width: 28 },
    ],
    EMPLOYES.map(e => ({ ...e, salaire: e.salaire.toLocaleString('fr-FR') })),
    'Liste du Personnel — RH',
    `rh_personnel_${new Date().toISOString().slice(0,10)}`,
    `${EMPLOYES.length} employé(s) — ${new Date().toLocaleDateString('fr-FR')}`,
  );

  const filtered = EMPLOYES.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.service.toLowerCase().includes(search.toLowerCase()) ||
    e.poste.toLowerCase().includes(search.toLowerCase())
  );

  const masseSalariale = EMPLOYES.reduce((s,e) => s + e.salaire, 0);
  const nbConge = EMPLOYES.filter(e => e.conge).length;

  return (
    <div style={{ padding:'18px', background:'#F4F6FA', minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        .emp-row:hover { background:#F5F7FF !important; }
        .rh-kpi { cursor:pointer; transition:all .15s; }
        .rh-kpi:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.12)!important; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#1C1917 0%,#292524 50%,#44403C 100%)', borderRadius:18, padding:'22px 26px 18px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 8px 24px rgba(28,25,23,0.45)' }}>
        <div style={{ position:'absolute', top:-60, right:50,  width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
        <div style={{ position:'absolute', bottom:-50, right:260, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,0.14)', border:'1.5px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <UserCog size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:21, fontWeight:900, color:'#fff', letterSpacing:'-0.3px' }}>Ressources Humaines</h1>
                <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Gestion du personnel, congés et paie</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleExportPDF} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 13px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.25)', background:'rgba(239,68,68,0.25)', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700 }}>
                <Download size={13}/> PDF
              </button>
              <button onClick={handleExportXLSX} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 13px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.25)', background:'rgba(34,197,94,0.25)', cursor:'pointer', color:'#fff', fontSize:12, fontWeight:700 }}>
                <FileSpreadsheet size={13}/> XLSX
              </button>
              <button style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'none', background:'#fff', cursor:'pointer', fontSize:13, color:'#1C1917', fontWeight:800 }}>
                <Plus size={14}/> Nouvel employé
              </button>
            </div>
          </div>

          {/* KPI pills */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:16 }}>
            {[
              { label:'Total employés',    val:142,              icon:<Users size={11}/> },
              { label:'En congé',          val:nbConge,          icon:<Calendar size={11}/> },
              { label:'Heures sup. (mois)',val:'124h',           icon:<Clock size={11}/> },
              { label:'Masse salariale',   val:fmtXOF(masseSalariale), icon:<Banknote size={11}/> },
            ].map((s,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:8, padding:'5px 12px' }}>
                <span style={{ color:'rgba(255,255,255,0.65)' }}>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{s.val}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { label:'Total employés',    value:142,                    sub:'8 services',          color:'#374151', bg:'#F3F4F6', border:'#D1D5DB', icon:<Users size={20} color="#374151"/>, tab:'personnel' as const },
          { label:'En congé ce mois',  value:nbConge,                sub:`${nbConge} absence(s)`,color:'#92400E', bg:'#FEF3C7', border:'#FDE68A', icon:<Calendar size={20} color="#92400E"/>, tab:'conges' as const },
          { label:'Heures sup. mois',  value:'124h',                 sub:'18 employés',         color:'#1E40AF', bg:'#DBEAFE', border:'#93C5FD', icon:<Clock size={20} color="#1E40AF"/>, tab:'paie' as const },
          { label:'Masse salariale',   value:fmtXOF(masseSalariale), sub:'Juillet 2026',        color:'#065F46', bg:'#D1FAE5', border:'#6EE7B7', icon:<TrendingUp size={20} color="#065F46"/>, tab:'paie' as const },
        ].map((k,i)=>(
          <div key={i} className="rh-kpi" title={`Voir : ${k.label}`} onClick={()=>setTab(k.tab)}
            style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 1px 8px rgba(0,0,0,0.08)', border:`1.5px solid ${k.border}`, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize:18, fontWeight:900, color:k.color, lineHeight:1.1, fontVariantNumeric:'tabular-nums' }}>{k.value}</div>
              <div style={{ fontSize:11, color:'#546E7A', marginTop:2, fontWeight:600 }}>{k.label}</div>
              <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:4, background:'#E8EEF8', padding:4, borderRadius:12, width:'fit-content', marginBottom:16 }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background:tab===t.key?'#fff':'transparent', color:tab===t.key?'#1C1917':'#78909C', boxShadow:tab===t.key?'0 1px 6px rgba(0,0,0,0.12)':'none', transition:'all .15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PERSONNEL ─────────────────────────────────────── */}
      {tab==='personnel'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          <div style={{ display:'flex', gap:10, marginBottom:14, alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, maxWidth:340 }}>
              <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#90A4AE' }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, service, poste…"
                style={{ width:'100%', padding:'10px 14px 10px 36px', borderRadius:11, border:'1.5px solid #E0E8F0', background:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', color:'#1A2332' }}/>
            </div>
            <span style={{ fontSize:12, color:'#90A4AE', fontWeight:600 }}>{filtered.length} employé{filtered.length>1?'s':''}</span>
          </div>

          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Employé','Poste','Service','Contrat','Statut','Salaire (XOF)','Ancienneté'].map(h=>(
                      <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#78909C', textTransform:'uppercase', letterSpacing:'0.6px', whiteSpace:'nowrap', borderBottom:'1.5px solid #EEF2F8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e=>{
                    const [ac,ab]=avatarColor(e.nom);
                    const [sc,sb]=SERVICE_COLORS[e.service]??['#374151','#F3F4F6'];
                    return (
                      <tr key={e.id} className="emp-row" style={{ borderTop:'1px solid #F0F4FA', transition:'background .12s' }}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                            <div style={{ width:38, height:38, borderRadius:11, background:`linear-gradient(135deg,${ab},${ac}22)`, border:`1.5px solid ${ac}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900, color:ac, flexShrink:0 }}>
                              {initials(e.nom)}
                            </div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{e.nom}</div>
                              <div style={{ fontSize:10, color:'#90A4AE', fontFamily:'monospace' }}>{e.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#37474F', fontWeight:600 }}>{e.poste}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:sb, color:sc, border:`1px solid ${sc}33` }}>{e.service}</span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:11, fontWeight:800, padding:'3px 9px', borderRadius:20, background:e.type==='CDI'?'#D1FAE5':'#FEF3C7', color:e.type==='CDI'?'#065F46':'#92400E', border:`1px solid ${e.type==='CDI'?'#6EE7B7':'#FDE68A'}` }}>
                            {e.type}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:20, background:e.conge?'#FEF3C7':'#D1FAE5', color:e.conge?'#92400E':'#065F46', border:`1px solid ${e.conge?'#FDE68A':'#6EE7B7'}` }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:e.conge?'#F59E0B':'#10B981', display:'inline-block' }}/>
                            {e.conge?'En congé':'Actif'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:800, color:'#1A2332', whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums' }}>
                          {fmtXOF(e.salaire)}
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:12, color:'#78909C' }}>{anciennete(e.dateEntree)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CONGÉS ────────────────────────────────────────── */}
      {tab==='conges'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #EEF2F8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#1A2332' }}>{CONGES.length} demande{CONGES.length>1?'s':''} ce mois</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#92400E', background:'#FEF3C7', padding:'3px 12px', borderRadius:20, border:'1px solid #FDE68A' }}>
                {CONGES.filter(c=>c.statut==='EN_ATTENTE').length} en attente
              </span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                <thead>
                  <tr style={{ background:'#F8FAFC' }}>
                    {['Employé','Type','Du','Au','Jours','Statut','Actions'].map(h=>(
                      <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#78909C', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1.5px solid #EEF2F8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONGES.map((c,i)=>{
                    const approuve = c.statut==='APPROUVE';
                    return (
                      <tr key={i} style={{ borderTop:'1px solid #F0F4FA', borderLeft:`3px solid ${approuve?'#6EE7B7':'#FDE68A'}` }}>
                        <td style={{ padding:'13px 16px', fontWeight:700, fontSize:13, color:'#1A2332' }}>{c.employe}</td>
                        <td style={{ padding:'13px 16px', fontSize:13, color:'#546E7A' }}>{c.type}</td>
                        <td style={{ padding:'13px 16px', fontSize:12, color:'#37474F', whiteSpace:'nowrap' }}>{new Date(c.debut).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</td>
                        <td style={{ padding:'13px 16px', fontSize:12, color:'#37474F', whiteSpace:'nowrap' }}>{new Date(c.fin).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</td>
                        <td style={{ padding:'13px 16px', fontWeight:800, fontSize:13, color:'#1A2332' }}>{c.jours}j</td>
                        <td style={{ padding:'13px 16px' }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, background:approuve?'#D1FAE5':'#FEF3C7', color:approuve?'#065F46':'#92400E', border:`1px solid ${approuve?'#6EE7B7':'#FDE68A'}` }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:approuve?'#10B981':'#F59E0B', display:'inline-block' }}/>
                            {approuve?'Approuvé':'En attente'}
                          </span>
                        </td>
                        <td style={{ padding:'13px 16px' }}>
                          {!approuve&&(
                            <div style={{ display:'flex', gap:6 }}>
                              <button style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'none', background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                <CheckCircle size={11}/> Approuver
                              </button>
                              <button style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'none', background:'#FEE2E2', color:'#991B1B', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                <XCircle size={11}/> Refuser
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAIE ──────────────────────────────────────────── */}
      {tab==='paie'&&(
        <div style={{ animation:'fadeUp .25s ease' }}>
          <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 1px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#064E3B,#065F46)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px' }}>Module de paie</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#fff', marginTop:4 }}>Juillet 2026</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', fontWeight:700 }}>Masse salariale</div>
                <div style={{ fontSize:20, fontWeight:900, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{fmtXOF(masseSalariale)}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:2 }}>142 bulletins à générer</div>
              </div>
            </div>

            {/* Breakdown par service */}
            <div style={{ padding:'20px 24px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#78909C', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:14 }}>Répartition par service (aperçu)</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { service:'Médecins',   montant:1_870_000, count:3 },
                  { service:'Infirmiers', montant:280_000,   count:1 },
                  { service:'Pharmacie',  montant:420_000,   count:1 },
                  { service:'Laboratoire',montant:580_000,   count:1 },
                  { service:'Autres',     montant:500_000,   count:3 },
                ].map(s=>{
                  const pct = Math.round((s.montant / masseSalariale) * 100);
                  return (
                    <div key={s.service}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                        <span style={{ fontWeight:700, color:'#37474F' }}>{s.service} <span style={{ fontWeight:400, color:'#90A4AE' }}>({s.count})</span></span>
                        <span style={{ fontWeight:800, color:'#065F46', fontVariantNumeric:'tabular-nums' }}>{fmtXOF(s.montant)}</span>
                      </div>
                      <div style={{ height:7, background:'#F0F4FA', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#065F46,#10B981)', borderRadius:4 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop:24, display:'flex', gap:10 }}>
                <button style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:11, background:'linear-gradient(135deg,#064E3B,#065F46)', border:'none', color:'#fff', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 14px rgba(6,78,59,0.3)' }}>
                  <Banknote size={16}/> Générer les bulletins de paie
                </button>
                <button style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 18px', borderRadius:11, background:'#fff', border:'1.5px solid #E0E8F0', color:'#374151', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  <Download size={14}/> Exporter XLSX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
