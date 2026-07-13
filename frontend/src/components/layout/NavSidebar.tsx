'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar, Stethoscope, FlaskConical, Pill,
  CreditCard, BarChart2, Settings, UserCog, Siren, BedDouble,
  Scissors, Scan, Building2, BookOpen, MessageSquare, ChevronLeft,
  ChevronRight, LogOut, Receipt, X,
} from 'lucide-react';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  alert?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Tableau de bord',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: 'Patients & Consultations',
    items: [
      { label: 'Patients', href: '/patients', icon: <Users size={18} /> },
      { label: 'Consultations', href: '/consultations', icon: <Stethoscope size={18} /> },
      { label: 'Rendez-vous', href: '/rendez-vous', icon: <Calendar size={18} /> },
      { label: 'Dossier Médical (DME)', href: '/dme', icon: <BookOpen size={18} /> },
    ],
  },
  {
    label: 'Soins & Hospitalisation',
    items: [
      { label: 'Hospitalisation', href: '/hospitalisation', icon: <BedDouble size={18} /> },
      { label: 'Bloc Opératoire', href: '/bloc-operatoire', icon: <Scissors size={18} /> },
      { label: 'Urgences', href: '/urgences', icon: <Siren size={18} />, alert: true },
      { label: 'Imagerie Médicale', href: '/imagerie', icon: <Scan size={18} /> },
    ],
  },
  {
    label: 'Médical & Pharmacie',
    items: [
      { label: 'Laboratoire', href: '/laboratoire', icon: <FlaskConical size={18} /> },
      { label: 'Pharmacie', href: '/pharmacie', icon: <Pill size={18} /> },
    ],
  },
  {
    label: 'Finance & Facturation',
    items: [
      { label: 'Facturation', href: '/facturation', icon: <Receipt size={18} /> },
      { label: 'Caisse', href: '/caisse', icon: <CreditCard size={18} /> },
      { label: 'Comptabilité', href: '/comptabilite', icon: <Building2 size={18} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Utilisateurs', href: '/utilisateurs', icon: <UserCog size={18} /> },
      { label: 'Ressources Humaines', href: '/rh', icon: <UserCog size={18} /> },
      { label: 'Reporting & BI', href: '/reporting', icon: <BarChart2 size={18} /> },
      { label: 'Support', href: '/support', icon: <MessageSquare size={18} /> },
      { label: 'Paramètres', href: '/parametres', icon: <Settings size={18} /> },
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
  const [collapsed, setCollapsed] = useState(false);

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
            padding: collapsed ? '16px 12px' : '16px 20px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="SANTAREX" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            </div>
          )}
          {collapsed && (
            <img src="/favicon-32x32.png" alt="S" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
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
            aria-label={collapsed ? 'Développer' : 'Réduire'}
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
            aria-label="Fermer le menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
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
                  {group.label}
                </div>
              )}
              {collapsed && <div style={{ height: '8px' }} />}
              <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px' }}>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
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
                            {item.label}
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
          ))}
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
            title={collapsed ? 'Déconnexion' : undefined}
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
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>
    </>
  );
}
