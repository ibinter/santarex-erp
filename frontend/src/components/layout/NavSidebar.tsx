'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, FlaskConical, Pill,
  CreditCard, BarChart2, Settings, UserCog, Siren, BedDouble,
  Scissors, Scan, Building2, BookOpen, MessageSquare, ChevronLeft,
  ChevronRight, LogOut, Receipt, X, HelpCircle, ShieldCheck, Award,
  Baby, Activity, Syringe, HeartPulse, FileSignature, Home, Droplets,
  Biohazard, Truck, ShieldAlert, Calculator, Wallet, FileSpreadsheet,
  PiggyBank, Wrench, Ambulance, Trash2, Snowflake, Network, AlertTriangle,
  Gauge, SmilePlus, FileWarning, MessageCircle, CalendarClock,
} from 'lucide-react';
import { logout, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Role-based visibility
type RoleKey = string;
const ALL_ROLES: RoleKey[] = ['superadmin','admin','medecin','infirmier','caissier','pharmacien','laborantin','drh','directeur'];
const CLINICAL: RoleKey[] = ['superadmin','admin','directeur','medecin','infirmier'];
const ADMIN_ONLY: RoleKey[] = ['superadmin','admin'];
const ADMIN_DIR: RoleKey[] = ['superadmin','admin','directeur'];

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  alert?: boolean;
  roles?: RoleKey[];
}

interface NavGroup {
  key: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    key: 'groupDashboard',
    items: [
      { key: 'dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ALL_ROLES },
    ],
  },
  {
    key: 'groupPatients',
    items: [
      { key: 'patients', href: '/patients', icon: <Users size={18} />, roles: CLINICAL },
      { key: 'consultations', href: '/consultations', icon: <Stethoscope size={18} />, roles: CLINICAL },
      { key: 'rendezVous', href: '/rendez-vous', icon: <Calendar size={18} />, roles: CLINICAL },
      { key: 'dmeLong', href: '/dme', icon: <BookOpen size={18} />, roles: ['superadmin','admin','medecin','infirmier'] },
    ],
  },
  {
    key: 'groupSoins',
    items: [
      { key: 'hospitalisation', href: '/hospitalisation', icon: <BedDouble size={18} />, roles: CLINICAL },
      { key: 'had', href: '/had', icon: <Home size={18} />, roles: CLINICAL },
      { key: 'blocOperatoire', href: '/bloc-operatoire', icon: <Scissors size={18} />, roles: ['superadmin','admin','medecin'] },
      { key: 'urgences', href: '/urgences', icon: <Siren size={18} />, alert: true, roles: CLINICAL },
      { key: 'imagerieLong', href: '/imagerie', icon: <Scan size={18} />, roles: ['superadmin','admin','medecin','infirmier'] },
      { key: 'maternite', href: '/maternite', icon: <Baby size={18} />, roles: CLINICAL },
      { key: 'pediatrie', href: '/pediatrie', icon: <Activity size={18} />, roles: CLINICAL },
      { key: 'vaccination', href: '/vaccination', icon: <Syringe size={18} />, roles: ['superadmin','admin','medecin','infirmier','laborantin'] },
      { key: 'soinsInfirmiers', href: '/soins-infirmiers', icon: <HeartPulse size={18} />, roles: CLINICAL },
      { key: 'consentements', href: '/consentements', icon: <FileSignature size={18} />, roles: CLINICAL },
    ],
  },
  {
    key: 'groupMedical',
    items: [
      { key: 'laboratoire', href: '/laboratoire', icon: <FlaskConical size={18} />, roles: ['superadmin','admin','medecin','laborantin'] },
      { key: 'pharmacie', href: '/pharmacie', icon: <Pill size={18} />, roles: ['superadmin','admin','pharmacien','medecin'] },
      { key: 'banqueSang', href: '/banque-sang', icon: <Droplets size={18} />, roles: ['superadmin','admin','medecin','infirmier','laborantin','directeur'] },
      { key: 'sterilisation', href: '/sterilisation', icon: <Biohazard size={18} />, roles: ['superadmin','admin','medecin','infirmier'] },
      { key: 'approvisionnement', href: '/approvisionnement', icon: <Truck size={18} />, roles: ['superadmin','admin','pharmacien','directeur'] },
      { key: 'interactions', href: '/interactions', icon: <ShieldAlert size={18} />, roles: ['superadmin','admin','medecin','pharmacien'] },
    ],
  },
  {
    key: 'groupFinance',
    items: [
      { key: 'facturation', href: '/facturation', icon: <Receipt size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'caisse', href: '/caisse', icon: <CreditCard size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'caisseSessions', href: '/caisse-sessions', icon: <Wallet size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'devis', href: '/devis', icon: <Calculator size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'priseEnCharge', href: '/prise-en-charge', icon: <ShieldCheck size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'tiersPayant', href: '/tiers-payant', icon: <FileSpreadsheet size={18} />, roles: ['superadmin','admin','caissier','directeur'] },
      { key: 'comptabilite', href: '/comptabilite', icon: <Building2 size={18} />, roles: ADMIN_DIR },
      { key: 'budget', href: '/budget', icon: <PiggyBank size={18} />, roles: ADMIN_DIR },
    ],
  },
  {
    key: 'groupOps',
    items: [
      { key: 'equipements', href: '/equipements', icon: <Wrench size={18} />, roles: ADMIN_DIR },
      { key: 'transport', href: '/transport', icon: <Ambulance size={18} />, roles: ['superadmin','admin','directeur','medecin','infirmier'] },
      { key: 'dechetsMedicaux', href: '/dechets-medicaux', icon: <Trash2 size={18} />, roles: ADMIN_DIR },
      { key: 'morgue', href: '/morgue', icon: <Snowflake size={18} />, roles: CLINICAL },
      { key: 'sites', href: '/sites', icon: <Network size={18} />, roles: ADMIN_DIR },
    ],
  },
  {
    key: 'groupQualite',
    items: [
      { key: 'incidentsQualite', href: '/incidents-qualite', icon: <AlertTriangle size={18} />, roles: ADMIN_DIR },
      { key: 'indicateursQualite', href: '/indicateurs-qualite', icon: <Gauge size={18} />, roles: ['superadmin','admin','directeur','medecin'] },
      { key: 'satisfaction', href: '/satisfaction', icon: <SmilePlus size={18} />, roles: ADMIN_DIR },
      { key: 'declarationsSanitaires', href: '/declarations-sanitaires', icon: <FileWarning size={18} />, roles: CLINICAL },
    ],
  },
  {
    key: 'groupComm',
    items: [
      { key: 'messagerie', href: '/messagerie', icon: <MessageSquare size={18} />, roles: ALL_ROLES },
      { key: 'messagesSortants', href: '/messages-sortants', icon: <MessageCircle size={18} />, roles: ['superadmin','admin','caissier','directeur','infirmier'] },
    ],
  },
  {
    key: 'groupAdmin',
    items: [
      { key: 'utilisateurs', href: '/utilisateurs', icon: <UserCog size={18} />, roles: ADMIN_ONLY },
      { key: 'rhLong', href: '/rh', icon: <UserCog size={18} />, roles: ['superadmin','admin','drh','directeur'] },
      { key: 'planningsGardes', href: '/plannings-gardes', icon: <CalendarClock size={18} />, roles: ['superadmin','admin','drh','directeur','medecin'] },
      { key: 'reportingLong', href: '/reporting', icon: <BarChart2 size={18} />, roles: ADMIN_DIR },
      { key: 'auditLogs', href: '/audit-logs', icon: <ShieldCheck size={18} />, roles: ADMIN_DIR },
      { key: 'licence', href: '/licence', icon: <Award size={18} />, roles: ADMIN_DIR },
      { key: 'guide', href: '/guide', icon: <BookOpen size={18} />, roles: ALL_ROLES },
      { key: 'faq', href: '/faq', icon: <HelpCircle size={18} />, roles: ALL_ROLES },
      { key: 'support', href: '/support', icon: <MessageSquare size={18} />, roles: ALL_ROLES },
      { key: 'parametres', href: '/parametres', icon: <Settings size={18} />, roles: ADMIN_DIR },
    ],
  },
];

