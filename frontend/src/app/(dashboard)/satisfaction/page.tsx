'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SmilePlus, Star, RefreshCw, BarChart3, ClipboardList, PenLine,
  TrendingUp, Users, ThumbsUp, Plus, Trash2, Save, X, MessageSquare,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import PatientSearch, { PatientLite } from '@/components/PatientSearch';

// ── Types ──────────────────────────────────────────────────────────
type QType = 'note_5' | 'note_10' | 'oui_non' | 'texte' | 'choix';
type QuestionDef = { id: string; libelle: string; type: QType; options?: string[] };
type Questionnaire = {
  id: string; titre: string; description?: string | null;
  questions: QuestionDef[]; echelleMax: number; actif: boolean;
};
type Stats = {
  questionnaires: number; questionnairesActifs: number; totalReponses: number;
  reponsesDuMois: number; scoreMoyen: number | null; nps: number | null;
  tauxRecommandation: number | null;
};
type Analyse = {
  totalReponses: number; scoreMoyen: number | null; echelleMax: number;
  nps: number | null; tauxRecommandation: number | null; repondantsNps: number;
  parQuestion: Array<{ questionId: string; libelle: string; type: string; moyenne: number | null; nbReponses: number; repartition?: Record<string, number> }>;
  parService: Array<{ service: string; scoreMoyen: number | null; nbReponses: number; tauxRecommandation: number | null }>;
  evolution: Array<{ mois: string; scoreMoyen: number | null; nbReponses: number }>;
};

const ACCENT = '#7C3AED';
const ACCENT_DK = '#5B21B6';
const QTYPES: QType[] = ['note_5', 'note_10', 'oui_non', 'texte', 'choix'];

function Stars({ value, max, onChange }: { value: number; max: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {Array.from({ length: max }).map((_, i) => {
        const n = i + 1;
        const on = n <= value;
        return (
          <Star key={i} size={22}
            onClick={onChange ? () => onChange(n) : undefined}
            style={{ cursor: onChange ? 'pointer' : 'default', color: on ? '#F59E0B' : '#D1D5DB', fill: on ? '#F59E0B' : 'none' }} />
        );
      })}
    </div>
  );
}

export default function SatisfactionPage() {
  const t = useTranslations('satisfaction');
  const [tab, setTab] = useState<'analyse' | 'questionnaires' | 'collecte'>('analyse');
  const [stats, setStats] = useState<Stats | null>(null);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, q] = await Promise.all([
        apiClient<any>('/satisfaction/stats'),
        apiClient<any>('/satisfaction/analyse'),
        apiClient<any>('/satisfaction/questionnaires'),
      ]);
      setStats((s?.data ?? s) as Stats);
      setAnalyse((a?.data ?? a) as Analyse);
      const ql = Array.isArray(q) ? q : (q?.data ?? []);
      setQuestionnaires(ql as Questionnaire[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* HERO */}
      <div style={{ background: `linear-gradient(135deg,${ACCENT_DK} 0%,${ACCENT} 55%,#A78BFA 100%)`, borderRadius: 18, padding: '24px 28px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(124,58,237,.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SmilePlus size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-.3px' }}>{t('heroTitle')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', fontWeight: 600, marginTop: 3 }}>{t('heroSubtitle')}</div>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('refresh')}
          </button>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpi.scoreMoyen'), val: stats?.scoreMoyen != null ? `${stats.scoreMoyen}/5` : '—', icon: <Star size={13} />, c: '#FDE68A' },
            { label: t('kpi.nps'), val: stats?.nps != null ? stats.nps : '—', icon: <TrendingUp size={13} />, c: '#BBF7D0' },
            { label: t('kpi.tauxRecommandation'), val: stats?.tauxRecommandation != null ? `${stats.tauxRecommandation}%` : '—', icon: <ThumbsUp size={13} />, c: '#C4B5FD' },
            { label: t('kpi.totalReponses'), val: stats?.totalReponses ?? 0, icon: <Users size={13} />, c: '#fff' },
            { label: t('kpi.questionnairesActifs'), val: stats?.questionnairesActifs ?? 0, icon: <ClipboardList size={13} />, c: '#fff' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'rgba(255,255,255,.75)' }}>
                {k.icon}<span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.c, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([
          { k: 'analyse', icon: <BarChart3 size={15} /> },
          { k: 'questionnaires', icon: <ClipboardList size={15} /> },
          { k: 'collecte', icon: <PenLine size={15} /> },
        ] as const).map(({ k, icon }) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${on ? ACCENT : '#E0E8F0'}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#546E7A', fontSize: 13, fontWeight: on ? 800 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              {icon} {t(`tabs.${k}`)}
            </button>
          );
        })}
      </div>

      {tab === 'analyse' && <AnalyseView analyse={analyse} loading={loading} />}
      {tab === 'questionnaires' && <QuestionnairesView questionnaires={questionnaires} reload={load} />}
      {tab === 'collecte' && <CollecteView questionnaires={questionnaires.filter(q => q.actif)} reload={load} />}
    </div>
  );
}

