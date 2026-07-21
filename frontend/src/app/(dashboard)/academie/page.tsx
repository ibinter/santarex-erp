'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, PlayCircle, FileText, HelpCircle, CheckCircle2,
  Clock, Lock, RefreshCw, BookOpen,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types alignés sur l'API backend (module academie) ─────────────────────────
type RessourceType = 'video' | 'document' | 'quiz';
type ProgressionStatut = 'non_commence' | 'en_cours' | 'termine';

interface Ressource {
  id: string;
  type: RessourceType;
  titre: string;
  description: string | null;
  duree: number | null;
  url: string | null;
  moduleAssocie: string | null;
  langue: string;
  contenuDisponible: boolean;
}

interface Parcours {
  id: string;
  titre: string;
  description: string | null;
  categorie: string;
  niveau: string;
  ressources: Ressource[];
}

interface GroupeCategorie {
  categorie: string;
  label: string;
  parcours: Parcours[];
}

interface Progression {
  ressourceId: string;
  statut: ProgressionStatut;
}

interface Stats {
  totalRessourcesPubliees: number;
  contenuDisponible: number;
  ressourcesCommencees: number;
  ressourcesTerminees: number;
  pourcentageTermine: number;
}

const NIVEAU_LABEL: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

const TYPE_META: Record<RessourceType, { icon: typeof PlayCircle; label: string; color: string; bg: string }> = {
  video: { icon: PlayCircle, label: 'Vidéo', color: '#B91C1C', bg: '#FEE2E2' },
  document: { icon: FileText, label: 'Document', color: '#1D4ED8', bg: '#DBEAFE' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: '#7C3AED', bg: '#EDE9FE' },
};

