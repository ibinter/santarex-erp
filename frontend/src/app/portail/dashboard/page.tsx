'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  FlaskConical,
  Pill,
  UserCircle,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { API_URL } from '@/lib/api';

type Onglet = 'rendezVous' | 'resultats' | 'ordonnances' | 'profil';

interface RendezVous {
  id: string;
  dateHeure: string;
  dureeMinutes: number;
  motif: string;
  type: string;
  statut: string;
  salle: string | null;
}
interface ValeurResultat {
  paramNom: string;
  valeur: string | number;
  unite: string;
  valeursNormalesMin?: number;
  valeursNormalesMax?: number;
  interpretation: string;
}
interface Resultat {
  id: string;
  dateValidation: string;
  interpretation: string | null;
  estCritique: boolean;
  resultats: ValeurResultat[];
}
interface LigneOrdonnance {
  medicamentNom: string;
  posologie: string;
  duree: string;
  quantite: number;
  instructions?: string;
}
interface Ordonnance {
  id: string;
  dateEmission: string;
  dateExpiration: string | null;
  statut: string;
  instructions: string | null;
  lignes: LigneOrdonnance[];
}
interface Profil {
  ipp: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  telephone: string | null;
  ville: string | null;
  groupeSanguin: string | null;
}

export default function PortailDashboardPage() {
  const router = useRouter();
  const t = useTranslations('portail');
  const [onglet, setOnglet] = useState<Onglet>('rendezVous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [profil, setProfil] = useState<Profil | null>(null);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem('portail_token');
    router.replace('/portail');
  }, [router]);

  const fetchPortail = useCallback(
    async <T,>(path: string): Promise<T> => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('portail_token') : null;
      if (!token) {
        logout();
        throw new Error(t('sessionExpiree'));
      }
      const res = await fetch(`${API_URL}/portail-patient/moi/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        throw new Error(t('sessionExpiree'));
      }
      if (!res.ok) throw new Error(t('erreurChargement'));
      return res.json();
    },
    [logout, t],
  );

  useEffect(() => {
    let annule = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [r, re, o, p] = await Promise.all([
          fetchPortail<RendezVous[]>('rendez-vous'),
          fetchPortail<Resultat[]>('resultats'),
          fetchPortail<Ordonnance[]>('ordonnances'),
          fetchPortail<Profil>('profil'),
        ]);
        if (annule) return;
        setRdv(r);
        setResultats(re);
        setOrdonnances(o);
        setProfil(p);
      } catch (err) {
        if (!annule) setError((err as Error).message);
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [fetchPortail]);

  const onglets: { key: Onglet; label: string; icon: typeof CalendarDays }[] = [
    { key: 'rendezVous', label: t('onglets.rendezVous'), icon: CalendarDays },
    { key: 'resultats', label: t('onglets.resultats'), icon: FlaskConical },
    { key: 'ordonnances', label: t('onglets.ordonnances'), icon: Pill },
    { key: 'profil', label: t('onglets.profil'), icon: UserCircle },
  ];

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : '—';
  const fmtDateTime = (d: string) =>
    d ? new Date(d).toLocaleString() : '—';

  return (
    <div className="min-h-screen bg-surface">
      {/* En-tête */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo-tr.png" alt="SANTAREX" className="h-8 w-auto object-contain" />
            <span className="text-sm font-semibold text-text-primary hidden sm:inline">
              {t('dashboardTitle')}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-danger transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('deconnexion')}</span>
          </button>
        </div>
      </header>

      {/* Onglets */}
      <nav className="bg-white border-b sticky top-[57px] z-10">
        <div className="max-w-3xl mx-auto flex overflow-x-auto">
          {onglets.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setOnglet(key)}
              className={`flex-1 min-w-[90px] flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium border-b-2 transition-colors ${
                onglet === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-5">
        {loading && <p className="text-sm text-text-secondary text-center py-10">{t('chargement')}</p>}
        {error && !loading && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-danger">{error}</div>
        )}

        {!loading && !error && onglet === 'rendezVous' && (
          <div className="flex flex-col gap-3">
            {rdv.length === 0 && <EmptyState label={t('aucunRendezVous')} />}
            {rdv.map((r) => (
              <div key={r.id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text-primary text-sm">{fmtDateTime(r.dateHeure)}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-primary">{r.statut}</span>
                </div>
                <p className="text-sm text-text-secondary">{t('rdv.motif')}: {r.motif}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {t('rdv.type')}: {r.type} · {t('rdv.duree')}: {r.dureeMinutes} min
                  {r.salle ? ` · ${t('rdv.salle')}: ${r.salle}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && onglet === 'resultats' && (
          <div className="flex flex-col gap-3">
            {resultats.length === 0 && <EmptyState label={t('aucunResultat')} />}
            {resultats.map((r) => (
              <div key={r.id} className="bg-white rounded-card shadow-card p-4">
                <p className="text-xs text-text-secondary mb-2">
                  {t('resultat.valideLe')} {fmtDate(r.dateValidation)}
                </p>
                {r.estCritique && (
                  <div className="flex items-center gap-1.5 text-xs text-danger mb-2">
                    <AlertTriangle size={14} /> {t('resultat.critique')}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-text-secondary text-left border-b">
                        <th className="py-1 pr-2 font-medium">{t('resultat.parametre')}</th>
                        <th className="py-1 pr-2 font-medium">{t('resultat.valeur')}</th>
                        <th className="py-1 pr-2 font-medium">{t('resultat.normes')}</th>
                        <th className="py-1 font-medium">{t('resultat.interpretation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.resultats.map((v, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1 pr-2">{v.paramNom}</td>
                          <td className="py-1 pr-2 font-medium">{v.valeur} {v.unite}</td>
                          <td className="py-1 pr-2 text-text-secondary">
                            {v.valeursNormalesMin != null && v.valeursNormalesMax != null
                              ? `${v.valeursNormalesMin} – ${v.valeursNormalesMax}`
                              : '—'}
                          </td>
                          <td className="py-1">{v.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {r.interpretation && (
                  <p className="text-xs text-text-secondary mt-2">{r.interpretation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && onglet === 'ordonnances' && (
          <div className="flex flex-col gap-3">
            {ordonnances.length === 0 && <EmptyState label={t('aucuneOrdonnance')} />}
            {ordonnances.map((o) => (
              <div key={o.id} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary">
                    {t('ordonnance.emiseLe')} {fmtDate(o.dateEmission)}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">{o.statut}</span>
                </div>
                <ul className="flex flex-col gap-2">
                  {o.lignes.map((l, i) => (
                    <li key={i} className="text-sm border-l-2 border-primary/40 pl-2">
                      <p className="font-medium text-text-primary">{l.medicamentNom}</p>
                      <p className="text-xs text-text-secondary">
                        {t('ordonnance.posologie')}: {l.posologie} · {t('ordonnance.duree')}: {l.duree} · {t('ordonnance.quantite')}: {l.quantite}
                      </p>
                      {l.instructions && <p className="text-xs text-text-secondary">{l.instructions}</p>}
                    </li>
                  ))}
                </ul>
                {o.instructions && (
                  <p className="text-xs text-text-secondary mt-2">{t('ordonnance.instructions')}: {o.instructions}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && onglet === 'profil' && profil && (
          <div className="bg-white rounded-card shadow-card p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Field label={t('profil.ipp')} value={profil.ipp} />
              <Field label={t('profil.nom')} value={profil.nom} />
              <Field label={t('profil.prenom')} value={profil.prenom} />
              <Field label={t('profil.dateNaissance')} value={fmtDate(profil.dateNaissance)} />
              <Field label={t('profil.sexe')} value={profil.sexe} />
              <Field label={t('profil.telephone')} value={profil.telephone || '—'} />
              <Field label={t('profil.ville')} value={profil.ville || '—'} />
              <Field label={t('profil.groupeSanguin')} value={profil.groupeSanguin || '—'} />
            </dl>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-text-secondary text-center py-10">{label}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="text-text-primary font-medium">{value}</dd>
    </div>
  );
}
