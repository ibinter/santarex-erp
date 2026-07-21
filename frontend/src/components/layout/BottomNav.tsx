'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Receipt, Siren, MoreHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/types';

const MAIN_ITEMS = [
  { href: '/dashboard', key: 'home', icon: LayoutDashboard },
  { href: '/patients', key: 'patients', icon: Users },
  { href: '/facturation', key: 'facturation', icon: Receipt },
  { href: '/urgences', key: 'urgences', icon: Siren, alert: true },
];

interface BottomNavProps {
  onMoreClick: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const mainItems = MAIN_ITEMS.map(item => ({ ...item, label: t(item.key) }));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { setUser(getCurrentUser()); }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isMoreActive = !mainItems.some(item => isActive(item.href));

  return (
    <>
      <style>{`
        .bottom-nav {
          display: none;
        }
        @media (max-width: 1023px) {
          .bottom-nav {
            display: flex;
          }
          .dashboard-main {
            padding-bottom: 72px !important;
          }
        }
      `}</style>
      <nav className="bottom-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#fff',
        borderTop: '1px solid #E8EAED',
        height: '60px',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {mainItems.map(({ href, label, icon: Icon, alert }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                textDecoration: 'none',
                color: active ? '#0D47A1' : '#90A4AE',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={22} />
                {alert && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-5px',
                    width: '8px',
                    height: '8px',
                    background: '#C62828',
                    borderRadius: '50%',
                    border: '1.5px solid #fff',
                  }} />
                )}
              </div>
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, letterSpacing: '0.2px' }}>{label}</span>
              {active && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: '25%',
                  right: '25%',
                  height: '2px',
                  background: '#0D47A1',
                  borderRadius: '0 0 2px 2px',
                }} />
              )}
            </Link>
          );
        })}

        {/* Bouton Plus */}
        <button
          onClick={onMoreClick}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: isMoreActive ? '#0D47A1' : '#90A4AE',
            position: 'relative',
          }}
        >
          <MoreHorizontal size={22} />
          <span style={{ fontSize: '10px', fontWeight: isMoreActive ? 700 : 500 }}>{t('more')}</span>
          {isMoreActive && (
            <span style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              right: '25%',
              height: '2px',
              background: '#0D47A1',
              borderRadius: '0 0 2px 2px',
            }} />
          )}
        </button>
      </nav>
    </>
  );
}
