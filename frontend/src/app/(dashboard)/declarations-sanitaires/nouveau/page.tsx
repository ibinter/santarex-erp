'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileWarning, ArrowLeft, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Gravite = 'benin' | 'modere' | 'severe' | 'critique';
type Sexe = 'm' | 'f' | 'inconnu';
type Evolution = 'en_cours' | 'gueri' | 'deces';
type Patient = { id: string; nom: string; prenom: string; ipp?: string };
type Maladie = { id: string; nom: string; codeCIM10?: string | null; categorie: string; delaiDeclarationHeures: number };

const GRAVITES: Gravite[] = ['benin', 'modere', 'severe', 'critique'];
const EVOLUTIONS: Evolution[] = ['en_cours', 'gueri', 'deces'];
const SEXES: Sexe[] = ['m', 'f', 'inconnu'];

const GRAVITE_COLOR: Record<Gravite, string> = {
  benin: '#10B981', modere: '#F59E0B', severe: '#F97316', critique: '#EF4444',
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 6, display: 'block' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' };

export default function NouvelleDeclarationPage() {
  const router = useRouter();
  const t = useTranslations('declarationsSanitaires');

  const [maladies, setMaladies] = useState<Maladie[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [maladieId, setMaladieId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientNom, setPatientNom] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientSexe, setPatientSexe] = useState<Sexe>('inconnu');
  const [localite, setLocalite] = useState('');
  const [dateDiagnostic, setDateDiagnostic] = useState(() => new Date().toISOString().slice(0, 16));
  const [gravite, setGravite] = useState<Gravite>('modere');
  const [evolution, setEvolution] = useState<Evolution>('en_cours');
  const [mesuresPrises, setMesuresPrises] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient<any>('/declarations-sanitaires/maladies?actif=true');
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setMaladies(list);
        if (list[0]) setMaladieId(list[0].id);
      } catch { /* référentiel optionnel */ }
      try {
        const res = await apiClient<any>('/patients?limit=100');
        const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? res?.items ?? []);
        setPatients(list);
      } catch { /* liste patients optionnelle */ }
    })();
  }, []);

  const selectedMaladie = maladies.find(m => m.id === maladieId);

  const submit = async () => {
    setError('');
    if (!maladieId || !dateDiagnostic) { setError(t('form.required')); return; }
    setSubmitting(true);
    try {
      const created = await apiClient<any>('/declarations-sanitaires', {
        method: 'POST',
        body: {
          maladieId,
          patientId: patientId || undefined,
          patientNom: patientNom.trim() || undefined,
          patientAge: patientAge ? Number(patientAge) : undefined,
          patientSexe,
          localite: localite.trim() || undefined,
          dateDiagnostic: new Date(dateDiagnostic).toISOString(),
          gravite,
          evolution,
          mesuresPrises: mesuresPrises.trim() || undefined,
        },
      });
      const id = created?.data?.id ?? created?.id;
      router.push(id ? `/declarations-sanitaires/${id}` : '/declarations-sanitaires');
    } catch (e: any) {
      setError(e?.message || t('form.error'));
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/declarations-sanitaires')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#0D9488', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#0F766E,#0D9488)', borderRadius: '16px 16px 0 0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileWarning size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>{t('form.title')}</h1>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.8)' }}>{t('form.subtitle')}</p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', padding: '22px 24px', boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}>
          {/* MDO */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.maladie')}</label>
            <select value={maladieId} onChange={e => setMaladieId(e.target.value)} style={inputStyle}>
              <option value="">{t('form.maladieSelect')}</option>
              {maladies.map(m => (
                <option key={m.id} value={m.id}>{m.nom}{m.codeCIM10 ? ` (${m.codeCIM10})` : ''}</option>
              ))}
            </select>
            {selectedMaladie && (
              <div style={{ marginTop: 8, fontSize: 11.5, color: '#0F766E', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: '7px 11px' }}>
                {t('form.delaiInfo', { heures: selectedMaladie.delaiDeclarationHeures, categorie: t(`categorie.${selectedMaladie.categorie}`) })}
              </div>
            )}
          </div>

          {/* Patient rattaché */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('form.patient')}</label>
              <select value={patientId} onChange={e => setPatientId(e.target.value)} style={inputStyle}>
                <option value="">{t('form.patientNone')}</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}{p.ipp ? ` — ${p.ipp}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('form.dateDiagnostic')}</label>
              <input type="datetime-local" value={dateDiagnostic} onChange={e => setDateDiagnostic(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Identité si pas de patient */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('form.patientNom')}</label>
              <input value={patientNom} onChange={e => setPatientNom(e.target.value)} placeholder={t('form.patientNomPlaceholder')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.patientAge')}</label>
              <input type="number" min={0} max={150} value={patientAge} onChange={e => setPatientAge(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('form.patientSexe')}</label>
              <select value={patientSexe} onChange={e => setPatientSexe(e.target.value as Sexe)} style={inputStyle}>
                {SEXES.map(s => <option key={s} value={s}>{t(`sexe.${s}`)}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.localite')}</label>
            <input value={localite} onChange={e => setLocalite(e.target.value)} placeholder={t('form.localitePlaceholder')} style={inputStyle} />
          </div>

          {/* Gravité */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.gravite')}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GRAVITES.map(g => {
                const on = gravite === g; const c = GRAVITE_COLOR[g];
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

          {/* Évolution */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.evolution')}</label>
            <select value={evolution} onChange={e => setEvolution(e.target.value as Evolution)} style={inputStyle}>
              {EVOLUTIONS.map(ev => <option key={ev} value={ev}>{t(`evolution.${ev}`)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('form.mesuresPrises')}</label>
            <textarea value={mesuresPrises} onChange={e => setMesuresPrises(e.target.value)} placeholder={t('form.mesuresPlaceholder')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={() => router.push('/declarations-sanitaires')} disabled={submitting}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('form.cancel')}
            </button>
            <button onClick={submit} disabled={submitting}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#0D9488', color: '#fff', fontSize: 13, fontWeight: 800, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Save size={15} /> {submitting ? t('form.submitting') : t('form.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
