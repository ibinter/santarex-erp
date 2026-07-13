'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, User as UserIcon, Settings, ChevronDown, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getFullName, getUserInitials } from '@/lib/auth';
import type { User } from '@/types';

export default function Topbar({ sidebarCollapsed, onMobileMenuToggle }: {
  sidebarCollapsed: boolean;
  onMobileMenuToggle?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const leftOffset = sidebarCollapsed ? '64px' : '260px';

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          [data-topbar] {
            left: 0 !important;
          }
          [data-topbar-hamburger] {
            display: flex !important;
          }
          [data-topbar-username] {
            display: none !important;
          }
          [data-topbar-search] {
            max-width: 100% !important;
          }
        }
        @media (min-width: 1024px) {
          [data-topbar-hamburger] {
            display: none !important;
          }
        }
      `}</style>

      <header
        data-topbar
        style={{
          position: 'fixed',
          top: 0,
          left: leftOffset,
          right: 0,
          height: '60px',
          zIndex: 40,
          background: '#fff',
          borderBottom: '1px solid #E8EAED',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '12px',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {/* Mobile hamburger */}
        <button
          data-topbar-hamburger
          onClick={onMobileMenuToggle}
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#546E7A',
            flexShrink: 0,
          }}
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div data-topbar-search style={{ flex: 1, maxWidth: '480px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#90A4AE',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher patient, acte, médicament…"
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '13px',
                border: '1px solid #E8EAED',
                borderRadius: '24px',
                background: '#F5F7FA',
                outline: 'none',
                color: '#37474F',
                transition: 'all 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#1976D2';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = '#F5F7FA';
                e.currentTarget.style.borderColor = '#E8EAED';
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#546E7A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F7FA'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Bell size={20} />
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '16px', height: '16px', background: '#C62828',
                color: '#fff', fontSize: '9px', fontWeight: 700,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>3</span>
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 'min(320px, calc(100vw - 32px))', background: '#fff', borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E8EAED', zIndex: 100,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8EAED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#37474F' }}>Notifications</span>
                  <span style={{ fontSize: '11px', color: '#1976D2', cursor: 'pointer' }}>Tout marquer lu</span>
                </div>
                {[
                  { msg: 'Stock Ténofovir en rupture critique', time: 'Il y a 5 min', dot: '#C62828' },
                  { msg: 'Résultats labo prêts à valider (x3)', time: 'Il y a 28 min', dot: '#F57F17' },
                  { msg: 'Rendez-vous Dr. KONE annulé', time: 'Il y a 1h', dot: '#1565C0' },
                ].map((n, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid #F5F7FA' : 'none', display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F5F7FA'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.dot, flexShrink: 0, marginTop: '4px' }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#37474F', fontWeight: 500 }}>{n.msg}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#90A4AE' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#1976D2', cursor: 'pointer' }}>Voir toutes les notifications</span>
                </div>
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div style={{ width: '1px', height: '32px', background: '#E8EAED' }} />

          {/* User */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 10px 6px 6px', borderRadius: '24px',
                border: '1px solid #E8EAED', background: 'transparent', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F7FA'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D47A1, #00838F)',
                color: '#fff', fontSize: '12px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {getUserInitials(user)}
              </div>
              <div data-topbar-username style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#37474F', lineHeight: 1.2 }}>
                  {getFullName(user) || 'Utilisateur'}
                </div>
                <div style={{ fontSize: '10px', color: '#90A4AE', textTransform: 'capitalize' }}>
                  {(user as any)?.role || 'admin'}
                </div>
              </div>
              <ChevronDown size={13} style={{ color: '#90A4AE' }} />
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '220px', background: '#fff', borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E8EAED', zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8EAED' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#37474F' }}>{getFullName(user)}</div>
                  <div style={{ fontSize: '11px', color: '#90A4AE', marginTop: '2px' }}>{user?.email}</div>
                </div>
                {[
                  { label: 'Mon profil', icon: <UserIcon size={15} />, href: '/profil' },
                  { label: 'Paramètres', icon: <Settings size={15} />, href: '/parametres' },
                ].map(item => (
                  <button key={item.href} onClick={() => { router.push(item.href); setDropdownOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: '#37474F', textAlign: 'left' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F5F7FA'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                    <span style={{ color: '#90A4AE' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
