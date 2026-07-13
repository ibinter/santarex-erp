'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavSidebar from '@/components/layout/NavSidebar';
import Topbar from '@/components/layout/Topbar';
import AiChat from '@/components/AiChat';
import { isAuthenticated } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  const leftOffset = sidebarCollapsed ? '64px' : '260px';

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          .dashboard-main {
            margin-left: 0 !important;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
        {/* Mobile overlay */}
        {mobileNavOpen && (
          <div
            onClick={() => setMobileNavOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 45,
            }}
          />
        )}

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
        <AiChat />
      </div>
    </>
  );
}
