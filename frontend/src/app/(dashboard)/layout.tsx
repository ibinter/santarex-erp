'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { isAuthenticated } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      {/* Le contenu (avec éventuelle sidebar) est géré par PageWrapper dans chaque page */}
      <div className="pt-16">{children}</div>
    </div>
  );
}
