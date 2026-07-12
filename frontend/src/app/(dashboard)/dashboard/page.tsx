'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getFullName, getUserInitials } from '@/lib/auth';
import type { User } from '@/types';
import {
  Users, Calendar, BedDouble, Scissors, Siren, Scan,
  FlaskConical, Pill, Receipt, CreditCard, Building2,
  UserCog, BarChart2, Stethoscope, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, ArrowRight,
} from 'lucide-react';

// ─── KPI Cards ────────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Patients aujourd\'hui', value: '128', trend: '+12%', up: true, color: '#0D47A1', bg: '#EFF6FF', icon: <Users size={22} color="#0D47A1" /> },
  { label: 'Lits occupés', value: '87/120', trend: '73%', up: null, color: '#1565C0', bg: '#E3F2FD', icon: <BedDouble size={22} color="#1565C0" /> },
  { label: 'Rendez-vous en attente', value: '36', trend: '+8%', up: true, color: '#00838F', bg: '#E0F7FA', icon: <Calendar size={22} color="#00838F" /> },
  { label: 'Encaissements du jour', value: '58,4M XOF', trend: '+18%', up: true, color: '#2E7D32', bg: '#E8F5E9', icon: <CreditCard size={22} color="#2E7D32" /> },
  { label: 'Ordonnances à valider', value: '23', trend: '-5%', up: false, color: '#E65100', bg: '#FFF3E0', icon: <Pill size={22} color="#E65100" /> },
  { label: 'Résultats labo en attente', value: '18', trend: '+10%', up: false, color: '#6A1B9A', bg: '#F3E5F5', icon: <FlaskConical size={22} color="#6A1B9A" /> },
  { label: 'Examens imagerie', value: '12', trend: 'Stable', up: null, color: '#00695C', bg: '#E0F2F1', icon: <Scan size={22} color="#00695C" /> },
  { label: 'Factures impayées', value: '24', trend: '+15%', up: false, color: '#C62828', bg: '#FFEBEE', icon: <Receipt size={22} color="#C62828" /> },
];

// ─── Module grid ──────────────────────────────────────────────────────────────

const modules = [
  { id: 'patients', title: 'Patients', icon: <Users size={20} />, color: '#0D47A1', bg: '#EFF6FF', stat: '1 247 actifs', sub: '+12 aujourd\'hui', href: '/patients' },
  { id: 'consultations', title: 'Consultations', icon: <Stethoscope size={20} />, color: '#00838F', bg: '#E0F7FA', stat: '89 ce mois', sub: '31 aujourd\'hui', href: '/consultations' },
  { id: 'rendez-vous', title: 'Rendez-vous', icon: <Calendar size={20} />, color: '#1565C0', bg: '#E3F2FD', stat: '48 prévus', sub: '5 en attente', alert: true, href: '/rendez-vous' },
  { id: 'hospitalisation', title: 'Hospitalisation', icon: <BedDouble size={20} />, color: '#1565C0', bg: '#E3F2FD', stat: '87 / 120 lits', sub: '4 sorties prévues', href: '/hospitalisation' },
  { id: 'bloc-operatoire', title: 'Bloc Opératoire', icon: <Scissors size={20} />, color: '#37474F', bg: '#ECEFF1', stat: '5 interventions', sub: '2 programmées', href: '/bloc-operatoire' },
  { id: 'urgences', title: 'Urgences', icon: <Siren size={20} />, color: '#C62828', bg: '#FFEBEE', stat: '12 actifs', sub: '🔴 2 critiques', alert: true, href: '/urgences' },
  { id: 'imagerie', title: 'Imagerie', icon: <Scan size={20} />, color: '#00695C', bg: '#E0F2F1', stat: '12 examens', sub: '3 en attente', href: '/imagerie' },
  { id: 'laboratoire', title: 'Laboratoire', icon: <FlaskConical size={20} />, color: '#6A1B9A', bg: '#F3E5F5', stat: '34 analyses', sub: '8 résultats critiques', alert: true, href: '/laboratoire' },
  { id: 'pharmacie', title: 'Pharmacie', icon: <Pill size={20} />, color: '#2E7D32', bg: '#E8F5E9', stat: '2 483 références', sub: '⚠️ 12 en rupture', alert: true, href: '/pharmacie' },
  { id: 'facturation', title: 'Facturation', icon: <Receipt size={20} />, color: '#E65100', bg: '#FFF3E0', stat: '156 factures/mois', sub: '23 impayées', alert: true, href: '/facturation' },
  { id: 'caisse', title: 'Caisse', icon: <CreditCard size={20} />, color: '#2E7D32', bg: '#E8F5E9', stat: '58,4M XOF', sub: 'encaissés aujourd\'hui', href: '/caisse' },
  { id: 'comptabilite', title: 'Comptabilité', icon: <Building2 size={20} />, color: '#0D47A1', bg: '#EFF6FF', stat: '3 écritures', sub: 'en attente validation', href: '/comptabilite' },
  { id: 'rh', title: 'Ressources Humaines', icon: <UserCog size={20} />, color: '#37474F', bg: '#ECEFF1', stat: '142 employés', sub: '3 congés ce jour', href: '/rh' },
  { id: 'reporting', title: 'Reporting & BI', icon: <BarChart2 size={20} />, color: '#1565C0', bg: '#E3F2FD', stat: 'Rapport mensuel', sub: 'Disponible', href: '/reporting' },
];

