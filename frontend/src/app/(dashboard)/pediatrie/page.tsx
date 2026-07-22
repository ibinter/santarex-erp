'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Baby, Search, RefreshCw, Plus, Activity, Syringe, Calculator,
  CheckCircle, Clock, AlertTriangle, TrendingUp, X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Patient = { id: string; nom: string; prenom: string; ipp?: string; dateNaissance?: string };
type Mesure = {
  id: string; dateMesure: string; ageMois?: number | null;
  poidsKg?: number | null; tailleCm?: number | null; perimetreCranienCm?: number | null; imc?: number | null;
  observations?: string | null;
};
type Vaccin = {
  id: string; vaccin: string; dosePrevueAge?: string; datePrevue?: string | null;
  dateAdministration?: string | null; lot?: string | null; statut: 'a_faire' | 'fait' | 'en_retard';
};
type CurvePoint = { date: string; ageMois: number | null; poidsKg: number | null; tailleCm: number | null; perimetreCranienCm: number | null; imc: number | null };
type Stats = { totalMesures: number; enfantsSuivis: number; vaccinsFaits: number; vaccinsAFaire: number; vaccinsEnRetard: number };

const unwrap = (r: any) => (Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []));
const num = (v: any): number | null => (v === null || v === undefined || v === '' ? null : Number(v));

function ageMonths(dob?: string): number | null {
  if (!dob) return null;
  const n = new Date(dob), now = new Date();
  if (isNaN(n.getTime())) return null;
  let m = (now.getFullYear() - n.getFullYear()) * 12 + (now.getMonth() - n.getMonth());
  if (now.getDate() < n.getDate()) m -= 1;
  return Math.max(0, m);
}

const STATUT_CFG: Record<Vaccin['statut'], { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  a_faire:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: <Clock size={11} /> },
  fait:      { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', icon: <CheckCircle size={11} /> },
  en_retard: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA', icon: <AlertTriangle size={11} /> },
};

