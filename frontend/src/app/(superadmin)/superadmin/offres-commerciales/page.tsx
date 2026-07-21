'use client';

import { useState, useEffect } from 'react';
import { apiClient, API_URL } from '@/lib/api';
import { FileText, Plus, Send, Download, RefreshCw, X, Check } from 'lucide-react';

interface OffreCommerciale {
  id: string;
  numero: string;
  clientNom: string;
  clientEmail: string;
  logiciel: string;
  formule?: string;
  modules: string[];
  nbUtilisateurs: number;
  nbSites: number;
  duree?: string;
  devise: string;
  prixHT: number;
  remise: number;
  taxes: number;
  prixTTC: number;
  statut: 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree';
  tokenAcceptation: string;
  dateValidite?: string;
  createdAt: string;
}

const STATUT_STYLES: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  envoyee: 'bg-blue-50 text-blue-700',
  acceptee: 'bg-green-50 text-green-700',
  refusee: 'bg-red-50 text-red-700',
  expiree: 'bg-amber-50 text-amber-700',
};

const MODULES_DISPONIBLES = [
  'Patients / DME',
  'Consultations',
  'Rendez-vous',
  'Pharmacie',
  'Laboratoire',
  'Imagerie',
  'Facturation',
  'Caisse',
  'Hospitalisation',
  'Urgences',
  'Bloc opératoire',
  'Comptabilité',
  'RH / Paie',
];

const EMPTY_FORM = {
  clientNom: '',
  clientEmail: '',
  logiciel: 'SANTAREX ERP',
  formule: '',
  modules: [] as string[],
  nbUtilisateurs: 5,
  nbSites: 1,
  duree: '12 mois',
  devise: 'XOF',
  prixHT: 0,
  remise: 0,
  taxes: 0,
  dateValidite: '',
  conditions: '',
  notes: '',
};

export default function OffresCommercialesPage() {
  const [offres, setOffres] = useState<OffreCommerciale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient<OffreCommerciale[]>('/offres-commerciales');
      setOffres(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const prixTTC = Math.max(0, form.prixHT - form.remise) + form.taxes;

  const toggleModule = (m: string) => {
    setForm((f) => ({
      ...f,
      modules: f.modules.includes(m)
        ? f.modules.filter((x) => x !== m)
        : [...f.modules, m],
    }));
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient('/offres-commerciales', {
        method: 'POST',
        body: {
          ...form,
          dateValidite: form.dateValidite || undefined,
          formule: form.formule || undefined,
          conditions: form.conditions || undefined,
          notes: form.notes || undefined,
        },
      });
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const envoyer = async (id: string) => {
    await apiClient(`/offres-commerciales/${id}/envoyer`, { method: 'POST' });
    load();
  };

  const telechargerPdf = async (o: OffreCommerciale) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null;
    const res = await fetch(`${API_URL}/offres-commerciales/${o.id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis-${o.numero}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number, d: string) => `${(n ?? 0).toLocaleString('fr-FR')} ${d}`;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={22} className="text-purple-600" /> Offres commerciales
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Devis personnalisés envoyés aux prospects et clients
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white font-medium"
            style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}
          >
            <Plus size={14} /> Nouveau devis
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Numéro</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Formule</th>
                <th className="px-4 py-3 font-semibold text-right">Total TTC</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offres.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.numero}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{o.clientNom}</div>
                    <div className="text-xs text-gray-400">{o.clientEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.formule || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {fmt(o.prixTTC, o.devise)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        STATUT_STYLES[o.statut] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {o.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => telechargerPdf(o)}
                        title="Télécharger le PDF"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      >
                        <Download size={15} />
                      </button>
                      {o.statut !== 'acceptee' && (
                        <button
                          onClick={() => envoyer(o.id)}
                          title="Envoyer au client"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                        >
                          <Send size={15} />
                        </button>
                      )}
                      <a
                        href={`/offre/${o.tokenAcceptation}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Voir la page publique"
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                      >
                        <FileText size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {!offres.length && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    Aucun devis. Créez votre première offre commerciale.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Nouveau devis</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom du client *">
                  <input
                    className="input"
                    value={form.clientNom}
                    onChange={(e) => setForm({ ...form, clientNom: e.target.value })}
                  />
                </Field>
                <Field label="Email du client *">
                  <input
                    className="input"
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  />
                </Field>
                <Field label="Logiciel">
                  <input
                    className="input"
                    value={form.logiciel}
                    onChange={(e) => setForm({ ...form, logiciel: e.target.value })}
                  />
                </Field>
                <Field label="Formule">
                  <input
                    className="input"
                    placeholder="Clinique, Hôpital…"
                    value={form.formule}
                    onChange={(e) => setForm({ ...form, formule: e.target.value })}
                  />
                </Field>
                <Field label="Utilisateurs">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.nbUtilisateurs}
                    onChange={(e) =>
                      setForm({ ...form, nbUtilisateurs: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Sites">
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={form.nbSites}
                    onChange={(e) => setForm({ ...form, nbSites: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Durée">
                  <input
                    className="input"
                    value={form.duree}
                    onChange={(e) => setForm({ ...form, duree: e.target.value })}
                  />
                </Field>
                <Field label="Devise">
                  <input
                    className="input"
                    value={form.devise}
                    onChange={(e) => setForm({ ...form, devise: e.target.value })}
                  />
                </Field>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Modules
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODULES_DISPONIBLES.map((m) => {
                    const active = form.modules.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModule(m)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                          active
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {active && <Check size={11} />} {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Prix HT">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.prixHT}
                    onChange={(e) => setForm({ ...form, prixHT: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Remise">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.remise}
                    onChange={(e) => setForm({ ...form, remise: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Taxes">
                  <input
                    className="input"
                    type="number"
                    min={0}
                    value={form.taxes}
                    onChange={(e) => setForm({ ...form, taxes: Number(e.target.value) })}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">Total TTC</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(prixTTC, form.devise)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date de validité">
                  <input
                    className="input"
                    type="date"
                    value={form.dateValidite}
                    onChange={(e) => setForm({ ...form, dateValidite: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Conditions">
                <textarea
                  className="input"
                  rows={2}
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={saving || !form.clientNom || !form.clientEmail}
                className="px-4 py-2 rounded-lg text-sm text-white font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}
              >
                {saving ? 'Enregistrement…' : 'Créer le devis'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #374151;
          outline: none;
        }
        .input:focus {
          border-color: #0d47a1;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
