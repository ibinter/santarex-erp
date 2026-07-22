'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldAlert, Plus, X, Trash2, AlertTriangle, AlertOctagon, Info,
  RefreshCw, Search, ListChecks, BookOpen, ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types alignés sur l'API backend (module interactions) ─────────────────────
type Severite = 'contre_indication' | 'majeure' | 'moderee' | 'mineure';

interface InteractionDetectee {
  medicamentA: string;
  medicamentB: string;
  severite: Severite;
  mecanisme: string | null;
  effet: string | null;
  conduiteATenir: string | null;
  source: string | null;
  reference: { dciA: string; dciB: string };
}

interface ResultatVerification {
  medicaments: string[];
  interactions: InteractionDetectee[];
  resume: {
    total: number;
    contre_indication: number;
    majeure: number;
    moderee: number;
    mineure: number;
    plusHauteSeverite: Severite | null;
  };
}

interface InteractionRef {
  id: string;
  dciA: string;
  dciB: string;
  severite: Severite;
  mecanisme: string | null;
  effet: string | null;
  conduiteATenir: string | null;
  source: string | null;
}

interface StatsRef {
  totalInteractions: number;
  parSeverite: Record<string, number>;
  totalContreIndications: number;
}

// Code couleur par sévérité (rouge=CI/majeure, orange=modérée, jaune=mineure).
const SEVERITE_STYLE: Record<Severite, { bg: string; border: string; color: string; icon: typeof AlertTriangle }> = {
  contre_indication: { bg: '#FEF2F2', border: '#FCA5A5', color: '#991B1B', icon: AlertOctagon },
  majeure: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', icon: AlertTriangle },
  moderee: { bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C', icon: AlertTriangle },
  mineure: { bg: '#FEFCE8', border: '#FEF08A', color: '#A16207', icon: Info },
};

const EXEMPLES = ['warfarine', 'aspirine', 'ibuprofène', 'énalapril', 'spironolactone'];

export default function InteractionsPage() {
  const t = useTranslations('interactions');
  const [onglet, setOnglet] = useState<'checker' | 'reference'>('checker');

  // ── Vérificateur ────────────────────────────────────────────────────────
  const [medicaments, setMedicaments] = useState<string[]>([]);
  const [saisie, setSaisie] = useState('');
  const [resultat, setResultat] = useState<ResultatVerification | null>(null);
  const [analyse, setAnalyse] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ajouter = useCallback((valeur: string) => {
    const v = valeur.trim();
    if (!v) return;
    setMedicaments(prev => {
      const existe = prev.some(m => m.toLowerCase() === v.toLowerCase());
      return existe ? prev : [...prev, v];
    });
    setSaisie('');
  }, []);

  const retirer = useCallback((valeur: string) => {
    setMedicaments(prev => prev.filter(m => m !== valeur));
  }, []);

  // Vérification en temps réel (debouncée) dès qu'il y a ≥ 2 médicaments.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (medicaments.length < 2) {
      setResultat(null);
      setAnalyse(false);
      return;
    }
    setAnalyse(true);
    debounce.current = setTimeout(async () => {
      try {
        const r = await apiClient<ResultatVerification>('/interactions/verifier', {
          method: 'POST',
          body: { medicaments },
        });
        setResultat(r);
      } catch {
        setResultat(null);
      } finally {
        setAnalyse(false);
      }
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [medicaments]);

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#FEF2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldAlert size={26} color="#B91C1C" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1A2332' }}>{t('title')}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#546E7A' }}>{t('subtitle')}</p>
        </div>
      </div>

      {/* ── Onglets ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, margin: '18px 0 22px', borderBottom: '1px solid #E5E9F0' }}>
        <Tab actif={onglet === 'checker'} onClick={() => setOnglet('checker')} icon={ListChecks} label={t('tabChecker')} />
        <Tab actif={onglet === 'reference'} onClick={() => setOnglet('reference')} icon={BookOpen} label={t('tabReference')} />
      </div>

      {onglet === 'checker' ? (
        <Checker
          t={t}
          medicaments={medicaments}
          saisie={saisie}
          setSaisie={setSaisie}
          ajouter={ajouter}
          retirer={retirer}
          onClear={() => setMedicaments([])}
          resultat={resultat}
          analyse={analyse}
        />
      ) : (
        <Reference t={t} />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  VÉRIFICATEUR
// ══════════════════════════════════════════════════════════════════════════════
function Checker({
  t, medicaments, saisie, setSaisie, ajouter, retirer, onClear, resultat, analyse,
}: {
  t: ReturnType<typeof useTranslations>;
  medicaments: string[];
  saisie: string;
  setSaisie: (v: string) => void;
  ajouter: (v: string) => void;
  retirer: (v: string) => void;
  onClear: () => void;
  resultat: ResultatVerification | null;
  analyse: boolean;
}) {
  return (
    <div>
      <div style={card}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('checkerTitle')}</h2>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#546E7A' }}>{t('checkerHelp')}</p>

        {/* Champ de saisie */}
        <form
          onSubmit={e => { e.preventDefault(); ajouter(saisie); }}
          style={{ display: 'flex', gap: 8, marginBottom: 12 }}
        >
          <input
            value={saisie}
            onChange={e => setSaisie(e.target.value)}
            placeholder={t('inputPlaceholder')}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 9, border: '1px solid #CFD8E3',
              fontSize: 14, outline: 'none',
            }}
          />
          <button type="submit" style={btnPrimaire}>
            <Plus size={16} /> {t('add')}
          </button>
        </form>

        {/* Exemples rapides */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: medicaments.length ? 14 : 0 }}>
          <span style={{ fontSize: 12, color: '#78909C' }}>{t('examples')} :</span>
          {EXEMPLES.map(ex => (
            <button key={ex} type="button" onClick={() => ajouter(ex)} style={chipExemple}>{ex}</button>
          ))}
        </div>

        {/* Liste des médicaments saisis */}
        {medicaments.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#546E7A' }}>
                {t('medicationsCount', { count: medicaments.length })}
              </span>
              <button type="button" onClick={onClear} style={btnLien}>
                <Trash2 size={13} /> {t('clear')}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {medicaments.map(m => (
                <span key={m} style={chipMed}>
                  {m}
                  <button type="button" onClick={() => retirer(m)} style={chipCloseBtn} aria-label="remove">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résultats */}
      <div style={{ marginTop: 18 }}>
        {medicaments.length < 2 && (
          <div style={infoBox}>
            <Info size={18} color="#546E7A" />
            <span>{t('noneAdded')}</span>
          </div>
        )}

        {medicaments.length >= 2 && analyse && (
          <div style={{ ...infoBox, color: '#546E7A' }}>
            <RefreshCw size={16} className="spin" /> {t('checking')}
          </div>
        )}

        {medicaments.length >= 2 && !analyse && resultat && resultat.interactions.length === 0 && (
          <div style={{ ...card, borderColor: '#BBF7D0', background: '#F0FDF4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={22} color="#15803D" />
              <div>
                <div style={{ fontWeight: 700, color: '#166534' }}>{t('noInteraction')}</div>
                <div style={{ fontSize: 12, color: '#3F6212', marginTop: 2 }}>{t('noInteractionHint')}</div>
              </div>
            </div>
          </div>
        )}

        {medicaments.length >= 2 && !analyse && resultat && resultat.interactions.length > 0 && (
          <div>
            {/* Synthèse */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <PastilleResume value={resultat.resume.contre_indication} label={t('severite.contre_indication')} sev="contre_indication" />
              <PastilleResume value={resultat.resume.majeure} label={t('severite.majeure')} sev="majeure" />
              <PastilleResume value={resultat.resume.moderee} label={t('severite.moderee')} sev="moderee" />
              <PastilleResume value={resultat.resume.mineure} label={t('severite.mineure')} sev="mineure" />
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A2332', margin: '0 0 12px' }}>
              {t('detectedTitle', { count: resultat.interactions.length })}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resultat.interactions.map((it, idx) => (
                <CarteInteraction key={idx} it={it} t={t} />
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#90A4AE', marginTop: 16, fontStyle: 'italic' }}>{t('disclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CarteInteraction({ it, t }: { it: InteractionDetectee; t: ReturnType<typeof useTranslations> }) {
  const s = SEVERITE_STYLE[it.severite];
  const Icon = s.icon;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <Icon size={20} color={s.color} />
        <span style={{ fontWeight: 700, fontSize: 15, color: '#1A2332' }}>
          {it.medicamentA} <span style={{ color: '#90A4AE' }}>+</span> {it.medicamentB}
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 0.3, color: s.color, background: '#fff',
          border: `1px solid ${s.border}`, borderRadius: 6, padding: '3px 9px',
        }}>
          {t(`severite.${it.severite}`)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {it.effet && <Ligne label={t('effect')} valeur={it.effet} />}
        {it.mecanisme && <Ligne label={t('mechanism')} valeur={it.mecanisme} />}
        {it.conduiteATenir && (
          <div style={{
            background: '#fff', border: `1px solid ${s.border}`, borderRadius: 8, padding: '8px 10px',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{t('conduct')}</span>
            <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{it.conduiteATenir}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: '#90A4AE', flexWrap: 'wrap' }}>
        <span>{t('matchedOn')} : {it.reference.dciA} / {it.reference.dciB}</span>
        {it.source && <span>{t('source')} : {it.source}</span>}
      </div>
    </div>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div style={{ fontSize: 13, color: '#374151' }}>
      <span style={{ fontWeight: 600, color: '#546E7A' }}>{label} : </span>{valeur}
    </div>
  );
}

function PastilleResume({ value, label, sev }: { value: number; label: string; sev: Severite }) {
  const s = SEVERITE_STYLE[sev];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, background: value > 0 ? s.bg : '#F8FAFC',
      border: `1px solid ${value > 0 ? s.border : '#EEF2F7'}`, borderRadius: 10, padding: '8px 12px',
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: value > 0 ? s.color : '#90A4AE' }}>{value}</span>
      <span style={{ fontSize: 12, color: '#546E7A' }}>{label}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  RÉFÉRENTIEL
// ══════════════════════════════════════════════════════════════════════════════
function Reference({ t }: { t: ReturnType<typeof useTranslations> }) {
  const [items, setItems] = useState<InteractionRef[]>([]);
  const [stats, setStats] = useState<StatsRef | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [severite, setSeverite] = useState<Severite | ''>('');
  const [dci, setDci] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    setErreur(null);
    try {
      const qs = new URLSearchParams();
      if (severite) qs.set('severite', severite);
      if (dci.trim()) qs.set('dci', dci.trim());
      const [list, s] = await Promise.all([
        apiClient<InteractionRef[]>(`/interactions${qs.toString() ? '?' + qs.toString() : ''}`),
        apiClient<StatsRef>('/interactions/stats'),
      ]);
      setItems(Array.isArray(list) ? list : []);
      setStats(s ?? null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [severite, dci, t]);

  useEffect(() => { charger(); }, [charger]);

  const severites: Severite[] = useMemo(() => ['contre_indication', 'majeure', 'moderee', 'mineure'], []);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <StatCard value={stats.totalInteractions} label={t('statTotal')} color="#0D47A1" />
          <StatCard value={stats.parSeverite?.contre_indication ?? 0} label={t('statContraindication')} color="#991B1B" />
          <StatCard value={stats.parSeverite?.majeure ?? 0} label={t('statMajor')} color="#B91C1C" />
        </div>
      )}

      {/* Filtres */}
      <div style={{ ...card, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>{t('filterByDci')}</label>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#90A4AE" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              value={dci}
              onChange={e => setDci(e.target.value)}
              placeholder="ains, warfarine…"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
        </div>
        <div style={{ minWidth: 180 }}>
          <label style={labelStyle}>{t('filterBySeverity')}</label>
          <select value={severite} onChange={e => setSeverite(e.target.value as Severite | '')} style={inputStyle}>
            <option value="">{t('all')}</option>
            {severites.map(s => <option key={s} value={s}>{t(`severite.${s}`)}</option>)}
          </select>
        </div>
      </div>

      {/* Liste */}
      <div style={{ marginTop: 16 }}>
        {loading && (
          <div style={{ ...infoBox, color: '#546E7A' }}>
            <RefreshCw size={16} className="spin" /> {t('checking')}
          </div>
        )}
        {!loading && erreur && (
          <div style={{ padding: 16, borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            {erreur}
            <button onClick={charger} style={{ ...btnLien, marginLeft: 12 }}>{t('retry')}</button>
          </div>
        )}
        {!loading && !erreur && items.length === 0 && (
          <div style={infoBox}><Info size={18} color="#546E7A" /> {t('referenceEmpty')}</div>
        )}
        {!loading && !erreur && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(it => {
              const s = SEVERITE_STYLE[it.severite];
              const Icon = s.icon;
              return (
                <div key={it.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: '#fff', border: '1px solid #E5E9F0', borderRadius: 10, padding: 14,
                  borderLeft: `4px solid ${s.color}`,
                }}>
                  <Icon size={18} color={s.color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1A2332' }}>
                        {it.dciA} <span style={{ color: '#90A4AE' }}>+</span> {it.dciB}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: s.color,
                        background: s.bg, border: `1px solid ${s.border}`, borderRadius: 5, padding: '2px 7px',
                      }}>
                        {t(`severite.${it.severite}`)}
                      </span>
                    </div>
                    {it.effet && <div style={{ fontSize: 12.5, color: '#546E7A', marginTop: 4 }}>{it.effet}</div>}
                    {it.conduiteATenir && (
                      <div style={{ fontSize: 12.5, color: '#374151', marginTop: 4 }}>
                        <span style={{ fontWeight: 600, color: s.color }}>{t('conduct')} : </span>{it.conduiteATenir}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sous-composants & styles ─────────────────────────────────────────────────
function Tab({ actif, onClick, icon: Icon, label }: { actif: boolean; onClick: () => void; icon: typeof ListChecks; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, color: actif ? '#B91C1C' : '#78909C',
        borderBottom: `2px solid ${actif ? '#B91C1C' : 'transparent'}`, marginBottom: -1,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E9F0', borderRadius: 12, padding: '14px 18px', minWidth: 150 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#546E7A', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #E5E9F0', borderRadius: 14, padding: 18,
};

const infoBox: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
  background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 12, fontSize: 13, color: '#546E7A',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid #CFD8E3',
  fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#546E7A', marginBottom: 5,
};

const btnPrimaire: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600,
  color: '#fff', background: '#B91C1C', borderRadius: 9, padding: '10px 16px',
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};

const btnLien: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
  color: '#B91C1C', fontWeight: 600, fontSize: 12, cursor: 'pointer',
};

const chipExemple: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#546E7A', background: '#F1F5F9',
  border: '1px solid #E2E8F0', borderRadius: 20, padding: '4px 11px', cursor: 'pointer',
};

const chipMed: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
  color: '#0D47A1', background: '#EFF6FF', border: '1px solid #BFDBFE',
  borderRadius: 8, padding: '6px 8px 6px 12px',
};

const chipCloseBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', background: 'transparent', color: '#0D47A1', cursor: 'pointer', padding: 2,
};
