'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getFullName, getUserInitials } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';
import type { User } from '@/types';
import {
  Users, Calendar, BedDouble, Scissors, Siren, Scan,
  FlaskConical, Pill, Receipt, CreditCard, Building2,
  UserCog, BarChart2, Stethoscope, TrendingUp, TrendingDown,
  AlertTriangle, ArrowRight, RefreshCw, Activity, Heart,
  Clock, CheckCircle, ChevronRight,
  ClipboardList, Baby, SmilePlus, Syringe, HeartPulse, FileSignature,
  Home, Droplets, ShieldCheck, Truck, Wrench, Biohazard, Snowflake,
  Ambulance, Network, FileSpreadsheet, Wallet, PiggyBank, Calculator,
  MessageSquare, MessageCircle, FileWarning, Gauge, ShieldAlert,
  CalendarClock, Puzzle, Plug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── modules ──────────────────────────────────────────────────────────────────
type ModuleDef = {
  id: string;
  tkey: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  href: string;
};
type ModuleView = ModuleDef & { title: string; desc: string };

const MODULES: ModuleDef[] = [
  { id: 'patients',       tkey: 'patients',        icon: Users,        color: '#1565C0', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', href: '/patients' },
  { id: 'consultations',  tkey: 'consultations',   icon: Stethoscope,  color: '#00838F', bg: 'linear-gradient(135deg,#E0F7FA,#B2EBF2)', href: '/consultations' },
  { id: 'rendez-vous',    tkey: 'rendezVous',      icon: Calendar,     color: '#0288D1', bg: 'linear-gradient(135deg,#E1F5FE,#B3E5FC)', href: '/rendez-vous' },
  { id: 'hospitalisation',tkey: 'hospitalisation', icon: BedDouble,    color: '#1565C0', bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', href: '/hospitalisation' },
  { id: 'bloc-operatoire',tkey: 'blocOperatoire',  icon: Scissors,     color: '#37474F', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/bloc-operatoire' },
  { id: 'urgences',       tkey: 'urgences',        icon: Siren,        color: '#C62828', bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)', href: '/urgences' },
  { id: 'imagerie',       tkey: 'imagerie',        icon: Scan,         color: '#00695C', bg: 'linear-gradient(135deg,#E0F2F1,#B2DFDB)', href: '/imagerie' },
  { id: 'laboratoire',    tkey: 'laboratoire',     icon: FlaskConical, color: '#6A1B9A', bg: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', href: '/laboratoire' },
  { id: 'pharmacie',      tkey: 'pharmacie',       icon: Pill,         color: '#2E7D32', bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', href: '/pharmacie' },
  { id: 'facturation',    tkey: 'facturation',     icon: Receipt,      color: '#E65100', bg: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', href: '/facturation' },
  { id: 'caisse',         tkey: 'caisse',          icon: CreditCard,   color: '#2E7D32', bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', href: '/caisse' },
  { id: 'comptabilite',   tkey: 'comptabilite',    icon: Building2,    color: '#0D47A1', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', href: '/comptabilite' },
  { id: 'rh',             tkey: 'rh',              icon: UserCog,      color: '#37474F', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/rh' },
  { id: 'reporting',      tkey: 'reporting',       icon: BarChart2,    color: '#1565C0', bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', href: '/reporting' },

  // ── Soins ──
  { id: 'maternite',       tkey: 'maternite',        icon: Baby,         color: '#AD1457', bg: 'linear-gradient(135deg,#FCE4EC,#F8BBD0)', href: '/maternite' },
  { id: 'pediatrie',       tkey: 'pediatrie',        icon: SmilePlus,    color: '#00838F', bg: 'linear-gradient(135deg,#E0F7FA,#B2EBF2)', href: '/pediatrie' },
  { id: 'vaccination',     tkey: 'vaccination',      icon: Syringe,      color: '#2E7D32', bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', href: '/vaccination' },
  { id: 'soins-infirmiers',tkey: 'soinsInfirmiers',  icon: HeartPulse,   color: '#C2185B', bg: 'linear-gradient(135deg,#FCE4EC,#F8BBD0)', href: '/soins-infirmiers' },
  { id: 'consentements',   tkey: 'consentements',    icon: FileSignature,color: '#37474F', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/consentements' },
  { id: 'interactions',    tkey: 'interactions',     icon: AlertTriangle,color: '#E65100', bg: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', href: '/interactions' },
  { id: 'had',             tkey: 'had',              icon: Home,         color: '#00695C', bg: 'linear-gradient(135deg,#E0F2F1,#B2DFDB)', href: '/had' },
  { id: 'dme',             tkey: 'dme',              icon: ClipboardList,color: '#1565C0', bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', href: '/dme' },

  // ── Pharmacie & plateau technique ──
  { id: 'banque-sang',     tkey: 'banqueSang',       icon: Droplets,     color: '#C62828', bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)', href: '/banque-sang' },
  { id: 'sterilisation',   tkey: 'sterilisation',    icon: ShieldCheck,  color: '#0288D1', bg: 'linear-gradient(135deg,#E1F5FE,#B3E5FC)', href: '/sterilisation' },
  { id: 'approvisionnement',tkey: 'approvisionnement',icon: Truck,       color: '#2E7D32', bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', href: '/approvisionnement' },

  // ── Opérations ──
  { id: 'equipements',     tkey: 'equipements',      icon: Wrench,       color: '#546E7A', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/equipements' },
  { id: 'dechets-medicaux',tkey: 'dechetsMedicaux',  icon: Biohazard,    color: '#558B2F', bg: 'linear-gradient(135deg,#F1F8E9,#DCEDC8)', href: '/dechets-medicaux' },
  { id: 'morgue',          tkey: 'morgue',           icon: Snowflake,    color: '#37474F', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/morgue' },
  { id: 'transport',       tkey: 'transport',        icon: Ambulance,    color: '#C62828', bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)', href: '/transport' },
  { id: 'sites',           tkey: 'sites',            icon: Network,      color: '#0D47A1', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', href: '/sites' },

  // ── Finances ──
  { id: 'devis',           tkey: 'devis',            icon: FileSpreadsheet,color: '#E65100', bg: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', href: '/devis' },
  { id: 'caisse-sessions', tkey: 'caisseSessions',   icon: Wallet,       color: '#2E7D32', bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', href: '/caisse-sessions' },
  { id: 'prise-en-charge', tkey: 'priseEnCharge',    icon: ShieldCheck,  color: '#00838F', bg: 'linear-gradient(135deg,#E0F7FA,#B2EBF2)', href: '/prise-en-charge' },
  { id: 'tiers-payant',    tkey: 'tiersPayant',      icon: PiggyBank,    color: '#6A1B9A', bg: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', href: '/tiers-payant' },
  { id: 'budget',          tkey: 'budget',           icon: Calculator,   color: '#0D47A1', bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', href: '/budget' },

  // ── Communication ──
  { id: 'messagerie',      tkey: 'messagerie',       icon: MessageSquare,color: '#0288D1', bg: 'linear-gradient(135deg,#E1F5FE,#B3E5FC)', href: '/messagerie' },
  { id: 'messages-sortants',tkey: 'messagesSortants',icon: MessageCircle,color: '#00838F', bg: 'linear-gradient(135deg,#E0F7FA,#B2EBF2)', href: '/messages-sortants' },

  // ── Qualité ──
  { id: 'incidents-qualite',tkey: 'incidentsQualite',icon: FileWarning,  color: '#E65100', bg: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', href: '/incidents-qualite' },
  { id: 'indicateurs-qualite',tkey: 'indicateursQualite',icon: Gauge,    color: '#1565C0', bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', href: '/indicateurs-qualite' },
  { id: 'declarations-sanitaires',tkey: 'declarationsSanitaires',icon: ShieldAlert,color: '#C62828', bg: 'linear-gradient(135deg,#FFEBEE,#FFCDD2)', href: '/declarations-sanitaires' },
  { id: 'satisfaction',    tkey: 'satisfaction',     icon: Heart,        color: '#F9A825', bg: 'linear-gradient(135deg,#FFFDE7,#FFF9C4)', href: '/satisfaction' },

  // ── Administration ──
  { id: 'plannings-gardes',tkey: 'planningsGardes',  icon: CalendarClock,color: '#6A1B9A', bg: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', href: '/plannings-gardes' },
  { id: 'services-personnalises',tkey: 'servicesPersonnalises',icon: Puzzle,color: '#00695C', bg: 'linear-gradient(135deg,#E0F2F1,#B2DFDB)', href: '/services-personnalises' },
  { id: 'interoperabilite',tkey: 'interoperabilite',  icon: Plug,        color: '#37474F', bg: 'linear-gradient(135deg,#ECEFF1,#CFD8DC)', href: '/interoperabilite' },
];

// ── mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ data, color, fill }: { data: number[]; color: string; fill: string }) {
  const w = 80, h = 32;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* last dot */}
      {(() => {
        const last = data[data.length - 1];
        const lx = w;
        const ly = h - ((last - min) / range) * (h - 4) - 2;
        return <circle cx={lx} cy={ly} r="3" fill={color} />;
      })()}
    </svg>
  );
}

// ── donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EAED" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{pct}%</text>
    </svg>
  );
}

// ── mini bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  const w = 96, h = 36, gap = 3;
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const bh = Math.max(3, (v / max) * (h - 4));
        const x = i * (bw + gap);
        const y = h - bh;
        return (
          <rect key={i} x={x} y={y} width={bw} height={bh} rx="2"
            fill={i === data.length - 1 ? color : color + '55'} />
        );
      })}
    </svg>
  );
}

// ── fake weekly trends ────────────────────────────────────────────────────────
const SPARK_ENCAISSE  = [820000, 940000, 710000, 1050000, 880000, 1200000, 1380000];
const SPARK_PATIENTS  = [42, 38, 55, 47, 61, 53, 68];
const SPARK_URGENCES  = [6, 9, 5, 11, 8, 7, 9];
const BARS_CONSULT    = [14, 18, 12, 22, 19, 25, 21];

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' k';
  return n.toLocaleString('fr-FR');
}
function fmtXof(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M XOF';
  if (n >= 1000) return n.toLocaleString('fr-FR') + ' XOF';
  return n.toLocaleString('fr-FR') + ' XOF';
}

const JOURS_COURT = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];

const ACTIVITES: { time: string; actKey: string; who?: string; whoKey?: string; color: string; icon: string }[] = [
  { time: '08:42', actKey: 'act1', who: 'Dr. Koné', color: '#C62828', icon: '🔴' },
  { time: '08:15', actKey: 'act2', whoKey: 'whoCash', color: '#E65100', icon: '🧾' },
  { time: '07:55', actKey: 'act3', who: 'Dr. Ouédraogo', color: '#6A1B9A', icon: '🔬' },
  { time: '07:30', actKey: 'act4', whoKey: 'whoReception', color: '#1565C0', icon: '👤' },
  { time: '07:10', actKey: 'act5', whoKey: 'whoPharmacy', color: '#2E7D32', icon: '💊' },
];

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const modules: ModuleView[] = MODULES.map(m => ({
    ...m,
    title: t(`mod.${m.tkey}.title`),
    desc: t(`mod.${m.tkey}.desc`),
  }));
  const [user, setUser] = useState<User | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    encaissementJour: 0,
    urgencesActives: 0,
    urgencesCritiques: 0,
    medicamentsRupture: 0,
  });

  useEffect(() => {
    setUser(getCurrentUser());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [caisse, urgences, pharmacie] = await Promise.allSettled([
        apiClient('/paiements/stats-caisse'),
        apiClient('/urgences/stats'),
        apiClient('/pharmacie/stats/jour'),
      ]);
      const c = caisse.status === 'fulfilled' ? (caisse.value as any) : null;
      const u = urgences.status === 'fulfilled' ? (urgences.value as any) : null;
      const p = pharmacie.status === 'fulfilled' ? (pharmacie.value as any) : null;
      setStats({
        encaissementJour:   c?.totalJour    ?? 1_380_000,
        urgencesActives:    u?.actifs       ?? u?.total ?? 9,
        urgencesCritiques:  u?.critiques    ?? 2,
        medicamentsRupture: p?.rupture      ?? 4,
      });
      setLastRefresh(new Date());
    } catch { /* keep defaults */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const hour = now.getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const litOccupancyPct = 72;
  const consultJour = BARS_CONSULT[BARS_CONSULT.length - 1];

  const alertes = [
    ...(stats.urgencesCritiques > 0 ? [{ level: 'danger', text: t('criticalPatients', { n: stats.urgencesCritiques }), href: '/urgences' }] : []),
    ...(stats.medicamentsRupture > 0 ? [{ level: 'warning', text: t('medsOutOfStock', { n: stats.medicamentsRupture }), href: '/pharmacie' }] : []),
    { level: 'info', text: t('realtimeSync'), href: '#' },
  ];

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .dash-kpi:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.13)!important; }
        .mod-card:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(0,0,0,0.13)!important; }
        .quick-btn:hover { opacity:.88; transform:translateY(-1px); }
      `}</style>

      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2E6E 0%, #1565C0 45%, #0097A7 100%)',
        borderRadius: 18, padding: '22px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        boxShadow: '0 8px 32px rgba(13,71,161,0.35)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-40, right:120, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:30,  width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:10,  right:260, width:80,  height:80,  borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:16, zIndex:1 }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', flexShrink:0 }}>
              {getUserInitials(user)}
            </div>
            <div style={{ position:'absolute', bottom:1, right:1, width:12, height:12, borderRadius:'50%', background:'#4ADE80', border:'2px solid #1565C0', animation:'pulse-dot 2s infinite' }} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>
              {greeting}, {user?.firstName ?? t('user')} 👋
            </h1>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>
              {t('heroSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14, zIndex:1 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#fff', fontSize:13, fontWeight:600, letterSpacing:'0.2px' }}>{dateStr}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:22, fontWeight:800, letterSpacing:'1px', marginTop:1 }}>{timeStr}</div>
            {lastRefresh && <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, marginTop:2 }}>{t('refreshedAt', { time: lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) })}</div>}
          </div>
          <button onClick={loadStats} disabled={loading}
            style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:10, color:'#fff', width:38, height:38, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .15s' }}
            title={t('refreshData')}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14, marginBottom:20 }}>

        {/* Encaissements */}
        <div className="dash-kpi" onClick={() => router.push('/caisse')} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', cursor:'pointer', transition:'all .2s', position:'relative', overflow:'hidden', borderBottom:'3px solid #2E7D32' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiEncaissements')}</p>
              <div style={{ fontSize:26, fontWeight:900, color:'#2E7D32', lineHeight:1.1, marginTop:6 }}>
                {loading ? <span style={{display:'inline-block',width:90,height:24,background:'#E8F5E9',borderRadius:4}}/> : fmtXof(stats.encaissementJour)}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
                <TrendingUp size={12} color="#2E7D32"/>
                <span style={{ fontSize:11, color:'#2E7D32', fontWeight:600 }}>{t('vsYesterday')}</span>
              </div>
            </div>
            <div style={{ background:'#E8F5E9', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CreditCard size={20} color="#2E7D32"/>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <Sparkline data={SPARK_ENCAISSE} color="#2E7D32" fill="#E8F5E9" />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
              {JOURS_COURT.map(j => <span key={j} style={{ fontSize:9, color:'#B0BEC5', fontWeight:600 }}>{j}</span>)}
            </div>
          </div>
        </div>

        {/* Urgences */}
        <div className="dash-kpi" onClick={() => router.push('/urgences')} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', cursor:'pointer', transition:'all .2s', borderBottom:'3px solid #C62828' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiUrgences')}</p>
              <div style={{ fontSize:26, fontWeight:900, color:'#C62828', lineHeight:1.1, marginTop:6 }}>
                {loading ? <span style={{display:'inline-block',width:40,height:24,background:'#FFEBEE',borderRadius:4}}/> : stats.urgencesActives}
              </div>
              {stats.urgencesCritiques > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#C62828', display:'inline-block', animation:'pulse-dot 1s infinite' }}/>
                  <span style={{ fontSize:11, color:'#C62828', fontWeight:700 }}>{t('critical', { n: stats.urgencesCritiques })}</span>
                </div>
              )}
            </div>
            <div style={{ background:'#FFEBEE', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Siren size={20} color="#C62828"/>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <Sparkline data={SPARK_URGENCES} color="#C62828" fill="#FFEBEE" />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
              {JOURS_COURT.map(j => <span key={j} style={{ fontSize:9, color:'#B0BEC5', fontWeight:600 }}>{j}</span>)}
            </div>
          </div>
        </div>

        {/* Occupation lits */}
        <div className="dash-kpi" onClick={() => router.push('/hospitalisation')} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', cursor:'pointer', transition:'all .2s', borderBottom:'3px solid #1565C0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiOccupation')}</p>
              <div style={{ fontSize:26, fontWeight:900, color:'#1565C0', lineHeight:1.1, marginTop:6 }}>{litOccupancyPct}%</div>
              <div style={{ fontSize:11, color:'#546E7A', marginTop:5 }}>{t('bedsOccupied')}</div>
            </div>
            <DonutChart pct={litOccupancyPct} color="#1565C0" size={72} />
          </div>
          <div style={{ marginTop:10, background:'#E3F2FD', borderRadius:6, height:6, overflow:'hidden' }}>
            <div style={{ width:`${litOccupancyPct}%`, height:'100%', background:'linear-gradient(90deg,#1565C0,#0288D1)', borderRadius:6, transition:'width 1s ease' }}/>
          </div>
        </div>

        {/* Consultations du jour */}
        <div className="dash-kpi" onClick={() => router.push('/consultations')} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', cursor:'pointer', transition:'all .2s', borderBottom:'3px solid #00838F' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiConsultations')}</p>
              <div style={{ fontSize:26, fontWeight:900, color:'#00838F', lineHeight:1.1, marginTop:6 }}>{consultJour}</div>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
                <TrendingUp size={12} color="#00838F"/>
                <span style={{ fontSize:11, color:'#00838F', fontWeight:600 }}>{t('vsWeek')}</span>
              </div>
            </div>
            <div style={{ background:'#E0F7FA', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Stethoscope size={20} color="#00838F"/>
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <MiniBarChart data={BARS_CONSULT} color="#00838F" />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
              {JOURS_COURT.map(j => <span key={j} style={{ fontSize:9, color:'#B0BEC5', fontWeight:600 }}>{j}</span>)}
            </div>
          </div>
        </div>

        {/* Pharmacie rupture */}
        <div className="dash-kpi" onClick={() => router.push('/pharmacie')} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', cursor:'pointer', transition:'all .2s', borderBottom:'3px solid #E65100' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#546E7A', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiRupture')}</p>
              <div style={{ fontSize:26, fontWeight:900, color: stats.medicamentsRupture > 0 ? '#E65100' : '#2E7D32', lineHeight:1.1, marginTop:6 }}>
                {loading ? <span style={{display:'inline-block',width:40,height:24,background:'#FFF3E0',borderRadius:4}}/> : stats.medicamentsRupture}
              </div>
              <div style={{ fontSize:11, color:'#546E7A', marginTop:5 }}>
                {stats.medicamentsRupture > 0 ? t('restockRequired') : t('stockOptimal')}
              </div>
            </div>
            <div style={{ background:'#FFF3E0', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Pill size={20} color="#E65100"/>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['Paracétamol','Amoxicilline','Ibuprofène','Oméprazole'].map((m,i) => (
                <span key={i} style={{ fontSize:9, background:'#FFF3E0', color:'#E65100', padding:'2px 6px', borderRadius:8, fontWeight:600, whiteSpace:'nowrap' }}>{m}</span>
              )).slice(0, stats.medicamentsRupture || 0)}
              {stats.medicamentsRupture === 0 && <span style={{ fontSize:10, color:'#2E7D32', fontWeight:600 }}>{t('noStockout')}</span>}
            </div>
          </div>
        </div>

        {/* Modules actifs */}
        <div className="dash-kpi" onClick={() => router.push('/reporting')} style={{ background:'linear-gradient(135deg,#0A2E6E,#1565C0)', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(13,71,161,0.25)', cursor:'pointer', transition:'all .2s', borderBottom:'3px solid #0288D1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ margin:0, fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.6px' }}>{t('kpiModules')}</p>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', lineHeight:1.1, marginTop:6 }}>{MODULES.length}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:5 }}>{t('systemOperational')}</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.15)', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <BarChart2 size={20} color="#fff"/>
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {[...Array(MODULES.length)].map((_,i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:2, background: '#4ADE80' }}/>
              ))}
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:5 }}>{t('modulesOnline', { n: MODULES.length })}</div>
          </div>
        </div>

      </div>

      {/* ── ALERTES + ACTIVITÉ RÉCENTE ──────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

        {/* Alertes */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F0F4FA', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'#FFEBEE', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AlertTriangle size={14} color="#C62828"/>
            </div>
            <span style={{ fontWeight:700, fontSize:13, color:'#1A2332' }}>{t('systemAlerts')}</span>
            <span style={{ marginLeft:'auto', background:'#FFEBEE', color:'#C62828', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20 }}>
              {t('urgentCount', { n: alertes.filter(a=>a.level==='danger').length })}
            </span>
          </div>
          <div style={{ padding:'8px 10px' }}>
            {alertes.map((a, i) => (
              <a key={i} href={a.href} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 10px', borderRadius:10, textDecoration:'none', marginBottom:3, borderLeft:`3px solid ${a.level==='danger'?'#C62828':a.level==='warning'?'#E65100':'#1565C0'}`, background:a.level==='danger'?'#FFF5F5':a.level==='warning'?'#FFF8F0':'#F0F6FF' }}
                onMouseEnter={e=>(e.currentTarget.style.opacity='.8')}
                onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                <span style={{ fontSize:16 }}>{a.level==='danger'?'🔴':a.level==='warning'?'🟡':'🔵'}</span>
                <span style={{ fontSize:12, color:'#37474F', flex:1, fontWeight:500, lineHeight:1.4 }}>{a.text}</span>
                <ChevronRight size={13} color="#B0BEC5"/>
              </a>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #F0F4FA', display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'#E3F2FD', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Activity size={14} color="#1565C0"/>
            </div>
            <span style={{ fontWeight:700, fontSize:13, color:'#1A2332' }}>{t('recentActivity')}</span>
            <span style={{ marginLeft:'auto', fontSize:10, color:'#90A4AE', fontWeight:600 }}>{t('thisMorning')}</span>
          </div>
          <div style={{ padding:'6px 10px' }}>
            {ACTIVITES.map((a, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, marginBottom:2 }}
                onMouseEnter={e=>(e.currentTarget.style.background='#F8FAFC')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <span style={{ fontSize:15, flexShrink:0 }}>{a.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:'#37474F', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t(a.actKey)}</div>
                  <div style={{ fontSize:10, color:'#90A4AE', marginTop:1 }}>{a.whoKey ? t(a.whoKey) : a.who}</div>
                </div>
                <div style={{ fontSize:10, color:'#90A4AE', fontWeight:600, flexShrink:0 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── GRILLE MODULES ──────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 10px rgba(0,0,0,0.07)', padding:'20px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <h2 style={{ margin:0, fontSize:15, fontWeight:800, color:'#1A2332' }}>{t('modulesTitle')}</h2>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#90A4AE' }}>{t('modulesAvailable', { n: MODULES.length })}</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'#E8F5E9', padding:'5px 12px', borderRadius:20 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', animation:'pulse-dot 2s infinite' }}/>
            <span style={{ fontSize:11, color:'#2E7D32', fontWeight:700 }}>{t('allOperational')}</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
          {modules.map(mod => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => router.push(mod.href)} />
          ))}
        </div>
      </div>

      {/* ── ACCÈS RAPIDES ───────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#0A2E6E 0%,#1565C0 60%,#0097A7 100%)', borderRadius:16, padding:'20px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:60, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-40, right:200, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
        <p style={{ margin:'0 0 14px', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'1px' }}>
          {t('quickAccess')}
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {[
            { label:t('qNewPatient'),      href:'/patients/nouveau',       color:'#fff', bg:'rgba(255,255,255,0.15)', icon:'👤' },
            { label:t('qConsultation'),          href:'/consultations/nouvelle', color:'#fff', bg:'rgba(255,255,255,0.12)', icon:'🩺' },
            { label:t('qAdmitEmergency'),      href:'/urgences',               color:'#FFCDD2', bg:'rgba(198,40,40,0.35)', icon:'🚨' },
            { label:t('qNewInvoice'),      href:'/facturation/nouvelle',   color:'#FFE0B2', bg:'rgba(230,81,0,0.35)',  icon:'🧾' },
            { label:t('qLabOrder'),       href:'/laboratoire/demandes/nouvelle', color:'#E1BEE7', bg:'rgba(106,27,154,0.35)', icon:'🔬' },
            { label:t('qReports'),             href:'/reporting',              color:'#B3E5FC', bg:'rgba(2,136,209,0.35)', icon:'' },
          ].map(item => (
            <a key={item.href} href={item.href} className="quick-btn"
              style={{ padding:'9px 16px', borderRadius:22, background:item.bg, color:item.color, fontSize:12, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6, border:'1px solid rgba(255,255,255,0.15)', transition:'all .15s', backdropFilter:'blur(4px)' }}>
              {item.icon && <span style={{ fontSize:14 }}>{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}

function ModuleCard({ mod, onClick }: { mod: ModuleView; onClick: () => void }) {
  const t = useTranslations('dashboard');
  const [hov, setHov] = useState(false);
  const Icon = mod.icon;
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key==='Enter'&&onClick()}
      className="mod-card"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:12, cursor:'pointer', transition:'all .2s', overflow:'hidden',
        background: hov ? mod.bg : '#FAFBFD',
        boxShadow: hov ? '0 10px 30px rgba(0,0,0,0.1)' : '0 1px 5px rgba(0,0,0,0.06)',
        border: `1px solid ${hov ? mod.color + '40' : '#EAECEF'}`,
        transform: hov ? 'translateY(-3px)' : 'none',
      }}>
      <div style={{ padding:'14px 14px 10px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ width:38, height:38, borderRadius:10, background: hov ? mod.color : '#fff', border:`1.5px solid ${mod.color}33`, display:'flex', alignItems:'center', justifyContent:'center', transition:'background .2s', boxShadow: hov ? `0 4px 12px ${mod.color}40` : 'none' }}>
          <Icon size={18} color={hov ? '#fff' : mod.color} />
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:12, color: hov ? mod.color : '#1A2332', lineHeight:1.3 }}>{mod.title}</div>
          <div style={{ fontSize:10, color:'#90A4AE', marginTop:2 }}>{mod.desc}</div>
        </div>
      </div>
      <div style={{ padding:'6px 14px 10px', display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:10, color: hov ? mod.color : '#90A4AE', fontWeight:600 }}>{t('access')}</span>
        <ChevronRight size={11} color={hov ? mod.color : '#B0BEC5'} />
      </div>
    </div>
  );
}
