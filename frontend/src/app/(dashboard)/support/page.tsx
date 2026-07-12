'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

type TicketStatut = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
type TicketCategorie = 'bug' | 'question' | 'amelioration' | 'facturation' | 'autre';

interface Ticket {
  id: string;
  numero: string;
  sujet: string;
  statut: TicketStatut;
  priorite: string;
  categorie: TicketCategorie;
  createdAt: string;
  updatedAt: string;
  reponses: { auteurNom: string; estAdmin: boolean; message: string; createdAt: string }[];
}

const STATUT_BADGE: Record<TicketStatut, { label: string; color: string }> = {
  ouvert:   { label: 'Ouvert',    color: '#1565C0' },
  en_cours: { label: 'En cours',  color: '#E65100' },
  resolu:   { label: 'Résolu',    color: '#2E7D32' },
  ferme:    { label: 'Fermé',     color: '#616161' },
};

const CAT_LABEL: Record<TicketCategorie, string> = {
  bug: 'Bug', question: 'Question', amelioration: 'Amélioration', facturation: 'Facturation', autre: 'Autre',
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reponse, setReponse] = useState('');
  const [form, setForm] = useState({ sujet: '', message: '', categorie: 'question' as TicketCategorie });
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await apiClient('/support-tickets');
      setTickets(data);
    } catch {}
  };

  useEffect(() => { fetchTickets(); }, []);

  const creer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient('/support-tickets', { method: 'POST', body: form });
      setShowForm(false);
      setForm({ sujet: '', message: '', categorie: 'question' });
      fetchTickets();
    } catch {} finally { setLoading(false); }
  };

  const envoyer = async () => {
    if (!selected || !reponse.trim()) return;
    setLoading(true);
    try {
      const updated = await apiClient(`/support-tickets/${selected.id}/repondre`, { method: 'POST', body: { message: reponse } });
      setSelected(updated);
      setReponse('');
      fetchTickets();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ouvrez un ticket, notre équipe vous répond sous 24h</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}
        >
          + Nouveau ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Liste */}
        <div className="space-y-2">
          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aucun ticket — cliquez sur "Nouveau ticket" pour commencer
            </div>
          )}
          {tickets.map((t) => {
            const s = STATUT_BADGE[t.statut];
            return (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                className={`bg-white rounded-xl p-4 cursor-pointer border-2 transition-all hover:shadow-md ${selected?.id === t.id ? 'border-blue-500' : 'border-transparent'}`}
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{t.numero} · {CAT_LABEL[t.categorie]}</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.sujet}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(t.updatedAt).toLocaleDateString('fr-FR')} · {t.reponses?.length ?? 0} réponse(s)
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.color + '18', color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Détail ticket */}
        {selected && (
          <div className="bg-white rounded-xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 className="font-bold text-gray-900 mb-1">{selected.sujet}</h2>
            <p className="text-xs text-gray-400 mb-4">{selected.numero} · {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
            <div className="space-y-3 max-h-56 overflow-y-auto mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selected.reponses?.[0]?.message ?? ''}</div>
              {(selected.reponses ?? []).slice(1).map((r, i) => (
                <div key={i} className={`rounded-lg p-3 text-sm ${r.estAdmin ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-700'}`}>
                  <p className="text-[10px] font-semibold mb-1 opacity-70">{r.estAdmin ? '🛡 IBIG SOFT' : r.auteurNom}</p>
                  {r.message}
                </div>
              ))}
            </div>
            {selected.statut !== 'resolu' && selected.statut !== 'ferme' && (
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  placeholder="Votre réponse…"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                />
                <button
                  onClick={envoyer}
                  disabled={loading || !reponse.trim()}
                  className="px-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-40"
                  style={{ background: '#0D47A1' }}
                >
                  Envoyer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nouveau ticket */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Nouveau ticket</h2>
            <form onSubmit={creer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie</label>
                <select
                  value={form.categorie}
                  onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as TicketCategorie }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                >
                  {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sujet</label>
                <input
                  required value={form.sujet}
                  onChange={(e) => setForm((f) => ({ ...f, sujet: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Décrivez brièvement votre problème"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                <textarea
                  required rows={4} value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
                  placeholder="Détaillez votre demande…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)' }}>
                  {loading ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
