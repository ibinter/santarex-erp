import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        textAlign: 'center',
      }}
    >
      {/* Icône */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#EFF6FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '20px',
        }}
      >
        {icon}
      </div>

      {/* Titre */}
      <h3
        style={{
          margin: '0 0 8px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#37474F',
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: '0 0 24px',
            fontSize: '13px',
            color: '#546E7A',
            maxWidth: '340px',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: '#0D47A1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(13,71,161,0.2)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#1565C0')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#0D47A1')}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
