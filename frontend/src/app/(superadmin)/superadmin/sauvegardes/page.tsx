'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, API_URL } from '@/lib/api';
import { Database, Download, Trash2, ShieldAlert, Plus, RefreshCw } from 'lucide-react';

const CONFIRMATION_TOKEN = 'RESTAURER-DEFINITIVEMENT';

interface Sauvegarde {
  id: string;
  nom: string;
  type: string;
  statut: 'en_cours' | 'reussie' | 'echouee';
  nomFichier: string | null;
  tailleOctets: string | null;
  checksum: string | null;
  erreur: string | null;
  createdAt: string;
  terminatedAt: string | null;
}

const STATUT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  en_cours: { bg: '#FEF9C3', text: '#854D0E', label: 'En cours' },
  reussie:  { bg: '#DCFCE7', text: '#166534', label: 'Réussie' },
  echouee:  { bg: '#FEE2E2', text: '#991B1B', label: 'Échouée' },
};

function formatTaille(octets: string | null): string {
  if (!octets) return '—';
  const n = Number(octets);
  if (!Number.isFinite(n)) return '—';
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

export default function SauvegardesPage() {
  const [items, setItems] = useState<Sauvegarde[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Restauration
  const [restoreTarget, setRestoreTarget] = useState<Sauvegarde | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient<Sauvegarde[]>('/sauvegardes');
      setItems(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const creer = async () => {
    setCreating(true);
    setError('');
    try {
      await apiClient('/sauvegardes', { method: 'POST', body: {} });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la création');
    } finally {
      setCreating(false);
    }
  };

  const telecharger = async (s: Sauvegarde) => {
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${API_URL}/sauvegardes/${s.id}/telecharger`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Téléchargement refusé');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = s.nomFichier ?? `${s.id}.dump`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message ?? 'Échec du téléchargement');
    }
  };

  const supprimer = async (s: Sauvegarde) => {
    if (!confirm(`Supprimer définitivement la sauvegarde « ${s.nom} » ?`)) return;
    try {
      await apiClient(`/sauvegardes/${s.id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Échec de la suppression');
    }
  };

  const restaurer = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    setRestoreMsg('');
    try {
      const res = await apiClient<{ message: string }>(
        `/sauvegardes/${restoreTarget.id}/restaurer`,
        { method: 'POST', body: { confirmationText: confirmInput } },
      );
      setRestoreMsg(res?.message ?? 'Opération traitée.');
      setConfirmInput('');
      await load();
    } catch (e: any) {
      setRestoreMsg(e?.message ?? 'Échec de la restauration');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={22} className="text-indigo-500" /> Sauvegardes &amp; restauration
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dumps chiffrés de la base, stockés dans un dossier privé du serveur.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            <RefreshCw size={15} /> Rafraîchir
          </button>
          <button
            onClick={creer}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={16} /> {creating ? 'Création…' : 'Créer une sauvegarde'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Liste */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Taille</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Checksum</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((s) => {
                  const st = STATUT_STYLES[s.statut] ?? STATUT_STYLES.en_cours;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(s.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.nom}
                        <span className="ml-2 text-xs text-gray-400">{s.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                          style={{ background: st.bg, color: st.text }}>
                          {st.label}
                        </span>
                        {s.statut === 'echouee' && s.erreur && (
                          <div className="text-xs text-red-500 mt-1 max-w-xs truncate" title={s.erreur}>
                            {s.erreur}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {formatTaille(s.tailleOctets)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 hidden lg:table-cell">
                        {s.checksum ? `${s.checksum.slice(0, 12)}…` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => telecharger(s)}
                            disabled={s.statut !== 'reussie'}
                            title="Télécharger"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => { setRestoreTarget(s); setConfirmInput(''); setRestoreMsg(''); }}
                            disabled={s.statut !== 'reussie'}
                            title="Restaurer"
                            className="p-1.5 rounded hover:bg-amber-50 text-amber-600 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ShieldAlert size={16} />
                          </button>
                          <button
                            onClick={() => supprimer(s)}
                            title="Supprimer"
                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!items.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Aucune sauvegarde. Cliquez sur « Créer une sauvegarde ».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panneau de restauration */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert size={22} />
              <h2 className="text-lg font-bold">Restauration destructrice</h2>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 space-y-2">
              <p className="font-semibold">
                ⚠️ Cette action REMPLACE l'intégralité de la base de données actuelle
                par le contenu de la sauvegarde sélectionnée.
              </p>
              <p>
                Une sauvegarde préalable automatique sera créée avant toute écriture.
                L'opération est irréversible côté données courantes.
              </p>
              <p className="text-xs">
                Cible : <span className="font-mono">{restoreTarget.nom}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pour confirmer, saisissez exactement&nbsp;:
                <span className="font-mono text-red-600"> {CONFIRMATION_TOKEN}</span>
              </label>
              <input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={CONFIRMATION_TOKEN}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            {restoreMsg && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm px-4 py-3">
                {restoreMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setRestoreTarget(null); setConfirmInput(''); setRestoreMsg(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={restaurer}
                disabled={restoring || confirmInput !== CONFIRMATION_TOKEN}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
              >
                {restoring ? 'Traitement…' : 'Confirmer la restauration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
