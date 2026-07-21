'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, User, Check, ChevronRight, ChevronLeft, Stethoscope, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Patient = { id: string; ipp?: string; nom: string; prenom: string; dateNaissance?: string; groupeSanguin?: string; allergies?: string };
type Medecin = { id: string; nom: string; prenom: string; specialite?: string; role?: string };

type FormData = {
  patientId: string; medecinId: string; motif: string;
  anamnese: string; examenClinique: string; diagnostic: string; codeCIM10: string;
  planSoins: string; conclusion: string;
  ta: string; fc: string; temperature: string; poids: string; taille: string; spo2: string;
};

const STEP_KEYS = ['new.stepPatient', 'new.stepMedecin', 'new.stepMotif', 'new.stepExamen', 'new.stepRecap'];

export default function NouvelleConsultationPage() {
  const router = useRouter();
  const t = useTranslations('consultations');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [mSearch, setMSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);

  const [form, setForm] = useState<FormData>({
    patientId: '', medecinId: '', motif: '', anamnese: '', examenClinique: '',
    diagnostic: '', codeCIM10: '', planSoins: '', conclusion: '',
    ta: '', fc: '', temperature: '', poids: '', taille: '', spo2: '',
  });

  const pTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const searchPatients = useCallback(async (q: string) => {
    try {
      const data = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=8`);
      setPatients(Array.isArray(data) ? data : data?.items ?? []);
    } catch { setPatients([]); }
  }, []);

  const searchMedecins = useCallback(async (q: string) => {
    try {
      const data = await apiClient<any>(`/users?role=medecin&q=${encodeURIComponent(q)}&limit=8`);
      setMedecins(Array.isArray(data) ? data : data?.items ?? []);
    } catch { setMedecins([]); }
  }, []);

  useEffect(() => {
    clearTimeout(pTimerRef.current);
    pTimerRef.current = setTimeout(() => searchPatients(pSearch), 300);
    return () => clearTimeout(pTimerRef.current);
  }, [pSearch, searchPatients]);

  useEffect(() => {
    clearTimeout(mTimerRef.current);
    mTimerRef.current = setTimeout(() => searchMedecins(mSearch), 300);
    return () => clearTimeout(mTimerRef.current);
  }, [mSearch, searchMedecins]);

  useEffect(() => { searchPatients(''); searchMedecins(''); }, []);

  const upd = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true); setError(null);
    try {
      await apiClient('/consultations', {
        method: 'POST',
        body: {
          patientId: selectedPatient!.id,
          medecinId: selectedMedecin!.id,
          motif: form.motif,
          anamnese: form.anamnese || undefined,
          examenClinique: form.examenClinique || undefined,
          diagnostic: form.diagnostic || undefined,
          codeCIM10: form.codeCIM10 || undefined,
          planSoins: form.planSoins || undefined,
          conclusion: form.conclusion || undefined,
          constantesVitales: {
            ta: form.ta || undefined, fc: form.fc ? Number(form.fc) : undefined,
            temperature: form.temperature ? Number(form.temperature) : undefined,
            poids: form.poids ? Number(form.poids) : undefined,
            taille: form.taille ? Number(form.taille) : undefined,
            spo2: form.spo2 ? Number(form.spo2) : undefined,
          },
        },
      });
      router.push('/consultations');
    } catch (e: any) {
      setError(e?.message ?? t('new.errCreate'));
    } finally { setSaving(false); }
  };

  const canNext = () => {
    if (step === 1) return !!selectedPatient;
    if (step === 2) return !!selectedMedecin;
    if (step === 3) return form.motif.trim().length > 0;
    return true;
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <button onClick={() => router.push('/consultations')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={14} /> {t('new.back')}
      </button>

      {/* Progress */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEP_KEYS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_KEYS.length - 1 ? 1 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: done ? '#00695C' : active ? '#1565C0' : '#F0F0F0', color: done || active ? '#fff' : '#90A4AE', transition: 'all 0.2s' }}>
                    {done ? <Check size={14} /> : n}
                  </div>
                  <span style={{ fontSize: 10, color: active ? '#1565C0' : done ? '#00695C' : '#90A4AE', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{t(s)}</span>
                </div>
                {i < STEP_KEYS.length - 1 && <div style={{ flex: 1, height: 2, background: done ? '#00695C' : '#E0E0E0', margin: '0 4px', marginBottom: 18 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '24px', marginBottom: 16 }}>
        {step === 1 && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('new.selectPatient')}</h2>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
              <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder={t('new.searchPatientPlaceholder')}
                style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patients.map(p => (
                <div key={p.id} onClick={() => { setSelectedPatient(p); setForm(f => ({ ...f, patientId: p.id })); }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${selectedPatient?.id === p.id ? '#1565C0' : '#E0E0E0'}`, background: selectedPatient?.id === p.id ? '#EFF6FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0D47A1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {p.prenom.charAt(0)}{p.nom.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332' }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE' }}>{p.ipp ?? '—'}{p.groupeSanguin && ` • ${p.groupeSanguin}`}</div>
                    {p.allergies && <div style={{ fontSize: 11, color: '#C62828' }}>⚠ {p.allergies}</div>}
                  </div>
                  {selectedPatient?.id === p.id && <Check size={16} color="#1565C0" />}
                </div>
              ))}
              {patients.length === 0 && <p style={{ textAlign: 'center', color: '#90A4AE', fontSize: 13, padding: '20px 0' }}>{t('new.noPatientFound')}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('new.selectMedecin')}</h2>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
              <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder={t('new.searchMedecinPlaceholder')}
                style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {medecins.map(m => (
                <div key={m.id} onClick={() => { setSelectedMedecin(m); setForm(f => ({ ...f, medecinId: m.id })); }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${selectedMedecin?.id === m.id ? '#1565C0' : '#E0E0E0'}`, background: selectedMedecin?.id === m.id ? '#EFF6FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#00695C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2332' }}>Dr. {m.prenom} {m.nom}</div>
                    {m.specialite && <div style={{ fontSize: 11, color: '#90A4AE' }}>{m.specialite}</div>}
                  </div>
                  {selectedMedecin?.id === m.id && <Check size={16} color="#1565C0" />}
                </div>
              ))}
              {medecins.length === 0 && <p style={{ textAlign: 'center', color: '#90A4AE', fontSize: 13, padding: '20px 0' }}>{t('new.noMedecinFound')}</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('new.motifTitle')}</h2>
            <div>
              <label style={labelStyle}>{t('new.labelMotif')} <span style={{ color: '#C62828' }}>*</span></label>
              <input value={form.motif} onChange={e => upd('motif', e.target.value)} placeholder={t('new.phMotif')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('new.labelAnamnese')}</label>
              <textarea value={form.anamnese} onChange={e => upd('anamnese', e.target.value)} rows={4} placeholder={t('new.phAnamnese')} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { k: 'ta', label: t('new.vitalTa'), ph: '120/80' },
                { k: 'fc', label: t('new.vitalFc'), ph: '75' },
                { k: 'temperature', label: t('new.vitalTemp'), ph: '37.0' },
                { k: 'poids', label: t('new.vitalPoids'), ph: '70' },
                { k: 'taille', label: t('new.vitalTaille'), ph: '170' },
                { k: 'spo2', label: t('new.vitalSpo2'), ph: '98' },
              ].map(f => (
                <div key={f.k}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={(form as any)[f.k]} onChange={e => upd(f.k as any, e.target.value)} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('new.examenTitle')}</h2>
            <div>
              <label style={labelStyle}>{t('new.labelExamen')}</label>
              <textarea value={form.examenClinique} onChange={e => upd('examenClinique', e.target.value)} rows={3} placeholder={t('new.phExamen')} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('new.labelDiagnostic')}</label>
                <input value={form.diagnostic} onChange={e => upd('diagnostic', e.target.value)} placeholder={t('new.phDiagnostic')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{t('new.labelCim10')}</label>
                <input value={form.codeCIM10} onChange={e => upd('codeCIM10', e.target.value)} placeholder={t('new.phCim10')} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{t('new.labelPlanSoins')}</label>
              <textarea value={form.planSoins} onChange={e => upd('planSoins', e.target.value)} rows={3} placeholder={t('new.phPlanSoins')} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('new.labelConclusion')}</label>
              <textarea value={form.conclusion} onChange={e => upd('conclusion', e.target.value)} rows={2} placeholder={t('new.phConclusion')} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('new.recapTitle')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: t('new.recapPatient'), value: selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom} (${selectedPatient.ipp ?? '—'})` : '—' },
                { label: t('new.recapMedecin'), value: selectedMedecin ? `Dr. ${selectedMedecin.prenom} ${selectedMedecin.nom}` : '—' },
                { label: t('new.recapMotif'), value: form.motif || '—' },
                { label: t('new.recapDiagnostic'), value: form.diagnostic || '—' },
                { label: t('new.recapConstantes'), value: [form.ta && t('new.recapTa', { value: form.ta }), form.fc && t('new.recapFc', { value: form.fc }), form.temperature && t('new.recapTemp', { value: form.temperature })].filter(Boolean).join(' • ') || '—' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #F5F7FA' }}>
                  <span style={{ width: 120, fontSize: 12, color: '#90A4AE', fontWeight: 600, flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: '#37474F' }}>{r.value}</span>
                </div>
              ))}
            </div>
            {error && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center', color: '#C62828', fontSize: 13 }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/consultations')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ChevronLeft size={14} /> {step === 1 ? t('new.cancel') : t('new.previous')}
        </button>
        {step < STEP_KEYS.length ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: canNext() ? '#1565C0' : '#E0E0E0', border: 'none', cursor: canNext() ? 'pointer' : 'default', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            {t('new.next')} <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: '#00695C', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? t('new.saving') : t('new.create')}
          </button>
        )}
      </div>
    </div>
  );
}
