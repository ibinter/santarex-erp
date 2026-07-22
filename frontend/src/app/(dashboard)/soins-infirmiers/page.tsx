'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HeartPulse, RefreshCw, Search, Plus, User, ClipboardList,
  ListChecks, Syringe, Activity, X, Check, Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';
import PatientSearch from '@/components/PatientSearch';

// ── Types ────────────────────────────────────────────────────────────────
type Patient = { id: string; nom: string; prenom: string; ipp?: string };
type Infirmier = { id: string; nom: string; prenom: string } | null;
type Niveau = 'aucune' | 'legere' | 'moderee' | 'intense';

type Transmission = {
  id: string; date: string; cible: string; donnees?: string; actions?: string;
  resultats?: string; infirmier?: Infirmier;
};
type Plan = {
  id: string; diagnostic: string; objectif: string; interventions?: string;
  echeance?: string; statut: 'actif' | 'atteint' | 'arrete'; infirmier?: Infirmier;
};
type Acte = {
  id: string; date: string; type: string; description: string; realise: boolean;
  infirmier?: Infirmier;
};
type Douleur = {
  id: string; date: string; echelle: string; score: number; niveau: Niveau;
  max: number; localisation?: string; traitementAdministre?: string;
  reevaluation?: string; infirmier?: Infirmier;
};
type Stats = {
  transmissionsJour: number; plansActifs: number; actesNonRealises: number;
  douleursNonReevaluees: number;
};

type Tab = 'transmissions' | 'plans' | 'actes' | 'douleur';

const ACTE_TYPES = ['pansement', 'injection', 'perfusion', 'toilette', 'prelevement', 'surveillance', 'autre'];
const ECHELLES = ['EVA', 'EN', 'CPOT', 'EVENDOL'];
const ECHELLE_MAX: Record<string, number> = { EVA: 10, EN: 10, CPOT: 8, EVENDOL: 15 };

