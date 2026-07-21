'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NavSidebar from '@/components/layout/NavSidebar';
import Topbar from '@/components/layout/Topbar';
import BottomNav from '@/components/layout/BottomNav';
import AiChat from '@/components/AiChat';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import { isAuthenticated } from '@/lib/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Stethoscope, Calendar, BookOpen,
  BedDouble, Scissors, Siren, Scan, FlaskConical, Pill,
  Receipt, CreditCard, Building2, UserCog, BarChart2,
  MessageSquare, Settings, X, GraduationCap,
} from 'lucide-react';

const ALL_NAV = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'patients', href: '/patients', icon: Users },
  { key: 'consultations', href: '/consultations', icon: Stethoscope },
  { key: 'rendezVous', href: '/rendez-vous', icon: Calendar },
  { key: 'dme', href: '/dme', icon: BookOpen },
  { key: 'hospitalisation', href: '/hospitalisation', icon: BedDouble },
  { key: 'blocOperatoire', href: '/bloc-operatoire', icon: Scissors },
  { key: 'urgences', href: '/urgences', icon: Siren },
  { key: 'imagerie', href: '/imagerie', icon: Scan },
  { key: 'laboratoire', href: '/laboratoire', icon: FlaskConical },
  { key: 'pharmacie', href: '/pharmacie', icon: Pill },
  { key: 'facturation', href: '/facturation', icon: Receipt },
  { key: 'caisse', href: '/caisse', icon: CreditCard },
  { key: 'comptabilite', href: '/comptabilite', icon: Building2 },
  { key: 'rh', href: '/rh', icon: UserCog },
  { key: 'reporting', href: '/reporting', icon: BarChart2 },
  { key: 'support', href: '/support', icon: MessageSquare },
  { key: 'academie', href: '/academie', icon: GraduationCap },
  { key: 'parametres', href: '/parametres', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('nav');
  const nav = ALL_NAV.map(n => ({ ...n, label: t(n.key) }));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  // Close more drawer when route changes
  useEffect(() => { setMoreDrawerOpen(false); }, [pathname]);

  const leftOffset = sidebarCollapsed ? '64px' : '260px';

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .dashboard-main {
            margin-left: 0 !important;
            padding-bottom: 72px;
          }
        }
        .overflow-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
        {/* Mobile sidebar overlay */}
        {mobileNavOpen && (
          <div
            onClick={() => setMobileNavOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
          />
        )}

        {/* More drawer overlay */}
        {moreDrawerOpen && (
          <div
            onClick={() => setMoreDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 55 }}
          />
        )}

        {/* More drawer (slide up) */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: '#fff',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          transform: moreDrawerOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '80vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F5F7FA', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A2332' }}>{t('allModules')}</span>
            <button onClick={() => setMoreDrawerOpen(false)} style={{ border: 'none', background: '#F5F7FA', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} color="#546E7A" />
            </button>
          </div>
          <div style={{ overflowY: 'auto', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 8px',
                    borderRadius: '12px',
                    background: active ? '#EFF6FF' : '#F8FAFC',
                    textDecoration: 'none',
                    border: active ? '1px solid #BFDBFE' : '1px solid transparent',
                  }}
                >
                  <Icon size={22} color={active ? '#0D47A1' : '#546E7A'} />
                  <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? '#0D47A1' : '#546E7A', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <NavSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          onCollapsedChange={setSidebarCollapsed}
        />
        <Topbar
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuToggle={() => setMobileNavOpen(v => !v)}
        />
        <main
          className="dashboard-main"
          style={{
            marginLeft: leftOffset,
            paddingTop: '60px',
            minHeight: '100vh',
            transition: 'margin-left 0.2s ease',
          }}
        >
          {children}
        </main>

        <BottomNav onMoreClick={() => setMoreDrawerOpen(v => !v)} />
        <AiChat />
        <PwaInstallPrompt />
      </div>
    </>
  );
}
