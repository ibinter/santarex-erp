'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, RefreshCw, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type NotifType = 'info' | 'warning' | 'success' | 'error' | string;

type Notification = {
  id: string;
  message: string;
  type?: NotifType;
  lue: boolean;
  createdAt: string;
  link?: string;
};

type PaginatedNotifs = { items?: Notification[]; data?: Notification[]; total?: number };

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  info:    { color: '#1565C0', bg: '#EFF6FF', icon: <Info size={14} /> },
  warning: { color: '#E65100', bg: '#FFF3E0', icon: <AlertTriangle size={14} /> },
  success: { color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={14} /> },
  error:   { color: '#C62828', bg: '#FFEBEE', icon: <AlertCircle size={14} /> },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'À l\'instant';
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  if (diff < 43200) return `Il y a ${Math.floor(diff / 1440)}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function groupByDate(notifs: Notification[]): { date: string; items: Notification[] }[] {
  const map = new Map<string, Notification[]>();
  for (const n of notifs) {
    const key = new Date(n.createdAt).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    date: fmtDate(items[0].createdAt),
    items,
  }));
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'toutes' | 'non_lues'>('toutes');
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filter === 'non_lues') qs.set('lue', 'false');
      const data = await apiClient<any>(`/notifications?${qs}`);
      const list: Notification[] = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      setNotifs(list);
      setTotal(data?.total ?? list.length);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/lire`, { method: 'PATCH' });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch { /* ignore */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await apiClient('/notifications/tout-lire', { method: 'PATCH' });
      setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
    } catch { /* ignore */ } finally {
      setMarkingAll(false);
    }
  }, []);

  const nonLues = notifs.filter(n => !n.lue).length;
  const grouped = groupByDate(notifs);
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Bell size={20} color="#E65100" />
            {nonLues > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#C62828', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {nonLues > 9 ? '9+' : nonLues}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Notifications</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#546E7A' }}>
              {loading ? '…' : `${total} notification(s) au total`}
              {nonLues > 0 && <span style={{ marginLeft: 8, color: '#C62828', fontWeight: 600 }}>{nonLues} non lue(s)</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          {nonLues > 0 && (
            <button onClick={markAllRead} disabled={markingAll}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#0D47A1', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600, opacity: markingAll ? 0.7 : 1 }}>
              <CheckCheck size={14} /> Tout marquer lu
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderRadius: 10, background: '#F5F7FA', padding: 4, width: 'fit-content', border: '1px solid #E0E0E0' }}>
        {([['toutes', 'Toutes'], ['non_lues', 'Non lues']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setFilter(key); setPage(1); }}
            style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: filter === key ? '#fff' : 'transparent', color: filter === key ? '#0D47A1' : '#546E7A', fontSize: 13, fontWeight: filter === key ? 700 : 400, cursor: 'pointer', boxShadow: filter === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Style */}
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Liste */}
      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid #F5F7FA', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F0F0', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, marginBottom: 8, width: '70%' }} />
                <div style={{ height: 11, background: '#F0F0F0', borderRadius: 4, width: '30%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '60px 20px', textAlign: 'center' }}>
          <Bell size={48} style={{ display: 'block', margin: '0 auto 16px', opacity: 0.2 }} color="#546E7A" />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#37474F', margin: '0 0 4px' }}>Aucune notification</p>
          <p style={{ fontSize: 13, color: '#90A4AE', margin: 0 }}>
            {filter === 'non_lues' ? 'Toutes vos notifications ont été lues.' : 'Vous n\'avez pas encore de notifications.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(({ date, items }) => (
            <div key={date}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, padding: '0 4px' }}>{date}</div>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                {items.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type ?? 'info'] ?? TYPE_CONFIG.info;
                  return (
                    <div key={n.id}
                      onClick={() => !n.lue && markRead(n.id)}
                      style={{ padding: '14px 20px', borderBottom: i < items.length - 1 ? '1px solid #F5F7FA' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: n.lue ? 'default' : 'pointer', background: n.lue ? 'transparent' : '#FAFBFF', transition: 'background 0.15s', position: 'relative' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.lue ? 'transparent' : '#FAFBFF'; }}>
                      {!n.lue && (
                        <span style={{ position: 'absolute', top: 18, right: 18, width: 8, height: 8, borderRadius: '50%', background: '#1565C0' }} />
                      )}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cfg.color }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#37474F', fontWeight: n.lue ? 400 : 600, lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#90A4AE' }}>{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.lue && (
                        <button onClick={e => { e.stopPropagation(); markRead(n.id); }} title="Marquer comme lu"
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 11, color: '#546E7A', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          Marquer lu
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#CFD8DC' : '#546E7A', fontWeight: 600 }}>
            Précédent
          </button>
          <span style={{ fontSize: 13, color: '#546E7A' }}>Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: page === totalPages ? '#CFD8DC' : '#546E7A', fontWeight: 600 }}>
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
