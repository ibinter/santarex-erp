'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Baby, ArrowLeft, Plus, Stethoscope, Activity, Sparkles,
  AlertTriangle, Calendar, Droplet, CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Dossier = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string } | null;
  ddr: string; dpa?: string;
  gestite: number; parite: number; avortements: number;
  groupeSanguin?: string; rhesus?: string; antecedents?: string;
  grossesseARisque: boolean; motifRisque?: string;
  statut: 'en_cours' | 'terminee'; notes?: string;
  cpns?: any[]; accouchements?: any[]; partogramme?: any[]; postnatal?: any[];
};

type Tab = 'cpn' | 'partogramme' | 'accouchement' | 'postnatal';

function termeSA(ddr?: string): number | null {
  if (!ddr) return null;
  const diff = Date.now() - new Date(ddr).getTime();
  if (isNaN(diff) || diff < 0) return null;
  return Math.floor(diff / (7 * 24 * 3600 * 1000));
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
function fmtDateTime(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 4, display: 'block' };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 20 };
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: 9, border: 'none', background: '#9D174D', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' };

export default function MaterniteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const t = useTranslations('maternite');
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('cpn');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(`/maternite/dossiers/${id}`);
      setDossier(res?.data ?? res);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('list.loading')}</div>;
  if (!dossier) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('list.emptyTitle')}</div>;

  const nom = dossier.patient ? `${dossier.patient.prenom} ${dossier.patient.nom}` : '—';
  const sa = termeSA(dossier.ddr);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'cpn', label: t('detail.tabCpn'), icon: <Stethoscope size={14} />, count: dossier.cpns?.length ?? 0 },
    { key: 'partogramme', label: t('detail.tabPartogramme'), icon: <Activity size={14} />, count: dossier.partogramme?.length ?? 0 },
    { key: 'accouchement', label: t('detail.tabAccouchement'), icon: <Baby size={14} />, count: dossier.accouchements?.length ?? 0 },
    { key: 'postnatal', label: t('detail.tabPostnatal'), icon: <Sparkles size={14} />, count: dossier.postnatal?.length ?? 0 },
  ];

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/maternite')} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#9D174D', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={16} /> {t('detail.back')}
      </button>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#831843 0%,#9D174D 50%,#DB2777 100%)', borderRadius: 18, padding: '22px 26px', marginBottom: 18, color: '#fff', boxShadow: '0 8px 28px rgba(157,23,77,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Baby size={26} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{nom}</h1>
              {dossier.grossesseARisque && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: 'rgba(220,38,38,0.85)', color: '#fff' }}>
                  <AlertTriangle size={10} /> {t('list.riskBadge')}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3, fontFamily: 'monospace' }}>
              {dossier.numero} {dossier.patient?.ipp ? `• ${t('list.ippLabel')} ${dossier.patient.ipp}` : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginTop: 16 }}>
          {[
            { l: t('detail.termeLabel'), v: sa != null ? `${sa} ${t('list.weeksShort')}` : '—' },
            { l: t('detail.dpaLabel'), v: fmtDate(dossier.dpa) },
            { l: t('detail.ddrLabel'), v: fmtDate(dossier.ddr) },
            { l: t('detail.gpaLabel'), v: `${dossier.gestite}-${dossier.parite}-${dossier.avortements}` },
            { l: t('detail.groupeLabel'), v: dossier.groupeSanguin ? `${dossier.groupeSanguin} ${dossier.rhesus === 'positif' ? '+' : dossier.rhesus === 'negatif' ? '−' : ''}` : '—' },
            { l: t('list.colStatut'), v: t(`statut.${dossier.statut}` as any) },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.5px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
        {(dossier.antecedents || dossier.motifRisque) && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
            {dossier.antecedents && <div><b>{t('detail.antecedentsLabel')}:</b> {dossier.antecedents}</div>}
            {dossier.motifRisque && <div style={{ marginTop: 4 }}><b>{t('detail.motifRisqueLabel')}:</b> {dossier.motifRisque}</div>}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${tab === tb.key ? '#9D174D' : '#E0E8F0'}`, background: tab === tb.key ? '#9D174D' : '#fff', color: tab === tb.key ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {tb.icon} {tb.label}
            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 10, background: tab === tb.key ? 'rgba(255,255,255,0.25)' : '#F1F5F9', color: tab === tb.key ? '#fff' : '#90A4AE' }}>{tb.count}</span>
          </button>
        ))}
      </div>

      {tab === 'cpn' && <CpnTab dossierId={id} rows={dossier.cpns ?? []} onSaved={load} />}
      {tab === 'partogramme' && <PartogrammeTab dossierId={id} rows={dossier.partogramme ?? []} onSaved={load} />}
      {tab === 'accouchement' && <AccouchementTab dossierId={id} rows={dossier.accouchements ?? []} onSaved={load} />}
      {tab === 'postnatal' && <PostnatalTab dossierId={id} rows={dossier.postnatal ?? []} onSaved={load} />}
    </div>
  );
}

// ── CPN ──────────────────────────────────────────────────────────────
function CpnTab({ dossierId, rows, onSaved }: { dossierId: string; rows: any[]; onSaved: () => void }) {
  const t = useTranslations('maternite');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ date: '', termeSA: '', poids: '', tensionArterielle: '', hauteurUterine: '', bruitsCoeurFoetal: '', oedemes: false, albuminurie: '', glycosurie: '', observations: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.date) return;
    setSaving(true);
    try {
      const p: any = { date: f.date, oedemes: f.oedemes };
      ['termeSA', 'bruitsCoeurFoetal'].forEach(k => { if (f[k] !== '') p[k] = Number(f[k]); });
      ['poids', 'hauteurUterine'].forEach(k => { if (f[k] !== '') p[k] = Number(f[k]); });
      ['tensionArterielle', 'albuminurie', 'glycosurie', 'observations'].forEach(k => { if (f[k]) p[k] = f[k]; });
      await apiClient(`/maternite/dossiers/${dossierId}/cpn`, { method: 'POST', body: p });
      setOpen(false); setF({ date: '', termeSA: '', poids: '', tensionArterielle: '', hauteurUterine: '', bruitsCoeurFoetal: '', oedemes: false, albuminurie: '', glycosurie: '', observations: '' });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('cpn.title')} action={<button onClick={() => setOpen(!open)} style={btnPrimary}><Plus size={13} style={{ verticalAlign: 'middle' }} /> {t('cpn.add')}</button>} />
      {open && (
        <div style={{ background: '#FDF2F8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><label style={lbl}>{t('cpn.date')} *</label><input type="date" value={f.date} onChange={e => set('date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.termeSA')}</label><input type="number" value={f.termeSA} onChange={e => set('termeSA', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.poids')}</label><input type="number" step="0.1" value={f.poids} onChange={e => set('poids', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.tension')}</label><input placeholder="120/80" value={f.tensionArterielle} onChange={e => set('tensionArterielle', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.hauteurUterine')}</label><input type="number" step="0.1" value={f.hauteurUterine} onChange={e => set('hauteurUterine', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.bcf')}</label><input type="number" value={f.bruitsCoeurFoetal} onChange={e => set('bruitsCoeurFoetal', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.albuminurie')}</label><input value={f.albuminurie} onChange={e => set('albuminurie', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('cpn.glycosurie')}</label><input value={f.glycosurie} onChange={e => set('glycosurie', e.target.value)} style={inp} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#1A2332', alignSelf: 'end' }}>
              <input type="checkbox" checked={f.oedemes} onChange={e => set('oedemes', e.target.checked)} /> {t('cpn.oedemes')}
            </label>
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>{t('cpn.observations')}</label><textarea rows={2} value={f.observations} onChange={e => set('observations', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginTop: 12, textAlign: 'right' }}><button onClick={submit} disabled={saving} style={btnPrimary}>{t('cpn.save')}</button></div>
        </div>
      )}
      {rows.length === 0 ? <Empty text={t('cpn.empty')} /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead><tr style={{ background: '#FDF2F8' }}>{[t('cpn.date'), t('cpn.termeSA'), t('cpn.poids'), t('cpn.tension'), t('cpn.hauteurUterine'), t('cpn.bcf'), t('cpn.observations')].map((h, i) => <Th key={i}>{h}</Th>)}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.id ?? i} style={{ borderTop: '1px solid #F5F0FF' }}>
                <Td>{fmtDate(r.date)}</Td><Td>{r.termeSA ?? '—'}</Td><Td>{r.poids ?? '—'}</Td><Td>{r.tensionArterielle ?? '—'}</Td><Td>{r.hauteurUterine ?? '—'}</Td><Td>{r.bruitsCoeurFoetal ?? '—'}</Td><Td>{r.observations ?? '—'}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Partogramme ──────────────────────────────────────────────────────
function PartogrammeTab({ dossierId, rows, onSaved }: { dossierId: string; rows: any[]; onSaved: () => void }) {
  const t = useTranslations('maternite');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ heure: '', dilatationCol: '', descentePresentation: '', frequenceContractions: '', rythmeCardiaqueFoetal: '', observations: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.heure) return;
    setSaving(true);
    try {
      const p: any = { heure: new Date(f.heure).toISOString() };
      ['dilatationCol', 'frequenceContractions', 'rythmeCardiaqueFoetal'].forEach(k => { if (f[k] !== '') p[k] = Number(f[k]); });
      ['descentePresentation', 'observations'].forEach(k => { if (f[k]) p[k] = f[k]; });
      await apiClient(`/maternite/dossiers/${dossierId}/partogramme`, { method: 'POST', body: p });
      setOpen(false); setF({ heure: '', dilatationCol: '', descentePresentation: '', frequenceContractions: '', rythmeCardiaqueFoetal: '', observations: '' });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('partogramme.title')} action={<button onClick={() => setOpen(!open)} style={btnPrimary}><Plus size={13} style={{ verticalAlign: 'middle' }} /> {t('partogramme.add')}</button>} />
      {open && (
        <div style={{ background: '#FDF2F8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><label style={lbl}>{t('partogramme.heure')} *</label><input type="datetime-local" value={f.heure} onChange={e => set('heure', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('partogramme.dilatation')}</label><input type="number" min={0} max={10} value={f.dilatationCol} onChange={e => set('dilatationCol', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('partogramme.descente')}</label><input value={f.descentePresentation} onChange={e => set('descentePresentation', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('partogramme.contractions')}</label><input type="number" value={f.frequenceContractions} onChange={e => set('frequenceContractions', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('partogramme.rcf')}</label><input type="number" value={f.rythmeCardiaqueFoetal} onChange={e => set('rythmeCardiaqueFoetal', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>{t('partogramme.observations')}</label><textarea rows={2} value={f.observations} onChange={e => set('observations', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginTop: 12, textAlign: 'right' }}><button onClick={submit} disabled={saving} style={btnPrimary}>{t('partogramme.save')}</button></div>
        </div>
      )}
      {rows.length === 0 ? <Empty text={t('partogramme.empty')} /> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead><tr style={{ background: '#FDF2F8' }}>{[t('partogramme.heure'), t('partogramme.dilatation'), t('partogramme.descente'), t('partogramme.contractions'), t('partogramme.rcf'), t('partogramme.observations')].map((h, i) => <Th key={i}>{h}</Th>)}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.id ?? i} style={{ borderTop: '1px solid #F5F0FF' }}>
                <Td>{fmtDateTime(r.heure)}</Td>
                <Td><span style={{ fontWeight: 800, color: '#9D174D' }}>{r.dilatationCol != null ? `${r.dilatationCol} cm` : '—'}</span></Td>
                <Td>{r.descentePresentation ?? '—'}</Td><Td>{r.frequenceContractions ?? '—'}</Td><Td>{r.rythmeCardiaqueFoetal ?? '—'}</Td><Td>{r.observations ?? '—'}</Td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Accouchement ─────────────────────────────────────────────────────
function AccouchementTab({ dossierId, rows, onSaved }: { dossierId: string; rows: any[]; onSaved: () => void }) {
  const t = useTranslations('maternite');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ dateHeure: '', mode: 'voie_basse', presentation: '', delivrance: '', etatPerinee: '', sexeNouveauNe: '', poidsNouveauNe: '', apgar1: '', apgar5: '', complications: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.dateHeure) return;
    setSaving(true);
    try {
      const p: any = { dateHeure: new Date(f.dateHeure).toISOString(), mode: f.mode };
      ['poidsNouveauNe', 'apgar1', 'apgar5'].forEach(k => { if (f[k] !== '') p[k] = Number(f[k]); });
      ['presentation', 'delivrance', 'etatPerinee', 'sexeNouveauNe', 'complications'].forEach(k => { if (f[k]) p[k] = f[k]; });
      await apiClient(`/maternite/dossiers/${dossierId}/accouchement`, { method: 'POST', body: p });
      setOpen(false);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('accouchement.title')} action={<button onClick={() => setOpen(!open)} style={btnPrimary}><Plus size={13} style={{ verticalAlign: 'middle' }} /> {t('accouchement.add')}</button>} />
      {open && (
        <div style={{ background: '#FDF2F8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#B45309', background: '#FEF3C7', borderRadius: 8, padding: '7px 10px', marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={12} /> {t('accouchement.warnClot')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div><label style={lbl}>{t('accouchement.dateHeure')} *</label><input type="datetime-local" value={f.dateHeure} onChange={e => set('dateHeure', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('accouchement.mode')}</label>
              <select value={f.mode} onChange={e => set('mode', e.target.value)} style={inp}>
                {['voie_basse', 'cesarienne', 'instrumental'].map(m => <option key={m} value={m}>{t(`mode.${m}` as any)}</option>)}
              </select>
            </div>
            <div><label style={lbl}>{t('accouchement.presentation')}</label><input value={f.presentation} onChange={e => set('presentation', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('accouchement.delivrance')}</label><input value={f.delivrance} onChange={e => set('delivrance', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('accouchement.etatPerinee')}</label><input value={f.etatPerinee} onChange={e => set('etatPerinee', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: '#9D174D' }}>{t('accouchement.nouveauNe')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 8 }}>
            <div><label style={lbl}>{t('accouchement.sexe')}</label>
              <select value={f.sexeNouveauNe} onChange={e => set('sexeNouveauNe', e.target.value)} style={inp}>
                <option value="">—</option>
                <option value="masculin">{t('sexe.masculin')}</option>
                <option value="feminin">{t('sexe.feminin')}</option>
              </select>
            </div>
            <div><label style={lbl}>{t('accouchement.poids')}</label><input type="number" value={f.poidsNouveauNe} onChange={e => set('poidsNouveauNe', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('accouchement.apgar1')}</label><input type="number" min={0} max={10} value={f.apgar1} onChange={e => set('apgar1', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('accouchement.apgar5')}</label><input type="number" min={0} max={10} value={f.apgar5} onChange={e => set('apgar5', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>{t('accouchement.complications')}</label><textarea rows={2} value={f.complications} onChange={e => set('complications', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginTop: 12, textAlign: 'right' }}><button onClick={submit} disabled={saving} style={btnPrimary}>{t('accouchement.save')}</button></div>
        </div>
      )}
      {rows.length === 0 ? <Empty text={t('accouchement.empty')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r, i) => (
            <div key={r.id ?? i} style={{ border: '1px solid #FCE7F3', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#9D174D' }}><Calendar size={13} /> {fmtDateTime(r.dateHeure)}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: '#FCE7F3', color: '#9D174D' }}>{t(`mode.${r.mode}` as any)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, fontSize: 12, color: '#546E7A' }}>
                <Field label={t('accouchement.presentation')} value={r.presentation} />
                <Field label={t('accouchement.delivrance')} value={r.delivrance} />
                <Field label={t('accouchement.etatPerinee')} value={r.etatPerinee} />
                <Field label={t('accouchement.sexe')} value={r.sexeNouveauNe ? t(`sexe.${r.sexeNouveauNe}` as any) : null} />
                <Field label={t('accouchement.poids')} value={r.poidsNouveauNe ? `${r.poidsNouveauNe} g` : null} />
                <Field label="APGAR" value={(r.apgar1 != null || r.apgar5 != null) ? `${r.apgar1 ?? '—'} / ${r.apgar5 ?? '—'}` : null} />
              </div>
              {r.complications && <div style={{ marginTop: 10, fontSize: 12, color: '#DC2626' }}><b>{t('accouchement.complications')}:</b> {r.complications}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Post-natal ───────────────────────────────────────────────────────
function PostnatalTab({ dossierId, rows, onSaved }: { dossierId: string; rows: any[]; onSaved: () => void }) {
  const t = useTranslations('maternite');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ date: '', etatMere: '', involutionUterine: '', allaitement: '', etatNouveauNe: '', vaccinationBCG: false, vaccinationPolio: false, observations: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.date) return;
    setSaving(true);
    try {
      const p: any = { date: f.date, vaccinationBCG: f.vaccinationBCG, vaccinationPolio: f.vaccinationPolio };
      ['etatMere', 'involutionUterine', 'allaitement', 'etatNouveauNe', 'observations'].forEach(k => { if (f[k]) p[k] = f[k]; });
      await apiClient(`/maternite/dossiers/${dossierId}/postnatal`, { method: 'POST', body: p });
      setOpen(false); setF({ date: '', etatMere: '', involutionUterine: '', allaitement: '', etatNouveauNe: '', vaccinationBCG: false, vaccinationPolio: false, observations: '' });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={card}>
      <SectionHeader title={t('postnatal.title')} action={<button onClick={() => setOpen(!open)} style={btnPrimary}><Plus size={13} style={{ verticalAlign: 'middle' }} /> {t('postnatal.add')}</button>} />
      {open && (
        <div style={{ background: '#FDF2F8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <div><label style={lbl}>{t('postnatal.date')} *</label><input type="date" value={f.date} onChange={e => set('date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('postnatal.allaitement')}</label><input value={f.allaitement} onChange={e => set('allaitement', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('postnatal.etatMere')}</label><input value={f.etatMere} onChange={e => set('etatMere', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('postnatal.involution')}</label><input value={f.involutionUterine} onChange={e => set('involutionUterine', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('postnatal.etatNouveauNe')}</label><input value={f.etatNouveauNe} onChange={e => set('etatNouveauNe', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#1A2332' }}><input type="checkbox" checked={f.vaccinationBCG} onChange={e => set('vaccinationBCG', e.target.checked)} /> {t('postnatal.vaccinationBCG')}</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#1A2332' }}><input type="checkbox" checked={f.vaccinationPolio} onChange={e => set('vaccinationPolio', e.target.checked)} /> {t('postnatal.vaccinationPolio')}</label>
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>{t('postnatal.observations')}</label><textarea rows={2} value={f.observations} onChange={e => set('observations', e.target.value)} style={{ ...inp, resize: 'vertical' }} /></div>
          <div style={{ marginTop: 12, textAlign: 'right' }}><button onClick={submit} disabled={saving} style={btnPrimary}>{t('postnatal.save')}</button></div>
        </div>
      )}
      {rows.length === 0 ? <Empty text={t('postnatal.empty')} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((r, i) => (
            <div key={r.id ?? i} style={{ border: '1px solid #FCE7F3', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#9D174D' }}><Calendar size={13} /> {fmtDate(r.date)}</span>
                {r.vaccinationBCG && <Vac label="BCG" />}
                {r.vaccinationPolio && <Vac label="Polio 0" />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, fontSize: 12, color: '#546E7A' }}>
                <Field label={t('postnatal.etatMere')} value={r.etatMere} />
                <Field label={t('postnatal.involution')} value={r.involutionUterine} />
                <Field label={t('postnatal.allaitement')} value={r.allaitement} />
                <Field label={t('postnatal.etatNouveauNe')} value={r.etatNouveauNe} />
              </div>
              {r.observations && <div style={{ marginTop: 10, fontSize: 12, color: '#546E7A' }}>{r.observations}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bits partagés ────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2332' }}>{title}</h3>
      {action}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9D174D', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px 12px', fontSize: 12, color: '#546E7A' }}>{children}</td>;
}
function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#90A4AE' }}>
      <Droplet size={30} style={{ display: 'block', margin: '0 auto 10px', color: '#FBCFE8' }} />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{text}</p>
    </div>
  );
}
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.5px', color: '#B0BEC5', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332', marginTop: 2 }}>{value || '—'}</div>
    </div>
  );
}
function Vac({ label }: { label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: '#DCFCE7', color: '#15803D' }}><CheckCircle size={10} /> {label}</span>;
}
