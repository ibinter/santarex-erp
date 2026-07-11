'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserInitials, getFullName, logout } from '@/lib/auth';
import type { User } from '@/types';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { setUser(getCurrentUser()); }, []);
  const [searchValue, setSearchValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifCount = 3; // Placeholder — à brancher sur l'API

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-border flex items-center px-4 gap-4"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 min-w-[220px]">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)' }}
        >
          S
        </div>
        <div className="leading-tight">
          <p className="font-bold text-primary text-sm tracking-wide">SANTAREX ERP</p>
          <p className="text-[10px] text-text-secondary font-medium">IBIG SOFT · Santé</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Rechercher un patient, acte, médicament…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-full bg-surface focus:outline-none focus:border-primary-light focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-text-secondary"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notifCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-card shadow-card-hover border border-border z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="font-semibold text-sm text-text-primary">Notifications</p>
                <span className="text-xs text-primary cursor-pointer hover:underline">
                  Tout marquer lu
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { msg: "Dossier patient #IPP-2024-0001 mis à jour", time: "Il y a 5 min", type: "info" },
                  { msg: "Stock médicament AMOXICILLINE 500mg critique", time: "Il y a 1h", type: "warning" },
                  { msg: "Rendez-vous Dr. KONE annulé", time: "Il y a 3h", type: "danger" },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-surface transition-colors cursor-pointer">
                    <p className="text-xs text-text-primary font-medium">{n.msg}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-border text-center">
                <span className="text-xs text-primary cursor-pointer hover:underline">
                  Voir toutes les notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getUserInitials(user)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-text-primary leading-tight">
                {getFullName(user) || 'Utilisateur'}
              </p>
              <p className="text-[10px] text-text-secondary capitalize">
                {user?.role || 'admin'}
              </p>
            </div>
            <ChevronDown size={14} className="text-text-secondary" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-card shadow-card-hover border border-border z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">{getFullName(user)}</p>
                <p className="text-xs text-text-secondary">{user?.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface transition-colors">
                  <User size={16} className="text-text-secondary" />
                  Mon profil
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface transition-colors">
                  <Settings size={16} className="text-text-secondary" />
                  Paramètres
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
