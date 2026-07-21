'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Search, Save, AlertTriangle, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

type Patient = { id: string; ipp?: string; nom: string; prenom: string };
type Medecin = { id: string; prenom: string; nom: string };

const MOTIFS = [
  'Consultation de routine', 'Suivi de traitement', 'Résultats d\'examens',
  'Vaccination', 'Urgence non vitale', 'Première consultation', 'Bilan de santé', 'Autre',
];
const TYPES = [
  { v: 'consultation', l: 'Consultation' }, { v: 'suivi', l: 'Suivi' },
  { v: 'urgence', l: 'Urgence' }, { v: 'visite', l: 'Visite à domicile' },
];
const CRENEAUX = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];

function todayStr() { return new Date().toISOString().slice(0,10); }

export default function NouveauRendezVousPage() {
  const t = useTranslations('rendezVous');
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [mSearch, setMSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedMedecin, setSelectedMedecin] = useState<Medecin | null>(null);
  const [date, setDate] = useState(todayStr());
  const [heure, setHeure] = useState('09:00');
  const [motif, setMotif] = useState(MOTIFS[0]);
  const [motifCustom, setMotifCustom] = useState('');
  const [type, setType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pTimer = useRef<ReturnType<typeof setTimeout>>();
  const mTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchP = useCallback(async (q: string) => {
    try { const d = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=6`); setPatients(Array.isArray(d) ? d : d?.items ?? []); } catch { setPatients([]); }
  }, []);
  const searchM = useCallback(async (q: string) => {
    try { const d = await apiClient<any>(`/users?role=medecin&q=${encodeURIComponent(q)}&limit=6`); setMedecins(Array.isArray(d) ? d : d?.items ?? []); } catch { setMedecins([]); }
  }, []);

  useEffect(() => { clearTimeout(pTimer.current); pTimer.current = setTimeout(() => searchP(pSearch), 300); }, [pSearch, searchP]);
  useEffect(() => { clearTimeout(mTimer.current); mTimer.current = setTimeout(() => searchM(mSearch), 300); }, [mSearch, searchM]);
  useEffect(() => { searchP(''); searchM(''); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setError(t('erreurPatientRequis')); return; }
    if (!selectedMedecin) { setError(t('erreurMedecinRequis')); return; }
    if (!date) { setError(t('erreurDateRequise')); return; }
    setLoading(true); setError(null);
    try {
      const dateHeure = `${date}T${heure}:00`;
      await apiClient('/rendez-vous', {
        method: 'POST',
        body: {
          patientId: selectedPatient.id,
          medecinId: selectedMedecin.id,
          dateHeure,
          type,
          motif: motif === 'Autre' ? motifCustom || 'Autre' : motif,
          notes: notes || undefined,
        },
      });
      router.push('/rendez-vous');
    } catch (e: any) { setError(e?.message ?? t('erreurCreation')); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };
  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px', marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', borderBottom: '2px solid #EDE7F6', paddingBottom: 9 }}>{title}</h2>
      {children}
    </div>
  );
  const PersonCard = ({ p, onClear }: { p: { prenom: string; nom: string; ipp?: string } | null; onClear: () => void }) => p ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#F3E5F5', border: '2px solid #6A1B9A' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{p.prenom} {p.nom}</div>
        {(p as any).ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{(p as any).ipp}</div>}
      </div>
      <button type="button" onClick={onClear} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#546E7A' }}>×</button>
    </div>
  ) : null;

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/rendez-vous')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t('retour')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#6A1B9A" />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1A2332' }}>{t('nouveauRendezVous')}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Patient */}
        <Card title={t('cardPatient')}>
          {selectedPatient ? <PersonCard p={selectedPatient} onClear={() => setSelectedPatient(null)} /> : (
            <>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder={t('rechercherPatient')} style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
              {patients.slice(0,5).map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, marginBottom: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6A1B9A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {p.prenom.charAt(0)}{p.nom.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</span>
                  <span style={{ fontSize: 11, color: '#90A4AE' }}>{p.ipp ?? ''}</span>
                </div>
              ))}
            </>
          )}
        </Card>

        {/* Médecin */}
        <Card title={t('cardMedecin')}>
          {selectedMedecin ? <PersonCard p={selectedMedecin} onClear={() => setSelectedMedecin(null)} /> : (
            <>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder={t('rechercherMedecin')} style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
              {medecins.slice(0,4).map(m => (
                <div key={m.id} onClick={() => setSelectedMedecin(m)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, marginBottom: 4, fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  Dr {m.prenom} {m.nom}
                </div>
              ))}
            </>
          )}
        </Card>

        {/* Date & Heure */}
        <Card title={t('cardDateHeure')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{t('labelDate')}</label>
              <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('labelHeure')}</label>
              <select value={heure} onChange={e => setHeure(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CRENEAUX.map(c => <option key={c} value={c}><Clock size={10} /> {c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('labelType')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TYPES.map(opt => (
                <button key={opt.v} type="button" onClick={() => setType(opt.v)}
                  style={{ padding: '7px 14px', borderRadius: 8, border: `2px solid ${type === opt.v ? '#6A1B9A' : '#E0E0E0'}`, background: type === opt.v ? '#F3E5F5' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: type === opt.v ? '#6A1B9A' : '#546E7A' }}>
                  {t(`types.${opt.v}`)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Motif */}
        <Card title={t('cardMotif')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: motif === 'Autre' ? 12 : 0 }}>
            {MOTIFS.map(m => (
              <button key={m} type="button" onClick={() => setMotif(m)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `2px solid ${motif === m ? '#6A1B9A' : '#E0E0E0'}`, background: motif === m ? '#F3E5F5' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: motif === m ? 700 : 400, color: motif === m ? '#6A1B9A' : '#37474F', textAlign: 'left' }}>
                {m}
              </button>
            ))}
          </div>
          {motif === 'Autre' && (
            <input value={motifCustom} onChange={e => setMotifCustom(e.target.value)} placeholder={t('placeholderMotif')} style={{ ...inputStyle, marginTop: 10 }} />
          )}
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>{t('labelNotes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('placeholderNotes')} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </Card>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginBottom: 14, color: '#C62828', fontSize: 13 }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
          <button type="button" onClick={() => router.push('/rendez-vous')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>{t('annuler')}</button>
          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, background: '#6A1B9A', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={14} /> {loading ? t('creationEnCours') : t('creerRdv')}
          </button>
        </div>
      </form>
    </div>
  );
}