const NIVEAU_COLOR: Record<Niveau, { bg: string; text: string; dot: string }> = {
  aucune:  { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  legere:  { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308' },
  moderee: { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  intense: { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' },
};

function arr<T>(d: any): T[] { return Array.isArray(d) ? d : d?.items ?? d?.data ?? []; }
function fmt(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}
function inits(p?: Patient) { return `${p?.prenom?.[0] ?? ''}${p?.nom?.[0] ?? ''}`.toUpperCase(); }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E0E8F0',
  background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332',
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 4, display: 'block' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 16 };

export default function SoinsInfirmiersPage() {
  const t = useTranslations('soinsInfirmiers');

  const [patient, setPatient] = useState<Patient | null>(null);

  const [tab, setTab] = useState<Tab>('transmissions');
  const [stats, setStats] = useState<Stats | null>(null);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [actes, setActes] = useState<Acte[]>([]);
  const [douleurs, setDouleurs] = useState<Douleur[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try { setStats(await apiClient<Stats>('/soins-infirmiers/stats')); } catch { /* noop */ }
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const loadData = useCallback(async () => {
    if (!patient) return;
    setLoading(true);
    const q = `?patientId=${patient.id}`;
    try {
      const [tr, pl, ac, do_] = await Promise.allSettled([
        apiClient<any>(`/soins-infirmiers/transmissions${q}`),
        apiClient<any>(`/soins-infirmiers/plans${q}`),
        apiClient<any>(`/soins-infirmiers/actes${q}`),
        apiClient<any>(`/soins-infirmiers/douleur${q}`),
      ]);
      if (tr.status === 'fulfilled') setTransmissions(arr<Transmission>(tr.value));
      if (pl.status === 'fulfilled') setPlans(arr<Plan>(pl.value));
      if (ac.status === 'fulfilled') setActes(arr<Acte>(ac.value));
      if (do_.status === 'fulfilled') setDouleurs(arr<Douleur>(do_.value));
    } finally { setLoading(false); }
  }, [patient]);
  useEffect(() => { loadData(); }, [loadData]);

  const refresh = () => { loadData(); loadStats(); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn:hover{opacity:.85}
        .pat-row:hover{background:#EFF6FF!important}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#7B1FA2 0%,#9C27B0 50%,#6A1B9A 100%)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, boxShadow: '0 8px 28px rgba(123,31,162,0.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartPulse size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('titre')}</h1>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>{t('sousTitre')}</div>
          </div>
        </div>
        <button onClick={refresh} disabled={loading}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('actualiser')}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: t('statTransmissionsJour'), val: stats?.transmissionsJour, icon: <ClipboardList size={16} />, c: '#7B1FA2' },
          { label: t('statPlansActifs'), val: stats?.plansActifs, icon: <ListChecks size={16} />, c: '#1565C0' },
          { label: t('statActesEnAttente'), val: stats?.actesNonRealises, icon: <Syringe size={16} />, c: '#E65100' },
          { label: t('statDouleursNonReevaluees'), val: stats?.douleursNonReevaluees, icon: <Activity size={16} />, c: '#C62828' },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.c}15`, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1A2332', lineHeight: 1 }}>{s.val ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PATIENT SELECTOR */}
      <div style={{ ...card, marginBottom: 18 }}>
        {!patient && <label style={labelStyle}>{t('selectionnerPatient')}</label>}
        <PatientSearch
          selected={patient}
          onSelect={(p) => setPatient(p)}
          accent="#7B1FA2"
        />
      </div>

      {!patient ? (
        <div style={{ ...card, textAlign: 'center', padding: '50px 20px' }}>
          <User size={40} style={{ color: '#CE93D8', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: '#90A4AE', fontSize: 13, fontWeight: 600 }}>{t('selectionnerPatientInvite')}</p>
        </div>
      ) : (
        <>
          {/* TABS */}
          <div style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 10, padding: 4, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', flexWrap: 'wrap' }}>
            {([
              { id: 'transmissions' as const, label: t('tabTransmissions'), icon: <ClipboardList size={13} /> },
              { id: 'plans' as const, label: t('tabPlans'), icon: <ListChecks size={13} /> },
              { id: 'actes' as const, label: t('tabActes'), icon: <Syringe size={13} /> },
              { id: 'douleur' as const, label: t('tabDouleur'), icon: <Activity size={13} /> },
            ]).map(x => (
              <button key={x.id} onClick={() => setTab(x.id)} className="tab-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: tab === x.id ? 'linear-gradient(135deg,#7B1FA2,#9C27B0)' : 'transparent', color: tab === x.id ? '#fff' : '#546E7A', fontSize: 12, fontWeight: tab === x.id ? 700 : 500, cursor: 'pointer' }}>
                {x.icon} {x.label}
              </button>
            ))}
          </div>

          <div style={{ animation: 'fadeUp .25s ease' }}>
            {tab === 'transmissions' && <TransmissionsTab patient={patient} items={transmissions} onSaved={refresh} />}
            {tab === 'plans' && <PlansTab patient={patient} items={plans} onSaved={refresh} />}
            {tab === 'actes' && <ActesTab patient={patient} items={actes} onSaved={refresh} />}
            {tab === 'douleur' && <DouleurTab patient={patient} items={douleurs} onSaved={refresh} />}
          </div>
        </>
      )}
    </div>
  );
}

// ── Transmissions ciblées (DAR) ─────────────────────────────────────────────
function TransmissionsTab({ patient, items, onSaved }: { patient: Patient; items: Transmission[]; onSaved: () => void }) {
  const t = useTranslations('soinsInfirmiers');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ cible: '', donnees: '', actions: '', resultats: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!f.cible.trim()) { setErr(t('transmissions.cibleRequise')); return; }
    setBusy(true); setErr(null);
    try {
      await apiClient('/soins-infirmiers/transmissions', { method: 'POST', body: { patientId: patient.id, ...f } });
      setF({ cible: '', donnees: '', actions: '', resultats: '' }); setOpen(false); onSaved();
    } catch (e: any) { setErr(e?.message ?? 'Erreur'); } finally { setBusy(false); }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('transmissions.titre')} open={open} setOpen={setOpen} addLabel={t('transmissions.nouvelle')} />
      {open && (
        <div style={{ background: '#FAFBFF', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #EEF1F8' }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>{t('transmissions.cible')} *</label>
            <input style={inputStyle} value={f.cible} onChange={e => setF({ ...f, cible: e.target.value })} />
          </div>
          {(['donnees', 'actions', 'resultats'] as const).map(k => (
            <div key={k} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{t(`transmissions.${k}`)}</label>
              <textarea style={{ ...inputStyle, minHeight: 52, resize: 'vertical' }} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
            </div>
          ))}
          <FormFooter err={err} busy={busy} onSubmit={submit} onCancel={() => setOpen(false)} />
        </div>
      )}
      {items.length === 0 ? <Empty label={t('transmissions.aucune')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => (
            <div key={it.id} style={{ border: '1px solid #F0F4FA', borderRadius: 10, padding: 12, borderLeft: '3px solid #7B1FA2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#7B1FA2' }}>{it.cible}</span>
                <Meta date={it.date} inf={it.infirmier} />
              </div>
              {it.donnees && <DarLine tag="D" label={t('transmissions.donnees')} text={it.donnees} />}
              {it.actions && <DarLine tag="A" label={t('transmissions.actions')} text={it.actions} />}
              {it.resultats && <DarLine tag="R" label={t('transmissions.resultats')} text={it.resultats} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DarLine({ tag, text }: { tag: string; label: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 12.5, color: '#37474F' }}>
      <span style={{ width: 18, height: 18, borderRadius: 5, background: '#EDE7F6', color: '#7B1FA2', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{tag}</span>
      <span>{text}</span>
    </div>
  );
}

// ── Plan de soins ────────────────────────────────────────────────────────────
function PlansTab({ patient, items, onSaved }: { patient: Patient; items: Plan[]; onSaved: () => void }) {
  const t = useTranslations('soinsInfirmiers');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ diagnostic: '', objectif: '', interventions: '', echeance: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!f.diagnostic.trim() || !f.objectif.trim()) { setErr(t('plans.champsRequis')); return; }
    setBusy(true); setErr(null);
    try {
      const body: any = { patientId: patient.id, diagnostic: f.diagnostic, objectif: f.objectif, interventions: f.interventions };
      if (f.echeance) body.echeance = new Date(f.echeance).toISOString();
      await apiClient('/soins-infirmiers/plans', { method: 'POST', body });
      setF({ diagnostic: '', objectif: '', interventions: '', echeance: '' }); setOpen(false); onSaved();
    } catch (e: any) { setErr(e?.message ?? 'Erreur'); } finally { setBusy(false); }
  };

  const setStatut = async (id: string, statut: string) => {
    try { await apiClient(`/soins-infirmiers/plans/${id}`, { method: 'PATCH', body: { statut } }); onSaved(); } catch { /* noop */ }
  };

  const statutCfg: Record<string, { bg: string; text: string; label: string }> = {
    actif: { bg: '#EFF6FF', text: '#1565C0', label: t('plans.statutActif') },
    atteint: { bg: '#F0FDF4', text: '#166534', label: t('plans.statutAtteint') },
    arrete: { bg: '#F8FAFC', text: '#64748B', label: t('plans.statutArrete') },
  };

  return (
    <div style={card}>
      <SectionHeader title={t('plans.titre')} open={open} setOpen={setOpen} addLabel={t('plans.nouveau')} />
      {open && (
        <div style={{ background: '#FAFBFF', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #EEF1F8' }}>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('plans.diagnostic')} *</label><input style={inputStyle} value={f.diagnostic} onChange={e => setF({ ...f, diagnostic: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('plans.objectif')} *</label><input style={inputStyle} value={f.objectif} onChange={e => setF({ ...f, objectif: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('plans.interventions')}</label><textarea style={{ ...inputStyle, minHeight: 52, resize: 'vertical' }} value={f.interventions} onChange={e => setF({ ...f, interventions: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('plans.echeance')}</label><input type="date" style={inputStyle} value={f.echeance} onChange={e => setF({ ...f, echeance: e.target.value })} /></div>
          <FormFooter err={err} busy={busy} onSubmit={submit} onCancel={() => setOpen(false)} />
        </div>
      )}
      {items.length === 0 ? <Empty label={t('plans.aucun')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(p => {
            const sc = statutCfg[p.statut] ?? statutCfg.actif;
            return (
              <div key={p.id} style={{ border: '1px solid #F0F4FA', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1A2332' }}>{p.diagnostic}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#37474F', marginTop: 6 }}><b style={{ color: '#7B1FA2' }}>{t('plans.objectif')} :</b> {p.objectif}</div>
                {p.interventions && <div style={{ fontSize: 12.5, color: '#546E7A', marginTop: 4 }}><b>{t('plans.interventions')} :</b> {p.interventions}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                  <Meta date={p.echeance} inf={p.infirmier} prefixDate={t('plans.echeance')} />
                  {p.statut === 'actif' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setStatut(p.id, 'atteint')} className="tab-btn" style={miniBtn('#166534', '#F0FDF4')}>{t('plans.marquerAtteint')}</button>
                      <button onClick={() => setStatut(p.id, 'arrete')} className="tab-btn" style={miniBtn('#64748B', '#F8FAFC')}>{t('plans.marquerArrete')}</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Feuille de soins (actes) ─────────────────────────────────────────────────
function ActesTab({ patient, items, onSaved }: { patient: Patient; items: Acte[]; onSaved: () => void }) {
  const t = useTranslations('soinsInfirmiers');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ type: 'pansement', description: '', realise: false });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!f.description.trim()) { setErr(t('actes.descriptionRequise')); return; }
    setBusy(true); setErr(null);
    try {
      await apiClient('/soins-infirmiers/actes', { method: 'POST', body: { patientId: patient.id, ...f } });
      setF({ type: 'pansement', description: '', realise: false }); setOpen(false); onSaved();
    } catch (e: any) { setErr(e?.message ?? 'Erreur'); } finally { setBusy(false); }
  };
  const markDone = async (id: string) => {
    try { await apiClient(`/soins-infirmiers/actes/${id}`, { method: 'PATCH', body: { realise: true } }); onSaved(); } catch { /* noop */ }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('actes.titre')} open={open} setOpen={setOpen} addLabel={t('actes.nouvel')} />
      {open && (
        <div style={{ background: '#FAFBFF', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #EEF1F8' }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>{t('actes.type')}</label>
            <select style={inputStyle} value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>
              {ACTE_TYPES.map(x => <option key={x} value={x}>{t(`actes.types.${x}`)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('actes.description')} *</label><textarea style={{ ...inputStyle, minHeight: 52, resize: 'vertical' }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#37474F', fontWeight: 600, marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.realise} onChange={e => setF({ ...f, realise: e.target.checked })} /> {t('actes.realise')}
          </label>
          <FormFooter err={err} busy={busy} onSubmit={submit} onCancel={() => setOpen(false)} />
        </div>
      )}
      {items.length === 0 ? <Empty label={t('actes.aucun')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(a => (
            <div key={a.id} style={{ border: '1px solid #F0F4FA', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: a.realise ? '#F0FDF4' : '#FFF7ED', color: a.realise ? '#166534' : '#9A3412', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {a.realise ? <Check size={16} /> : <Clock size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#EDE7F6', color: '#7B1FA2', textTransform: 'uppercase' }}>{t(`actes.types.${a.type}`)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{a.description}</span>
                </div>
                <Meta date={a.date} inf={a.infirmier} />
              </div>
              {!a.realise && <button onClick={() => markDone(a.id)} className="tab-btn" style={miniBtn('#166534', '#F0FDF4')}>{t('actes.marquerRealise')}</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Douleur ──────────────────────────────────────────────────────────────────
function DouleurTab({ patient, items, onSaved }: { patient: Patient; items: Douleur[]; onSaved: () => void }) {
  const t = useTranslations('soinsInfirmiers');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ echelle: 'EVA', score: 0, localisation: '', traitementAdministre: '', reevaluation: '' });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const max = ECHELLE_MAX[f.echelle] ?? 10;
  const submit = async () => {
    if (f.score < 0 || f.score > max) { setErr(t('douleur.scoreInvalide')); return; }
    setBusy(true); setErr(null);
    try {
      const body: any = { patientId: patient.id, echelle: f.echelle, score: Number(f.score), localisation: f.localisation, traitementAdministre: f.traitementAdministre };
      if (f.reevaluation) body.reevaluation = new Date(f.reevaluation).toISOString();
      await apiClient('/soins-infirmiers/douleur', { method: 'POST', body });
      setF({ echelle: 'EVA', score: 0, localisation: '', traitementAdministre: '', reevaluation: '' }); setOpen(false); onSaved();
    } catch (e: any) { setErr(e?.message ?? 'Erreur'); } finally { setBusy(false); }
  };

  const niveauLabel = (n: Niveau) => t(`douleur.niveau${n.charAt(0).toUpperCase() + n.slice(1)}`);

  return (
    <div style={card}>
      <SectionHeader title={t('douleur.titre')} open={open} setOpen={setOpen} addLabel={t('douleur.nouvelle')} />
      {open && (
        <div style={{ background: '#FAFBFF', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #EEF1F8' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>{t('douleur.echelle')}</label>
              <select style={inputStyle} value={f.echelle} onChange={e => setF({ ...f, echelle: e.target.value, score: 0 })}>
                {ECHELLES.map(x => <option key={x} value={x}>{x} (0–{ECHELLE_MAX[x]})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('douleur.score')} (0–{max})</label>
              <input type="number" min={0} max={max} style={inputStyle} value={f.score} onChange={e => setF({ ...f, score: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('douleur.localisation')}</label><input style={inputStyle} value={f.localisation} onChange={e => setF({ ...f, localisation: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('douleur.traitement')}</label><input style={inputStyle} value={f.traitementAdministre} onChange={e => setF({ ...f, traitementAdministre: e.target.value })} /></div>
          <div style={{ marginBottom: 10 }}><label style={labelStyle}>{t('douleur.reevaluation')}</label><input type="datetime-local" style={inputStyle} value={f.reevaluation} onChange={e => setF({ ...f, reevaluation: e.target.value })} /></div>
          <FormFooter err={err} busy={busy} onSubmit={submit} onCancel={() => setOpen(false)} />
        </div>
      )}
      {items.length === 0 ? <Empty label={t('douleur.aucune')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(d => {
            const nc = NIVEAU_COLOR[d.niveau] ?? NIVEAU_COLOR.aucune;
            return (
              <div key={d.id} style={{ border: '1px solid #F0F4FA', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: nc.bg, color: nc.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{d.score}</span>
                  <span style={{ fontSize: 9, opacity: .7 }}>/ {d.max ?? ECHELLE_MAX[d.echelle]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#1A2332' }}>{d.echelle}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: nc.bg, color: nc.text }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: nc.dot }} /> {niveauLabel(d.niveau)}
                    </span>
                    {d.localisation && <span style={{ fontSize: 12, color: '#546E7A' }}>· {d.localisation}</span>}
                  </div>
                  {d.traitementAdministre && <div style={{ fontSize: 12, color: '#546E7A', marginTop: 3 }}>{d.traitementAdministre}</div>}
                  <Meta date={d.date} inf={d.infirmier} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Petits composants partagés ───────────────────────────────────────────────
function SectionHeader({ title, open, setOpen, addLabel }: { title: string; open: boolean; setOpen: (v: boolean) => void; addLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2332' }}>{title}</h2>
      <button onClick={() => setOpen(!open)} className="tab-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: open ? '#F5F0FA' : 'linear-gradient(135deg,#7B1FA2,#9C27B0)', color: open ? '#7B1FA2' : '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {open ? <X size={14} /> : <Plus size={14} />} {addLabel}
      </button>
    </div>
  );
}

function FormFooter({ err, busy, onSubmit, onCancel }: { err: string | null; busy: boolean; onSubmit: () => void; onCancel: () => void }) {
  const t = useTranslations('soinsInfirmiers');
  return (
    <div>
      {err && <div style={{ color: '#C62828', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="tab-btn" style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('annuler')}</button>
        <button onClick={onSubmit} disabled={busy} className="tab-btn" style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7B1FA2,#9C27B0)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{t('enregistrer')}</button>
      </div>
    </div>
  );
}

function Meta({ date, inf, prefixDate }: { date?: string; inf?: Infirmier; prefixDate?: string }) {
  const t = useTranslations('soinsInfirmiers');
  return (
    <span style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600 }}>
      {prefixDate ? `${prefixDate} : ` : ''}{fmt(date)}
      {inf && ` · ${t('par')} ${inf.prenom} ${inf.nom}`}
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#90A4AE' }}>
      <ClipboardList size={34} style={{ display: 'block', margin: '0 auto 10px', color: '#CE93D8' }} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function miniBtn(text: string, bg: string): React.CSSProperties {
  return { padding: '6px 12px', borderRadius: 8, border: 'none', background: bg, color: text, fontSize: 11, fontWeight: 700, cursor: 'pointer' };
}
