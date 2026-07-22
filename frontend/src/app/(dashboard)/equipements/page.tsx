'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench, RefreshCw, Plus, X, ChevronRight, AlertTriangle, Save,
  Activity, Calendar, MapPin, Tag, ClipboardList, Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type Statut = 'en_service' | 'en_panne' | 'en_maintenance' | 'reforme' | string;
type Categorie = 'imagerie' | 'laboratoire' | 'monitoring' | 'bloc' | 'autre' | string;

type Equipement = {
  id: string; code: string; nom: string; categorie: Categorie;
  marque?: string; modele?: string; numeroSerie?: string; localisation?: string;
  dateAcquisition?: string; valeurAcquisition?: number; devise?: string;
  statut: Statut; periodiciteMaintenanceJours?: number; dateProchaineMaintenance?: string;
  notes?: string;
};
type Intervention = {
  id: string; type: string; date: string; description?: string;
  technicienRef?: string; prestataire?: string; cout?: number; devise?: string;
  resultat?: string; dureeIndispoHeures?: number; statut: string; prochaineDate?: string;
};
type Stats = {
  total?: number; enService?: number; enPanne?: number; enMaintenance?: number;
  reforme?: number; maintenancesDues?: number; tauxDisponibilite?: number; valeurParcXOF?: number;
};

