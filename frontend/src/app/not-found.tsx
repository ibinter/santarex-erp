import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F7FA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          color: '#fff',
          fontWeight: 900,
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(13,71,161,0.25)',
        }}
      >
        🏥
      </div>

      <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#0D47A1', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
        SANTAREX ERP
      </p>

      {/* 404 */}
      <h1
        style={{
          margin: '24px 0 8px',
          fontSize: '96px',
          fontWeight: 900,
          color: '#0D47A1',
          lineHeight: 1,
          letterSpacing: '-4px',
        }}
      >
        404
      </h1>
      <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#37474F' }}>
        Page introuvable
      </h2>
      <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#546E7A', maxWidth: '380px', lineHeight: 1.6 }}>
        Cette page n&apos;existe pas ou vous n&apos;avez pas les droits nécessaires pour y accéder.
        Vérifiez l&apos;URL ou retournez au tableau de bord.
      </p>

      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0D47A1',
          color: '#fff',
          padding: '12px 28px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(13,71,161,0.3)',
          transition: 'background 0.2s',
        }}
      >
        ← Retour au tableau de bord
      </Link>

      <p style={{ marginTop: '48px', fontSize: '11px', color: '#90A4AE' }}>
        © {new Date().getFullYear()} IBIG SOFT — Tous droits réservés
      </p>
    </div>
  );
}
