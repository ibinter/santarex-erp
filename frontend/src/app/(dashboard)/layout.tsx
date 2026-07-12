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

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  // Sync collapsed state from NavSidebar via CSS (read width)
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const aside = document.querySelector('aside');
      if (aside) setSidebarCollapsed(aside.style.width === '64px');
    });
    const aside = document.querySelector('aside');
    if (aside) obs.observe(aside, { attributes: true, attributeFilter: ['style'] });
    return () => obs.disconnect();
  }, []);

  const leftOffset = sidebarCollapsed ? '64px' : '260px';

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <NavSidebar />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      <main
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
  );
}
