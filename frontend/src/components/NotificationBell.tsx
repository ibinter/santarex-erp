'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';

interface Notif {
  id: string;
  titre: string;
  message: string;
  type: 'info' | 'succes' | 'alerte' | 'erreur';
  categorie: string;
  lu: boolean;
  lienHref?: string;
  createdAt: string;
}

const TYPE_COLOR: Record<string, string> = {
  info: '#0D47A1',
  succes: '#2E7D32',
  alerte: '#E65100',
  erreur: '#C62828',
};

const TYPE_BG: Record<string, string> = {
  info: '#E3F2FD',
  succes: '#E8F5E9',
  alerte: '#FFF3E0',
  erreur: '#FFEBEE',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = async () => {
    try {
      const data = await apiClient('/notifications/count');
      setCount(data.count);
    } catch {}
  };

  const fetchNotifs = async () => {
    try {
      const data = await apiClient('/notifications');
      setNotifs(data);
    } catch {}
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifs();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marquerLue = async (id: string) => {
    try {
      await apiClient(`/notifications/${id}/lire`, { method: 'PATCH' });
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
      setCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const toutLire = async () => {
    try {
      await apiClient('/notifications/tout-lire', { method: 'PATCH' });
      setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
      setCount(0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: '#C62828' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm text-gray-800">Notifications</span>
            {count > 0 && (
              <button onClick={toutLire} className="text-xs text-blue-700 hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucune notification</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${n.lu ? 'opacity-60' : ''}`}
                  onClick={() => { marquerLue(n.id); if (n.lienHref) window.location.href = n.lienHref; }}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.lu ? '#d1d5db' : TYPE_COLOR[n.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{n.titre}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t bg-gray-50">
            <a href="/support" className="text-xs text-blue-700 hover:underline">Voir le support →</a>
          </div>
        </div>
      )}
    </div>
  );
}
