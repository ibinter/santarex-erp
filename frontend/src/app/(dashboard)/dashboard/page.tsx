'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getFullName, getUserInitials } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';
import {
  Users, Calendar, BedDouble, Scissors, Siren, Scan,
  FlaskConical, Pill, Receipt, CreditCard, Building2,
  UserCog, BarChart2, Stethoscope, TrendingUp, TrendingDown,
  AlertTriangle, Clock, ArrowRight, RefreshCw,
} from 'lucide-react';

// ─── Grille modules ────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'patients', title: 'Patients', icon: <Users size={20} />, color: '#0D47A1', bg: '#EFF6FF', href: '/patients' },
  { id: 'consultations', title: 'Consultations', icon: <Stethoscope size={20} />, color: '#00838F', bg: '#E0F7FA', href: '/consultations' },
  { id: 'rendez-vous', title: 'Rendez-vous', icon: <Calendar size={20} />, color: '#1565C0', bg: '#E3F2FD', href: '/rendez-vous' },
  { id: 'hospitalisation', title: 'Hospitalisation', icon: <BedDouble size={20} />, color: '#1565C0', bg: '#E3F2FD', href: '/hospitalisation' },
  { id: 'bloc-operatoire', title: 'Bloc Opératoire', icon: <Scissors size={20} />, color: '#37474F', bg: '#ECEFF1', href: '/bloc-operatoire' },
  { id: 'urgences', title: 'Urgences', icon: <Siren size={20} />, color: '#C62828', bg: '#FFEBEE', href: '/urgences' },
  { id: 'imagerie', title: 'Imagerie', icon: <Scan size={20} />, color: '#00695C', bg: '#E0F2F1', href: '/imagerie' },
  { id: 'laboratoire', title: 'Laboratoire', icon: <FlaskConical size={20} />, color: '#6A1B9A', bg: '#F3E5F5', href: '/laboratoire' },
  { id: 'pharmacie', title: 'Pharmacie', icon: <Pill size={20} />, color: '#2E7D32', bg: '#E8F5E9', href: '/pharmacie' },
  { id: 'facturation', title: 'Facturation', icon: <Receipt size={20} />, color: '#E65100', bg: '#FFF3E0', href: '/facturation' },
  { id: 'caisse', title: 'Caisse', icon: <CreditCard size={20} />, color: '#2E7D32', bg: '#E8F5E9', href: '/caisse' },
  { id: 'comptabilite', title: 'Comptabilité', icon: <Building2 size={20} />, color: '#0D47A1', bg: '#EFF6FF', href: '/comptabilite' },
  { id: 'rh', title: 'Ressources Humaines', icon: <UserCog size={20} />, color: '#37474F', bg: '#ECEFF1', href: '/rh' },
  { id: 'reporting', title: 'Reporting & BI', icon: <BarChart2 size={20} />, color: '#1565C0', bg: '#E3F2FD', href: '/reporting' },
];

interface DashStats {
  totalPatients: number;
  patientsAujourdhui: number;
  rdvEnAttente: number;
  litsOccupes: number;
  litsTotal: number;
  urgencesActives: number;
  urgencesCritiques: number;
  facturesImpayees: number;
  ordonnancesAValider: number;
  resultatsLaboEnAttente: number;
  examenImagirie: number;
  encaissementJour: number;
  medicamentsRupture: number;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + 'M XOF';
  if (n >= 1000) return n.toLocaleString('fr-FR') + ' XOF';
  return n.toLocaleString('fr-FR');
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState<Partial<DashStats>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const t = setInterval(() => setNow(new Date()), 60000);
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

      const caisseData = caisse.status === 'fulfilled' ? caisse.value as any : null;
      const urgencesData = urgences.status === 'fulfilled' ? urgences.value as any : null;
      const pharmacieData = pharmacie.status === 'fulfilled' ? pharmacie.value as any : null;