export default function PediatriePage() {
  const t = useTranslations('pediatrie');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [tab, setTab] = useState<'croissance' | 'vaccinal' | 'posologie'>('croissance');

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [patRes, statRes] = await Promise.all([
        apiClient<any>('/patients?limit=100'),
        apiClient<any>('/pediatrie/stats').catch(() => null),
      ]);
      setPatients(unwrap(patRes));
      if (statRes) setStats(statRes);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      const nom = `${p.prenom} ${p.nom}`.toLowerCase();
      return !q || nom.includes(q) || (p.ipp ?? '').toLowerCase().includes(q);
    }).slice(0, 40);
  }, [patients, search]);

  const ageLabel = (dob?: string) => {
    const m = ageMonths(dob);
    if (m === null) return '—';
    return m < 24 ? t('patient.months', { count: m }) : t('patient.years', { count: Math.floor(m / 12) });
  };

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ped-pat:hover{background:#F0FDFA!important;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0F766E 0%,#0D9488 50%,#14B8A6 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,148,136,0.4)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Baby size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('heroTitle')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>{t('heroSubtitle')}</div>
            </div>
          </div>
          <button onClick={loadBase} disabled={loading}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('refresh')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpi.enfantsSuivis'), val: stats?.enfantsSuivis ?? 0, c: '#fff' },
            { label: t('kpi.mesures'), val: stats?.totalMesures ?? 0, c: '#CCFBF1' },
            { label: t('kpi.vaccinsFaits'), val: stats?.vaccinsFaits ?? 0, c: '#BBF7D0' },
            { label: t('kpi.vaccinsEnRetard'), val: stats?.vaccinsEnRetard ?? 0, c: '#FCA5A5' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.c, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        {/* PATIENT LIST */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', marginBottom: 8 }}>{t('patient.select')}</div>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('patient.searchPlaceholder')}
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
            </div>
          </div>
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {displayed.map((p) => {
              const active = selected?.id === p.id;
              return (
                <div key={p.id} className="ped-pat" onClick={() => setSelected(p)}
                  style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F5F7FA', background: active ? '#CCFBF1' : '#fff', transition: 'background .1s' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize: 10, color: '#90A4AE', display: 'flex', gap: 8, marginTop: 2 }}>
                    {p.ipp && <span style={{ fontFamily: 'monospace' }}>{t('patient.ipp')} {p.ipp}</span>}
                    <span>{ageLabel(p.dateNaissance)}</span>
                  </div>
                </div>
              );
            })}
            {displayed.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#90A4AE', fontSize: 12 }}>—</div>}
          </div>
        </div>

        {/* MAIN */}
        <div>
          {!selected ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <Baby size={40} style={{ color: '#99F6E4', marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#546E7A' }}>{t('patient.none')}</div>
              <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 4 }}>{t('patient.chooseHint')}</div>
            </div>
          ) : (
            <>
              {/* selected header + tabs */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{selected.prenom} {selected.nom}</div>
                  <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('patient.ageLabel')}: {ageLabel(selected.dateNaissance)}{selected.ipp ? ` • ${t('patient.ipp')} ${selected.ipp}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([['croissance', <Activity key="a" size={13} />], ['vaccinal', <Syringe key="s" size={13} />], ['posologie', <Calculator key="c" size={13} />]] as const).map(([key, icon]) => (
                    <button key={key} onClick={() => setTab(key)}
                      style={{ padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, background: tab === key ? '#0F766E' : '#F1F5F9', color: tab === key ? '#fff' : '#546E7A' }}>
                      {icon} {t(`tabs.${key}`)}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'croissance' && <CroissanceTab patient={selected} onChanged={loadBase} />}
              {tab === 'vaccinal' && <VaccinalTab patient={selected} onChanged={loadBase} />}
              {tab === 'posologie' && <PosologieTab patient={selected} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Croissance ─────────────────────────────── */
function CroissanceTab({ patient, onChanged }: { patient: Patient; onChanged: () => void }) {
  const t = useTranslations('pediatrie');
  const [mesures, setMesures] = useState<Mesure[]>([]);
  const [curve, setCurve] = useState<CurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ dateMesure: new Date().toISOString().slice(0, 10), poidsKg: '', tailleCm: '', perimetreCranienCm: '', observations: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        apiClient<any>(`/pediatrie/croissance?patientId=${patient.id}`),
        apiClient<any>(`/pediatrie/croissance/${patient.id}/courbe`),
      ]);
      setMesures(unwrap(mRes));
      setCurve(cRes?.points ?? []);
    } finally { setLoading(false); }
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient('/pediatrie/croissance', { method: 'POST', body: {
        patientId: patient.id,
        dateMesure: form.dateMesure,
        poidsKg: form.poidsKg ? Number(form.poidsKg) : undefined,
        tailleCm: form.tailleCm ? Number(form.tailleCm) : undefined,
        perimetreCranienCm: form.perimetreCranienCm ? Number(form.perimetreCranienCm) : undefined,
        observations: form.observations || undefined,
      } });
      setShowForm(false);
      setForm({ dateMesure: new Date().toISOString().slice(0, 10), poidsKg: '', tailleCm: '', perimetreCranienCm: '', observations: '' });
      await load(); onChanged();
    } finally { setSaving(false); }
  };

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      {/* Curve */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={15} /> {t('croissance.curveTitle')}
        </div>
        <GrowthCurve points={curve} labels={{ poids: t('croissance.curvePoids'), taille: t('croissance.curveTaille'), pc: t('croissance.curvePc') }} empty={t('croissance.curveEmpty')} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2332' }}>{t('croissance.title')}</div>
          <button onClick={() => setShowForm((s) => !s)} style={{ padding: '7px 14px', borderRadius: 9, border: 'none', background: '#0F766E', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> {t('croissance.add')}
          </button>
        </div>

        {showForm && (
          <div style={{ padding: 16, background: '#F8FEFC', borderBottom: '1px solid #E6FFFA', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            <Field label={t('croissance.date')}><input type="date" value={form.dateMesure} onChange={(e) => setForm({ ...form, dateMesure: e.target.value })} style={inp} /></Field>
            <Field label={t('croissance.poids')}><input type="number" step="0.01" value={form.poidsKg} onChange={(e) => setForm({ ...form, poidsKg: e.target.value })} style={inp} /></Field>
            <Field label={t('croissance.taille')}><input type="number" step="0.1" value={form.tailleCm} onChange={(e) => setForm({ ...form, tailleCm: e.target.value })} style={inp} /></Field>
            <Field label={t('croissance.pc')}><input type="number" step="0.1" value={form.perimetreCranienCm} onChange={(e) => setForm({ ...form, perimetreCranienCm: e.target.value })} style={inp} /></Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={t('croissance.observations')}><input value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} style={inp} /></Field>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ ...btnGhost }}>{t('croissance.cancel')}</button>
              <button onClick={save} disabled={saving} style={{ ...btnPrimary }}>{saving ? t('croissance.saving') : t('croissance.save')}</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)' }}>
                {[t('croissance.date'), t('croissance.age'), t('croissance.poids'), t('croissance.taille'), t('croissance.pc'), t('croissance.imc'), t('croissance.observations')].map((h, i) => (
                  <th key={i} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#90A4AE' }}>…</td></tr>
              ) : mesures.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>{t('croissance.empty')}</td></tr>
              ) : mesures.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid #F5F7FA' }}>
                  <td style={td}>{m.dateMesure}</td>
                  <td style={td}>{m.ageMois ?? '—'}</td>
                  <td style={td}>{num(m.poidsKg) ?? '—'}</td>
                  <td style={td}>{num(m.tailleCm) ?? '—'}</td>
                  <td style={td}>{num(m.perimetreCranienCm) ?? '—'}</td>
                  <td style={td}><strong>{num(m.imc) ?? '—'}</strong></td>
                  <td style={{ ...td, color: '#90A4AE' }}>{m.observations || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GrowthCurve({ points, labels, empty }: { points: CurvePoint[]; labels: { poids: string; taille: string; pc: string }; empty: string }) {
  const valid = points.filter((p) => p.ageMois !== null);
  if (valid.length < 2) return <div style={{ padding: 30, textAlign: 'center', color: '#90A4AE', fontSize: 12 }}>{empty}</div>;

  const W = 640, H = 220, pad = 34;
  const ages = valid.map((p) => p.ageMois as number);
  const minA = Math.min(...ages), maxA = Math.max(...ages);
  const spanA = maxA - minA || 1;
  const series = [
    { key: 'poidsKg' as const, color: '#0D9488', label: labels.poids },
    { key: 'tailleCm' as const, color: '#6366F1', label: labels.taille },
    { key: 'perimetreCranienCm' as const, color: '#F59E0B', label: labels.pc },
  ];

  const x = (a: number) => pad + ((a - minA) / spanA) * (W - pad * 2);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#E2E8F0" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#E2E8F0" />
        {series.map((s) => {
          const vals = valid.map((p) => p[s.key]).filter((v): v is number => v !== null);
          if (vals.length < 2) return null;
          const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
          const y = (v: number) => H - pad - ((v - mn) / sp) * (H - pad * 2);
          const pts = valid.filter((p) => p[s.key] !== null);
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.ageMois as number).toFixed(1)},${y(p[s.key] as number).toFixed(1)}`).join(' ');
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
              {pts.map((p, i) => <circle key={i} cx={x(p.ageMois as number)} cy={y(p[s.key] as number)} r={3} fill={s.color} />)}
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 6 }}>
        {series.map((s) => (
          <span key={s.key} style={{ fontSize: 10, color: '#546E7A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 3, background: s.color, borderRadius: 2, display: 'inline-block' }} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Vaccinal ─────────────────────────────── */
function VaccinalTab({ patient, onChanged }: { patient: Patient; onChanged: () => void }) {
  const t = useTranslations('pediatrie');
  const [vaccins, setVaccins] = useState<Vaccin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Vaccin | null>(null);
  const [lot, setLot] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try { setVaccins(unwrap(await apiClient<any>(`/pediatrie/vaccinations?patientId=${patient.id}`))); }
    finally { setLoading(false); }
  }, [patient.id]);

  useEffect(() => { load(); }, [load]);

  const markDone = async () => {
    if (!editing) return;
    await apiClient(`/pediatrie/vaccinations/${editing.id}`, { method: 'PATCH', body: { dateAdministration: date, lot: lot || undefined, statut: 'fait' } });
    setEditing(null); setLot(''); await load(); onChanged();
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
      <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#1A2332', borderBottom: '1px solid #F1F5F9' }}>{t('vaccinal.title')}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)' }}>
              {[t('vaccinal.vaccin'), t('vaccinal.agePrevu'), t('vaccinal.datePrevue'), t('vaccinal.dateAdmin'), t('vaccinal.lot'), t('vaccinal.statut'), t('vaccinal.action')].map((h, i) => <th key={i} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#90A4AE' }}>…</td></tr>
            ) : vaccins.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>{t('vaccinal.empty')}</td></tr>
            ) : vaccins.map((v) => {
              const cfg = STATUT_CFG[v.statut];
              return (
                <tr key={v.id} style={{ borderTop: '1px solid #F5F7FA' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{v.vaccin}</td>
                  <td style={td}>{v.dosePrevueAge || '—'}</td>
                  <td style={td}>{v.datePrevue || '—'}</td>
                  <td style={td}>{v.dateAdministration || '—'}</td>
                  <td style={td}>{v.lot || '—'}</td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.icon} {t(`vaccinal.statutValues.${v.statut}`)}
                    </span>
                  </td>
                  <td style={td}>
                    {v.statut !== 'fait' && (
                      <button onClick={() => { setEditing(v); setLot(v.lot || ''); }} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid #99F6E4', background: '#F0FDFA', color: '#0F766E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {t('vaccinal.markDone')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 20, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('vaccinal.markTitle')}</div>
              <X size={18} style={{ cursor: 'pointer', color: '#90A4AE' }} onClick={() => setEditing(null)} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E', marginBottom: 12 }}>{editing.vaccin}</div>
            <Field label={t('vaccinal.dateAdmin')}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} /></Field>
            <div style={{ height: 10 }} />
            <Field label={t('vaccinal.lot')}><input value={lot} onChange={(e) => setLot(e.target.value)} placeholder={t('vaccinal.lotPlaceholder')} style={inp} /></Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setEditing(null)} style={btnGhost}>{t('vaccinal.cancel')}</button>
              <button onClick={markDone} style={btnPrimary}>{t('vaccinal.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── Posologie ─────────────────────────────── */
function PosologieTab({ patient }: { patient: Patient }) {
  const t = useTranslations('pediatrie');
  const [form, setForm] = useState({ medicament: '', poidsKg: '', mgParKgParJour: '', nbPrises: '3', doseMaxJourMg: '' });
  const [result, setResult] = useState<{ doseJourMg: number; doseParPriseMg: number; nbPrises: number; plafonnee: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = async () => {
    if (!form.poidsKg || !form.mgParKgParJour || !form.nbPrises) return;
    setLoading(true);
    try {
      const res = await apiClient<any>('/pediatrie/posologie', { method: 'POST', body: {
        medicament: form.medicament || undefined,
        poidsKg: Number(form.poidsKg),
        mgParKgParJour: Number(form.mgParKgParJour),
        nbPrises: Number(form.nbPrises),
        doseMaxJourMg: form.doseMaxJourMg ? Number(form.doseMaxJourMg) : undefined,
      } });
      setResult(res);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', animation: 'fadeUp .25s ease' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F766E' }}>{t('posologie.title')}</div>
      <div style={{ fontSize: 12, color: '#90A4AE', marginBottom: 16 }}>{t('posologie.subtitle')}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        <Field label={t('posologie.medicament')}><input value={form.medicament} onChange={(e) => setForm({ ...form, medicament: e.target.value })} placeholder={t('posologie.medicamentPlaceholder')} style={inp} /></Field>
        <Field label={t('posologie.poids')}><input type="number" step="0.1" value={form.poidsKg} onChange={(e) => setForm({ ...form, poidsKg: e.target.value })} style={inp} /></Field>
        <Field label={t('posologie.mgKgJour')}><input type="number" step="0.1" value={form.mgParKgParJour} onChange={(e) => setForm({ ...form, mgParKgParJour: e.target.value })} style={inp} /></Field>
        <Field label={t('posologie.nbPrises')}><input type="number" min="1" value={form.nbPrises} onChange={(e) => setForm({ ...form, nbPrises: e.target.value })} style={inp} /></Field>
        <Field label={t('posologie.doseMax')}><input type="number" step="1" value={form.doseMaxJourMg} onChange={(e) => setForm({ ...form, doseMaxJourMg: e.target.value })} style={inp} /></Field>
      </div>

      <button onClick={compute} disabled={loading} style={{ ...btnPrimary, marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Calculator size={14} /> {t('posologie.compute')}
      </button>

      {result ? (
        <div style={{ marginTop: 18, padding: 16, background: '#F0FDFA', borderRadius: 12, border: '1px solid #CCFBF1' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', marginBottom: 12 }}>{t('posologie.resultTitle')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase' }}>{t('posologie.doseJour')}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0F766E' }}>{result.doseJourMg} <span style={{ fontSize: 13, fontWeight: 600 }}>{t('posologie.mg')}</span></div>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase' }}>{t('posologie.doseParPrise')}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0D9488' }}>{result.doseParPriseMg} <span style={{ fontSize: 13, fontWeight: 600 }}>{t('posologie.mg')}</span></div>
              <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>{t('posologie.prisesLabel', { count: result.nbPrises })}</div>
            </div>
          </div>
          {result.plafonnee && <div style={{ marginTop: 10, fontSize: 11, color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={12} /> {t('posologie.plafonnee')}</div>}
        </div>
      ) : (
        <div style={{ marginTop: 16, fontSize: 12, color: '#90A4AE' }}>{t('posologie.fillHint')}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────── UI helpers ─────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' };
const th: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '11px 14px', fontSize: 12, color: '#37474F', whiteSpace: 'nowrap' };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 9, border: 'none', background: '#0F766E', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '9px 18px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
