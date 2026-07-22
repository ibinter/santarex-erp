'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HousePlus, RefreshCw, Plus, X, ChevronRight, AlertTriangle, Save,
  Calendar, MapPin, Phone, Stethoscope, ClipboardList, CheckCircle2,
  Clock, PauseCircle, PlayCircle, User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type StatutHAD = 'active' | 'suspendue' | 'terminee' | string;
type TypeVisite = 'infirmier' | 'medical' | 'kine' | 'autre' | string;
type StatutVisite = 'planifiee' | 'effectuee' | 'annulee' | 'reportee' | string;

type PersonLite = { id: string; nom: string; prenom: string; ipp?: string } | null;

type Visite = {
  id: string; hadId: string; patientId: string; dateVisite: string; type: TypeVisite;
  intervenantRef?: string; statut: StatutVisite; observations?: string;
  actesRealises?: string; dateRealisation?: string | null; prochaineVisite?: string | null;
  patient?: PersonLite;
};
type HAD = {
  id: string; numero: string; patientId: string; adresseDomicile: string;
  ville?: string; telephoneContact?: string; motif: string; medecinReferentRef: string;
  dateDebut: string; dateFinPrevue?: string; dateFinReelle?: string | null;
  protocoleSoins?: string; frequenceVisites?: string; statut: StatutHAD;
  patient?: PersonLite; medecin?: PersonLite; visites?: Visite[];
};
type Stats = {
  prisesEnCharge?: { total?: number; actives?: number; suspendues?: number; terminees?: number };
  visites?: { aujourdhui?: number; enRetard?: number };
};

