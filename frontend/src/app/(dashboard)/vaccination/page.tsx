'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Syringe, Plus, Search, RefreshCw, Calendar, AlertTriangle,
  Clock, CheckCircle, BookOpen, Bell, ChevronRight, X, ShieldAlert,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Cible = 'enfant' | 'adulte' | 'tous';
type Vaccin = {
  id: string; code: string; nom: string; maladieCible: string;
  nbDoses: number; intervalleJours: number; cible: Cible; ageRecommande?: string;
};
type Patient = { id: string; nom: string; prenom: string; ipp?: string };
type Vaccination = {
  id: string; patientId: string; vaccinId: string; doseNumero: number;
  dateAdministration: string; lot?: string; voie?: string; siteInjection?: string;
  dateRappelPrevue?: string; statut: string; aDeclarer?: boolean; notes?: string;
  patient?: Patient | null;
  vaccin?: { id: string; code: string; nom: string; maladieCible: string } | null;
};
type Stats = {
  vaccinationsMois: number; vaccinationsJour: number;
  rappelsEnRetard: number; rappelsAVenir7j: number; aDeclarer: number;
};

const CIBLE_CFG: Record<Cible, { bg: string; color: string }> = {
  enfant: { bg: '#DBEAFE', color: '#1D4ED8' },
  adulte: { bg: '#DCFCE7', color: '#15803D' },
  tous:   { bg: '#EDE9FE', color: '#6D28D9' },
};

const unwrap = (r: any) => (Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []));