const alertes = [
  { level: 'danger', icon: '🔴', text: '[URGENT] Stock Ténofovir en rupture', href: '/pharmacie' },
  { level: 'warning', icon: '🟠', text: '[STOCK] Fluconazole sous seuil critique', href: '/pharmacie' },
  { level: 'danger', icon: '🔴', text: '[URGENCE] Patient critique — Salle 3', href: '/urgences' },
  { level: 'info', icon: '🔵', text: '[RDV] 5 rendez-vous non confirmés', href: '/rendez-vous' },
  { level: 'warning', icon: '🟠', text: '[LABO] 8 analyses en attente > 2h', href: '/laboratoire' },
  { level: 'success', icon: '🟢', text: '[HOSP] 4 sorties prévues aujourd\'hui', href: '/hospitalisation' },
  { level: 'warning', icon: '🟠', text: '[FACTURE] 23 factures impayées', href: '/facturation' },
  { level: 'info', icon: '🔵', text: '[LABO] 3 résultats prêts à valider', href: '/laboratoire' },
];

const activities = [
  { initials: 'AD', color: '#0D47A1', text: 'Dr. Amara Diallo — Consultation Konan Marie-Ange', time: 'il y a 5 min' },
  { initials: 'CB', color: '#2E7D32', text: 'Célestine Bamba — Encaissement 45 000 XOF', time: 'il y a 12 min' },
  { initials: 'AB', color: '#6A1B9A', text: 'Ahmed Ben Salah — Dispensation ordonnance', time: 'il y a 18 min' },
  { initials: 'FK', color: '#E65100', text: 'Fatou Koné — Admission hospitalisation Lit 23B', time: 'il y a 24 min' },
  { initials: 'MO', color: '#00838F', text: 'Dr. Moussa Ouédraogo — Validation 3 résultats labo', time: 'il y a 31 min' },
  { initials: 'AS', color: '#C62828', text: 'Awa Sanogo — Prise en charge urgence triage rouge', time: 'il y a 45 min' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setUser(getCurrentUser());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* ─── Header banner ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #00838F 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(13,71,161,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: '#fff',
          }}>
            {getUserInitials(user)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#fff' }}>
              {greeting}, {user?.firstName || 'Utilisateur'} 👋
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              SANTAREX ERP — Tableau de bord principal
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{dateStr}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '2px' }}>{timeStr}</div>
          <span style={{
            display: 'inline-block', marginTop: '6px',
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', fontSize: '10px', fontWeight: 700,
            padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px', textTransform: 'uppercase',
          }}>
            {(user as any)?.role || 'admin'}
          </span>
        </div>
      </div>

      {/* ─── KPI Grid ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px 18px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderTop: `3px solid ${k.color}`,
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {k.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: '#546E7A', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.label}</div>
              {k.trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                  {k.up === true && <TrendingUp size={11} color="#2E7D32" />}
                  {k.up === false && <TrendingDown size={11} color="#C62828" />}
                  <span style={{ fontSize: '10px', color: k.up === true ? '#2E7D32' : k.up === false ? '#C62828' : '#546E7A', fontWeight: 600 }}>{k.trend}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Modules + Alertes ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '24px', alignItems: 'start' }}>

        {/* Modules grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#37474F', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Modules de gestion
            </h2>
            <span style={{ fontSize: '11px', color: '#90A4AE' }}>{modules.length} modules actifs</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {modules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} onClick={() => router.push(mod.href)} />
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#37474F', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} color="#F57F17" />
              Alertes en cours
            </span>
            <span style={{ background: '#FFEBEE', color: '#C62828', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
              {alertes.filter(a => a.level === 'danger').length} urgentes
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {alertes.map((a, i) => (
              <a key={i} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 10px', borderRadius: '8px', textDecoration: 'none', marginBottom: '2px', transition: 'background 0.12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#F5F7FA'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}>
                <span style={{ fontSize: '14px', flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: '12px', color: a.level === 'danger' ? '#C62828' : a.level === 'warning' ? '#E65100' : a.level === 'success' ? '#2E7D32' : '#1565C0', flex: 1, fontWeight: 500 }}>{a.text}</span>
                <ArrowRight size={12} color="#B0BEC5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Activité récente ───────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#37474F', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            <Clock size={15} color="#546E7A" />
            Activité récente
          </h2>
          <span style={{ fontSize: '11px', color: '#1976D2', cursor: 'pointer' }}>Voir tout</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {activities.map((act, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: act.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                {act.initials}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#37474F', lineHeight: 1.4 }}>{act.text}</p>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#90A4AE' }}>{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function ModuleCard({ mod, onClick }: { mod: typeof modules[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: hovered ? '0 6px 20px rgba(0,0,0,0.12)' : '0 1px 6px rgba(0,0,0,0.07)',
        borderTop: `3px solid ${mod.color}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.18s ease',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 14px', background: mod.bg, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: mod.color }}>{mod.icon}</span>
        <span style={{ fontWeight: 700, fontSize: '11px', color: mod.color, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{mod.title}</span>
        {mod.alert && <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#FF5252', flexShrink: 0 }} />}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '17px', fontWeight: 800, color: mod.color, lineHeight: 1 }}>{mod.stat}</div>
        <div style={{ fontSize: '11px', color: mod.alert ? '#C62828' : '#546E7A', marginTop: '4px', fontWeight: mod.alert ? 600 : 400 }}>{mod.sub}</div>
      </div>
    </div>
  );
}
