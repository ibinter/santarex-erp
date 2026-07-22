'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Gauge, RefreshCw, TrendingUp, TrendingDown, Minus, Plus,
  ShieldCheck, ClipboardCheck, Activity, AlertTriangle, CheckCircle2, X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────
type Domaine = 'hygiene' | 'securite_patient' | 'delais' | 'satisfaction' | 'mortalite' | 'infections';
type Unite = 'pourcentage' | 'nombre' | 'jours';
type Sens = 'hausse_bonne' | 'baisse_bonne';
type StatutMesure = 'atteint' | 'alerte' | 'critique';
type StatutConf = 'conforme' | 'partiel' | 'non_conforme' | 'na';

type Indicateur = {
  id: string; code: string; libelle: string; domaine: Domaine; unite: Unite;
  cible: number; seuil: number | null; sens: Sens; actif: boolean; description?: string | null;
};
type Mesure = { id: string; periode: string; valeur: number; statut: StatutMesure; dateMesure: string };
type BordRow = {
  indicateur: Indicateur;
  derniere: Mesure | null;
  precedente: Mesure | null;
  tendance: 'hausse' | 'baisse' | 'stable' | null;
  historique: Array<{ periode: string; valeur: number }>;
};
type Bord = {
  indicateurs: BordRow[];
  resume: { totalIndicateurs: number; atteints: number; enAlerte: number; critiques: number; sansMesure: number };
};
type Critere = {
  id: string; referentiel: string; chapitre: string | null; exigence: string;
  statut: StatutConf; preuve: string | null; responsableRef: string | null; echeance: string | null;
};
type Stats = {
  accreditation: {
    totalCriteres: number;
    parStatut: Record<string, number>;
    tauxConformite: number;
    parReferentiel: Array<{ referentiel: string; total: number; conformes: number; tauxConformite: number }>;
  };
};

