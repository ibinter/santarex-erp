'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export interface StatusScreenAction {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  icon?: ReactNode;
}

export interface StatusScreenProps {
  /** Code affiché en grand (401, 403, "Hors ligne"…). */
  code: string;
  /** Titre principal. */
  title: string;
  /** Description sous le titre. */
  description: string;
  /** Icône illustrative (lucide-react conseillé). */
  icon?: ReactNode;
  /** Couleur d'accent (par défaut bleu SANTAREX). */
  accent?: string;
  /** Actions (boutons / liens). */
  actions?: StatusScreenAction[];
  /** Contenu additionnel optionnel (ex : référence d'erreur). */
  children?: ReactNode;
}

/**
 * Écran d'état plein page, branddé SANTAREX. Réutilisé par les pages
 * 401 / 403 / hors-ligne et les pages d'erreur pour une présentation cohérente.
 */
export default function StatusScreen({
  code,
  title,
  description,
  icon,
  accent = '#1565C0',
  actions = [],
  children,
}: StatusScreenProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F7FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
      }}
    >
      {/* Logo SANTAREX */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          color: '#fff',
          fontWeight: 900,
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(13,71,161,0.25)',
        }}
      >
        {icon ?? '🏥'}
      </div>

      <p
        style={{
          margin: '0 0 4px',
          fontSize: 12,
          fontWeight: 700,
          color: '#0D47A1',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}
      >
        SANTAREX ERP
      </p>

      <h1
        style={{
          margin: '20px 0 8px',
          fontSize: 64,
          fontWeight: 900,
          color: accent,
          lineHeight: 1,
          letterSpacing: -2,
        }}
      >
        {code}
      </h1>
      <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#37474F' }}>
        {title}
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#546E7A', maxWidth: 400, lineHeight: 1.6 }}>
        {description}
      </p>

      {children}

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions.map((a, i) => {
            const style: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              border: a.primary ? 'none' : '1px solid #CFD8DC',
              background: a.primary ? accent : '#fff',
              color: a.primary ? '#fff' : '#546E7A',
              boxShadow: a.primary ? '0 4px 14px rgba(21,101,192,0.28)' : 'none',
            };
            if (a.href) {
              return (
                <Link key={i} href={a.href} style={style}>
                  {a.icon} {a.label}
                </Link>
              );
            }
            return (
              <button key={i} type="button" onClick={a.onClick} style={style}>
                {a.icon} {a.label}
              </button>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 44, fontSize: 11, color: '#90A4AE' }}>
        © {new Date().getFullYear()} IBIG SOFT — Tous droits réservés
      </p>
    </div>
  );
}
