'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import type { User } from '@/types';
import {
  LayoutDashboard, Building2, CreditCard, Package, ScrollText,
  LogOut, ChevronRight, Shield, Menu, X, Users, FileText,
} from 'lucide-react';

const NAV = [
  { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/crm', label: 'CRM Prospects', icon: Users },
  { href: '/superadmin/offres-commerciales', label: 'Offres commerciales', icon: FileText },
  { href: '/superadmin/tenants', label: 'Établissements', icon: Building2 },
  { href: '/superadmin/licences', label: 'Licences', icon: CreditCard },
  { href: '/superadmin/offres', label: 'Offres SaaS', icon: Package },
  { href: '/superadmin/audit-logs', label: 'Journal d\'audit', icon: ScrollText },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'superadmin') {
      router.replace('/login');
      return;
    }
    setUser(u);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo-icon-tr.png" alt="SANTAREX" className="h-8 w-auto object-contain" />
          <div>
            <div className="text-white font-bold text-sm leading-tight">SANTAREX ERP</div>
            <div className="text-blue-200 text-xs">Console SuperAdmin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">
              {user ? `${user.firstName} ${user.lastName}` : '…'}
            </div>
            <div className="text-blue-200 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-100 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7FA]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 fixed inset-y-0 left-0 z-30"
        style={{ background: 'linear-gradient(180deg, #0D47A1 0%, #00838F 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 h-full flex flex-col"
            style={{ background: 'linear-gradient(180deg, #0D47A1 0%, #00838F 100%)' }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>
          <img src="/logo-horizontal-tr.png" alt="SANTAREX" className="h-7 w-auto object-contain" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SuperAdmin</span>
        </div>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
