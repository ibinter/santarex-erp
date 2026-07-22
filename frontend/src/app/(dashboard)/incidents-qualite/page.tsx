'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Plus, Search, RefreshCw, ChevronRight,
  AlertTriangle, CheckCircle, Calendar, TrendingUp, Activity,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'declare' | 'en_analyse' | 'action_en_cours' | 'cloture';
type Gravite = 'mineure' | 'moderee' | 'grave' | 'critique';
type TypeInc = 'erreur_medicamenteuse' | 'chute' | 'infection_nosocomiale' | 'erreur_identite' | 'materiel_defectueux' | 'autre';

type Incident = {
  id: string; numero: string; type: TypeInc; gravite: Gravite; statut: Statut;
  serviceConcerne: string; dateSurvenue: string; createdAt: string; patientId?: string | null;
  description: string;
};

type Stats = {
  total: number;
  parType: Record<string, number>;
  parGravite: Record<string, number>;
  parStatut: Record<string, number>;
  tauxCloture: number;
  incidentsDuMois: number;
  ouvertsCritiques: number;
};

const GRAVITE_CFG: Record<Gravite, { bg: string; color: string; border: string; dot: string }> = {
  mineure:  { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  moderee:  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  grave:    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  critique: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string; dot: string }> = {
  declare:         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  en_analyse:      { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  action_en_cours: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  cloture:         { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
};

const GRAVITES: Gravite[] = ['mineure', 'moderee', 'grave', 'critique'];
const STATUTS: Statut[] = ['declare', 'en_analyse', 'action_en_cours', 'cloture'];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function IncidentsQualitePage() {
  const router = useRouter();
  const t = useTranslations('incidentsQualite');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fGravite, setFGravite] = useState<Gravite | ''>('');
  const [fStatut, setFStatut] = useState<Statut | ''>('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);
      const [listRes, statsRes] = await Promise.all([
        apiClient<any>('/incidents-qualite?limit=100'),
        apiClient<any>('/incidents-qualite/stats'),
      ]);
      setIncidents(unwrap(listRes));
      setStats((statsRes?.data ?? statsRes) as Stats);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = incidents.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !search
      || (i.numero ?? '').toLowerCase().includes(q)
      || (i.serviceConcerne ?? '').toLowerCase().includes(q)
      || (i.description ?? '').toLowerCase().includes(q);
    const matchG = !fGravite || i.gravite === fGravite;
    const matchS = !fStatut || i.statut === fStatut;
    return matchQ && matchG && matchS;
  });

  const total = stats?.total ?? incidents.length;
  const mois = stats?.incidentsDuMois ?? 0;
  const critiques = stats?.ouvertsCritiques ?? 0;
  const taux = stats?.tauxCloture ?? 0;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .inc-row:hover{background:#FFF5F5!important;}
        .chip:hover{filter:brightness(0.98);}
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#7F1D1D 0%,#B91C1C 50%,#DC2626 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(185,28,28,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -70, right: 200, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('list.heroTitle')}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  {loading ? t('list.loading') : t('list.summary', { total, ouverts: total - (stats?.parStatut?.cloture ?? 0) })}
                </span>
                {lastRefresh && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => router.push('/incidents-qualite/nouveau')}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('list.newIncident')}
            </button>
          </div>
        </div>

        {/* KPI inline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('list.kpiTotal'), val: total, icon: <Activity size={13} />, valColor: '#fff' },
            { label: t('list.kpiMois'), val: mois, icon: <Calendar size={13} />, valColor: '#FDE68A' },
            { label: t('list.kpiOuvertsCritiques'), val: critiques, icon: <AlertTriangle size={13} />, valColor: '#FCA5A5' },
            { label: t('list.kpiTauxCloture'), val: `${taux}%`, icon: <TrendingUp size={13} />, valColor: '#BBF7D0' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>
                {k.icon}
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.valColor, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RÉPARTITIONS ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('list.byGravite')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {GRAVITES.map(g => {
              const cfg = GRAVITE_CFG[g];
              const n = stats?.parGravite?.[g] ?? 0;
              const pct = total > 0 ? Math.round((n / total) * 100) : 0;
              return (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, width: 78 }}>{t(`gravite.${g}`)}</span>
                  <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.dot, borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#37474F', width: 26, textAlign: 'right' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('list.byStatut')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {STATUTS.map(s => {
              const cfg = STATUT_CFG[s];
              const n = stats?.parStatut?.[s] ?? 0;
              const pct = total > 0 ? Math.round((n / total) * 100) : 0;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, width: 100 }}>{t(`statut.${s}`)}</span>
                  <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: cfg.dot, borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#37474F', width: 26, textAlign: 'right' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SEARCH + FILTRES ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFGravite('')}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${fGravite === '' ? '#B91C1C' : '#E0E8F0'}`, background: fGravite === '' ? '#B91C1C' : '#fff', color: fGravite === '' ? '#fff' : '#546E7A', fontSize: 11, fontWeight: fGravite === '' ? 800 : 500, cursor: 'pointer' }}>
            {t('list.filterAll')}
          </button>
          {GRAVITES.map(g => {
            const cfg = GRAVITE_CFG[g];
            const on = fGravite === g;
            return (
              <button key={g} className="chip" onClick={() => setFGravite(on ? '' : g)}
                style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {t(`gravite.${g}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATUTS.map(s => {
          const cfg = STATUT_CFG[s];
          const on = fStatut === s;
          return (
            <button key={s} className="chip" onClick={() => setFStatut(on ? '' : s)}
              style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
              {t(`statut.${s}`)}
            </button>
          );
        })}
      </div>

      {!loading && <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* ── TABLE ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)' }}>
                {[t('list.colNumero'), t('list.colType'), t('list.colGravite'), t('list.colService'), t('list.colDateSurvenue'), t('list.colStatut'), ''].map((h, hi) => (
                  <th key={hi} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #FEF2F2' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}><div style={{ height: 13, background: '#FEE2E2', borderRadius: 4, width: j === 3 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                  <ShieldAlert size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#FECACA' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#546E7A' }}>{t('list.emptyTitle')}</p>
                  <p style={{ margin: 0, fontSize: 12 }}>{t('list.emptySubtitle')}</p>
                </td></tr>
              ) : displayed.map(inc => {
                const gc = GRAVITE_CFG[inc.gravite] ?? GRAVITE_CFG.mineure;
                const sc = STATUT_CFG[inc.statut] ?? STATUT_CFG.declare;
                return (
                  <tr key={inc.id} className="inc-row" onClick={() => router.push(`/incidents-qualite/${inc.id}`)}
                    style={{ borderTop: '1px solid #FEF2F2', cursor: 'pointer', transition: 'background .1s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>{inc.numero}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: '#37474F', whiteSpace: 'nowrap' }}>{t(`type.${inc.type}`)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: gc.dot, display: 'inline-block' }} />
                        {t(`gravite.${inc.gravite}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A' }}>{inc.serviceConcerne}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={10} color="#B0BEC5" /> {fmtDate(inc.dateSurvenue)}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {t(`statut.${inc.statut}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}><ChevronRight size={14} color="#B0BEC5" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
