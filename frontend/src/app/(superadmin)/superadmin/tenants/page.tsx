'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Tenant, TenantStatut } from '@/types';
import { Building2, Plus, Search, CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react';

const STATUT_CONFIG: Record<TenantStatut, { label: string; bg: string; text: string }> = {
  actif:       { label: 'Actif',      bg: '#DCFCE7', text: '#166534' },
  suspendu:    { label: 'Suspendu',   bg: '#FEE2E2', text: '#991B1B' },
  essai:       { label: 'Essai',      bg: '#DBEAFE', text: '#1E40AF' },
  expire:      { label: 'Expiré',     bg: '#F3F4F6', text: '#6B7280' },
  en_attente:  { label: 'En attente', bg: '#FEF9C3', text: '#854D0E' },
};

function Badge({ statut }: { statut: TenantStatut }) {
  const c = STATUT_CONFIG[statut] ?? STATUT_CONFIG.en_attente;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nom: '', slug: '', email: '', telephone: '', maxUtilisateurs: '' });
  // Export CSV de la base clients (tous / par statut).
  const [statuts, setStatuts] = useState<string[]>([]);
  const [statutExport, setStatutExport] = useState('');
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    api.superadmin.getStatutsClients().then(setStatuts).catch(() => {});
  }, []);
  const exporterClients = async (statut?: string) => {
    setExporting(true);
    try {
      await api.superadmin.telechargerClientsCsv(statut || undefined);
    } catch (e: any) {
      alert(e?.message || 'Export impossible');
    } finally {
      setExporting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.superadmin.getTenants({ page, limit: 20 });
      setTenants(res.data ?? res);
      setTotal(res.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.slug.trim()) {
      alert('Le nom et le slug sont obligatoires.');
      return;
    }
    setCreating(true);
    try {
      const payload: any = { nom: form.nom.trim(), slug: form.slug.trim() };
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.telephone.trim()) payload.telephone = form.telephone.trim();
      if (form.maxUtilisateurs) payload.maxUtilisateurs = Number(form.maxUtilisateurs);
      await api.superadmin.createTenant(payload);
      setShowCreate(false);
      setForm({ nom: '', slug: '', email: '', telephone: '', maxUtilisateurs: '' });
      await load();
    } catch (err: any) {
      alert('Échec de la création du tenant : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setCreating(false);
    }
  };

  const filtered = search
    ? tenants.filter(
        (t) =>
          t.nom.toLowerCase().includes(search.toLowerCase()) ||
          t.slug.toLowerCase().includes(search.toLowerCase()) ||
          t.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : tenants;

  const handleAction = async (id: string, action: 'suspendre' | 'activer') => {
    if (action === 'suspendre' &&
        !window.confirm('Suspendre ce tenant ? Ses utilisateurs perdront l\'accès à la plateforme.')) {
      return;
    }
    setActionId(id);
    try {
      if (action === 'suspendre') await api.superadmin.suspendreTenant(id);
      else await api.superadmin.activerTenant(id);
      await load();
    } catch (err: any) {
      alert('Échec de l\'action : ' + (err?.message ?? 'erreur inconnue'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={22} className="text-primary" /> Établissements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} tenant(s) enregistré(s)</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
          <Plus size={16} /> Nouveau tenant
        </button>
      </div>

      {/* Export de la base clients (CSV — Excel / Google Sheets) */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Export clients :</span>
        <button
          onClick={() => exporterClients()}
          disabled={exporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: '#065F46' }}>
          <Download size={15} /> Exporter tous les clients (CSV)
        </button>
        <span className="text-gray-300">|</span>
        <select
          value={statutExport}
          onChange={(e) => setStatutExport(e.target.value)}
          className="px-2 py-1.5 rounded-lg border border-gray-300 text-sm bg-white">
          <option value="">— Choisir un statut —</option>
          {statuts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => exporterClients(statutExport)}
          disabled={exporting || !statutExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 disabled:opacity-50">
          <Download size={15} /> Exporter par statut
        </button>
      </div>

      {/* Modal création tenant */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !creating && setShowCreate(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={18} className="text-primary" /> Nouveau tenant
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nom *</label>
                <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Clinique Saint-Joseph" required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="clinique-saint-joseph" required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@saint-joseph.ci"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone</label>
                <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+22507000000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Max. utilisateurs</label>
                <input type="number" min={1} value={form.maxUtilisateurs}
                  onChange={(e) => setForm({ ...form, maxUtilisateurs: e.target.value })}
                  placeholder="10"
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
                {creating ? 'Création…' : 'Créer le tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
        />
      </div>

      {/* Table */}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Établissement</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-800">{t.nom}</div>
                      <div className="text-xs text-gray-400">{t.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="text-gray-600">{t.email ?? '—'}</div>
                      <div className="text-xs text-gray-400">{t.telephone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge statut={t.statut} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        {t.statut === 'actif' ? (
                          <button
                            onClick={() => handleAction(t.id, 'suspendre')}
                            disabled={actionId === t.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={13} /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(t.id, 'activer')}
                            disabled={actionId === t.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle size={13} /> Activer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      Aucun établissement trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
