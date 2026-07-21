'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  Bot, Save, RefreshCw, Gauge, KeyRound, Thermometer, Hash, MessageSquare,
  Activity, ShieldCheck, Sparkles,
} from 'lucide-react';

type AiProvider = 'groq' | 'anthropic' | 'openai';

interface AiConfig {
  id: string;
  tenantId: string;
  provider: AiProvider;
  model: string;
  estActif: boolean;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
  quotaMessagesJour: number;
}

interface UsageSummary {
  quotaMessagesJour: number;
  usedToday: number;
  restantAujourdhui: number;
  totalMessages30j: number;
  totalTokens30j: number;
  parDate: { date: string; nbMessages: number; nbTokensEstimes: number }[];
}

const PROVIDERS: { value: AiProvider; label: string; hint: string }[] = [
  { value: 'groq', label: 'Groq', hint: 'llama-3.3-70b-versatile (défaut)' },
  { value: 'anthropic', label: 'Anthropic', hint: 'claude-haiku-4-5' },
  { value: 'openai', label: 'OpenAI', hint: 'gpt-4o-mini' },
];

export default function SuperadminIaPage() {
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, usg] = await Promise.all([
        apiClient<AiConfig>('/ai-assistant/config'),
        apiClient<UsageSummary>('/ai-assistant/usage').catch(() => null),
      ]);
      setConfig(cfg);
      if (usg) setUsage(usg);
    } catch (e) {
      setToast({ type: 'err', msg: (e as Error).message || 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = (field: keyof AiConfig, value: unknown) =>
    setConfig((c) => (c ? { ...c, [field]: value } as AiConfig : c));

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        provider: config.provider,
        model: config.model,
        estActif: config.estActif,
        systemPrompt: config.systemPrompt ?? '',
        temperature: Number(config.temperature),
        maxTokens: Number(config.maxTokens),
        quotaMessagesJour: Number(config.quotaMessagesJour),
      };
      const updated = await apiClient<AiConfig>('/ai-assistant/config', { method: 'PATCH', body: payload });
      setConfig(updated);
      setToast({ type: 'ok', msg: 'Configuration IA enregistrée.' });
      apiClient<UsageSummary>('/ai-assistant/usage').then(setUsage).catch(() => {});
    } catch (e) {
      setToast({ type: 'err', msg: (e as Error).message || "Échec de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!config) {
    return <div className="text-center py-16 text-gray-400">Configuration IA indisponible.</div>;
  }

  const quotaPct = usage && usage.quotaMessagesJour > 0
    ? Math.min(100, Math.round((usage.usedToday / usage.quotaMessagesJour) * 100))
    : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot size={22} className="text-purple-600" /> Assistante IA (SARA)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configuration du moteur, du prompt système et des quotas — par établissement
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {toast && (
        <div className={`text-sm px-4 py-2.5 rounded-lg border ${
          toast.type === 'ok'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Consommation */}
      <div className="grid sm:grid-cols-4 gap-4">
        <StatCard icon={<Activity size={16} />} label="Messages aujourd'hui"
          value={usage ? `${usage.usedToday} / ${usage.quotaMessagesJour || '∞'}` : '—'} accent="#7C3AED" />
        <StatCard icon={<Gauge size={16} />} label="Restant aujourd'hui"
          value={usage ? String(usage.restantAujourdhui) : '—'} accent="#0891B2" />
        <StatCard icon={<MessageSquare size={16} />} label="Messages (30 j)"
          value={usage ? usage.totalMessages30j.toLocaleString('fr-FR') : '—'} accent="#2563EB" />
        <StatCard icon={<Hash size={16} />} label="Tokens estimés (30 j)"
          value={usage ? usage.totalTokens30j.toLocaleString('fr-FR') : '—'} accent="#059669" />
      </div>

      {usage && usage.quotaMessagesJour > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600 font-medium">Consommation du quota journalier</span>
            <span className="text-gray-400">{quotaPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${quotaPct}%`, background: quotaPct >= 90 ? '#DC2626' : 'linear-gradient(135deg,#0D47A1,#00838F)' }} />
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" /> Moteur & comportement
          </h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <span className={config.estActif ? 'text-green-700 font-medium' : 'text-gray-400'}>
              {config.estActif ? 'Assistant activé' : 'Assistant désactivé'}
            </span>
            <button type="button" onClick={() => patch('estActif', !config.estActif)}
              className={`relative w-11 h-6 rounded-full transition-colors ${config.estActif ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${config.estActif ? 'translate-x-5' : ''}`} />
            </button>
          </label>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fournisseur</label>
          <div className="grid sm:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => (
              <button key={p.value} type="button" onClick={() => patch('provider', p.value)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  config.provider === p.value
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="font-semibold text-gray-800 text-sm">{p.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{p.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Model + Key */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Modèle">
            <input value={config.model} onChange={(e) => patch('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-primary"
              placeholder="llama-3.3-70b-versatile" />
          </Field>
          <Field label="Clé API">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-400">
              <KeyRound size={14} />
              <span className="font-mono tracking-widest">••••••••••••</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
              <ShieldCheck size={11} /> Stockée côté serveur (variables d'environnement), jamais transmise au navigateur.
            </p>
          </Field>
        </div>

        {/* Temperature + maxTokens + quota */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={`Température (${config.temperature})`} icon={<Thermometer size={13} />}>
            <input type="range" min={0} max={2} step={0.1} value={config.temperature}
              onChange={(e) => patch('temperature', parseFloat(e.target.value))} className="w-full accent-purple-600" />
          </Field>
          <Field label="Max tokens (réponse)" icon={<Hash size={13} />}>
            <input type="number" min={64} max={8192} value={config.maxTokens}
              onChange={(e) => patch('maxTokens', parseInt(e.target.value || '0', 10))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
          </Field>
          <Field label="Quota messages / jour / tenant" icon={<Gauge size={13} />}>
            <input type="number" min={0} max={100000} value={config.quotaMessagesJour}
              onChange={(e) => patch('quotaMessagesJour', parseInt(e.target.value || '0', 10))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" />
          </Field>
        </div>

        {/* System prompt */}
        <Field label="Message système (prompt de SARA)">
          <textarea value={config.systemPrompt ?? ''} onChange={(e) => patch('systemPrompt', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary leading-relaxed"
            placeholder="Laissez vide pour utiliser le prompt système SARA par défaut." />
          <p className="text-[11px] text-gray-400 mt-1">
            Le contexte produit (FAQ, guides, offres) est injecté automatiquement via le RAG interne — inutile de le recopier ici.
          </p>
        </Field>

        <div className="flex justify-end pt-1">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
            <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Historique */}
      {usage && usage.parDate.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-3 text-sm">Consommation par jour (30 derniers jours)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold text-right">Messages</th>
                  <th className="py-2 font-semibold text-right">Tokens estimés</th>
                </tr>
              </thead>
              <tbody>
                {usage.parDate.map((r) => (
                  <tr key={r.date} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{r.date}</td>
                    <td className="py-2 text-right text-gray-800 font-medium">{r.nbMessages.toLocaleString('fr-FR')}</td>
                    <td className="py-2 text-right text-gray-500">{r.nbTokensEstimes.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
        <span style={{ color: accent }}>{icon}</span> {label}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