const STATUT_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  en_service:     { color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', dot: '#22C55E' },
  en_panne:       { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444' },
  en_maintenance: { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316' },
  reforme:        { color: '#475569', bg: '#F1F5F9', border: '#CBD5E1', dot: '#94A3B8' },
};
const CAT_ICON: Record<string, string> = {
  imagerie: '🩻', laboratoire: '🧪', monitoring: '💓', bloc: '🔪', autre: '🔧',
};
const CATEGORIES = ['imagerie', 'laboratoire', 'monitoring', 'bloc', 'autre'];
const STATUTS = ['en_service', 'en_panne', 'en_maintenance', 'reforme'];
const TYPES_INTER = ['preventive', 'curative', 'etalonnage'];
const STATUTS_INTER = ['terminee', 'planifiee', 'en_cours'];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
function fmtMoney(n?: number) {
  if (n === undefined || n === null) return '—';
  return new Intl.NumberFormat('fr-FR').format(n) + ' XOF';
}
function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export default function EquipementsPage() {
  const t = useTranslations('equipements');
  const statutLabel = (s: string) => t(`statut.${s}` as any);
  const catLabel = (c: string) => t(`categorie.${c}` as any);

  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [dues, setDues] = useState<Equipement[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inventaire' | 'maintenancesDues'>('inventaire');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Equipement | null>(null);
  const [history, setHistory] = useState<Intervention[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [showInter, setShowInter] = useState(false);
  const [showPanne, setShowPanne] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eR, dR, sR] = await Promise.allSettled([
        apiClient<any>('/equipements?limit=100'),
        apiClient<any>('/equipements/maintenances-dues'),
        apiClient<any>('/equipements/stats'),
      ]);
      if (eR.status === 'fulfilled') { const d = eR.value; setEquipements(Array.isArray(d) ? d : d?.data ?? []); }
      if (dR.status === 'fulfilled') setDues(Array.isArray(dR.value) ? dR.value : dR.value?.data ?? []);
      if (sR.status === 'fulfilled') setStats(sR.value ?? {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const d = await apiClient<any>(`/equipements/${id}/interventions`);
      setHistory(Array.isArray(d) ? d : d?.data ?? []);
    } catch { setHistory([]); }
  }, []);

  useEffect(() => { if (selected) loadHistory(selected.id); else setHistory([]); }, [selected, loadHistory]);

  const filtered = equipements.filter(e =>
    (filtreStatut === 'TOUS' || e.statut === filtreStatut) &&
    (!search ||
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      (e.marque ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.numeroSerie ?? '').toLowerCase().includes(search.toLowerCase())));

  const kpis = [
    { label: t('hero.kpiTotal'), val: stats.total ?? equipements.length, f: 'TOUS' },
    { label: t('hero.kpiEnService'), val: stats.enService ?? equipements.filter(e => e.statut === 'en_service').length, f: 'en_service' },
    { label: t('hero.kpiEnPanne'), val: stats.enPanne ?? equipements.filter(e => e.statut === 'en_panne').length, f: 'en_panne' },
    { label: t('hero.kpiMaintenancesDues'), val: stats.maintenancesDues ?? dues.length, f: 'DUES' },
    { label: t('hero.kpiDisponibilite'), val: (stats.tauxDisponibilite ?? 0) + '%', f: null as any },
  ];

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .eq-row:hover{background:#EFF6FF!important;}
        .eq-kpi{cursor:pointer;transition:all .15s;}
        .eq-kpi:hover{transform:translateY(-2px);}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0F3D3E 0%,#155E63 50%,#1B7A82 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15,61,62,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('hero.title')}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    {loading ? t('hero.loading') : t('hero.displayedCount', { count: filtered.length })}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {kpis.map(k => {
                const active = filtreStatut === k.f || (k.f === 'DUES' && tab === 'maintenancesDues');
                return (
                  <div key={k.label} className="eq-kpi"
                    title={k.f ? t('hero.filterTitle', { label: k.label }) : k.label}
                    onClick={() => { if (k.f === 'DUES') setTab('maintenancesDues'); else if (k.f) { setTab('inventaire'); setFiltreStatut(k.f); } }}
                    style={{ background: active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.12)', border: `1px solid ${active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{loading ? '…' : k.val}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{k.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => setShowCreate(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#0F3D3E', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('hero.newEquip')}
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['inventaire', 'maintenancesDues'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${tab === tb ? '#155E63' : '#E0E8F0'}`, background: tab === tb ? '#155E63' : '#fff', color: tab === tb ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tb === 'inventaire' ? <ClipboardList size={13} /> : <Calendar size={13} />}
            {t(`tabs.${tb}`)}
            {tb === 'maintenancesDues' && dues.length > 0 && (
              <span style={{ background: tab === tb ? 'rgba(255,255,255,0.3)' : '#FEF2F2', color: tab === tb ? '#fff' : '#DC2626', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{dues.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'inventaire' ? (
        <>
          {/* SEARCH + FILTRES */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['TOUS', ...STATUTS].map(f => {
                const cfg = f === 'TOUS' ? null : STATUT_CFG[f];
                const active = filtreStatut === f;
                return (
                  <button key={f} onClick={() => setFiltreStatut(f)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? (cfg?.border ?? '#155E63') : '#E0E8F0'}`, background: active ? (cfg?.bg ?? '#CCFBF1') : '#fff', color: active ? (cfg?.color ?? '#155E63') : '#546E7A', fontSize: 11, fontWeight: active ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cfg && active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />}
                    {f === 'TOUS' ? t('list.filterAll') : statutLabel(f)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TABLE + DETAIL */}
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: selected ? '1fr 380px' : '1fr', alignItems: 'start', animation: 'fadeUp .25s ease' }}>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#F0FFFE,#E6FAF7)' }}>
                      {[t('list.colCode'), t('list.colNom'), t('list.colCategorie'), t('list.colLocalisation'), t('list.colProchaine'), t('list.colStatut'), ''].map((h, i) => (
                        <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F0F4FA' }}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 13, background: '#F0F4FA', borderRadius: 4, width: j === 1 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                        ))}
                      </tr>
                    )) : filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                        <Wrench size={36} style={{ display: 'block', margin: '0 auto 12px', color: '#99F6E4' }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('list.empty')}</p>
                      </td></tr>
                    ) : filtered.map(e => {
                      const cfg = STATUT_CFG[e.statut] ?? STATUT_CFG.en_service;
                      const isSel = selected?.id === e.id;
                      const dj = daysUntil(e.dateProchaineMaintenance);
                      return (
                        <tr key={e.id} className="eq-row" onClick={() => setSelected(isSel ? null : e)}
                          style={{ borderTop: '1px solid #F0F4FA', cursor: 'pointer', background: isSel ? '#DBEAFE' : 'transparent' }}>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#155E63', background: '#CCFBF1', padding: '2px 8px', borderRadius: 6 }}>{e.code}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{CAT_ICON[e.categorie] ?? '🔧'}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{e.nom}</div>
                                {(e.marque || e.modele) && <div style={{ fontSize: 10, color: '#90A4AE' }}>{[e.marque, e.modele].filter(Boolean).join(' · ')}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{catLabel(e.categorie)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{e.localisation ?? '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: dj !== null && dj <= 0 ? '#DC2626' : '#546E7A', fontWeight: dj !== null && dj <= 0 ? 800 : 500, whiteSpace: 'nowrap' }}>
                            {e.dateProchaineMaintenance ? fmtDate(e.dateProchaineMaintenance) : '—'}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{statutLabel(e.statut)}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px' }}><ChevronRight size={13} color={isSel ? '#1D4ED8' : '#CBD5E1'} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DETAIL PANEL */}
            {selected && (() => {
              const cfg = STATUT_CFG[selected.statut] ?? STATUT_CFG.en_service;
              return (
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'sticky', top: 76, animation: 'slideIn .2s ease' }}>
                  <div style={{ background: 'linear-gradient(135deg,#0F3D3E,#155E63)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{t('detail.title')}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{CAT_ICON[selected.categorie] ?? '🔧'}</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{selected.nom}</div>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, display: 'block' }}>{selected.code}</span>
                    </div>
                    <button onClick={() => setSelected(null)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                  </div>

                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: cfg.bg, borderRadius: 10, border: `1px solid ${cfg.border}` }}>
                      <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700, textTransform: 'uppercase' }}>{t('detail.statut')}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: cfg.color }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />{statutLabel(selected.statut)}
                      </span>
                    </div>

                    {[
                      { icon: <Tag size={11} />, label: t('detail.categorie'), val: catLabel(selected.categorie) },
                      { icon: <Activity size={11} />, label: t('detail.marque'), val: selected.marque ?? '—' },
                      { icon: <Activity size={11} />, label: t('detail.modele'), val: selected.modele ?? '—' },
                      { icon: <Tag size={11} />, label: t('detail.numeroSerie'), val: selected.numeroSerie ?? '—' },
                      { icon: <MapPin size={11} />, label: t('detail.localisation'), val: selected.localisation ?? '—' },
                      { icon: <Calendar size={11} />, label: t('detail.dateAcquisition'), val: fmtDate(selected.dateAcquisition) },
                      { icon: <Tag size={11} />, label: t('detail.valeurAcquisition'), val: fmtMoney(selected.valeurAcquisition) },
                      { icon: <Calendar size={11} />, label: t('detail.periodicite'), val: selected.periodiciteMaintenanceJours ? t('detail.days', { count: selected.periodiciteMaintenanceJours }) : '—' },
                      { icon: <Calendar size={11} />, label: t('detail.prochaineMaintenance'), val: fmtDate(selected.dateProchaineMaintenance) },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0F4FA' }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{row.icon}{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>{row.val}</span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => setShowInter(true)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, border: 'none', background: '#155E63', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        <Wrench size={13} /> {t('detail.addIntervention')}
                      </button>
                      {selected.statut !== 'en_panne' && selected.statut !== 'reforme' && (
                        <button onClick={() => setShowPanne(true)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <Zap size={13} /> {t('detail.declarePanne')}
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#155E63', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{t('detail.history')}</div>
                      {history.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#90A4AE', padding: '12px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8 }}>{t('detail.historyEmpty')}</div>
                      ) : history.map(h => (
                        <div key={h.id} style={{ padding: '9px 11px', borderRadius: 8, border: '1px solid #F0F4FA', marginBottom: 6, background: '#FAFCFE' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#155E63' }}>{t(`typeInter.${h.type}` as any)}</span>
                            <span style={{ fontSize: 10, color: '#90A4AE' }}>{fmtDate(h.date)}</span>
                          </div>
                          {h.description && <div style={{ fontSize: 11, color: '#546E7A', lineHeight: 1.4 }}>{h.description}</div>}
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 10, color: '#90A4AE' }}>
                            <span>{t(`statutInter.${h.statut}` as any)}</span>
                            {h.cout ? <span>{t('detail.cost')}: {fmtMoney(h.cout)}</span> : null}
                            {h.prestataire ? <span>{h.prestataire}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        /* MAINTENANCES DUES */
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F4FA', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#C2410C" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('due.title')}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ background: '#FFF7ED' }}>
                  {[t('due.colEquip'), t('due.colLocalisation'), t('due.colEcheance'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dues.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '50px 20px', color: '#90A4AE', fontSize: 13, fontWeight: 600 }}>{t('due.empty')}</td></tr>
                ) : dues.map(e => {
                  const dj = daysUntil(e.dateProchaineMaintenance);
                  const overdue = dj !== null && dj < 0;
                  const today = dj === 0;
                  return (
                    <tr key={e.id} className="eq-row" onClick={() => { setTab('inventaire'); setSelected(e); }} style={{ borderTop: '1px solid #F0F4FA', cursor: 'pointer' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15 }}>{CAT_ICON[e.categorie] ?? '🔧'}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{e.nom}</div>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#90A4AE' }}>{e.code}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{e.localisation ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#374151', fontWeight: 700 }}>{fmtDate(e.dateProchaineMaintenance)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: overdue ? '#FEF2F2' : today ? '#FFF7ED' : '#EFF6FF', color: overdue ? '#DC2626' : today ? '#C2410C' : '#1D4ED8', border: `1px solid ${overdue ? '#FECACA' : today ? '#FED7AA' : '#BFDBFE'}` }}>
                          {overdue ? t('due.overdue') : today ? t('due.today') : t('due.inDays', { count: dj ?? 0 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <CreateModal t={t} onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} />}
      {showInter && selected && <InterModal t={t} equip={selected} onClose={() => setShowInter(false)} onSaved={() => { setShowInter(false); load(); loadHistory(selected.id); }} />}
      {showPanne && selected && <PanneModal t={t} equip={selected} onClose={() => setShowPanne(false)} onSaved={() => { setShowPanne(false); load(); loadHistory(selected.id); }} />}
    </div>
  );
}

/* ── Modales ─────────────────────────────────────────────────────── */
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' };
const modalBox: React.CSSProperties = { width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeUp .2s ease' };
const modalHead: React.CSSProperties = { background: 'linear-gradient(135deg,#0F3D3E,#155E63)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 6 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}

function CreateModal({ t, onClose, onSaved }: any) {
  const [nom, setNom] = useState(''); const [categorie, setCategorie] = useState('imagerie');
  const [marque, setMarque] = useState(''); const [modele, setModele] = useState('');
  const [numeroSerie, setNumeroSerie] = useState(''); const [localisation, setLocalisation] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState(''); const [valeur, setValeur] = useState('');
  const [periodicite, setPeriodicite] = useState(''); const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!nom.trim()) { setErr(t('errors.nomRequired')); return; }
    setSaving(true); setErr(null);
    try {
      await apiClient('/equipements', {
        method: 'POST',
        body: {
          nom, categorie, marque: marque || undefined, modele: modele || undefined,
          numeroSerie: numeroSerie || undefined, localisation: localisation || undefined,
          dateAcquisition: dateAcquisition || undefined,
          valeurAcquisition: valeur ? Number(valeur) : undefined,
          periodiciteMaintenanceJours: periodicite ? Number(periodicite) : undefined,
          notes: notes || undefined,
        },
      });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.create')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Wrench size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('form.titleCreate')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label={t('form.nom')}><input style={inp} value={nom} onChange={e => setNom(e.target.value)} placeholder={t('form.phNom')} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('form.categorie')}>
              <select style={inp} value={categorie} onChange={e => setCategorie(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{t(`categorie.${c}`)}</option>)}
              </select>
            </Field>
            <Field label={t('form.localisation')}><input style={inp} value={localisation} onChange={e => setLocalisation(e.target.value)} /></Field>
            <Field label={t('form.marque')}><input style={inp} value={marque} onChange={e => setMarque(e.target.value)} /></Field>
            <Field label={t('form.modele')}><input style={inp} value={modele} onChange={e => setModele(e.target.value)} /></Field>
            <Field label={t('form.numeroSerie')}><input style={inp} value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} /></Field>
            <Field label={t('form.dateAcquisition')}><input type="date" style={inp} value={dateAcquisition} onChange={e => setDateAcquisition(e.target.value)} /></Field>
            <Field label={t('form.valeurAcquisition')}><input type="number" style={inp} value={valeur} onChange={e => setValeur(e.target.value)} /></Field>
            <Field label={t('form.periodicite')}><input type="number" style={inp} value={periodicite} onChange={e => setPeriodicite(e.target.value)} /></Field>
          </div>
          <Field label={t('form.notes')}><textarea style={{ ...inp, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
          {err && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', color: '#DC2626', fontSize: 12 }}><AlertTriangle size={13} /> {err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('form.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#155E63', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Save size={15} /> {saving ? t('form.saving') : t('form.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterModal({ t, equip, onClose, onSaved }: any) {
  const [type, setType] = useState('preventive'); const [date, setDate] = useState('');
  const [description, setDescription] = useState(''); const [technicien, setTechnicien] = useState('');
  const [prestataire, setPrestataire] = useState(''); const [cout, setCout] = useState('');
  const [duree, setDuree] = useState(''); const [resultat, setResultat] = useState('');
  const [statut, setStatut] = useState('terminee'); const [prochaineDate, setProchaineDate] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true); setErr(null);
    const me = getCurrentUser();
    try {
      await apiClient(`/equipements/${equip.id}/interventions`, {
        method: 'POST',
        body: {
          type, date: date || undefined, description: description || undefined,
          technicienRef: technicien || me?.id || undefined, prestataire: prestataire || undefined,
          cout: cout ? Number(cout) : undefined, dureeIndispoHeures: duree ? Number(duree) : undefined,
          resultat: resultat || undefined, statut, prochaineDate: prochaineDate || undefined,
        },
      });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.interSave')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Wrench size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('interForm.title')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#546E7A' }}>{equip.code} — <strong>{equip.nom}</strong></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('interForm.type')}>
              <select style={inp} value={type} onChange={e => setType(e.target.value)}>
                {TYPES_INTER.map(x => <option key={x} value={x}>{t(`typeInter.${x}`)}</option>)}
              </select>
            </Field>
            <Field label={t('interForm.statut')}>
              <select style={inp} value={statut} onChange={e => setStatut(e.target.value)}>
                {STATUTS_INTER.map(x => <option key={x} value={x}>{t(`statutInter.${x}`)}</option>)}
              </select>
            </Field>
            <Field label={t('interForm.date')}><input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} /></Field>
            <Field label={t('interForm.prochaineDate')}><input type="date" style={inp} value={prochaineDate} onChange={e => setProchaineDate(e.target.value)} /></Field>
            <Field label={t('interForm.technicien')}><input style={inp} value={technicien} onChange={e => setTechnicien(e.target.value)} /></Field>
            <Field label={t('interForm.prestataire')}><input style={inp} value={prestataire} onChange={e => setPrestataire(e.target.value)} /></Field>
            <Field label={t('interForm.cout')}><input type="number" style={inp} value={cout} onChange={e => setCout(e.target.value)} /></Field>
            <Field label={t('interForm.dureeIndispo')}><input type="number" style={inp} value={duree} onChange={e => setDuree(e.target.value)} /></Field>
          </div>
          <Field label={t('interForm.description')}><textarea style={{ ...inp, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('interForm.phDescription')} /></Field>
          <Field label={t('interForm.resultat')}><textarea style={{ ...inp, minHeight: 44, resize: 'vertical', fontFamily: 'inherit' }} value={resultat} onChange={e => setResultat(e.target.value)} placeholder={t('interForm.phResultat')} /></Field>
          {err && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', color: '#DC2626', fontSize: 12 }}><AlertTriangle size={13} /> {err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('interForm.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#155E63', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Save size={15} /> {saving ? t('interForm.saving') : t('interForm.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanneModal({ t, equip, onClose, onSaved }: any) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setSaving(true); setErr(null);
    try {
      await apiClient(`/equipements/${equip.id}/panne`, { method: 'PATCH', body: { description: description || undefined } });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.create')); } finally { setSaving(false); }
  };
  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ ...modalHead, background: 'linear-gradient(135deg,#991B1B,#DC2626)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Zap size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('panneModal.title')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#546E7A' }}>{equip.code} — <strong>{equip.nom}</strong></div>
          <Field label={t('panneModal.description')}><textarea style={{ ...inp, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('panneModal.phDescription')} /></Field>
          {err && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('panneModal.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#DC2626', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Zap size={15} /> {saving ? t('panneModal.saving') : t('panneModal.confirm')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
