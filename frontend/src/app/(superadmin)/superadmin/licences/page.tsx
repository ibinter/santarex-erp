'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Licence, LicenceStatut } from '@/types';
import { CreditCard, RefreshCw, PauseCircle, CheckCircle, Plus } from 'lucide-react';

const STATUT_CONFIG: Record<LicenceStatut, { label: string; bg: string; text: string }> = {
  active:    { label: 'Active',    bg: '#DCFCE7', text: '#166534' },
  suspendue: { label: 'Suspendue', bg: '#FEE2E2', text: '#991B1B' },
  expiree:   { label: 'Expirée',   bg: '#F3F4F6', text: '#6B7280' },
  essai:     { label: 'Essai',     bg: '#DBEAFE', text: '#1E40AF' },
  annulee:   { label: 'Annulée',   bg: '#FEF9C3', text: '#854D0E' },
};

function Badge({ statut }: { statut: LicenceStatut }) {
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.expiree;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>{c.label}</span>
  );
}

function joursRestants(dateExp: string): number {
  return Math.ceil((new Date(dateExp).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function LicencesPage() {
  const [licences, setLicences] = useState<Licence[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [offres, setOffres] = useState<Array<{ id: string; code: string; nom: string }>>([]);
  const [form, setForm] = useState({
    tenantSlug: '',
    offreId: '',
    dateDebut: new Date().toISOString().slice(0, 10),
    joursEssai: '',
    montantPaye: '',
    maxUtilisateurs: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superadmin.getLicences({ page, limit: 20 });
      setLicences(res.data ?? res);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setShowCreate(true);
    if (!offres.length) {
      try {
        const res = await api.superadmin.getOffres();
        setOffres(res.data ?? res ?? []);
      } catch {
        setOffres([]);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug.trim() || !form.offreId || !form.dateDebut) {
      alert('Le tenant, l\'offre et la date de début sont obligatoires.');
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        tenantSlug: form.tenantSlug.trim(),
        offreId: form.offreId,
        dateDebut: new Date(form.dateDebut).toISOString(),
      };
      if (form.joursEssai) payload.joursEssai = Number(form.joursEssai);
      if (form.montantPaye) payload.montantPaye = Number(form.montantPaye);
      if (form.maxUtilisateurs) payload.maxUtilisateurs = Number(form.maxUtilisateurs);
      await api.superadmin.creerLicence(payload);
      setShowCreate(false);
      setForm({ tenantSlug: '', offreId: '', dateDebut: new Date().toISOString().slice(0, 10), joursEssai: '', montantPaye: '', maxUtilisateurs: '' });
      await load();
    } catch (err: any) {
      alert('Échec de la création de la licence : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setCreating(false);
    }
  };

  const handleSuspendre = async (id: string) => {
    if (!window.confirm('Suspendre cette licence ? Le tenant perdra l\'accès aux modules concernés.')) return;
    setActionId(id);
    try {
      await api.superadmin.suspendreLicence(id);
      await load();
    } catch (err: any) {
      alert('Échec de la suspension : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setActionId(null);
    }
  };

  const handleRenouveler = async (id: string) => {
    setActionId(id);
    try {
      await api.superadmin.renouvelerLicence(id, 1);
      await load();
    } catch (err: any) {
      alert('Échec du renouvellement : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={22} className="text-teal-600" /> Licences SaaS
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} licence(s) au total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
          <Plus size={16} /> Créer une licence
        </button>
      </div>

      {/* Modal création licence */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !creating && setShowCreate(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={18} className="text-teal-600" /> Créer une licence
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug du tenant *</label>
                <input value={form.tenantSlug} onChange={(e) => setForm({ ...form, tenantSlug: e.target.value })}
                  placeholder="clinique-saint-joseph" required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Offre SaaS *</label>
                <select value={form.offreId} onChange={(e) => setForm({ ...form, offreId: e.target.value })} required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white">
                  <option value="">— Choisir une offre —</option>
                  {offres.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom} ({o.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date de début *</label>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Jours d'essai</label>
                  <input type="number" min={0} value={form.joursEssai}
                    onChange={(e) => setForm({ ...form, joursEssai: e.target.value })} placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Max. utilisateurs</label>
                  <input type="number" min={1} value={form.maxUtilisateurs}
                    onChange={(e) => setForm({ ...form, maxUtilisateurs: e.target.value })} placeholder="offre"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Montant payé (FCFA)</label>
                <input type="number" min={0} value={form.montantPaye}
                  onChange={(e) => setForm({ ...form, montantPaye: e.target.value })} placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} disabled={creating}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">
                Annuler
              </button>
              <button type="submit" disabled={creating}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
                {creating ? 'Création…' : 'Créer la licence'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Clé / Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Expiration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Montant</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {licences.map((l) => {
                  const jours = joursRestants(l.dateExpiration);
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs text-gray-500">{l.cle}</div>
                        <div className="font-semibold text-gray-800">{l.tenantSlug}</div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                          {l.offreCode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge statut={l.statut} />
                        {l.statut === 'active' && jours <= 30 && jours > 0 && (
                          <div className="text-xs text-amber-600 mt-0.5">⚠ J-{jours}</div>
                        )}
                        {jours <= 0 && l.statut !== 'suspendue' && l.statut !== 'annulee' && (
                          <div className="text-xs text-red-600 mt-0.5">Expiré</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">
                        {new Date(l.dateExpiration).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium hidden lg:table-cell">
                        {l.montantPaye.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleRenouveler(l.id)}
                            disabled={actionId === l.id}
                            title="Renouveler +1 mois"
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 transition-colors"
                          >
                            <RefreshCw size={12} /> +1 mois
                          </button>
                          {l.statut === 'active' && (
                            <button
                              onClick={() => handleSuspendre(l.id)}
                              disabled={actionId === l.id}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <PauseCircle size={12} /> Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!licences.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Aucune licence trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} résultats</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              ← Précédent
            </button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
              className="px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