function inits(p?: Patient | null) {
  if (!p) return '?';
  return `${p.prenom?.charAt(0) ?? ''}${p.nom?.charAt(0) ?? ''}`.toUpperCase();
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

export default function VaccinationPage() {
  const t = useTranslations('vaccination');
  const [tab, setTab] = useState<'rappels' | 'carnet' | 'referentiel'>('rappels');

  const [vaccins, setVaccins] = useState<Vaccin[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rappels, setRappels] = useState<{ enRetard: Vaccination[]; aVenir: Vaccination[] }>({ enRetard: [], aVenir: [] });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refSearch, setRefSearch] = useState('');
  const [cibleFilter, setCibleFilter] = useState<Cible | ''>('');

  // Carnet patient
  const [patientSel, setPatientSel] = useState<Patient | null>(null);
  const [carnet, setCarnet] = useState<Vaccination[]>([]);
  const [carnetLoading, setCarnetLoading] = useState(false);
  const [patientQuery, setPatientQuery] = useState('');

  // Modal enregistrement
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: '', vaccinId: '', doseNumero: 1, lot: '', voie: '',
    siteInjection: '', dateAdministration: new Date().toISOString().slice(0, 10),
    aDeclarer: false, notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, pRes, rRes, sRes] = await Promise.all([
        apiClient<any>('/vaccination/vaccins'),
        apiClient<any>('/patients?limit=200'),
        apiClient<any>('/vaccination/rappels'),
        apiClient<any>('/vaccination/stats'),
      ]);
      setVaccins(unwrap(vRes));
      setPatients(unwrap(pRes));
      setRappels({ enRetard: rRes?.enRetard ?? [], aVenir: rRes?.aVenir ?? [] });
      setStats(sRes ?? null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadCarnet = useCallback(async (p: Patient) => {
    setPatientSel(p);
    setCarnetLoading(true);
    try {
      const res = await apiClient<any>(`/vaccination/${p.id}`);
      setCarnet(unwrap(res));
    } finally { setCarnetLoading(false); }
  }, []);

  const submit = async () => {
    if (!form.patientId || !form.vaccinId) return;
    setSaving(true);
    try {
      await apiClient('/vaccination', {
        method: 'POST',
        body: {
          patientId: form.patientId,
          vaccinId: form.vaccinId,
          doseNumero: Number(form.doseNumero) || 1,
          lot: form.lot || undefined,
          voie: form.voie || undefined,
          siteInjection: form.siteInjection || undefined,
          dateAdministration: new Date(form.dateAdministration).toISOString(),
          aDeclarer: form.aDeclarer,
          notes: form.notes || undefined,
        },
      });
      setShowForm(false);
      setForm({ ...form, vaccinId: '', doseNumero: 1, lot: '', siteInjection: '', notes: '', aDeclarer: false });
      await load();
      if (patientSel && patientSel.id === form.patientId) await loadCarnet(patientSel);
    } finally { setSaving(false); }
  };

  const refVaccins = vaccins.filter(v => {
    const q = refSearch.toLowerCase();
    const matchQ = !q || v.nom.toLowerCase().includes(q) || v.code.toLowerCase().includes(q) || v.maladieCible.toLowerCase().includes(q);
    const matchC = !cibleFilter || v.cible === cibleFilter || v.cible === 'tous';
    return matchQ && matchC;
  });

  const patientsFiltered = patients.filter(p => {
    const q = patientQuery.toLowerCase();
    return !q || `${p.prenom} ${p.nom}`.toLowerCase().includes(q) || (p.ipp ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .vx-row:hover{background:#F0FDF4!important;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#064E3B 0%,#047857 50%,#10B981 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(4,120,87,0.4)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Syringe size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('heroTitle')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>{t('heroSubtitle')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#047857', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('newRecord')}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpiMonth'), val: stats?.vaccinationsMois, color: '#fff' },
            { label: t('kpiToday'), val: stats?.vaccinationsJour, color: '#A7F3D0' },
            { label: t('kpiOverdue'), val: stats?.rappelsEnRetard, color: '#FCA5A5' },
            { label: t('kpiToDeclare'), val: stats?.aDeclarer, color: '#FCD34D' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.color, lineHeight: 1 }}>{loading ? '…' : (k.val ?? 0)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          { k: 'rappels', label: t('tabReminders'), icon: <Bell size={13} /> },
          { k: 'carnet', label: t('tabRecord'), icon: <BookOpen size={13} /> },
          { k: 'referentiel', label: t('tabCatalog'), icon: <Syringe size={13} /> },
        ] as const).map(x => (
          <button key={x.k} onClick={() => setTab(x.k)}
            style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${tab === x.k ? '#047857' : '#E0E8F0'}`, background: tab === x.k ? '#047857' : '#fff', color: tab === x.k ? '#fff' : '#546E7A', fontSize: 12, fontWeight: tab === x.k ? 800 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {x.icon} {x.label}
          </button>
        ))}
      </div>

      {/* ── RAPPELS ── */}
      {tab === 'rappels' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <RappelSection title={t('overdueTitle')} icon={<AlertTriangle size={15} color="#DC2626" />} color="#DC2626" bg="#FEF2F2" items={rappels.enRetard} loading={loading} t={t} overdue />
          <div style={{ height: 16 }} />
          <RappelSection title={t('upcomingTitle')} icon={<Clock size={15} color="#D97706" />} color="#D97706" bg="#FFFBEB" items={rappels.aVenir} loading={loading} t={t} />
        </div>
      )}

      {/* ── CARNET ── */}
      {tab === 'carnet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, animation: 'fadeUp .25s ease' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', maxHeight: 560, overflowY: 'auto' }}>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
              <input value={patientQuery} onChange={e => setPatientQuery(e.target.value)} placeholder={t('searchPatient')}
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {patientsFiltered.slice(0, 60).map(p => (
              <button key={p.id} onClick={() => loadCarnet(p)}
                style={{ width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 9, border: 'none', background: patientSel?.id === p.id ? '#DCFCE7' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, marginBottom: 2 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: '#D1FAE5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{inits(p)}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1A2332', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.prenom} {p.nom}</div>
                  {p.ipp && <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{p.ipp}</div>}
                </div>
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            {!patientSel ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#90A4AE' }}>
                <BookOpen size={40} style={{ display: 'block', margin: '0 auto 12px', color: '#A7F3D0' }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('selectPatient')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1A2332' }}>{patientSel.prenom} {patientSel.nom}</h2>
                    {patientSel.ipp && <div style={{ fontSize: 11, color: '#90A4AE', fontFamily: 'monospace' }}>{t('ippLabel')} {patientSel.ipp}</div>}
                  </div>
                  <button onClick={() => { setForm({ ...form, patientId: patientSel.id }); setShowForm(true); }}
                    style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: '#047857', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={13} /> {t('newRecord')}
                  </button>
                </div>
                {carnetLoading ? (
                  <div style={{ color: '#90A4AE', fontSize: 13, padding: 20 }}>{t('loading')}</div>
                ) : carnet.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#90A4AE' }}>
                    <Syringe size={34} style={{ display: 'block', margin: '0 auto 10px', color: '#D1FAE5' }} />
                    <p style={{ margin: 0, fontSize: 13 }}>{t('emptyRecord')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {carnet.map(v => (
                      <div key={v.id} style={{ border: '1px solid #F0F0F0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#D1FAE5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Syringe size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A2332' }}>
                            {v.vaccin?.nom ?? v.vaccinId} <span style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600 }}>· {t('doseLabel')} {v.doseNumero}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span><Calendar size={10} style={{ verticalAlign: -1 }} /> {fmtDate(v.dateAdministration)}</span>
                            {v.lot && <span>{t('lotLabel')}: {v.lot}</span>}
                            {v.vaccin?.maladieCible && <span style={{ color: '#90A4AE' }}>{v.vaccin.maladieCible}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          {v.aDeclarer && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: '#FEF3C7', color: '#B45309', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <ShieldAlert size={10} /> {t('toDeclare')}
                            </span>
                          )}
                          {v.dateRappelPrevue && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706' }}>
                              <Bell size={10} style={{ verticalAlign: -1 }} /> {t('nextDose')}: {fmtDate(v.dateRappelPrevue)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REFERENTIEL ── */}
      {tab === 'referentiel' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
              <input value={refSearch} onChange={e => setRefSearch(e.target.value)} placeholder={t('searchVaccine')}
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {(['', 'enfant', 'adulte'] as const).map(c => (
              <button key={c} onClick={() => setCibleFilter(c as Cible | '')}
                style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${cibleFilter === c ? '#047857' : '#E0E8F0'}`, background: cibleFilter === c ? '#047857' : '#fff', color: cibleFilter === c ? '#fff' : '#546E7A', fontSize: 11, fontWeight: cibleFilter === c ? 800 : 500, cursor: 'pointer' }}>
                {c === '' ? t('cibleAll') : t(`cible.${c}`)}
              </button>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' }}>
                    {[t('colCode'), t('colName'), t('colDisease'), t('colDoses'), t('colInterval'), t('colTarget'), t('colAge')].map((h, i) => (
                      <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#90A4AE' }}>{t('loading')}</td></tr>
                  ) : refVaccins.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('emptyCatalog')}</td></tr>
                  ) : refVaccins.map(v => {
                    const cfg = CIBLE_CFG[v.cible];
                    return (
                      <tr key={v.id} className="vx-row" style={{ borderTop: '1px solid #F1F5F9', transition: 'background .1s' }}>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#047857', background: '#D1FAE5', padding: '2px 8px', borderRadius: 6 }}>{v.code}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{v.nom}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{v.maladieCible}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{v.nbDoses}</td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A' }}>{v.intervalleJours > 0 ? t('daysValue', { n: v.intervalleJours }) : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{t(`cible.${v.cible}`)}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: '#90A4AE' }}>{v.ageRecommande ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ENREGISTREMENT ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 22, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Syringe size={18} color="#047857" /> {t('formTitle')}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#90A4AE' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label={t('fieldPatient')}>
                <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={selStyle}>
                  <option value="">{t('selectPlaceholder')}</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}{p.ipp ? ` (${p.ipp})` : ''}</option>)}
                </select>
              </Field>
              <Field label={t('fieldVaccine')}>
                <select value={form.vaccinId} onChange={e => { const v = vaccins.find(x => x.id === e.target.value); setForm({ ...form, vaccinId: e.target.value, doseNumero: 1 }); }} style={selStyle}>
                  <option value="">{t('selectPlaceholder')}</option>
                  {vaccins.map(v => <option key={v.id} value={v.id}>{v.code} — {v.nom}</option>)}
                </select>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('fieldDose')}>
                  <input type="number" min={1} value={form.doseNumero} onChange={e => setForm({ ...form, doseNumero: Number(e.target.value) })} style={inpStyle} />
                </Field>
                <Field label={t('fieldDate')}>
                  <input type="date" value={form.dateAdministration} onChange={e => setForm({ ...form, dateAdministration: e.target.value })} style={inpStyle} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label={t('fieldLot')}>
                  <input value={form.lot} onChange={e => setForm({ ...form, lot: e.target.value })} style={inpStyle} placeholder="LOT-…" />
                </Field>
                <Field label={t('fieldRoute')}>
                  <select value={form.voie} onChange={e => setForm({ ...form, voie: e.target.value })} style={selStyle}>
                    <option value="">—</option>
                    {['intramusculaire', 'sous_cutanee', 'intradermique', 'orale', 'nasale'].map(x => <option key={x} value={x}>{t(`route.${x}`)}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={t('fieldSite')}>
                <input value={form.siteInjection} onChange={e => setForm({ ...form, siteInjection: e.target.value })} style={inpStyle} placeholder={t('sitePlaceholder')} />
              </Field>
              <Field label={t('fieldNotes')}>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inpStyle, resize: 'vertical' }} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#546E7A', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.aDeclarer} onChange={e => setForm({ ...form, aDeclarer: e.target.checked })} />
                <ShieldAlert size={14} color="#B45309" /> {t('fieldToDeclare')}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('cancel')}</button>
              <button onClick={submit} disabled={saving || !form.patientId || !form.vaccinId}
                style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: (!form.patientId || !form.vaccinId) ? '#A7F3D0' : '#047857', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />} {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inpStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' };
const selStyle: React.CSSProperties = { ...inpStyle, background: '#fff' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function RappelSection({ title, icon, color, bg, items, loading, t, overdue }: {
  title: string; icon: React.ReactNode; color: string; bg: string;
  items: Vaccination[]; loading: boolean; t: any; overdue?: boolean;
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', background: bg, display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${color}22` }}>
        {icon}
        <span style={{ fontSize: 13.5, fontWeight: 800, color }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: color, borderRadius: 20, padding: '1px 9px', marginLeft: 4 }}>{items.length}</span>
      </div>
      {loading ? (
        <div style={{ padding: 24, color: '#90A4AE', fontSize: 13 }}>{t('loading')}</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
          <CheckCircle size={28} style={{ display: 'block', margin: '0 auto 8px', color: '#A7F3D0' }} />
          {t('noReminders')}
        </div>
      ) : (
        <div>
          {items.map(v => (
            <div key={v.id} className="vx-row" style={{ padding: '12px 18px', borderTop: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 12, transition: 'background .1s' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{inits(v.patient)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{v.patient ? `${v.patient.prenom} ${v.patient.nom}` : '—'}</div>
                <div style={{ fontSize: 11, color: '#546E7A' }}>{v.vaccin?.nom ?? v.vaccinId} · {t('doseLabel')} {v.doseNumero + 1}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: overdue ? '#DC2626' : '#D97706' }}>{fmtDate(v.dateRappelPrevue)}</div>
                <div style={{ fontSize: 10, color: '#90A4AE' }}>{overdue ? t('overdueLabel') : t('dueLabel')}</div>
              </div>
              <ChevronRight size={14} color="#B0BEC5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
