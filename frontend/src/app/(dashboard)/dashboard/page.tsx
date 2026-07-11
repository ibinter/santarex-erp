'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getFullName, getUserInitials } from '@/lib/auth';
import type { User } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KPI {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface ModuleData {
  id: string;
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat2Alert?: boolean;
  href: string;
}

interface Alert {
  icon: string;
  level: 'danger' | 'warning' | 'info' | 'success';
  text: string;
  href: string;
}

interface Activity {
  initials: string;
  avatarColor: string;
  text: string;
  time: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const kpis: KPI[] = [
  { icon: '🛏️', value: '87/120', label: 'Lits occupés', color: '#1565C0' },
  { icon: '👥', value: '247', label: 'Patients actifs', color: '#0D47A1' },
  { icon: '💰', value: '4.2M XOF', label: "Recettes aujourd'hui", color: '#2E7D32' },
  { icon: '🚨', value: '3', label: 'Urgences actives', color: '#C62828' },
];

const modules: ModuleData[] = [
  {
    id: 'patients',
    title: 'PATIENTS',
    icon: '👤',
    color: '#0D47A1',
    bgColor: '#EFF6FF',
    borderColor: '#0D47A1',
    stat1Value: '1 247',
    stat1Label: 'Patients actifs',
    stat2Value: '+12',
    stat2Label: "Nouveaux aujourd'hui",
    href: '/patients',
  },
  {
    id: 'rendez-vous',
    title: 'RENDEZ-VOUS',
    icon: '📅',
    color: '#00838F',
    bgColor: '#E0F7FA',
    borderColor: '#00838F',
    stat1Value: '48',
    stat1Label: "RDV aujourd'hui",
    stat2Value: '5',
    stat2Label: 'En attente confirmation',
    stat2Alert: true,
    href: '/rendez-vous',
  },
  {
    id: 'hospitalisation',
    title: 'HOSPITALISATION',
    icon: '🛏️',
    color: '#1565C0',
    bgColor: '#E3F2FD',
    borderColor: '#1565C0',
    stat1Value: '87/120',
    stat1Label: 'Lits (73%)',
    stat2Value: '4',
    stat2Label: 'Sorties prévues',
    href: '/hospitalisation',
  },
  {
    id: 'pharmacie',
    title: 'PHARMACIE',
    icon: '💊',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
    borderColor: '#2E7D32',
    stat1Value: '2 483',
    stat1Label: 'Références en stock',
    stat2Value: '⚠️ 12',
    stat2Label: 'En rupture',
    stat2Alert: true,
    href: '/pharmacie',
  },
  {
    id: 'laboratoire',
    title: 'LABORATOIRE',
    icon: '🔬',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    borderColor: '#6A1B9A',
    stat1Value: '34',
    stat1Label: 'Analyses du jour',
    stat2Value: '8',
    stat2Label: 'Résultats critiques',
    stat2Alert: true,
    href: '/laboratoire',
  },
  {
    id: 'facturation',
    title: 'FACTURATION',
    icon: '💰',
    color: '#E65100',
    bgColor: '#FFF3E0',
    borderColor: '#E65100',
    stat1Value: '156',
    stat1Label: 'Factures du mois',
    stat2Value: '23',
    stat2Label: 'Impayées',
    stat2Alert: true,
    href: '/caisse',
  },
  {
    id: 'urgences',
    title: 'URGENCES',
    icon: '🚑',
    color: '#C62828',
    bgColor: '#FFEBEE',
    borderColor: '#C62828',
    stat1Value: '12',
    stat1Label: 'Patients actifs',
    stat2Value: '🔴 2',
    stat2Label: 'Critiques',
    stat2Alert: true,
    href: '/urgences',
  },
  {
    id: 'consultations',
    title: 'CONSULTATIONS',
    icon: '🩺',
    color: '#00838F',
    bgColor: '#E0F7FA',
    borderColor: '#00ACC1',
    stat1Value: '89',
    stat1Label: 'Total consultations',
    stat2Value: '31',
    stat2Label: "Aujourd'hui",
    href: '/consultations',
  },
];

const alerts: Alert[] = [
  { icon: '🔴', level: 'danger', text: '[URGENT] Stock Ténofovir en rupture', href: '/pharmacie' },
  { icon: '🟠', level: 'warning', text: '[STOCK] Fluconazole sous le seuil critique', href: '/pharmacie' },
  { icon: '🔵', level: 'info', text: '[RDV] 5 rendez-vous non confirmés', href: '/rendez-vous' },
  { icon: '🟢', level: 'success', text: '[LABO] 3 résultats prêts à valider', href: '/laboratoire' },
  { icon: '🔴', level: 'danger', text: '[URGENCE] Patient critique en salle 3', href: '/urgences' },
  { icon: '🟠', level: 'warning', text: '[FACTURE] 23 factures impayées ce mois', href: '/caisse' },
  { icon: '🔵', level: 'info', text: '[LABO] 8 analyses en attente > 2h', href: '/laboratoire' },
  { icon: '🟢', level: 'success', text: '[HOSP] 4 sorties prévues aujourd\'hui', href: '/hospitalisation' },
];

const activities: Activity[] = [
  { initials: 'AD', avatarColor: '#0D47A1', text: 'Dr. Amara Diallo a créé une consultation pour Konan Marie-Ange', time: 'il y a 5 min' },
  { initials: 'CB', avatarColor: '#2E7D32', text: 'Célestine Bamba a encaissé 45 000 XOF pour Ibrahim Traoré', time: 'il y a 12 min' },
  { initials: 'AB', avatarColor: '#6A1B9A', text: 'Ahmed Ben Salah a dispensé une ordonnance pour Emmanuel Yao', time: 'il y a 18 min' },
  { initials: 'FK', avatarColor: '#E65100', text: 'Fatou Koné a admis un patient en hospitalisation (Lit 23B)', time: 'il y a 24 min' },
  { initials: 'MO', avatarColor: '#00838F', text: 'Dr. Moussa Ouédraogo a validé 3 résultats de laboratoire', time: 'il y a 31 min' },
  { initials: 'AS', avatarColor: '#C62828', text: 'Awa Sanogo a pris en charge une urgence — Triange rouge', time: 'il y a 45 min' },
  { initials: 'KT', avatarColor: '#1565C0', text: 'Kofi Tetteh a enregistré un nouveau patient : Bah Mariama', time: 'il y a 52 min' },
  { initials: 'NB', avatarColor: '#37474F', text: 'Nathalie Bogui a généré le rapport mensuel d\'activité', time: 'il y a 1h 05' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flex: '1 1 200px',
        minWidth: '0',
      }}
    >
      <span style={{ fontSize: '28px', flexShrink: 0 }}>{kpi.icon}</span>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, lineHeight: 1.1 }}>
          {kpi.value}
        </div>
        <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>{kpi.label}</div>
      </div>
    </div>
  );
}

