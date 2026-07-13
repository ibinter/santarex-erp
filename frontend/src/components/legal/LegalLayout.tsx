'use client';
import { useState } from 'react';
import Link from 'next/link';

const SantarexIcon = () => (
  <svg width="32" height="37" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lg1" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00D9C4"/><stop offset="45%" stopColor="#0070E0"/><stop offset="100%" stopColor="#1228B8"/>
      </linearGradient>
      <linearGradient id="lg2" x1="10" y1="5" x2="90" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00CEB8"/><stop offset="100%" stopColor="#1535C8"/>
      </linearGradient>
    </defs>
    <path d="M 16,64 C 16,64 14,52 20,42 C 28,30 44,26 60,24 C 72,22 84,18 90,10 C 94,4 90,2 84,4 C 76,7 64,12 50,14 C 36,16 22,20 14,32 C 6,44 8,58 12,66 Z" fill="url(#lg1)"/>
    <path d="M 84,50 C 84,50 86,62 80,72 C 72,84 56,88 40,90 C 28,92 16,96 10,104 C 6,110 10,113 16,111 C 24,108 36,103 50,101 C 64,99 78,95 86,83 C 94,71 92,57 88,49 Z" fill="url(#lg1)"/>
    <rect x="43" y="36" width="14" height="42" rx="5" fill="url(#lg2)"/>
    <rect x="31" y="48" width="38" height="14" rx="5" fill="url(#lg2)"/>
    <polyline points="33,55 39,55 43,47 50,63 57,49 61,55 67,55" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LEGAL_PAGES = {
  fr: [
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/cgu', label: 'CGU' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/cookies', label: 'Cookies' },
    { href: '/licence', label: 'Contrat de licence' },
    { href: '/securite', label: 'Sécurité' },
  ],
  en: [
    { href: '/mentions-legales', label: 'Legal notice' },
    { href: '/cgu', label: 'Terms of use' },
    { href: '/confidentialite', label: 'Privacy policy' },
    { href: '/cookies', label: 'Cookie policy' },
    { href: '/licence', label: 'License agreement' },
    { href: '/securite', label: 'Security policy' },
  ],
};

interface LegalLayoutProps {
  title: { fr: string; en: string };
  subtitle?: { fr: string; en: string };
  updatedAt: string;
  children: React.ReactNode;
  childrenEn: React.ReactNode;
  currentPath: string;
}

export default function LegalLayout({ title, subtitle, updatedAt, children, childrenEn, currentPath }: LegalLayoutProps) {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#06101F', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '0 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <SantarexIcon />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
                SANTA<span style={{ color: '#00CEB8' }}>REX</span>
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', color: '#4A8090', textTransform: 'uppercase', marginTop: 1 }}>ERP v2.0</span>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setLang(l => l === 'fr' ? 'en' : 'fr')}
              style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: '#CBD5E1', fontSize: '0.75rem', fontWeight: 700, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              🌐 {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <Link href="/" style={{ fontSize: '0.8125rem', color: '#64748B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 80px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 56 }}>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>
            {lang === 'fr' ? 'Documents légaux' : 'Legal documents'}
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {LEGAL_PAGES[lang].map(p => (
              <Link
                key={p.href}
                href={p.href}
                style={{
                  padding: '9px 14px',
                  borderRadius: 6,
                  fontSize: '0.875rem',
                  fontWeight: p.href === currentPath ? 700 : 500,
                  color: p.href === currentPath ? '#1A56C8' : '#64748B',
                  background: p.href === currentPath ? 'rgba(26,86,200,.08)' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: p.href === currentPath ? '3px solid #1A56C8' : '3px solid transparent',
                  transition: 'all .15s',
                  display: 'block',
                }}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: 32, padding: '16px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>
              {lang === 'fr' ? 'Questions légales ?' : 'Legal questions?'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#3B82F6', lineHeight: 1.6 }}>
              <a href="mailto:contact@ibigsoft.com" style={{ color: '#1A56C8', textDecoration: 'none' }}>contact@ibigsoft.com</a><br />
              +225 27 22 27 60 14
            </div>
          </div>
        </aside>

        {/* Content */}
        <main>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>
              {lang === 'fr' ? `Document légal · Dernière mise à jour : ${updatedAt}` : `Legal document · Last updated: ${updatedAt}`}
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8 }}>
              {title[lang]}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.65 }}>{subtitle[lang]}</p>
            )}
          </div>
          <div className="legal-content">
            {lang === 'fr' ? children : childrenEn}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{ background: '#03090F', borderTop: '1px solid rgba(255,255,255,.05)', padding: '24px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: '#2D4255' }}>
            © {new Date().getFullYear()} SANTAREX ERP — IBIG Soft · Intermark Business International Group · Abidjan, Côte d&apos;Ivoire
          </span>
          <Link href="/" style={{ fontSize: '0.75rem', color: '#4A6580', textDecoration: 'none' }}>
            ← {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
          </Link>
        </div>
      </footer>

      <style>{`
        .legal-content h2 { font-size: 1.25rem; font-weight: 700; color: #0F172A; margin: 36px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #E2E8F0; }
        .legal-content h3 { font-size: 1rem; font-weight: 700; color: #1E293B; margin: 24px 0 8px; }
        .legal-content p { font-size: 0.9375rem; color: #475569; line-height: 1.75; margin-bottom: 14px; }
        .legal-content ul { padding-left: 20px; margin-bottom: 14px; }
        .legal-content li { font-size: 0.9375rem; color: #475569; line-height: 1.75; margin-bottom: 6px; }
        .legal-content a { color: #1A56C8; }
        .legal-content strong { color: #0F172A; }
        .legal-content .highlight { background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .legal-content .highlight p { color: #0369A1; margin: 0; }
      `}</style>
    </div>
  );
}
