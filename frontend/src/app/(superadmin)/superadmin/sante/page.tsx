'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Activity, Database, Mail, Bot, HardDrive, MemoryStick,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Clock,
} from 'lucide-react';

type CheckStatus = 'up' | 'degraded' | 'down' | 'configured' | 'not_configured';

interface ServiceCheck {
  key: string;
  label: string;
  status: CheckStatus;
  latenceMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface HealthDetails {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptimeSec: number;
  services: ServiceCheck[];
}

const STATUS_META: Record<CheckStatus, { color: string; label: string; Icon: any }> = {
  up: { color: '#22C55E', label: 'Opérationnel', Icon: CheckCircle2 },
  configured: { color: '#22C55E', label: 'Configuré', Icon: CheckCircle2 },
  degraded: { color: '#F59E0B', label: 'Dégradé', Icon: AlertTriangle },
  not_configured: { color: '#94A3B8', label: 'Non configuré', Icon: MinusCircle },
  down: { color: '#EF4444', label: 'Hors service', Icon: XCircle },
};

const GLOBAL_META: Record<HealthDetails['status'], { color: string; label: string }> = {
  ok: { color: '#22C55E', label: 'Tous les services critiques sont opérationnels' },
  degraded: { color: '#F59E0B', label: 'Service dégradé — surveillance recommandée' },
  down: { color: '#EF4444', label: 'Incident critique en cours' },
};

const SERVICE_ICONS: Record<string, any> = {
  db: Database,
  smtp: Mail,
  ia: Bot,
  disk: HardDrive,
  memory: MemoryStick,
};

function formatUptime(sec: number): string {
  const j = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (j > 0) return `${j}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function Pastille({ status }: { status: CheckStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: meta.color + '1A', color: meta.color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function ServiceRow({ svc }: { svc: ServiceCheck }) {
  const Icon = SERVICE_ICONS[svc.key] ?? Activity;
  const meta = STATUS_META[svc.status];
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.color + '18' }}
          >
            <Icon size={20} style={{ color: meta.color }} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{svc.label}</div>
            {typeof svc.latenceMs === 'number' && (
              <div className="text-xs text-gray-400 mt-0.5">Latence : {svc.latenceMs} ms</div>
            )}
          </div>
        </div>
        <Pastille status={svc.status} />
      </div>

      {svc.message && (
        <p className="text-xs text-amber-600 mt-3">{svc.message}</p>
      )}

      {svc.details && Object.keys(svc.details).length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 pt-3 border-t border-gray-50">
          {Object.entries(svc.details).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-gray-400">{k} : </span>
              <span className="text-gray-700 font-medium">
                {Array.isArray(v) ? (v.length ? v.join(', ') : '—') : String(v ?? '—')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperadminSantePage() {
  const [data, setData] = useState<HealthDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const d = await apiClient<HealthDetails>('/health/details');
      setData(d);
      setError('');
      setLastCheck(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 15000); // auto-refresh 15 s
    return () => clearInterval(id);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw size={18} className="animate-spin" /> Chargement de l&apos;état système…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <XCircle size={40} className="mx-auto mb-3 text-red-500" />
        <h2 className="font-semibold text-gray-900 mb-1">Impossible de récupérer l&apos;état système</h2>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
        >
          <RefreshCw size={15} /> Réessayer
        </button>
      </div>
    );
  }

  const g = data ? GLOBAL_META[data.status] : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> État du système
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Observabilité en temps réel des services SANTAREX — actualisation automatique (15 s).
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-60"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* Bandeau statut global */}
      {data && g && (
        <div
          className="rounded-xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4"
          style={{ background: g.color + '12', border: `1px solid ${g.color}40` }}
        >
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ background: g.color }} />
            <span className="font-semibold" style={{ color: g.color }}>{g.label}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Version <b className="text-gray-700">v{data.version}</b></span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} /> Uptime <b className="text-gray-700">{formatUptime(data.uptimeSec)}</b>
            </span>
          </div>
        </div>
      )}

      {/* Grille des services */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.services.map((svc) => <ServiceRow key={svc.key} svc={svc} />)}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        {lastCheck ? `Dernière vérification : ${lastCheck.toLocaleTimeString('fr-FR')}` : ''}
        {error && <span className="text-amber-600"> · dernière actualisation en échec ({error})</span>}
      </p>
    </div>
  );
}