      setStats({
        encaissementJour: caisseData?.totalJour ?? 0,
        urgencesActives: urgencesData?.actifs ?? urgencesData?.total ?? 0,
        urgencesCritiques: urgencesData?.critiques ?? 0,
        medicamentsRupture: pharmacieData?.rupture ?? 0,
      });
      setLastRefresh(new Date());
    } catch {
      // silently ignore — UI shows zeros
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const kpis = [
    { label: 'Urgences actives', value: stats.urgencesActives ?? '—', trend: stats.urgencesCritiques ? `${stats.urgencesCritiques} critiques` : null, up: false, color: '#C62828', bg: '#FFEBEE', icon: <Siren size={22} color="#C62828" />, href: '/urgences' },
    { label: 'Encaissements du jour', value: stats.encaissementJour != null ? fmt(stats.encaissementJour) : '—', trend: null, up: true, color: '#2E7D32', bg: '#E8F5E9', icon: <CreditCard size={22} color="#2E7D32" />, href: '/caisse' },
    { label: 'Médicaments en rupture', value: stats.medicamentsRupture ?? '—', trend: stats.medicamentsRupture ? 'Stock critique' : null, up: false, color: '#E65100', bg: '#FFF3E0', icon: <Pill size={22} color="#E65100" />, href: '/pharmacie' },
    { label: 'Modules actifs', value: MODULES.length, trend: null, up: null, color: '#0D47A1', bg: '#EFF6FF', icon: <BarChart2 size={22} color="#0D47A1" />, href: '/reporting' },
  ];

  const alertes = [
    ...(stats.urgencesCritiques ? [{ level: 'danger', icon: '🔴', text: `[URGENCE] ${stats.urgencesCritiques} patient(s) critique(s)`, href: '/urgences' }] : []),
    ...(stats.medicamentsRupture ? [{ level: 'warning', icon: '🟠', text: `[STOCK] ${stats.medicamentsRupture} médicament(s) en rupture`, href: '/pharmacie' }] : []),
    { level: 'info', icon: '🔵', text: '[SYSTÈME] Données temps réel activées', href: '#' },
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* ─── Header banner ───────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #00838F 100%)',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(13,71,161,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {getUserInitials(user)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {greeting}, {user?.firstName || 'Utilisateur'} 👋
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              SANTAREX ERP — Tableau de bord
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{dateStr}</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '1px' }}>{timeStr}</div>
            {lastRefresh && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', marginTop: '2px' }}>Actualisé à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Actualiser"
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ─── KPI Grid ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {kpis.map((k, i) => (
          <a key={i} href={k.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '14px 16px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderTop: `3px solid ${k.color}`,
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {k.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>
                  {loading ? <span style={{ display: 'inline-block', width: 48, height: 20, background: '#F0F0F0', borderRadius: 4 }} /> : k.value}
                </div>
                <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.label}</div>
                {k.trend && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    {k.up === false && <TrendingDown size={10} color="#C62828" />}
                    {k.up === true && <TrendingUp size={10} color="#2E7D32" />}
                    <span style={{ fontSize: '10px', color: k.up === false ? '#C62828' : '#2E7D32', fontWeight: 600 }}>{k.trend}</span>
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* ─── Alertes temps réel ────────────────────────────────── */}
      {alertes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F7FA', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#F57F17" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#37474F' }}>Alertes</span>
            <span style={{ marginLeft: 'auto', background: '#FFEBEE', color: '#C62828', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
              {alertes.filter(a => a.level === 'danger').length} urgente(s)
            </span>
          </div>
          <div style={{ padding: '6px 8px' }}>
            {alertes.map((a, i) => (
              <a key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', marginBottom: '2px' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: '12px', color: a.level === 'danger' ? '#C62828' : a.level === 'warning' ? '#E65100' : '#1565C0', flex: 1, fontWeight: 500 }}>{a.text}</span>
                <ArrowRight size={11} color="#B0BEC5" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modules grid ──────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#37474F', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Modules de gestion
          </h2>
          <span style={{ fontSize: '11px', color: '#90A4AE' }}>{MODULES.length} modules</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '10px',
        }}>
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => router.push(mod.href)} />
          ))}
        </div>
      </div>

      {/* ─── Accès rapides rôle-spécifiques ───────────────────── */}
      <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', border: '1px solid #BFDBFE' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Accès rapides
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'Nouveau patient', href: '/patients/nouveau', color: '#0D47A1' },
            { label: 'Nouvelle consultation', href: '/consultations/nouvelle', color: '#00838F' },
            { label: 'Admettre urgence', href: '/urgences', color: '#C62828' },
            { label: 'Nouvelle facture', href: '/facturation/nouvelle', color: '#E65100' },
            { label: 'Stock pharmacie', href: '/pharmacie', color: '#2E7D32' },
            { label: 'Rapports', href: '/reporting', color: '#6A1B9A' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                background: '#fff',
                border: `1px solid ${item.color}22`,
                color: item.color,
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = `${item.color}11`)}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}

function ModuleCard({ mod, onClick }: { mod: typeof MODULES[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '10px',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${mod.color}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        border: `1px solid ${hovered ? mod.color + '40' : '#F0F0F0'}`,
      }}
    >
      <div style={{ padding: '10px 12px', background: mod.bg, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: mod.color }}>{mod.icon}</span>
        <span style={{ fontWeight: 700, fontSize: '10px', color: mod.color, letterSpacing: '0.2px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
      </div>
      <div style={{ padding: '8px 12px' }}>
        <div style={{ fontSize: '10px', color: '#90A4AE', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowRight size={10} />
          <span>Accéder</span>
        </div>
      </div>
    </div>
  );
}
