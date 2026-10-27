'use client';

interface LoadMoreProps {
  loaded: number;
  total: number;
  loading?: boolean;
  onMore: () => void;
}

/** Pied de liste : « n sur total » + bouton pour charger la page suivante. */
export default function LoadMore({ loaded, total, loading, onMore }: LoadMoreProps) {
  if (total <= 0) return null;
  const reste = total - loaded;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 4px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: '#546E7A' }}>
        {loaded.toLocaleString('fr-FR')} sur {total.toLocaleString('fr-FR')}
      </span>
      {reste > 0 && (
        <button
          type="button"
          onClick={onMore}
          disabled={loading}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #1565C0', background: '#fff', color: '#1565C0', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Chargement…' : `Charger plus (${Math.min(reste, 50)})`}
        </button>
      )}
    </div>
  );
}