export default function AcademiePage() {
  const t = useTranslations('academie');
  const [groupes, setGroupes] = useState<GroupeCategorie[]>([]);
  const [progression, setProgression] = useState<Record<string, ProgressionStatut>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const [g, p, s] = await Promise.all([
        apiClient<GroupeCategorie[]>('/academie/parcours'),
        apiClient<Progression[]>('/academie/progression'),
        apiClient<Stats>('/academie/stats'),
      ]);
      setGroupes(Array.isArray(g) ? g : []);
      const map: Record<string, ProgressionStatut> = {};
      (Array.isArray(p) ? p : []).forEach(x => { map[x.ressourceId] = x.statut; });
      setProgression(map);
      setStats(s ?? null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  const marquer = useCallback(async (ressourceId: string, statut: 'en_cours' | 'termine') => {
    setBusy(ressourceId);
    try {
      await apiClient(`/academie/progression/${ressourceId}`, { method: 'POST', body: { statut } });
      setProgression(prev => ({ ...prev, [ressourceId]: statut }));
      // Rafraîchir les stats globales sans recharger toute la page.
      try { setStats(await apiClient<Stats>('/academie/stats')); } catch { /* silencieux */ }
    } catch {
      /* silencieux — l'état local n'est pas modifié en cas d'échec */
    } finally {
      setBusy(null);
    }
  }, []);

  const totalRessources = useMemo(
    () => groupes.reduce((acc, g) => acc + g.parcours.reduce((a, p) => a + p.ressources.length, 0), 0),
    [groupes],
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#EFF6FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GraduationCap size={26} color="#0D47A1" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1A2332' }}>{t('title')}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#546E7A' }}>
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* ── Bandeau progression globale ─────────────────────────────────── */}
      {stats && (
        <div style={{
          background: '#fff', border: '1px solid #E5E9F0', borderRadius: 14,
          padding: '18px 20px', marginTop: 16, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            <StatBloc valeur={stats.ressourcesTerminees} total={stats.totalRessourcesPubliees} label={t('statCompleted')} />
            <StatBloc valeur={stats.ressourcesCommencees} total={stats.totalRessourcesPubliees} label={t('statStarted')} />
            <StatBloc valeur={stats.contenuDisponible} total={stats.totalRessourcesPubliees} label={t('statAvailable')} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#546E7A', marginBottom: 6 }}>
                <span>{t('globalProgress')}</span>
                <span style={{ fontWeight: 700, color: '#0D47A1' }}>{stats.pourcentageTermine}%</span>
              </div>
              <div style={{ height: 10, background: '#EEF2F7', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${stats.pourcentageTermine}%`, height: '100%',
                  background: 'linear-gradient(90deg,#1E88E5,#0D47A1)', transition: 'width .3s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── États ────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#546E7A' }}>
          <RefreshCw size={22} className="spin" style={{ marginBottom: 8 }} />
          <div>{t('loading')}</div>
        </div>
      )}

      {!loading && erreur && (
        <div style={{ padding: 20, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          {erreur}
          <button onClick={charger} style={{ marginLeft: 12, ...btnLien }}>{t('retry')}</button>
        </div>
      )}

      {!loading && !erreur && totalRessources === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#546E7A', background: '#fff', border: '1px solid #E5E9F0', borderRadius: 14 }}>
          <BookOpen size={28} color="#90A4AE" style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 600 }}>{t('emptyTitle')}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{t('emptySubtitle')}</div>
        </div>
      )}

      {/* ── Catégories & parcours ────────────────────────────────────────── */}
      {!loading && !erreur && groupes.map(groupe => (
        <section key={groupe.categorie} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A2332', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 18, background: '#0D47A1', borderRadius: 2, display: 'inline-block' }} />
            {groupe.label}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {groupe.parcours.map(parcours => {
              const termines = parcours.ressources.filter(r => progression[r.id] === 'termine').length;
              const pct = parcours.ressources.length ? Math.round((termines / parcours.ressources.length) * 100) : 0;
              return (
                <div key={parcours.id} style={{
                  background: '#fff', border: '1px solid #E5E9F0', borderRadius: 14,
                  padding: 18, display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1A2332' }}>{parcours.titre}</h3>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#546E7A', background: '#F1F5F9', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                      {NIVEAU_LABEL[parcours.niveau] ? t(`niveau.${parcours.niveau}`) : parcours.niveau}
                    </span>
                  </div>
                  {parcours.description && (
                    <p style={{ margin: '6px 0 12px', fontSize: 13, color: '#546E7A', lineHeight: 1.5 }}>{parcours.description}</p>
                  )}

                  {/* Barre de progression du parcours */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#78909C', marginBottom: 4 }}>
                      <span>{termines}/{parcours.ressources.length} {t('completed', { count: termines })}</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#EEF2F7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#43A047', transition: 'width .3s ease' }} />
                    </div>
                  </div>

                  {/* Ressources */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parcours.ressources.map(r => {
                      const meta = TYPE_META[r.type];
                      const Icon = meta.icon;
                      const statut = progression[r.id] ?? 'non_commence';
                      const dispo = r.contenuDisponible && !!r.url;
                      return (
                        <div key={r.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10,
                          background: statut === 'termine' ? '#F0FDF4' : '#F8FAFC',
                          border: `1px solid ${statut === 'termine' ? '#BBF7D0' : '#EEF2F7'}`,
                        }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                            background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={16} color={meta.color} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titre}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: '#78909C' }}>
                              <span>{t(`type.${r.type}`)}</span>
                              {r.duree != null && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <Clock size={11} /> {r.duree} {t('minUnit')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action / badge honnête */}
                          {!dispo ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                              fontSize: 11, fontWeight: 600, color: '#B45309',
                              background: '#FEF3C7', border: '1px solid #FDE68A',
                              borderRadius: 6, padding: '4px 8px',
                            }}>
                              <Lock size={11} /> {t('soon')}
                            </span>
                          ) : statut === 'termine' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#15803D' }}>
                              <CheckCircle2 size={14} /> {t('done')}
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {r.url && (
                                <a href={r.url} target="_blank" rel="noopener noreferrer"
                                  onClick={() => { if (statut === 'non_commence') marquer(r.id, 'en_cours'); }}
                                  style={{ ...btnPrimaireSm }}>
                                  {t('open')}
                                </a>
                              )}
                              <button disabled={busy === r.id} onClick={() => marquer(r.id, 'termine')} style={{ ...btnSecondaireSm, opacity: busy === r.id ? 0.6 : 1 }}>
                                {t('finish')}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Sous-composants & styles ─────────────────────────────────────────────────
function StatBloc({ valeur, total, label }: { valeur: number; total: number; label: string }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#1A2332' }}>
        {valeur}<span style={{ fontSize: 14, fontWeight: 600, color: '#90A4AE' }}> / {total}</span>
      </div>
      <div style={{ fontSize: 12, color: '#546E7A' }}>{label}</div>
    </div>
  );
}

const btnLien: React.CSSProperties = {
  border: 'none', background: 'transparent', color: '#0D47A1', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
};

const btnPrimaireSm: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#fff', background: '#0D47A1',
  borderRadius: 7, padding: '6px 12px', textDecoration: 'none', border: 'none', cursor: 'pointer',
};

const btnSecondaireSm: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#0D47A1', background: '#EFF6FF',
  border: '1px solid #BFDBFE', borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
};
