'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import PatientSearch, { PatientLite } from '@/components/PatientSearch';

type TypeInc = 'erreur_medicamenteuse' | 'chute' | 'infection_nosocomiale' | 'erreur_identite' | 'materiel_defectueux' | 'autre';
type Gravite = 'mineure' | 'moderee' | 'grave' | 'critique';
const TYPES: TypeInc[] = ['erreur_medicamenteuse', 'chute', 'infection_nosocomiale', 'erreur_identite', 'materiel_defectueux', 'autre'];
const GRAVITES: Gravite[] = ['mineure', 'moderee', 'grave', 'critique'];

const GRAVITE_COLOR: Record<Gravite, string> = {
  mineure: '#10B981', moderee: '#F59E0B', grave: '#F97316', critique: '#EF4444',
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 6, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' };

export default function NouvelIncidentPage() {
  const router = useRouter();
  const t = useTranslations('incidentsQualite');

  const [type, setType] = useState<TypeInc>('erreur_medicamenteuse');
  const [gravite, setGravite] = useState<Gravite>('moderee');
  const [dateSurvenue, setDateSurvenue] = useState(() => new Date().toISOString().slice(0, 16));
  const [serviceConcerne, setServiceConcerne] = useState('');
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [description, setDescription] = useState('');
  const [causes, setCauses] = useState('');
  const [mesures, setMesures] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!serviceConcerne.trim() || !description.trim() || !dateSurvenue) {
      setError(t('form.required'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiClient<any>('/incidents-qualite', {
        method: 'POST',
        body: {
          type,
          gravite,
          dateSurvenue: new Date(dateSurvenue).toISOString(),
          serviceConcerne: serviceConcerne.trim(),
          patientId: patient?.id || undefined,
          description: description.trim(),
          causesIdentifiees: causes.trim() || undefined,
          mesuresCorrectives: mesures.trim() || undefined,
        },
      });
      const id = created?.data?.id ?? created?.id;
      router.push(id ? `/incidents-qualite/${id}` : '/incidents-qualite');
    } catch (e: any) {
      setError(e?.message || t('form.error'));
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/incidents-qualite')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#B91C1C', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#7F1D1D,#B91C1C)', borderRadius: '16px 16px 0 0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>{t('form.title')}</h1>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>{t('form.subtitle')}</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', padding: '22px 24px', boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('form.type')}</label>
              <select value={type} onChange={e => setType(e.target.value as TypeInc)} style={inputStyle}>
                {TYPES.map(tp => <option key={tp} value={tp}>{t(`type.${tp}`)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.dateSurvenue')}</label>
              <input type="datetime-local" value={dateSurvenue} onChange={e => setDateSurvenue(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.gravite')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GRAVITES.map(g => {
                const on = gravite === g;
                const c = GRAVITE_COLOR[g];
                return (
                  <button key={g} type="button" onClick={() => setGravite(g)}
                    style={{ padding: '8px 16px', borderRadius: 20, border: `2px solid ${on ? c : '#E0E8F0'}`, background: on ? c : '#fff', color: on ? '#fff' : '#546E7A', fontSize: 12, fontWeight: on ? 800 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: on ? '#fff' : c, display: 'inline-block' }} />
                    {t(`gravite.${g}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('form.service')}</label>
              <input value={serviceConcerne} onChange={e => setServiceConcerne(e.target.value)} placeholder={t('form.servicePlaceholder')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.patient')}</label>
              <PatientSearch selected={patient} onSelect={(p) => setPatient(p)} accent="#B91C1C" placeholder={t('form.patientNone')} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('form.descriptionPlaceholder')} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('form.causes')}</label>
              <textarea value={causes} onChange={e => setCauses(e.target.value)} placeholder={t('form.causesPlaceholder')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.mesures')}</label>
              <textarea value={mesures} onChange={e => setMesures(e.target.value)} placeholder={t('form.mesuresPlaceholder')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => router.push('/incidents-qualite')} disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('form.cancel')}
            </button>
            <button onClick={submit} disabled={submitting}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#B91C1C', color: '#fff', fontSize: 13, fontWeight: 800, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={15} /> {submitting ? t('form.submitting') : t('form.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