interface NavSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function NavSidebar({ mobileOpen = false, onMobileClose, onCollapsedChange }: NavSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const u = getCurrentUser();
    setUserRole(u?.role ?? '');
  }, []);

  const canSee = (item: NavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!userRole) return true; // show all while loading
    return item.roles.includes(userRole);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          [data-navsidebar] {
            transform: translateX(-100%) !important;
            transition: transform 0.25s ease !important;
          }
          [data-navsidebar][data-open="true"] {
            transform: translateX(0) !important;
          }
          [data-navsidebar-close] {
            display: flex !important;
          }
          [data-navsidebar-collapse] {
            display: none !important;
          }
        }
        @media (min-width: 1024px) {
          [data-navsidebar] {
            transform: none !important;
          }
          [data-navsidebar-close] {
            display: none !important;
          }
        }
      `}</style>

      <aside
        data-navsidebar
        data-open={mobileOpen ? 'true' : 'false'}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          background: '#0D1B2A',
          width: collapsed ? '64px' : '260px',
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? '10px 8px' : '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '8px',
            minHeight: '64px',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <img
              src="/logo-horizontal-tr.png"
              alt="SANTAREX ERP"
              style={{ height: 42, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          )}
          {collapsed && (
            <img
              src="/logo-icon-tr.png"
              alt="S"
              style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }}
            />
          )}

          {/* Desktop collapse toggle */}
          <button
            data-navsidebar-collapse
            onClick={handleToggleCollapse}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              flexShrink: 0,
            }}
            aria-label={collapsed ? t('expand') : t('collapse')}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Mobile close button */}
          <button
            data-navsidebar-close
            onClick={onMobileClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              flexShrink: 0,
              display: 'none',
            }}
            aria-label={t('closeMenu')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;
            return (
            <div key={group.key} style={{ marginBottom: '4px' }}>
              {!collapsed && (
                <div
                  style={{
                    padding: '10px 20px 4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {t(group.key)}
                </div>
              )}
              {collapsed && <div style={{ height: '8px' }} />}
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px' }}>
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        title={collapsed ? t(item.key) : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: collapsed ? '10px 12px' : '9px 12px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          marginBottom: '2px',
                          background: active
                            ? 'linear-gradient(90deg, rgba(0,188,212,0.2) 0%, rgba(0,188,212,0.05) 100%)'
                            : 'transparent',
                          borderLeft: active ? '3px solid #00BCD4' : '3px solid transparent',
                          transition: 'all 0.15s ease',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }
                        }}
                      >
                        <span style={{ color: active ? '#00BCD4' : item.alert ? '#FF5252' : 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: active ? 600 : 400,
                              color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                              flex: 1,
                            }}
                          >
                            {t(item.key)}
                          </span>
                        )}
                        {!collapsed && item.alert && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#FF5252',
                              flexShrink: 0,
                              animation: 'pulse 2s infinite',
                            }}
                          />
                        )}
                        {!collapsed && item.badge !== undefined && item.badge > 0 && (
                          <span
                            style={{
                              background: '#FF5252',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              borderRadius: '10px',
                              padding: '1px 6px',
                              flexShrink: 0,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 8px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleLogout}
            title={collapsed ? t('logout') : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '13px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,82,82,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = '#FF5252';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <LogOut size={18} />
            {!collapsed && t('logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
