import React from 'react';

type SkeletonVariant = 'card' | 'table' | 'text' | 'kpi';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

const pulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  borderRadius: '6px',
};

// Inject keyframes once
if (typeof document !== 'undefined') {
  const id = 'skeleton-keyframes';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes skeleton-pulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

function CardSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        overflow: 'hidden',
      }}
    >
      <div style={{ ...pulse, height: '60px', borderRadius: 0 }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ ...pulse, height: '16px', width: '70%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ ...pulse, height: '32px' }} />
          <div style={{ ...pulse, height: '32px' }} />
        </div>
      </div>
    </div>
  );
}

function KPISkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flex: '1 1 200px',
      }}
    >
      <div style={{ ...pulse, width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...pulse, height: '20px', width: '60%', marginBottom: '6px' }} />
        <div style={{ ...pulse, height: '12px', width: '80%' }} />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ ...pulse, height: '48px', borderRadius: 0, marginBottom: '1px' }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '14px 16px',
            borderBottom: '1px solid #F5F7FA',
          }}
        >
          <div style={{ ...pulse, height: '14px' }} />
          <div style={{ ...pulse, height: '14px' }} />
          <div style={{ ...pulse, height: '14px' }} />
          <div style={{ ...pulse, height: '14px' }} />
        </div>
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ ...pulse, height: '14px', width: '100%' }} />
      <div style={{ ...pulse, height: '14px', width: '90%' }} />
      <div style={{ ...pulse, height: '14px', width: '75%' }} />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'card',
  count = 1,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'table') return <TableSkeleton />;
  if (variant === 'text')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {items.map((_, i) => <TextSkeleton key={i} />)}
      </div>
    );
  if (variant === 'kpi')
    return (
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {items.map((_, i) => <KPISkeleton key={i} />)}
      </div>
    );

  // card (default)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
      {items.map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
