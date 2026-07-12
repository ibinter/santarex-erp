'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { SuperadminDashboard } from '@/types';
import {
  Building2, CreditCard, TrendingUp, AlertTriangle,
  CheckCircle, Info, XCircle, Activity,
} from 'lucide-react';

function StatCard({
  icon: Icon, label, value, sub, color,
}: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

const ALERTE_STYLES = {
  danger: { icon: XCircle, bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', iconColor: '#EF4444' },
  warning: { icon: AlertTriangle, bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', iconColor: '#F59E0B' },
  info: { icon: Info, bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', iconColor: '#3B82F6' },
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Connexion',
  LOGIN_FAILED: 'Tentative échouée',
  CREATE: 'Création',
  UPDATE: 'Modification',
  DELETE: 'Suppression',
  ACTIVATE: 'Activation',
  SUSPEND: 'Suspension',
  EXPORT: 'Export',
};

export default function SuperadminDashboardPage() {
  const [data, setData] = useState<SuperadminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.superadmin.getDashboard()
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Global</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de tous les établissements SANTAREX</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Établissements" value={data?.tenants.total ?? 0}
          sub={`${data?.tenants.actifs ?? 0} actifs`} color="#0D47A1" />
        <StatCard icon={CreditCard} label="Licences actives" value={data?.licences.actives ?? 0}
          sub={`${data?.licences.essai ?? 0} en essai`} color="#00838F" />
        <StatCard icon={TrendingUp} label="Licences suspendues" value={data?.licences.suspendues ?? 0}
          sub="À régulariser" color="#EF4444" />
        <StatCard icon={CheckCircle} label="Offres SaaS" value={data?.offres.length ?? 0}
          sub="Plans disponibles" color="#22C55E" />
      </div>

      {/* Alertes + Activité récente */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alertes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Alertes
          </h2>
          {data?.alertes.length === 0 ? (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-lg p-3">
              <CheckCircle size={16} /> Aucune alerte — tout est nominal
            </div>
          ) : (
            <div className="space-y-3">
              {data?.alertes.map((a, i) => {
                const s = ALERTE_STYLES[a.niveau];
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-3"
                    style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
                    <Icon size={15} style={{ color: s.iconColor }} className="mt-0.5 flex-shrink-0" />
                    <span className="text-sm" style={{ color: s.text }}>{a.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" /> Activité récente
          </h2>
          <div className="space-y-2">
            {data?.activiteRecente.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">· {log.ressource}</span>
                  {log.userEmail && (
                    <span className="text-xs text-gray-400 ml-1 truncate"> · {log.userEmail}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {!data?.activiteRecente.length && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune activité enregistrée</p>
            )}
          </div>
        </div>
      </div>

      {/* Offres SaaS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-teal-500" /> Plans SaaS actifs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.offres.map((o) => (
            <div key={o.id} className="rounded-lg border border-gray-100 p-4 relative">
              {o.estMisEnAvant && (
                <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}>
                  ★ Recommandé
                </span>
              )}
              <div className="font-bold text-gray-800">{o.nom}</div>
              <div className="text-2xl font-bold text-primary mt-1">
                {o.prix.toLocaleString('fr-FR')} <span className="text-sm font-normal text-gray-500">FCFA/{o.cycle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
