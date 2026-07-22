'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Baby, Plus, Search, RefreshCw, ChevronRight, AlertTriangle,
  Calendar, HeartPulse, X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'en_cours' | 'terminee';
type Dossier = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string } | null;
  ddr: string; dpa?: string;
  gestite: number; parite: number; avortements: number;
  grossesseARisque: boolean; motifRisque?: string;
  statut: Statut; createdAt: string;
};
type PatientLite = { id: string; nom: string; prenom: string; ipp?: string };

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string; dot: string }> = {
  en_cours: { bg: '#FCE7F3', color: '#9D174D', border: '#FBCFE8', dot: '#EC4899' },
  terminee: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', dot: '#22C55E' },
};

const AVATAR_COLORS: [string, string][] = [
  ['#9D174D', '#FCE7F3'], ['#7C3AED', '#EDE9FE'], ['#0F766E', '#CCFBF1'],
  ['#B45309', '#FEF3C7'], ['#1D4ED8', '#DBEAFE'], ['#BE185D', '#FBCFE8'],
];
function aColor(name: string): [string, string] {
  let h = 0; for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function inits(p?: { nom: string; prenom: string } | null) {
  if (!p) return '?'; return `${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase();
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
/** Terme en semaines d'aménorrhée depuis la DDR. */
function termeSA(ddr?: string): number | null {
  if (!ddr) return null;
  const diff = Date.now() - new Date(ddr).getTime();
  if (isNaN(diff) || diff < 0) return null;
  return Math.floor(diff / (7 * 24 * 3600 * 1000));
}

export default function MaternitePage() {
  const router = useRouter();
  const t = useTranslations('maternite');
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [patients, setPatients] = useState<PatientLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [risqueOnly, setRisqueOnly] = useState(false);
  const [filtre, setFiltre] = useState<Statut | ''>('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [stats, setStats] = useState<{ grossessesEnCours: number; grossessesARisque: number; accouchementsMois: number; totalDossiers: number } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const statutLabel = (s: string) => t(`statut.${s}` as any);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
      const [dosRes, patRes, statRes] = await Promise.all([
        apiClient<any>('/maternite/dossiers'),
        apiClient<any>('/patients?limit=200'),
        apiClient<any>('/maternite/stats'),
      ]);
      setDossiers(unwrap(dosRes));
      setPatients(unwrap(patRes).map((p: any) => ({ id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp })));
      setStats(statRes?.data ?? statRes ?? null);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = dossiers.filter(d => {
    const q = search.toLowerCase();
    const nom = d.patient ? `${d.patient.prenom} ${d.patient.nom}`.toLowerCase() : '';
    const matchQ = !search || nom.includes(q) || (d.numero ?? '').toLowerCase().includes(q) || (d.patient?.ipp ?? '').toLowerCase().includes(q);
    const matchR = !risqueOnly || d.grossesseARisque;
    const matchS = !filtre || d.statut === filtre;
    return matchQ && matchR && matchS;
  });

  const kEnCours = stats?.grossessesEnCours ?? dossiers.filter(d => d.statut === 'en_cours').length;
  const kRisque = stats?.grossessesARisque ?? dossiers.filter(d => d.grossesseARisque && d.statut === 'en_cours').length;
  const kAcc = stats?.accouchementsMois ?? 0;
  const kTotal = stats?.totalDossiers ?? dossiers.length;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .dos-row:hover{background:#FDF2F8!important;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#831843 0%,#9D174D 50%,#DB2777 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(157,23,77,0.4)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -70, right: 200, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Baby size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('list.heroTitle')}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                    {loading ? t('list.loading') : t('list.summary', { total: dossiers.length, enCours: kEnCours })}
                  </span>
                  {lastRefresh && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => setShowModal(true)}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#9D174D', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('list.newDossier')}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('list.kpiEnCours'), val: kEnCours, dot: '#FBCFE8', valColor: '#fff' },
            { label: t('list.kpiARisque'), val: kRisque, dot: '#FCA5A5', valColor: '#FCA5A5' },
            { label: t('list.kpiAccouchementsMois'), val: kAcc, dot: '#BBF7D0', valColor: '#BBF7D0' },
            { label: t('list.kpiTotal'), val: kTotal, dot: 'rgba(255,255,255,0.7)', valColor: '#fff' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: k.dot, display: 'inline-block' }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.valColor, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH + FILTRES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setRisqueOnly(!risqueOnly)}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${risqueOnly ? '#DC2626' : '#E0E8F0'}`, background: risqueOnly ? '#FEE2E2' : '#fff', color: risqueOnly ? '#DC2626' : '#546E7A', fontSize: 11, fontWeight: risqueOnly ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={11} /> {t('list.filterRisque')}
          </button>
          <button onClick={() => setFiltre('')}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filtre === '' ? '#9D174D' : '#E0E8F0'}`, background: filtre === '' ? '#9D174D' : '#fff', color: filtre === '' ? '#fff' : '#546E7A', fontSize: 11, fontWeight: filtre === '' ? 800 : 500, cursor: 'pointer' }}>
            {t('list.filterAll')}
          </button>
          {(Object.keys(STATUT_CFG) as Statut[]).map(s => {
            const cfg = STATUT_CFG[s];
            return (
              <button key={s} onClick={() => setFiltre(filtre === s ? '' : s)}
                style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${filtre === s ? cfg.border : '#E0E8F0'}`, background: filtre === s ? cfg.bg : '#fff', color: filtre === s ? cfg.color : '#546E7A', fontSize: 11, fontWeight: filtre === s ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {statutLabel(s)}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)' }}>
                {[t('list.colDossier'), t('list.colPatiente'), t('list.colTerme'), t('list.colDpa'), t('list.colGpa'), t('list.colStatut'), ''].map((h, hi) => (
                  <th key={hi} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#9D174D', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #FDF2F8' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}><div style={{ height: 13, background: '#FCE7F3', borderRadius: 4, width: j === 1 ? 130 : 60, animation: 'pulse 1.5s ease infinite' }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                  <Baby size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#FBCFE8' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('list.emptyTitle')}</p>
                </td></tr>
              ) : displayed.map(d => {
                const cfg = STATUT_CFG[d.statut] ?? STATUT_CFG.en_cours;
                const nom = d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—';
                const [ac, ab] = aColor(nom);
                const sa = termeSA(d.ddr);
                return (
                  <tr key={d.id} className="dos-row" onClick={() => router.push(`/maternite/${d.id}`)}
                    style={{ borderTop: '1px solid #FDF2F8', cursor: 'pointer', transition: 'background .1s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#BE185D', background: '#FCE7F3', padding: '2px 8px', borderRadius: 6 }}>
                        {d.numero || d.id.slice(0, 8).toUpperCase()}
                      </span>
                      {d.grossesseARisque && (
                        <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626' }}>
                          <AlertTriangle size={9} /> {t('list.riskBadge')}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: ab, border: `1.5px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: ac, flexShrink: 0 }}>{inits(d.patient)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{nom}</div>
                          {d.patient?.ipp && <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{t('list.ippLabel')} {d.patient.ipp}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>
                      {sa != null ? <span style={{ fontWeight: 700 }}>{sa} {t('list.weeksShort')}</span> : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={10} color="#B0BEC5" /> {fmtDate(d.dpa)}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 700 }}>
                      {d.gestite}-{d.parite}-{d.avortements}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                        {statutLabel(d.statut)}
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

      {showModal && (
        <CreateDossierModal
          patients={patients}
          onClose={() => setShowModal(false)}
          onCreated={(id) => { setShowModal(false); router.push(`/maternite/${id}`); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Modale de création d'un dossier de grossesse
// ─────────────────────────────────────────────────────────────────────
function CreateDossierModal({ patients, onClose, onCreated }: {
  patients: PatientLite[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const t = useTranslations('maternite');
  const [form, setForm] = useState({
    patientId: '', ddr: '', gestite: 1, parite: 0, avortements: 0,
    groupeSanguin: '', rhesus: '', antecedents: '',
    grossesseARisque: false, motifRisque: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.patientId || !form.ddr) { setError(t('form.required')); return; }
    setSaving(true); setError('');
    try {
      const payload: any = {
        patientId: form.patientId,
        ddr: form.ddr,
        gestite: Number(form.gestite),
        parite: Number(form.parite),
        avortements: Number(form.avortements),
        grossesseARisque: form.grossesseARisque,
      };
      if (form.groupeSanguin) payload.groupeSanguin = form.groupeSanguin;
      if (form.rhesus) payload.rhesus = form.rhesus;
      if (form.antecedents) payload.antecedents = form.antecedents;
      if (form.motifRisque) payload.motifRisque = form.motifRisque;
      if (form.notes) payload.notes = form.notes;
      const res = await apiClient<any>('/maternite/dossiers', { method: 'POST', body: payload });
      const created = res?.data ?? res;
      onCreated(created.id);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
      setSaving(false);
    }
  };

  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 4, display: 'block' };
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HeartPulse size={18} color="#9D174D" /></div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{t('form.title')}</h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#546E7A" /></button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>{t('form.patiente')} *</label>
            <select value={form.patientId} onChange={e => set('patientId', e.target.value)} style={inp}>
              <option value="">{t('form.selectPatiente')}</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}{p.ipp ? ` — ${p.ipp}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{t('form.ddr')} *</label>
            <input type="date" value={form.ddr} onChange={e => set('ddr', e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <div><label style={lbl}>{t('form.gestite')}</label><input type="number" min={1} value={form.gestite} onChange={e => set('gestite', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('form.parite')}</label><input type="number" min={0} value={form.parite} onChange={e => set('parite', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>{t('form.avortements')}</label><input type="number" min={0} value={form.avortements} onChange={e => set('avortements', e.target.value)} style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>{t('form.groupeSanguin')}</label>
              <select value={form.groupeSanguin} onChange={e => set('groupeSanguin', e.target.value)} style={inp}>
                <option value="">—</option>{['A', 'B', 'AB', 'O'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div><label style={lbl}>{t('form.rhesus')}</label>
              <select value={form.rhesus} onChange={e => set('rhesus', e.target.value)} style={inp}>
                <option value="">—</option>
                <option value="positif">{t('form.rhesusPositif')}</option>
                <option value="negatif">{t('form.rhesusNegatif')}</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>{t('form.antecedents')}</label>
            <textarea value={form.antecedents} onChange={e => set('antecedents', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>
            <input type="checkbox" checked={form.grossesseARisque} onChange={e => set('grossesseARisque', e.target.checked)} />
            {t('form.grossesseARisque')}
          </label>
          {form.grossesseARisque && (
            <div>
              <label style={lbl}>{t('form.motifRisque')}</label>
              <input value={form.motifRisque} onChange={e => set('motifRisque', e.target.value)} style={inp} />
            </div>
          )}
          <div>
            <label style={lbl}>{t('form.notes')}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>

          {error && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid #F1F5F9', position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('form.cancel')}</button>
          <button onClick={submit} disabled={saving} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#9D174D', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? t('form.saving') : t('form.save')}</button>
        </div>
      </div>
    </div>
  );
}
