'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/auth';
import type { User } from '@/types';
import {
  LayoutDashboard, Building2, CreditCard, Package, ScrollText,
  LogOut, Shield, Menu, X, Users, FileText,
  Bot, DatabaseBackup, Activity, Megaphone, Wallet,
} from 'lucide-react';

// Menu regroupé par thème : on retrouve vite ce qu'on cherche.
const GROUPES = [
  {
    titre: 'Pilotage',
    items: [
      { href: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/superadmin/sante', label: 'État du système', icon: Activity },
      { href: '/superadmin/audit-logs', label: "Journal d'audit", icon: ScrollText },
    ],
  },
  {
    titre: 'Clients',
    items: [
      { href: '/superadmin/tenants', label: 'Établissements', icon: Building2 },
      { href: '/superadmin/licences', label: 'Licences', icon: CreditCard },
      { href: '/superadmin/crm', label: 'CRM Prospects', icon: Users },
      { href: '/superadmin/offres-commerciales', label: 'Offres commerciales', icon: FileText },
    ],
  },
  {
    titre: 'Argent',
    items: [
      { href: '/superadmin/offres', label: 'Offres SaaS', icon: Package },
      { href: '/superadmin/paiements', label: 'Paiements (GeniusPay)', icon: Wallet },
    ],
  },
  {
    titre: 'Communication',
    items: [{ href: '/superadmin/annonces', label: 'Annonces', icon: Megaphone }],
  },
  {
    titre: 'Outils',
    items: [
      { href: '/superadmin/ia', label: 'Assistant IA', icon: Bot },
      { href: '/superadmin/sauvegardes', label: 'Sauvegardes', icon: DatabaseBackup },
    ],
  },
];

const TOUS = GROUPES.flatMap((g) => g.items);
const FOND_MENU = 'linear-gradient(180deg, #0B1F3F 0%, #0A2A57 55%, #0B3C5D 100%)';

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

  const page = TOUS.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'));
  const initiales = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'SA' : 'SA';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo-icon-tr.png" alt="SANTAREX" className="h-9 w-auto object-contain" />
          <div>
            <div className="text-white font-extrabold text-sm tracking-wide leading-tight">SANTAREX ERP</div>
            <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#5EEAD4' }}>Console SuperAdmin</div>
          </div>
        </div>
      </div>

      {/* Nav groupée */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {GROUPES.map((g) => (
          <div key={g.titre} className="mb-5">
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-200/50">{g.titre}</div>
            <div className="space-y-0.5">
              {g.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      active ? 'bg-white/12 text-white' : 'text-blue-100/80 hover:bg-white/8 hover:text-white'
                    }`}
                    style={active ? { background: 'rgba(255,255,255,0.12)' } : undefined}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r" style={{ background: '#2DD4BF' }} />}
                    <Icon size={17} style={active ? { color: '#5EEAD4' } : undefined} />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Compte + déconnexion */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#1565C0,#00838F)' }}>
            {initiales}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user ? `${user.firstName} ${user.lastName}` : '…'}</div>
            <div className="text-blue-200/70 text-[11px] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-blue-100/80 hover:bg-white/8 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F3F6FB]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30" style={{ background: FOND_MENU }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col" style={{ background: FOND_MENU }}>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Barre du haut */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-4 lg:px-8 h-14 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {page && <page.icon size={17} className="text-[#0D47A1] flex-shrink-0" />}
            <h1 className="text-sm font-bold text-gray-800 truncate">{page?.label ?? 'Console SuperAdmin'}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
              style={{ background: '#E0F2FE', color: '#075985' }}>
              <Shield size={12} /> Superadmin
            </span>
            <Link href="/dashboard" className="hidden sm:inline text-xs font-semibold text-gray-500 hover:text-[#0D47A1]">
              Vue clinique
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