const STATUT_CFG: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  active:    { color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', dot: '#22C55E' },
  suspendue: { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316' },
  terminee:  { color: '#475569', bg: '#F1F5F9', border: '#CBD5E1', dot: '#94A3B8' },
};
const VISITE_CFG: Record<string, { color: string; bg: string }> = {
  planifiee: { color: '#1D4ED8', bg: '#EFF6FF' },
  effectuee: { color: '#15803D', bg: '#DCFCE7' },
  annulee:   { color: '#DC2626', bg: '#FEF2F2' },
  reportee:  { color: '#C2410C', bg: '#FFF7ED' },
};
const TYPE_ICON: Record<string, string> = {
  infirmier: '💉', medical: '🩺', kine: '🦵', autre: '🏠',
};
const STATUTS = ['active', 'suspendue', 'terminee'];
const TYPES_VISITE = ['infirmier', 'medical', 'kine', 'autre'];
const STATUTS_VISITE = ['planifiee', 'effectuee', 'annulee', 'reportee'];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
function fmtDateTime(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}
function fmtHeure(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}
function personName(p?: PersonLite) {
  if (!p) return '—';
  return `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || '—';
}

export default function HadPage() {
  const t = useTranslations('had');
  const statutLabel = (s: string) => t(`statut.${s}` as any);
  const typeLabel = (s: string) => t(`typeVisite.${s}` as any);
  const statutVisiteLabel = (s: string) => t(`statutVisite.${s}` as any);

  const [prises, setPrises] = useState<HAD[]>([]);
  const [agenda, setAgenda] = useState<Visite[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'patients' | 'agenda'>('patients');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HAD | null>(null);

  const [showAdmission, setShowAdmission] = useState(false);
  const [showVisite, setShowVisite] = useState(false);
  const [editVisite, setEditVisite] = useState<Visite | null>(null);
  const [showCloture, setShowCloture] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pR, aR, sR] = await Promise.allSettled([
        apiClient<any>('/had?limit=200'),
        apiClient<any>('/had/visites-jour'),
        apiClient<any>('/had/stats'),
      ]);
      if (pR.status === 'fulfilled') { const d = pR.value; setPrises(Array.isArray(d) ? d : d?.data ?? []); }
      if (aR.status === 'fulfilled') setAgenda(Array.isArray(aR.value) ? aR.value : aR.value?.data ?? []);
      if (sR.status === 'fulfilled') setStats(sR.value ?? {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    try { const d = await apiClient<HAD>(`/had/${id}`); setSelected(d); }
    catch { /* ignore */ }
  }, []);

  const filtered = prises.filter(h =>
    (filtreStatut === 'TOUS' || h.statut === filtreStatut) &&
    (!search ||
      personName(h.patient).toLowerCase().includes(search.toLowerCase()) ||
      h.numero.toLowerCase().includes(search.toLowerCase()) ||
      (h.motif ?? '').toLowerCase().includes(search.toLowerCase())));

  const sc = stats.prisesEnCharge ?? {};
  const svc = stats.visites ?? {};
  const kpis = [
    { label: t('hero.kpiActives'), val: sc.actives ?? prises.filter(h => h.statut === 'active').length, f: 'active' },
    { label: t('hero.kpiSuspendues'), val: sc.suspendues ?? prises.filter(h => h.statut === 'suspendue').length, f: 'suspendue' },
    { label: t('hero.kpiTotal'), val: sc.total ?? prises.length, f: 'TOUS' },
    { label: t('hero.kpiVisitesJour'), val: svc.aujourdhui ?? agenda.length, f: 'AGENDA' },
    { label: t('hero.kpiEnRetard'), val: svc.enRetard ?? 0, f: null as any },
  ];

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .had-row:hover{background:#EFF6FF!important;}
        .had-kpi{cursor:pointer;transition:all .15s;}
        .had-kpi:hover{transform:translateY(-2px);}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0F3D3E 0%,#155E63 50%,#1B7A82 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15,61,62,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HousePlus size={24} color="#fff" />
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
                const active = filtreStatut === k.f || (k.f === 'AGENDA' && tab === 'agenda');
                return (
                  <div key={k.label} className="had-kpi"
                    title={k.f ? t('hero.filterTitle', { label: k.label }) : k.label}
                    onClick={() => { if (k.f === 'AGENDA') setTab('agenda'); else if (k.f) { setTab('patients'); setFiltreStatut(k.f); } }}
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
            <button onClick={() => setShowAdmission(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#0F3D3E', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('hero.newAdmission')}
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['patients', 'agenda'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${tab === tb ? '#155E63' : '#E0E8F0'}`, background: tab === tb ? '#155E63' : '#fff', color: tab === tb ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tb === 'patients' ? <ClipboardList size={13} /> : <Calendar size={13} />}
            {t(`tabs.${tb}`)}
            {tb === 'agenda' && agenda.length > 0 && (
              <span style={{ background: tab === tb ? 'rgba(255,255,255,0.3)' : '#EFF6FF', color: tab === tb ? '#fff' : '#1D4ED8', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 800 }}>{agenda.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'patients' ? (
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
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: selected ? '1fr 400px' : '1fr', alignItems: 'start', animation: 'fadeUp .25s ease' }}>
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#F0FFFE,#E6FAF7)' }}>
                      {[t('list.colNumero'), t('list.colPatient'), t('list.colMotif'), t('list.colDebut'), t('list.colStatut'), ''].map((h, i) => (
                        <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F0F4FA' }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 13, background: '#F0F4FA', borderRadius: 4, width: j === 1 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                        ))}
                      </tr>
                    )) : filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                        <HousePlus size={36} style={{ display: 'block', margin: '0 auto 12px', color: '#99F6E4' }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('list.empty')}</p>
                      </td></tr>
                    ) : filtered.map(h => {
                      const cfg = STATUT_CFG[h.statut] ?? STATUT_CFG.active;
                      const isSel = selected?.id === h.id;
                      return (
                        <tr key={h.id} className="had-row" onClick={() => isSel ? setSelected(null) : loadDetail(h.id)}
                          style={{ borderTop: '1px solid #F0F4FA', cursor: 'pointer', background: isSel ? '#DBEAFE' : 'transparent' }}>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#155E63', background: '#CCFBF1', padding: '2px 8px', borderRadius: 6 }}>{h.numero}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{personName(h.patient)}</div>
                            {h.patient?.ipp && <div style={{ fontSize: 10, color: '#90A4AE' }}>{h.patient.ipp}</div>}
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.motif}</td>
                          <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(h.dateDebut)}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{statutLabel(h.statut)}
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
              const cfg = STATUT_CFG[selected.statut] ?? STATUT_CFG.active;
              const visites = selected.visites ?? [];
              return (
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'sticky', top: 76, animation: 'slideIn .2s ease' }}>
                  <div style={{ background: 'linear-gradient(135deg,#0F3D3E,#155E63)', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{t('detail.title')} · {selected.numero}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{personName(selected.patient)}</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, marginTop: 6, padding: '3px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{statutLabel(selected.statut)}
                      </span>
                    </div>
                    <button onClick={() => setSelected(null)}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                  </div>

                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '72vh', overflowY: 'auto' }}>
                    {[
                      { icon: <Stethoscope size={11} />, label: t('detail.medecin'), val: personName(selected.medecin) },
                      { icon: <MapPin size={11} />, label: t('detail.adresse'), val: selected.adresseDomicile || '—' },
                      { icon: <MapPin size={11} />, label: t('detail.ville'), val: selected.ville ?? '—' },
                      { icon: <Phone size={11} />, label: t('detail.telephone'), val: selected.telephoneContact ?? '—' },
                      { icon: <Calendar size={11} />, label: t('detail.dateDebut'), val: fmtDate(selected.dateDebut) },
                      { icon: <Calendar size={11} />, label: t('detail.dateFinPrevue'), val: fmtDate(selected.dateFinPrevue) },
                      { icon: <Calendar size={11} />, label: t('detail.dateFinReelle'), val: fmtDate(selected.dateFinReelle) },
                      { icon: <Clock size={11} />, label: t('detail.frequence'), val: selected.frequenceVisites ?? '—' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #F0F4FA' }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>{row.icon}{row.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>{row.val}</span>
                      </div>
                    ))}

                    {/* MOTIF */}
                    <div style={{ marginTop: 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#155E63', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{t('detail.motif')}</div>
                      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8 }}>{selected.motif}</div>
                    </div>

                    {/* PLAN DE SOINS */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#155E63', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>{t('detail.planSoins')}</div>
                      <div style={{ fontSize: 12, color: selected.protocoleSoins ? '#374151' : '#90A4AE', lineHeight: 1.5, background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                        {selected.protocoleSoins || t('detail.aucunProtocole')}
                      </div>
                    </div>

                    {/* ACTIONS STATUT */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditVisite(null); setShowVisite(true); }} disabled={selected.statut === 'terminee'}
                        style={{ flex: 1, minWidth: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 8, border: 'none', background: selected.statut === 'terminee' ? '#CBD5E1' : '#155E63', color: '#fff', fontSize: 12, fontWeight: 700, cursor: selected.statut === 'terminee' ? 'default' : 'pointer' }}>
                        <Plus size={13} /> {t('detail.planifier')}
                      </button>
                      {selected.statut === 'active' && (
                        <button onClick={() => changeStatut(selected.id, 'suspendue')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #FED7AA', background: '#FFF7ED', color: '#C2410C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <PauseCircle size={13} /> {t('detail.suspendre')}
                        </button>
                      )}
                      {selected.statut === 'suspendue' && (
                        <button onClick={() => changeStatut(selected.id, 'active')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #86EFAC', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <PlayCircle size={13} /> {t('detail.reactiver')}
                        </button>
                      )}
                      {selected.statut !== 'terminee' && (
                        <button onClick={() => setShowCloture(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          <CheckCircle2 size={13} /> {t('detail.cloturer')}
                        </button>
                      )}
                    </div>

                    {/* PLANNING DES VISITES */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#155E63', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>{t('detail.visites')} ({visites.length})</div>
                      {visites.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#90A4AE', padding: '12px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8 }}>{t('detail.visitesEmpty')}</div>
                      ) : visites.map(v => {
                        const vc = VISITE_CFG[v.statut] ?? VISITE_CFG.planifiee;
                        return (
                          <div key={v.id} onClick={() => { setEditVisite(v); setShowVisite(true); }}
                            className="had-row"
                            style={{ padding: '9px 11px', borderRadius: 8, border: '1px solid #F0F4FA', marginBottom: 6, background: '#FAFCFE', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#155E63', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>{TYPE_ICON[v.type] ?? '🏠'}</span>{typeLabel(v.type)}
                              </span>
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: vc.bg, color: vc.color }}>{statutVisiteLabel(v.statut)}</span>
                            </div>
                            <div style={{ fontSize: 10, color: '#90A4AE' }}>{fmtDateTime(v.dateVisite)}</div>
                            {v.observations && <div style={{ fontSize: 11, color: '#546E7A', lineHeight: 1.4, marginTop: 3 }}>{v.observations}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        /* AGENDA DU JOUR */
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F4FA', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="#155E63" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('agenda.title')}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ background: '#F0FFFE' }}>
                  {[t('agenda.colHeure'), t('agenda.colPatient'), t('agenda.colType'), t('agenda.colStatut')].map((h, i) => (
                    <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#155E63', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agenda.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '50px 20px', color: '#90A4AE', fontSize: 13, fontWeight: 600 }}>{t('agenda.empty')}</td></tr>
                ) : agenda.map(v => {
                  const vc = VISITE_CFG[v.statut] ?? VISITE_CFG.planifiee;
                  return (
                    <tr key={v.id} className="had-row" onClick={() => { setTab('patients'); loadDetail(v.hadId); }} style={{ borderTop: '1px solid #F0F4FA', cursor: 'pointer' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 800, color: '#155E63', whiteSpace: 'nowrap' }}>{fmtHeure(v.dateVisite)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} color="#90A4AE" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{personName(v.patient)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{TYPE_ICON[v.type] ?? '🏠'} {typeLabel(v.type)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: vc.bg, color: vc.color }}>{statutVisiteLabel(v.statut)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdmission && <AdmissionModal t={t} onClose={() => setShowAdmission(false)} onSaved={() => { setShowAdmission(false); load(); }} />}
      {showVisite && selected && (
        <VisiteModal t={t} had={selected} visite={editVisite}
          onClose={() => { setShowVisite(false); setEditVisite(null); }}
          onSaved={() => { setShowVisite(false); setEditVisite(null); load(); loadDetail(selected.id); }} />
      )}
      {showCloture && selected && (
        <ClotureModal t={t} had={selected}
          onClose={() => setShowCloture(false)}
          onSaved={() => { setShowCloture(false); load(); loadDetail(selected.id); }} />
      )}
    </div>
  );

  async function changeStatut(id: string, statut: StatutHAD, motif?: string) {
    try {
      await apiClient(`/had/${id}/statut`, { method: 'PATCH', body: { statut, motif } });
      load(); loadDetail(id);
    } catch { /* ignore */ }
  }
}

/* ── Modales ─────────────────────────────────────────────────────── */
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' };
const modalBox: React.CSSProperties = { width: '100%', maxWidth: 540, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeUp .2s ease' };
const modalHead: React.CSSProperties = { background: 'linear-gradient(135deg,#0F3D3E,#155E63)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 6 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
function ErrBox({ msg }: { msg: string }) {
  return <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', color: '#DC2626', fontSize: 12 }}><AlertTriangle size={13} /> {msg}</div>;
}

function AdmissionModal({ t, onClose, onSaved }: any) {
  const me = getCurrentUser();
  const [patientId, setPatientId] = useState('');
  const [adresseDomicile, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [telephoneContact, setTel] = useState('');
  const [motif, setMotif] = useState('');
  const [medecinReferentRef, setMedecin] = useState(me?.id ?? '');
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFinPrevue, setDateFin] = useState('');
  const [frequenceVisites, setFreq] = useState('');
  const [protocoleSoins, setProtocole] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!patientId.trim()) { setErr(t('errors.patientRequired')); return; }
    if (!adresseDomicile.trim()) { setErr(t('errors.adresseRequired')); return; }
    if (!motif.trim()) { setErr(t('errors.motifRequired')); return; }
    if (!medecinReferentRef.trim()) { setErr(t('errors.medecinRequired')); return; }
    setSaving(true); setErr(null);
    try {
      await apiClient('/had', {
        method: 'POST',
        body: {
          patientId, adresseDomicile, ville: ville || undefined, telephoneContact: telephoneContact || undefined,
          motif, medecinReferentRef, dateDebut,
          dateFinPrevue: dateFinPrevue || undefined,
          frequenceVisites: frequenceVisites || undefined,
          protocoleSoins: protocoleSoins || undefined,
        },
      });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.create')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><HousePlus size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('admission.title')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label={t('admission.patientId')}><input style={inp} value={patientId} onChange={e => setPatientId(e.target.value)} placeholder={t('admission.phPatientId')} /></Field>
          <Field label={t('admission.adresseDomicile')}><input style={inp} value={adresseDomicile} onChange={e => setAdresse(e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('admission.ville')}><input style={inp} value={ville} onChange={e => setVille(e.target.value)} /></Field>
            <Field label={t('admission.telephoneContact')}><input style={inp} value={telephoneContact} onChange={e => setTel(e.target.value)} /></Field>
            <Field label={t('admission.medecinReferentRef')}><input style={inp} value={medecinReferentRef} onChange={e => setMedecin(e.target.value)} /></Field>
            <Field label={t('admission.frequenceVisites')}><input style={inp} value={frequenceVisites} onChange={e => setFreq(e.target.value)} placeholder={t('admission.phFrequence')} /></Field>
            <Field label={t('admission.dateDebut')}><input type="date" style={inp} value={dateDebut} onChange={e => setDateDebut(e.target.value)} /></Field>
            <Field label={t('admission.dateFinPrevue')}><input type="date" style={inp} value={dateFinPrevue} onChange={e => setDateFin(e.target.value)} /></Field>
          </div>
          <Field label={t('admission.motif')}><textarea style={{ ...inp, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={motif} onChange={e => setMotif(e.target.value)} /></Field>
          <Field label={t('admission.protocoleSoins')}><textarea style={{ ...inp, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }} value={protocoleSoins} onChange={e => setProtocole(e.target.value)} /></Field>
          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('admission.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#155E63', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Save size={15} /> {saving ? t('admission.saving') : t('admission.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisiteModal({ t, had, visite, onClose, onSaved }: any) {
  const me = getCurrentUser();
  const isEdit = !!visite;
  const toLocal = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso); const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  };
  const [dateVisite, setDateVisite] = useState(isEdit ? toLocal(visite.dateVisite) : '');
  const [type, setType] = useState(isEdit ? visite.type : 'infirmier');
  const [intervenantRef, setIntervenant] = useState(isEdit ? (visite.intervenantRef ?? '') : (me?.id ?? ''));
  const [statut, setStatut] = useState(isEdit ? visite.statut : 'planifiee');
  const [observations, setObs] = useState(isEdit ? (visite.observations ?? '') : '');
  const [actesRealises, setActes] = useState(isEdit ? (visite.actesRealises ?? '') : '');
  const [prochaineVisite, setProchaine] = useState(isEdit ? toLocal(visite.prochaineVisite) : '');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true); setErr(null);
    const body: any = {
      dateVisite: dateVisite ? new Date(dateVisite).toISOString() : undefined,
      type, intervenantRef: intervenantRef || undefined, statut,
      observations: observations || undefined, actesRealises: actesRealises || undefined,
      prochaineVisite: prochaineVisite ? new Date(prochaineVisite).toISOString() : undefined,
    };
    try {
      if (isEdit) {
        await apiClient(`/had/${had.id}/visites/${visite.id}`, { method: 'PATCH', body });
      } else {
        await apiClient(`/had/${had.id}/visites`, { method: 'POST', body });
      }
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.visiteSave')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Calendar size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{isEdit ? t('visiteForm.titleEdit') : t('visiteForm.titleCreate')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#546E7A' }}>{had.numero} — <strong>{had.patient?.prenom} {had.patient?.nom}</strong></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('visiteForm.dateVisite')}><input type="datetime-local" style={inp} value={dateVisite} onChange={e => setDateVisite(e.target.value)} /></Field>
            <Field label={t('visiteForm.type')}>
              <select style={inp} value={type} onChange={e => setType(e.target.value)}>
                {TYPES_VISITE.map(x => <option key={x} value={x}>{t(`typeVisite.${x}`)}</option>)}
              </select>
            </Field>
            <Field label={t('visiteForm.intervenantRef')}><input style={inp} value={intervenantRef} onChange={e => setIntervenant(e.target.value)} /></Field>
            <Field label={t('visiteForm.statut')}>
              <select style={inp} value={statut} onChange={e => setStatut(e.target.value)}>
                {STATUTS_VISITE.map(x => <option key={x} value={x}>{t(`statutVisite.${x}`)}</option>)}
              </select>
            </Field>
            <Field label={t('visiteForm.prochaineVisite')}><input type="datetime-local" style={inp} value={prochaineVisite} onChange={e => setProchaine(e.target.value)} /></Field>
          </div>
          <Field label={t('visiteForm.observations')}><textarea style={{ ...inp, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={observations} onChange={e => setObs(e.target.value)} placeholder={t('visiteForm.phObservations')} /></Field>
          <Field label={t('visiteForm.actesRealises')}><textarea style={{ ...inp, minHeight: 50, resize: 'vertical', fontFamily: 'inherit' }} value={actesRealises} onChange={e => setActes(e.target.value)} placeholder={t('visiteForm.phActes')} /></Field>
          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('visiteForm.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#155E63', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Save size={15} /> {saving ? t('visiteForm.saving') : t('visiteForm.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClotureModal({ t, had, onClose, onSaved }: any) {
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setSaving(true); setErr(null);
    try {
      await apiClient(`/had/${had.id}/statut`, { method: 'PATCH', body: { statut: 'terminee', motif: motif || undefined } });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.statutSave')); } finally { setSaving(false); }
  };
  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={{ ...modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ ...modalHead, background: 'linear-gradient(135deg,#334155,#475569)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle2 size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('cloture.title')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#546E7A' }}>{had.numero} — <strong>{had.patient?.prenom} {had.patient?.nom}</strong></div>
          <Field label={t('cloture.motif')}><textarea style={{ ...inp, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={motif} onChange={e => setMotif(e.target.value)} placeholder={t('cloture.phMotif')} /></Field>
          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('cloture.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#475569', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><CheckCircle2 size={15} /> {saving ? t('cloture.saving') : t('cloture.confirm')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
