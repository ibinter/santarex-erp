'use client';

// ════════════════════════════════════════════════════════════════════════════
//  AppFooter — pied de page interne, affiché en bas des pages du dashboard.
//  Discret, sobre, responsive, bilingue (namespace i18n « footer »).
//  Monté une seule fois dans le layout du dashboard.
// ════════════════════════════════════════════════════════════════════════════

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AppFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  const links: { href: string; label: string }[] = [
    { href: '/guide', label: t('links.guide') },
    { href: '/faq', label: t('links.faq') },
    { href: '/support', label: t('links.support') },
    { href: '/parametres', label: t('links.parametres') },
    { href: '/cgu', label: t('links.cgu') },
    { href: '/confidentialite', label: t('links.confidentialite') },
  ];

  return (
    <footer
      style={{
        borderTop: '1px solid #E5E9F0',
        background: '#FAFBFC',
        color: '#64748B',
        fontSize: '12px',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span>{t('copyright', { year })}</span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#0D47A1',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '999px',
            padding: '1px 8px',
          }}
        >
          {t('version')}
        </span>
        <span style={{ color: '#94A3B8' }}>· {t('tagline')}</span>
      </div>

      <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 4px' }}>
        {links.map((l, i) => (
          <span key={l.href} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {i > 0 && <span style={{ color: '#CBD5E1', margin: '0 8px' }}>·</span>}
            <Link
              href={l.href}
              style={{ color: '#64748B', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0D47A1')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              {l.label}
            </Link>
          </span>
        ))}
      </nav>
    </footer>
  );
}
