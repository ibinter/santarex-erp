'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Plus, Search, RefreshCw, ChevronRight, AlertTriangle,
  Calendar, Send, MapPin, Clock, Skull, FileWarning,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'a_declarer' | 'declaree' | 'transmise' | 'confirmee' | 'classee';
type Gravite = 'benin' | 'modere' | 'severe' | 'critique';

type Declaration = {
  id: string; numero: string; maladieNom: string; codeCIM10?: string | null;
  statut: Statut; gravite: Gravite; evolution: string;
  patientNom?: string | null; localite?: string | null;
  dateDiagnostic: string; createdAt: string;
  urgent?: boolean; enRetard?: boolean; echeance?: string | null;
};

type Stats = {
  total: number;
  parStatut: Record<string, number>;
  parGravite: Record<string, number>;
  parEvolution: Record<string, number>;
  parMaladie: { maladieNom: string; total: number }[];
  parLocalite: { localite: string; total: number }[];
  casDuMois: number;
  aTransmettre: number;
  enRetard: number;
  deces: number;
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string; dot: string }> = {
  a_declarer: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  declaree:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  transmise:  { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  confirmee:  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  classee:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
};

const GRAVITE_CFG: Record<Gravite, { bg: string; color: string; border: string; dot: string }> = {
  benin:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  modere:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  severe:   { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  critique: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};

const STATUTS: Statut[] = ['a_declarer', 'declaree', 'transmise', 'confirmee', 'classee'];
const GRAVITES: Gravite[] = ['benin', 'modere', 'severe', 'critique'];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return '—'; }
}

export default function DeclarationsSanitairesPage() {
  const router = useRouter();
  const t = useTranslations('declarationsSanitaires');
  const [items, setItems] = useState<Declaration[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fStatut, setFStatut] = useState<Statut | ''>('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);
      const [listRes, statsRes] = await Promise.all([
        apiClient<any>('/declarations-sanitaires?limit=200'),
        apiClient<any>('/declarations-sanitaires/stats'),
      ]);
      setItems(unwrap(listRes));
      setStats((statsRes?.data ?? statsRes) as Stats);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = items.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !search
      || (d.numero ?? '').toLowerCase().includes(q)
      || (d.maladieNom ?? '').toLowerCase().includes(q)
      || (d.localite ?? '').toLowerCase().includes(q)
      || (d.patientNom ?? '').toLowerCase().includes(q);
    const matchS = !fStatut || d.statut === fStatut;
    return matchQ && matchS;
  });

  const total = stats?.total ?? items.length;
  const mois = stats?.casDuMois ?? 0;
  const enRetard = stats?.enRetard ?? 0;
  const deces = stats?.deces ?? 0;
  const topMaladies = stats?.parMaladie?.slice(0, 6) ?? [];
  const maxMaladie = topMaladies.reduce((m, x) => Math.max(m, x.total), 0) || 1;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .decl-row:hover{background:#F0FDFA!important;}
        .chip:hover{filter:brightness(0.98);}
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#0F766E 0%,#0D9488 50%,#14B8A6 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,148,136,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileWarning size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('list.heroTitle')}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                  {loading ? t('list.loading') : t('list.summary', { total, aTransmettre: stats?.aTransmettre ?? 0 })}
                </span>
                {lastRefresh && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => router.push('/declarations-sanitaires/nouveau')}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#0D9488', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('list.newDeclaration')}
            </button>
          </div>
        </div>

        {/* KPI inline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('list.kpiTotal'), val: total, icon: <Activity size={13} />, valColor: '#fff' },
            { label: t('list.kpiMois'), val: mois, icon: <Calendar size={13} />, valColor: '#CFFAFE' },
            { label: t('list.kpiEnRetard'), val: enRetard, icon: <Clock size={13} />, valColor: '#FCA5A5' },
            { label: t('list.kpiDeces'), val: deces, icon: <Skull size={13} />, valColor: '#FECACA' },
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

      {/* ── ALERTE délais ───────────────────────────────────────── */}
      {enRetard > 0 && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#B91C1C" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#991B1B' }}>{t('list.alertRetard', { count: enRetard })}</span>
        </div>
      )}

      {/* ── TABLEAU DE BORD ÉPIDÉMIOLOGIQUE ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('list.byMaladie')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {topMaladies.length === 0 && <span style={{ fontSize: 12, color: '#90A4AE' }}>—</span>}
            {topMaladies.map(m => (
              <div key={m.maladieNom} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#37474F', width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.maladieNom}>{m.maladieNom}</span>
                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((m.total / maxMaladie) * 100)}%`, height: '100%', background: '#0D9488', borderRadius: 6 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#37474F', width: 26, textAlign: 'right' }}>{m.total}</span>
              </div>
            ))}
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

        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('list.byLocalite')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(stats?.parLocalite ?? []).length === 0 && <span style={{ fontSize: 12, color: '#90A4AE' }}>—</span>}
            {(stats?.parLocalite ?? []).slice(0, 6).map(l => (
              <div key={l.localite} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={12} color="#0D9488" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#37474F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.localite}>{l.localite}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#0D9488' }}>{l.total}</span>
              </div>
            ))}
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
          <button onClick={() => setFStatut('')}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${fStatut === '' ? '#0D9488' : '#E0E8F0'}`, background: fStatut === '' ? '#0D9488' : '#fff', color: fStatut === '' ? '#fff' : '#546E7A', fontSize: 11, fontWeight: fStatut === '' ? 800 : 500, cursor: 'pointer' }}>
            {t('list.filterAll')}
          </button>
          {STATUTS.map(s => {
            const cfg = STATUT_CFG[s];
            const on = fStatut === s;
            return (
              <button key={s} className="chip" onClick={() => setFStatut(on ? '' : s)}
                style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {t(`statut.${s}`)}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* ── TABLE ────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)' }}>
                {[t('list.colNumero'), t('list.colMaladie'), t('list.colGravite'), t('list.colLocalite'), t('list.colDate'), t('list.colStatut'), ''].map((h, hi) => (
                  <th key={hi} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F0FDFA' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}><div style={{ height: 13, background: '#CCFBF1', borderRadius: 4, width: j === 1 ? 140 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                  <FileWarning size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#99F6E4' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#546E7A' }}>{t('list.emptyTitle')}</p>
                  <p style={{ margin: 0, fontSize: 12 }}>{t('list.emptySubtitle')}</p>
                </td></tr>
              ) : displayed.map(d => {
                const gc = GRAVITE_CFG[d.gravite] ?? GRAVITE_CFG.modere;
                const sc = STATUT_CFG[d.statut] ?? STATUT_CFG.a_declarer;
                return (
                  <tr key={d.id} className="decl-row" onClick={() => router.push(`/declarations-sanitaires/${d.id}`)}
                    style={{ borderTop: '1px solid #F0FDFA', cursor: 'pointer', transition: 'background .1s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#0F766E', background: '#CCFBF1', padding: '2px 8px', borderRadius: 6 }}>{d.numero}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: '#37474F' }}>
                      {d.maladieNom}
                      {d.codeCIM10 && <span style={{ marginLeft: 6, fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{d.codeCIM10}</span>}
                      {(d.urgent || d.enRetard) && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '1px 6px', borderRadius: 20 }}>{d.enRetard ? t('list.badgeRetard') : t('list.badgeUrgent')}</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: gc.dot, display: 'inline-block' }} />
                        {t(`gravite.${d.gravite}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A' }}>{d.localite || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={10} color="#B0BEC5" /> {fmtDate(d.dateDiagnostic)}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {t(`statut.${d.statut}`)}
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