function ModuleCardItem({ mod, onNavigate }: { mod: ModuleData; onNavigate: (href: string) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(mod.href)}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(mod.href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.12)'
          : '0 1px 6px rgba(0,0,0,0.07)',
        borderLeft: `4px solid ${mod.borderColor}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
      aria-label={`Accéder au module ${mod.title}`}
    >
      {/* Header */}
      <div
        style={{
          background: mod.bgColor,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '22px' }}>{mod.icon}</span>
        <span style={{ fontWeight: 700, fontSize: '13px', color: mod.color, letterSpacing: '0.5px' }}>
          {mod.title}
        </span>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#0D47A1', lineHeight: 1 }}>
            {mod.stat1Value}
          </div>
          <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>{mod.stat1Label}</div>
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: mod.stat2Alert ? '#C62828' : '#37474F', lineHeight: 1 }}>
            {mod.stat2Value}
          </div>
          <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px' }}>{mod.stat2Label}</div>
        </div>
      </div>
    </div>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  const colorMap = {
    danger: '#C62828',
    warning: '#F57F17',
    info: '#1565C0',
    success: '#2E7D32',
  };

  return (
    <a
      href={alert.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: '#F5F7FA',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#F5F7FA')}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{alert.icon}</span>
      <span style={{ fontSize: '12px', color: colorMap[alert.level], flex: 1, fontWeight: 500 }}>
        {alert.text}
      </span>
      <span style={{ color: '#90A4AE', fontSize: '14px' }}>›</span>
    </a>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: activity.avatarColor,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {activity.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', color: '#37474F', lineHeight: 1.5, margin: 0 }}>{activity.text}</p>
        <p style={{ fontSize: '11px', color: '#90A4AE', margin: '2px 0 0' }}>{activity.time}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setUser(getCurrentUser());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const firstName = user?.firstName || 'Utilisateur';
  const roleName = (user as unknown as Record<string, unknown>)?.role as string || 'Utilisateur';
  const initials = getUserInitials(user);
  const fullName = getFullName(user) || 'Utilisateur';

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', background: '#F5F7FA', minHeight: '100vh' }}>

      {/* ── Zone Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 20px rgba(13,71,161,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>
              {greeting}, {firstName} 👋
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              SANTAREX ERP — Hôpital Central
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>{dateStr}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '2px' }}>{timeStr}</div>
          </div>
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '20px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {roleName}
          </span>
        </div>
      </div>

      {/* ── Barre KPI ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        {kpis.map((kpi, i) => (
          <KPICard key={i} kpi={kpi} />
        ))}
      </div>

      {/* ── Grille modules + Alertes ───────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px',
          marginBottom: '24px',
          alignItems: 'start',
        }}
      >
        {/* Modules grid 4×2 */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#37474F', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Modules de gestion
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
          >
            {modules.map((mod) => (
              <ModuleCardItem key={mod.id} mod={mod} onNavigate={(href) => router.push(href)} />
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            padding: '20px',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: '#37474F' }}>
            🔔 Alertes en cours
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.map((alert, i) => (
              <AlertItem key={i} alert={alert} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Activité récente ───────────────────────────────────────────────── */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
          padding: '20px 24px',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: '#37474F' }}>
          🕐 Activité récente
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {activities.map((act, i) => (
            <ActivityItem key={i} activity={act} />
          ))}
        </div>
      </div>

    </div>
  );
}