// ── ANALYSE ────────────────────────────────────────────────────────
function AnalyseView({ analyse, loading }: { analyse: Analyse | null; loading: boolean }) {
  const t = useTranslations('satisfaction');
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('loading')}</div>;
  if (!analyse || analyse.totalReponses === 0)
    return <div style={{ background: '#fff', borderRadius: 14, padding: 60, textAlign: 'center', color: '#90A4AE', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
      <BarChart3 size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#DDD6FE' }} />
      {t('analyse.noData')}
    </div>;

  const maxEvo = Math.max(...analyse.evolution.map(e => e.nbReponses), 1);
  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,.06)' };
  const title: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeUp .25s ease' }}>
      {/* Par question */}
      <div style={card}>
        <div style={title}>{t('analyse.byQuestion')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analyse.parQuestion.map(q => {
            const isNote = q.type === 'note_5' || q.type === 'note_10';
            const scaleMax = q.type === 'note_10' ? 10 : 5;
            const pct = q.moyenne != null ? Math.round((q.moyenne / scaleMax) * 100) : 0;
            return (
              <div key={q.questionId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#37474F' }}>{q.libelle}</span>
                  {isNote
                    ? <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT }}>{q.moyenne != null ? `${q.moyenne}/${scaleMax}` : '—'}</span>
                    : <span style={{ fontSize: 11, color: '#90A4AE' }}>{t('analyse.responses', { count: q.nbReponses })}</span>}
                </div>
                {isNote ? (
                  <div style={{ height: 8, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: ACCENT, borderRadius: 6 }} />
                  </div>
                ) : q.repartition ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                    {Object.entries(q.repartition).map(([k, v]) => (
                      <span key={k} style={{ fontSize: 11, fontWeight: 700, background: '#F3F0FF', color: ACCENT_DK, padding: '3px 9px', borderRadius: 14 }}>{k}: {v}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
        {/* Par service */}
        <div style={card}>
          <div style={title}>{t('analyse.byService')}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', color: '#90A4AE', fontSize: 10, textTransform: 'uppercase' }}>
              <th style={{ padding: '4px 6px' }}>{t('analyse.colService')}</th>
              <th style={{ padding: '4px 6px' }}>{t('analyse.colScore')}</th>
              <th style={{ padding: '4px 6px' }}>{t('analyse.colReponses')}</th>
              <th style={{ padding: '4px 6px' }}>{t('analyse.colReco')}</th>
            </tr></thead>
            <tbody>
              {analyse.parService.map(s => (
                <tr key={s.service} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '7px 6px', fontSize: 12, fontWeight: 600, color: '#37474F' }}>{s.service}</td>
                  <td style={{ padding: '7px 6px', fontSize: 12, fontWeight: 800, color: ACCENT }}>{s.scoreMoyen != null ? s.scoreMoyen : '—'}</td>
                  <td style={{ padding: '7px 6px', fontSize: 12, color: '#546E7A' }}>{s.nbReponses}</td>
                  <td style={{ padding: '7px 6px', fontSize: 12, color: '#546E7A' }}>{s.tauxRecommandation != null ? `${s.tauxRecommandation}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Évolution */}
        <div style={card}>
          <div style={title}>{t('analyse.evolution')}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130 }}>
            {analyse.evolution.map(e => (
              <div key={e.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT }}>{e.scoreMoyen ?? ''}</span>
                <div title={`${e.nbReponses}`} style={{ width: '100%', maxWidth: 34, height: `${Math.max((e.nbReponses / maxEvo) * 90, 6)}px`, background: `linear-gradient(180deg,${ACCENT},#A78BFA)`, borderRadius: '6px 6px 0 0' }} />
                <span style={{ fontSize: 9, color: '#90A4AE' }}>{e.mois.slice(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QUESTIONNAIRES ─────────────────────────────────────────────────
function QuestionnairesView({ questionnaires, reload }: { questionnaires: Questionnaire[]; reload: () => void }) {
  const t = useTranslations('satisfaction');
  const [editing, setEditing] = useState<Questionnaire | 'new' | null>(null);

  const remove = async (id: string) => {
    if (!confirm(t('questionnaires.confirmDelete'))) return;
    await apiClient(`/satisfaction/questionnaires/${id}`, { method: 'DELETE' });
    reload();
  };

  if (editing) return <QuestionnaireForm initial={editing === 'new' ? null : editing} onDone={() => { setEditing(null); reload(); }} onCancel={() => setEditing(null)} />;

  return (
    <div style={{ animation: 'fadeUp .25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => setEditing('new')}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Plus size={15} /> {t('questionnaires.new')}
        </button>
      </div>
      {questionnaires.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: 50, textAlign: 'center', color: '#90A4AE', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>{t('questionnaires.empty')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {questionnaires.map(q => (
            <div key={q.id} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#263238' }}>{q.titre}</div>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: q.actif ? '#ECFDF5' : '#F1F5F9', color: q.actif ? '#047857' : '#90A4AE' }}>
                  {q.actif ? t('questionnaires.active') : t('questionnaires.inactive')}
                </span>
              </div>
              {q.description && <div style={{ fontSize: 12, color: '#78909C', marginTop: 6 }}>{q.description}</div>}
              <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 10 }}>{t('questionnaires.questionsCount', { count: q.questions?.length ?? 0 })} · /{q.echelleMax}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => setEditing(q)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{t('questionnaires.edit')}</button>
                <button onClick={() => remove(q.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #FECACA', background: '#fff', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionnaireForm({ initial, onDone, onCancel }: { initial: Questionnaire | null; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations('satisfaction');
  const [titre, setTitre] = useState(initial?.titre ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [echelleMax, setEchelleMax] = useState(initial?.echelleMax ?? 5);
  const [actif, setActif] = useState(initial?.actif ?? true);
  const [questions, setQuestions] = useState<QuestionDef[]>(initial?.questions ?? []);
  const [saving, setSaving] = useState(false);

  const addQ = () => setQuestions(qs => [...qs, { id: `q${Date.now()}`, libelle: '', type: 'note_5' }]);
  const updQ = (i: number, patch: Partial<QuestionDef>) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const rmQ = (i: number) => setQuestions(qs => qs.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      const body = { titre, description, echelleMax, actif, questions };
      if (initial) await apiClient(`/satisfaction/questionnaires/${initial.id}`, { method: 'PATCH', body });
      else await apiClient('/satisfaction/questionnaires', { method: 'POST', body });
      onDone();
    } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 4, display: 'block' };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.06)', animation: 'fadeUp .25s ease', maxWidth: 720 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div><label style={lbl}>{t('questionnaires.form.titre')}</label><input style={inp} value={titre} onChange={e => setTitre(e.target.value)} /></div>
        <div><label style={lbl}>{t('questionnaires.form.description')}</label><textarea style={{ ...inp, minHeight: 60 }} value={description ?? ''} onChange={e => setDescription(e.target.value)} /></div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div><label style={lbl}>{t('questionnaires.form.echelleMax')}</label>
            <select style={{ ...inp, width: 100 }} value={echelleMax} onChange={e => setEchelleMax(+e.target.value)}>
              <option value={5}>/5</option><option value={10}>/10</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#37474F', marginTop: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> {t('questionnaires.form.actif')}
          </label>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>{t('questionnaires.form.questions')}</label>
            <button onClick={addQ} style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${ACCENT}`, background: '#F3F0FF', color: ACCENT, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={13} /> {t('questionnaires.form.addQuestion')}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map((q, i) => (
              <div key={q.id} style={{ border: '1px solid #EEF2F6', borderRadius: 10, padding: 10, display: 'grid', gap: 8, gridTemplateColumns: '1fr 150px auto', alignItems: 'center' }}>
                <input style={inp} placeholder={t('questionnaires.form.libelle')} value={q.libelle} onChange={e => updQ(i, { libelle: e.target.value })} />
                <select style={inp} value={q.type} onChange={e => updQ(i, { type: e.target.value as QType })}>
                  {QTYPES.map(ty => <option key={ty} value={ty}>{t(`questionType.${ty}`)}</option>)}
                </select>
                <button onClick={() => rmQ(i)} style={{ padding: 8, borderRadius: 8, border: '1.5px solid #FECACA', background: '#fff', color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                {q.type === 'choix' && (
                  <input style={{ ...inp, gridColumn: '1 / -1' }} placeholder={t('questionnaires.form.options')}
                    value={(q.options ?? []).join(', ')} onChange={e => updQ(i, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><X size={14} /> {t('questionnaires.form.cancel')}</button>
          <button onClick={save} disabled={saving || !titre.trim()} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: !titre.trim() ? .5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}><Save size={14} /> {t('questionnaires.form.save')}</button>
        </div>
      </div>
    </div>
  );
}

// ── COLLECTE ───────────────────────────────────────────────────────
function CollecteView({ questionnaires, reload }: { questionnaires: Questionnaire[]; reload: () => void }) {
  const t = useTranslations('satisfaction');
  const [qId, setQId] = useState('');
  const [values, setValues] = useState<Record<string, number | string | boolean>>({});
  const [service, setService] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [recommande, setRecommande] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const questionnaire = questionnaires.find(q => q.id === qId) ?? null;
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 4, display: 'block' };

  const setVal = (id: string, v: number | string | boolean) => setValues(s => ({ ...s, [id]: v }));

  const submit = async () => {
    if (!questionnaire) { setMsg({ ok: false, text: t('collecte.chooseFirst') }); return; }
    setSaving(true); setMsg(null);
    try {
      const reponses = questionnaire.questions.map(q => ({ questionId: q.id, valeur: values[q.id] ?? null }));
      await apiClient('/satisfaction/reponses', {
        method: 'POST',
        body: {
          questionnaireId: questionnaire.id,
          serviceConcerne: service || undefined,
          patientId: patientId || undefined,
          reponses, commentaireLibre: commentaire || undefined,
          recommande: recommande ?? undefined,
        },
      });
      setMsg({ ok: true, text: t('collecte.success') });
      setValues({}); setService(''); setPatientId(''); setPatient(null); setCommentaire(''); setRecommande(null); setQId('');
      reload();
    } catch {
      setMsg({ ok: false, text: t('collecte.error') });
    } finally { setSaving(false); }
  };

  if (questionnaires.length === 0)
    return <div style={{ background: '#fff', borderRadius: 14, padding: 50, textAlign: 'center', color: '#90A4AE', boxShadow: '0 1px 6px rgba(0,0,0,.06)' }}>{t('collecte.noActive')}</div>;

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,.06)', animation: 'fadeUp .25s ease', maxWidth: 640 }}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div><label style={lbl}>{t('collecte.selectQuestionnaire')}</label>
          <select style={inp} value={qId} onChange={e => { setQId(e.target.value); setValues({}); }}>
            <option value="">—</option>
            {questionnaires.map(q => <option key={q.id} value={q.id}>{q.titre}</option>)}
          </select>
        </div>

        {questionnaire && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>{t('collecte.service')}</label><input style={inp} value={service} onChange={e => setService(e.target.value)} /></div>
              <div><label style={lbl}>{t('collecte.patientId')}</label>
                <PatientSearch
                  selected={patient}
                  onSelect={(p) => { setPatient(p); setPatientId(p?.id ?? ''); }}
                  accent={ACCENT}
                  placeholder={t('collecte.anonyme')}
                />
              </div>
            </div>

            {questionnaire.questions.map(q => (
              <div key={q.id}>
                <label style={lbl}>{q.libelle}</label>
                {(q.type === 'note_5' || q.type === 'note_10') && (
                  <Stars value={Number(values[q.id] ?? 0)} max={q.type === 'note_10' ? 10 : 5} onChange={v => setVal(q.id, v)} />
                )}
                {q.type === 'oui_non' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: true, l: t('collecte.oui') }, { v: false, l: t('collecte.non') }].map(o => {
                      const on = values[q.id] === o.v;
                      return <button key={o.l} onClick={() => setVal(q.id, o.v)} style={{ padding: '7px 18px', borderRadius: 20, border: `1.5px solid ${on ? ACCENT : '#E0E8F0'}`, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{o.l}</button>;
                    })}
                  </div>
                )}
                {q.type === 'texte' && <textarea style={{ ...inp, minHeight: 50 }} value={String(values[q.id] ?? '')} onChange={e => setVal(q.id, e.target.value)} />}
                {q.type === 'choix' && (
                  <select style={inp} value={String(values[q.id] ?? '')} onChange={e => setVal(q.id, e.target.value)}>
                    <option value="">—</option>
                    {(q.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </div>
            ))}

            <div>
              <label style={lbl}>{t('collecte.recommande')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: true, l: t('collecte.oui') }, { v: false, l: t('collecte.non') }].map(o => {
                  const on = recommande === o.v;
                  return <button key={o.l} onClick={() => setRecommande(o.v)} style={{ padding: '7px 18px', borderRadius: 20, border: `1.5px solid ${on ? '#10B981' : '#E0E8F0'}`, background: on ? '#10B981' : '#fff', color: on ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><ThumbsUp size={13} /> {o.l}</button>;
                })}
              </div>
            </div>

            <div><label style={lbl}><MessageSquare size={12} style={{ display: 'inline', verticalAlign: -1 }} /> {t('collecte.commentaire')}</label>
              <textarea style={{ ...inp, minHeight: 60 }} value={commentaire} onChange={e => setCommentaire(e.target.value)} /></div>

            {msg && <div style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: msg.ok ? '#ECFDF5' : '#FEF2F2', color: msg.ok ? '#047857' : '#B91C1C' }}>{msg.text}</div>}

            <button onClick={submit} disabled={saving} style={{ padding: '11px', borderRadius: 10, border: 'none', background: ACCENT, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>{t('collecte.submit')}</button>
          </>
        )}
      </div>
    </div>
  );
}
