'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { OffreSaas } from '@/types';
import { Package, Star, Users, RefreshCw } from 'lucide-react';

const CYCLE_LABELS: Record<string, string> = {
  mensuel: 'mois', trimestriel: 'trimestre', annuel: 'an', unique: 'unique',
};

export default function OffresPage() {
  const [offres, setOffres] = useState<OffreSaas[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.superadmin.getOffres();
      setOffres(Array.isArray(data) ? data : data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleMisEnAvant = async (o: OffreSaas) => {
    await api.superadmin.updateOffre(o.id, { estMisEnAvant: !o.estMisEnAvant });
    load();
  };

  const toggleVisible = async (o: OffreSaas) => {
    await api.superadmin.updateOffre(o.id, { estVisible: !o.estVisible });
    load();
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={22} className="text-purple-600" /> Offres SaaS
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les plans tarifaires de SANTAREX ERP</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {offres.map((o) => {
            const fonctionnalites: string[] = o.fonctionnalites
              ? JSON.parse(o.fonctionnalites)
              : [];
            return (
              <div key={o.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                  o.estMisEnAvant ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'
                }`}>
                {o.estMisEnAvant && (
                  <div className="px-4 py-1.5 text-xs font-bold text-center text-white"
                    style={{ background: 'linear-gradient(135deg,#0D47A1,#00838F)' }}>
                    ★ RECOMMANDÉ
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{o.nom}</div>
                      <div className="text-xs text-gray-400 font-mono">{o.code}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      o.estActif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {o.estActif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">
                      {o.prix.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      FCFA/{CYCLE_LABELS[o.cycle] ?? o.cycle}
                    </span>
                    {o.remiseAnnuelle > 0 && (
                      <div className="text-xs text-green-600 mt-0.5">
                        -{o.remiseAnnuelle}% si paiement annuel
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
                    <Users size={14} className="text-gray-400" />
                    Jusqu'à <strong>{o.maxUtilisateurs}</strong> utilisateurs
                  </div>

                  {fonctionnalites.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {fonctionnalites.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {fonctionnalites.length > 4 && (
                        <li className="text-xs text-gray-400">+{fonctionnalites.length - 4} autres…</li>
                      )}
                    </ul>
                  )}

                  <div className="border-t border-gray-100 pt-3 flex gap-2">
                    <button
                      onClick={() => toggleMisEnAvant(o)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                        o.estMisEnAvant
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Star size={13} fill={o.estMisEnAvant ? 'currentColor' : 'none'} />
                      {o.estMisEnAvant ? 'Recommandé' : 'Mettre en avant'}
                    </button>
                    <button
                      onClick={() => toggleVisible(o)}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                        o.estVisible
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {o.estVisible ? 'Visible' : 'Masqué'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!offres.length && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              Aucune offre configurée. Créez votre premier plan SaaS.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
