'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature, ArrowLeft, Search, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient, api } from '@/lib/api';

type Modele = { id: string; type: string; titre: string; texteModele: string; actif: boolean };
type PatientLite = { id: string; nom?: string; prenom?: string; ipp?: string };

const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);

export default function NouveauConsentementPage() {
  const router = useRouter();
  const t = useTranslations('consentements');

  const [modeles, setModeles] = useState<Modele[]>([]);
  const [modeleId, setModeleId] = useState('');
  const [acte, setActe] = useState('');
  const [medecin, setMedecin] = useState('');
  const [mineur, setMineur] = useState(false);
  const [observations, setObservations] = useState('');

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientLite[]>([]);
  const [patient, setPatient] = useState<PatientLite | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient<any>('/consentements/modeles?actif=true')
      .then(r => setModeles(unwrap(r).filter((m: Modele) => m.actif)))
      .catch(() => setModeles([]));
  }, []);

  const searchPatient = useCallback(async (q: string) => {
    setPatientQuery(q);
    if (q.trim().length < 2) { setPatientResults([]); return; }
    try {
      const r = await api.searchPatients(q) as any;
      setPatientResults(unwrap(r));
    } catch { setPatientResults([]); }
  }, []);

  const selected = modeles.find(m => m.id === modeleId) || null;

  const submit = async () => {
    setError('');
    if (!patient) { setError(t('create.errPatient')); return; }
    if (!modeleId) { setError(t('create.errModele')); return; }
    if (!acte.trim()) { setError(t('create.errActe')); return; }
    setSaving(true);
    try {
      const created = await apiClient<any>('/consentements', {
        method: 'POST',
        body: {
          patientId: patient.id,
          modeleId,
          acteConcerne: acte.trim(),
          medecinRef: medecin.trim() || undefined,
          patientMineur: mineur,
          observations: observations.trim() || undefined,
        },
      });
      const id = created?.data?.id ?? created?.id;
      router.push(id ? `/consentements/${id}` : '/consentements');
    } catch (e: any) {
      setError(e?.message || t('toast.error'));
      setSaving(false);
    }
  };

  const label = { fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 6, display: 'block' } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' } as const;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/consentements')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileSignature size={22} color="#4F46E5" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1A2332' }}>{t('create.title')}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90A4AE' }}>{t('create.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        {/* FORM */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          {/* Patient */}
          <label style={label}>{t('create.patient')}</label>
          {patient ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: '#EEF2FF', marginBottom: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#3730A3' }}>
                <User size={15} /> {patient.nom} {patient.prenom} {patient.ipp ? `• ${patient.ipp}` : ''}
              </span>
              <button onClick={() => { setPatient(null); setPatientQuery(''); }} style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
            </div>
          ) : (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: 13, color: '#90A4AE' }} />
              <input value={patientQuery} onChange={e => searchPatient(e.target.value)} placeholder={t('create.patientPlaceholder')}
                style={{ ...inputStyle, paddingLeft: 34 }} />
              {patientResults.length > 0 && (
                <div style={{ position: 'absolute', zIndex: 5, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E0E8F0', borderRadius: 10, marginTop: 4, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto' }}>
                  {patientResults.map(p => (
                    <div key={p.id} onClick={() => { setPatient(p); setPatientResults([]); }}
                      style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', color: '#37474F', borderBottom: '1px solid #F1F5F9' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FF')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                      {p.nom} {p.prenom} {p.ipp ? <span style={{ color: '#90A4AE' }}>• {p.ipp}</span> : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modele */}
          <label style={label}>{t('create.modele')}</label>
          <select value={modeleId} onChange={e => setModeleId(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
            <option value="">{t('create.modelePlaceholder')}</option>
            {modeles.map(m => (
              <option key={m.id} value={m.id}>{t(`type.${m.type}`)} — {m.titre}</option>
            ))}
          </select>

          {/* Acte */}
          <label style={label}>{t('create.acte')}</label>
          <input value={acte} onChange={e => setActe(e.target.value)} placeholder={t('create.actePlaceholder')} style={{ ...inputStyle, marginBottom: 16 }} />

          {/* Medecin */}
          <label style={label}>{t('create.medecin')}</label>
          <input value={medecin} onChange={e => setMedecin(e.target.value)} placeholder={t('create.medecinPlaceholder')} style={{ ...inputStyle, marginBottom: 16 }} />

          {/* Mineur */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#37474F', cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={mineur} onChange={e => setMineur(e.target.checked)} />
            {t('create.patientMineur')}
          </label>

          {/* Observations */}
          <label style={label}>{t('create.observations')}</label>
          <textarea value={observations} onChange={e => setObservations(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }} />

          {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => router.push('/consentements')} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('create.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? t('create.creating') : t('create.submit')}
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>{t('create.preview')}</div>
          {selected ? (
            <>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: '#1A2332' }}>{selected.titre}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#37474F', whiteSpace: 'pre-wrap' }}>{selected.texteModele}</p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#90A4AE' }}>{t('create.modelePlaceholder')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