// ── Palette ──────────────────────────────────────────────────────────────────
const STATUT_CFG: Record<StatutMesure, { bg: string; color: string; border: string; dot: string }> = {
  atteint:  { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  alerte:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  critique: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};
const CONF_CFG: Record<StatutConf, { bg: string; color: string; border: string }> = {
  conforme:     { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  partiel:      { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  non_conforme: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  na:           { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};
const CONF_STATUTS: StatutConf[] = ['conforme', 'partiel', 'non_conforme', 'na'];

function uniteSuffix(u: Unite) { return u === 'pourcentage' ? '%' : u === 'jours' ? 'j' : ''; }
function fmtVal(v: number | null | undefined, u: Unite) {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}${uniteSuffix(u)}`;
}

// Mini-graphe SVG (sparkline)
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <div style={{ height: 30 }} />;
  const w = 120, h = 30, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={coords[coords.length - 1].split(',')[0]} cy={coords[coords.length - 1].split(',')[1]} r={2.5} fill={color} />
    </svg>
  );
}

export default function IndicateursQualitePage() {
  const t = useTranslations('indicateursQualite');
  const [tab, setTab] = useState<'bord' | 'accreditation'>('bord');
  const [bord, setBord] = useState<Bord | null>(null);
  const [criteres, setCriteres] = useState<Critere[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesureFor, setMesureFor] = useState<Indicateur | null>(null);
  const [critModal, setCritModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bordRes, critRes, statsRes] = await Promise.all([
        apiClient<Bord>('/indicateurs-qualite/tableau-bord'),
        apiClient<Critere[]>('/indicateurs-qualite/accreditation'),
        apiClient<Stats>('/indicateurs-qualite/stats'),
      ]);
      setBord(bordRes);
      setCriteres(Array.isArray(critRes) ? critRes : []);
      setStats(statsRes);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const r = bord?.resume;

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .iq-card{animation:fadeUp .3s ease both}
        .iq-tab:hover{filter:brightness(0.97)}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0F766E 0%,#0D9488 50%,#14B8A6 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,148,136,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('heroTitle')}</h1>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {loading ? t('loading') : t('heroSubtitle', { total: r?.totalIndicateurs ?? 0 })}
              </span>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="iq-tab"
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('refresh')}
          </button>
        </div>
      </div>

      {/* RESUME CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        <ResumeCard icon={<Activity size={18} />} label={t('resume.total')} value={r?.totalIndicateurs ?? 0} color="#0D9488" />
        <ResumeCard icon={<CheckCircle2 size={18} />} label={t('resume.atteints')} value={r?.atteints ?? 0} color="#10B981" />
        <ResumeCard icon={<AlertTriangle size={18} />} label={t('resume.alerte')} value={r?.enAlerte ?? 0} color="#F59E0B" />
        <ResumeCard icon={<AlertTriangle size={18} />} label={t('resume.critiques')} value={r?.critiques ?? 0} color="#EF4444" />
        <ResumeCard icon={<ShieldCheck size={18} />} label={t('resume.conformite')} value={`${stats?.accreditation?.tauxConformite ?? 0}%`} color="#6366F1" />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['bord', 'accreditation'] as const).map((tk) => (
          <button key={tk} onClick={() => setTab(tk)} className="iq-tab"
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: tab === tk ? '#0D9488' : '#fff', color: tab === tk ? '#fff' : '#334155',
              boxShadow: tab === tk ? '0 4px 12px rgba(13,148,136,0.3)' : '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
            {tk === 'bord' ? <Gauge size={15} /> : <ClipboardCheck size={15} />}
            {tk === 'bord' ? t('tabs.bord') : t('tabs.accreditation')}
          </button>
        ))}
      </div>

      {/* ── TABLEAU DE BORD ────────────────────────────────────── */}
      {tab === 'bord' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {(bord?.indicateurs ?? []).map((row) => (
            <IndicateurCard key={row.indicateur.id} row={row} t={t} onMesure={() => setMesureFor(row.indicateur)} />
          ))}
          {!loading && (bord?.indicateurs ?? []).length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14 }}>{t('empty.indicateurs')}</div>
          )}
        </div>
      )}

      {/* ── ACCREDITATION ──────────────────────────────────────── */}
      {tab === 'accreditation' && (
        <AccreditationView criteres={criteres} stats={stats} t={t} onNew={() => setCritModal(true)}
          onUpdate={async (id, statut) => { await apiClient(`/indicateurs-qualite/accreditation/${id}`, { method: 'PATCH', body: { statut } }); load(); }} />
      )}

      {mesureFor && (
        <MesureModal indicateur={mesureFor} t={t} onClose={() => setMesureFor(null)}
          onSaved={() => { setMesureFor(null); load(); }} />
      )}
      {critModal && (
        <CritereModal t={t} onClose={() => setCritModal(false)} onSaved={() => { setCritModal(false); load(); }} />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function ResumeCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="iq-card" style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function IndicateurCard({ row, t, onMesure }: { row: BordRow; t: any; onMesure: () => void }) {
  const { indicateur: i, derniere, tendance, historique } = row;
  const cfg = derniere ? STATUT_CFG[derniere.statut] : STATUT_CFG.atteint;
  const TrendIcon = tendance === 'hausse' ? TrendingUp : tendance === 'baisse' ? TrendingDown : Minus;
  return (
    <div className="iq-card" style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderTop: `3px solid ${derniere ? cfg.dot : '#CBD5E1'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{i.libelle}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>{t(`domaines.${i.domaine}`)}</div>
        </div>
        {derniere && (
          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {t(`statutMesure.${derniere.statut}`)}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: derniere ? cfg.color : '#94A3B8', lineHeight: 1 }}>
          {derniere ? fmtVal(derniere.valeur, i.unite) : '—'}
        </div>
        {derniere && tendance && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 3 }}>
            <TrendIcon size={13} />
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
        {t('card.cible')}: <strong>{fmtVal(i.cible, i.unite)}</strong>
        {i.seuil !== null && <> · {t('card.seuil')}: {fmtVal(i.seuil, i.unite)}</>}
      </div>
      <div style={{ marginTop: 10 }}>
        <Sparkline points={historique.map((h) => h.valeur)} color={cfg.dot} />
      </div>
      <button onClick={onMesure} className="iq-tab"
        style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 9, border: '1.5px solid #CCFBF1', background: '#F0FDFA', color: '#0D9488', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Plus size={13} /> {t('card.addMesure')}
      </button>
    </div>
  );
}

function AccreditationView({ criteres, stats, t, onNew, onUpdate }:
  { criteres: Critere[]; stats: Stats | null; t: any; onNew: () => void; onUpdate: (id: string, s: StatutConf) => void }) {
  const groups = criteres.reduce<Record<string, Critere[]>>((acc, c) => {
    (acc[c.referentiel] ??= []).push(c); return acc;
  }, {});
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
          {t('accreditation.globalRate')}: <span style={{ color: '#0D9488', fontWeight: 900 }}>{stats?.accreditation?.tauxConformite ?? 0}%</span>
        </div>
        <button onClick={onNew} className="iq-tab"
          style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#0D9488', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> {t('accreditation.newCritere')}
        </button>
      </div>
      {Object.keys(groups).length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', background: '#fff', borderRadius: 14 }}>{t('empty.criteres')}</div>
      )}
      {Object.entries(groups).map(([ref, list]) => {
        const refStat = stats?.accreditation?.parReferentiel?.find((x) => x.referentiel === ref);
        return (
          <div key={ref} className="iq-card" style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{ref}</div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0D9488' }}>{refStat?.tauxConformite ?? 0}%</span>
            </div>
            {list.map((c) => {
              const cfg = CONF_CFG[c.statut];
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ flex: 1 }}>
                    {c.chapitre && <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{c.chapitre}</div>}
                    <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{c.exigence}</div>
                    {c.preuve && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{t('accreditation.preuve')}: {c.preuve}</div>}
                  </div>
                  <select value={c.statut} onChange={(e) => onUpdate(c.id, e.target.value as StatutConf)}
                    style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {CONF_STATUTS.map((s) => <option key={s} value={s}>{t(`statutConformite.${s}`)}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 5, display: 'block' };

function MesureModal({ indicateur, t, onClose, onSaved }: { indicateur: Indicateur; t: any; onClose: () => void; onSaved: () => void }) {
  const [typePeriode, setTypePeriode] = useState<'mois' | 'trimestre'>('mois');
  const [periode, setPeriode] = useState('');
  const [valeur, setValeur] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!periode.trim() || valeur === '') { setErr(t('mesure.required')); return; }
    setSaving(true);
    try {
      await apiClient(`/indicateurs-qualite/indicateurs/${indicateur.id}/mesures`, {
        method: 'POST',
        body: { typePeriode, periode: periode.trim(), valeur: Number(valeur), commentaire: commentaire || undefined },
      });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('mesure.error')); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={`${t('mesure.title')} — ${indicateur.libelle}`} onClose={onClose}>
      <label style={labelStyle}>{t('mesure.typePeriode')}</label>
      <select value={typePeriode} onChange={(e) => setTypePeriode(e.target.value as any)} style={inputStyle}>
        <option value="mois">{t('mesure.mois')}</option>
        <option value="trimestre">{t('mesure.trimestre')}</option>
      </select>
      <label style={labelStyle}>{t('mesure.periode')}</label>
      <input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder={typePeriode === 'mois' ? '2026-01' : '2026-T1'} style={inputStyle} />
      <label style={labelStyle}>{t('mesure.valeur')} ({uniteSuffix(indicateur.unite) || t(`unites.${indicateur.unite}`)})</label>
      <input type="number" value={valeur} onChange={(e) => setValeur(e.target.value)} style={inputStyle} />
      <label style={labelStyle}>{t('mesure.commentaire')}</label>
      <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <button onClick={submit} disabled={saving} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#0D9488', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
        {saving ? t('saving') : t('save')}
      </button>
    </ModalShell>
  );
}

function CritereModal({ t, onClose, onSaved }: { t: any; onClose: () => void; onSaved: () => void }) {
  const [referentiel, setReferentiel] = useState('');
  const [chapitre, setChapitre] = useState('');
  const [exigence, setExigence] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!referentiel.trim() || !exigence.trim()) { setErr(t('mesure.required')); return; }
    setSaving(true);
    try {
      await apiClient('/indicateurs-qualite/accreditation', {
        method: 'POST',
        body: { referentiel: referentiel.trim(), chapitre: chapitre || undefined, exigence: exigence.trim() },
      });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('mesure.error')); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell title={t('accreditation.newCritere')} onClose={onClose}>
      <label style={labelStyle}>{t('accreditation.referentiel')}</label>
      <input value={referentiel} onChange={(e) => setReferentiel(e.target.value)} placeholder="HAS V2020" style={inputStyle} />
      <label style={labelStyle}>{t('accreditation.chapitre')}</label>
      <input value={chapitre} onChange={(e) => setChapitre(e.target.value)} style={inputStyle} />
      <label style={labelStyle}>{t('accreditation.exigence')}</label>
      <textarea value={exigence} onChange={(e) => setExigence(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      {err && <div style={{ color: '#B91C1C', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <button onClick={submit} disabled={saving} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#0D9488', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
        {saving ? t('saving') : t('save')}
      </button>
    </ModalShell>
  );
}
