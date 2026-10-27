'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import type { SuperadminDashboard } from '@/types';
import {
  Building2, CreditCard, TrendingUp, AlertTriangle, Hourglass,
  CheckCircle, Info, XCircle, Activity, Megaphone, Wallet,
  DatabaseBackup, ArrowRight, Package,
} from 'lucide-react';

function StatCard({
  icon: Icon, label, value, sub, color,
}: { icon: any; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-1.5 leading-none">{value}</div>
          {sub && <div className="text-xs text-gray-500 mt-2">{sub}</div>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
          <Icon size={21} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function Action({ href, icon: Icon, titre, texte, color }: { href: string; icon: any; titre: string; texte: string; color: string }) {
  return (
    <Link href={href} className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-3 items-start">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-gray-800 flex items-center gap-1">
          {titre} <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{texte}</div>
      </div>
    </Link>
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
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    setPrenom(getCurrentUser()?.firstName ?? '');
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

  const heure = new Date().getHours();
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Bannière d'accueil */}
      <div className="rounded-2xl p-6 lg:p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 55%, #00838F 100%)' }}>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute right-24 -bottom-14 w-36 h-36 rounded-full bg-white/5" />
        <div className="relative">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/70 capitalize">{date}</div>
          <h2 className="text-2xl lg:text-3xl font-extrabold mt-1">{salut}{prenom ? `, ${prenom}` : ''} 👋</h2>
          <p className="text-sm text-white/85 mt-2 max-w-xl">
            {data?.tenants.total ?? 0} établissement(s) sur SANTAREX · {data?.licences.actives ?? 0} licence(s) active(s)
            · {data?.licences.essai ?? 0} en essai
            {(data?.alertes.length ?? 0) > 0 ? ` · ${data?.alertes.length} alerte(s) à regarder` : ' · aucune alerte'}.
          </p>
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Établissements" value={data?.tenants.total ?? 0}
          sub={`${data?.tenants.actifs ?? 0} actifs`} color="#0D47A1" />
        <StatCard icon={CreditCard} label="Licences actives" value={data?.licences.actives ?? 0}
          sub="Abonnements en cours" color="#00838F" />
        <StatCard icon={Hourglass} label="En essai" value={data?.licences.essai ?? 0}
          sub="À convertir en abonnement" color="#F59E0B" />
        <StatCard icon={TrendingUp} label="Suspendues" value={data?.licences.suspendues ?? 0}
          sub="À régulariser" color="#EF4444" />
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-400 mb-3">Actions rapides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Action href="/superadmin/annonces" icon={Megaphone} color="#7C3AED" titre="Annoncer des nouveautés" texte="Envoyer un e-mail à tous vos abonnés" />
          <Action href="/superadmin/paiements" icon={Wallet} color="#0D47A1" titre="Paiement des licences" texte="Configurer GeniusPay et vos clés" />
          <Action href="/superadmin/tenants" icon={Building2} color="#00838F" titre="Établissements" texte="Voir et gérer vos clients" />
          <Action href="/superadmin/licences" icon={CreditCard} color="#F59E0B" titre="Licences" texte="Activer, renouveler, suspendre" />
          <Action href="/superadmin/crm" icon={Package} color="#22C55E" titre="Prospects" texte="Suivre les demandes de démonstration" />
          <Action href="/superadmin/sauvegardes" icon={DatabaseBackup} color="#546E7A" titre="Sauvegardes" texte="Contrôler et lancer une sauvegarde" />
        </div>
      </div>

      {/* Alertes + Activité récente */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={16} className="text-teal-500" /> Plans SaaS actifs
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.offres.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-100 p-4 relative hover:border-gray-200 transition-colors">
              {o.estMisEnAvant && (
                <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}>
                  ★ Recommandé
                </span>
              )}
              <div className="font-bold text-gray-800">{o.nom}</div>
              <div className="text-2xl font-extrabold text-primary mt-1">
                {o.prix.toLocaleString('fr-FR')} <span className="text-sm font-normal text-gray-500">FCFA/{o.cycle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
