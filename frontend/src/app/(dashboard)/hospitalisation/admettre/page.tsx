'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bed, Search, Save, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Patient = { id: string; ipp?: string; nom: string; prenom: string };
type Lit = { id: string; numero: string; chambre?: string; service?: string; type?: string };
type Medecin = { id: string; prenom: string; nom: string };

export default function AdmettreHospitalisationPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [lits, setLits] = useState<Lit[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [mSearch, setMSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedLit, setSelectedLit] = useState('');
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [motifAdmission, setMotifAdmission] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pTimer = useRef<ReturnType<typeof setTimeout>>();
  const mTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchPatients = useCallback(async (q: string) => {
    try { const d = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=6`); setPatients(Array.isArray(d) ? d : d?.items ?? []); }
    catch { setPatients([]); }
  }, []);

  const searchMedecins = useCallback(async (q: string) => {
    try { const d = await apiClient<any>(`/users?role=medecin&q=${encodeURIComponent(q)}&limit=6`); setMedecins(Array.isArray(d) ? d : d?.items ?? []); }
    catch { setMedecins([]); }
  }, []);

  useEffect(() => { clearTimeout(pTimer.current); pTimer.current = setTimeout(() => searchPatients(pSearch), 300); }, [pSearch, searchPatients]);
  useEffect(() => { clearTimeout(mTimer.current); mTimer.current = setTimeout(() => searchMedecins(mSearch), 300); }, [mSearch, searchMedecins]);

  useEffect(() => {
    searchPatients(''); searchMedecins('');
    apiClient<any>('/hospitalisation/lits?statut=disponible&limit=100').then(d => {
      setLits(Array.isArray(d) ? d : d?.items ?? []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) { setError('Sélectionnez un patient.'); return; }
    if (!selectedLit) { setError('Sélectionnez un lit.'); return; }
    setLoading(true); setError(null);
    try {
      const created = await apiClient<any>('/hospitalisation/sejours', {
        method: 'POST',
        body: {
          patientId: selectedPatient.id,
          litId: selectedLit,
          medecinId: selectedMedecin || undefined,
          motifAdmission: motifAdmission || undefined,
          diagnosticAdmission: diagnostic || undefined,
        },
      });
      router.push(created?.id ? `/hospitalisation/${created.id}` : '/hospitalisation');
    } catch (e: any) { setError(e?.message ?? "Erreur lors de l'admission"); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E0E0E0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 };

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 22px', marginBottom: 14 }}>
      <h2 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', borderBottom: '2px solid #E3F2FD', paddingBottom: 9 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/hospitalisation')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bed size={20} color="#1565C0" />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1A2332' }}>Admettre un patient</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Patient */}
        <Card title="Patient *">
          {selectedPatient ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', border: '2px solid #1565C0' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
                <div style={{ fontSize: 11, color: '#90A4AE' }}>{selectedPatient.ipp ?? '—'}</div>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 14, color: '#546E7A' }}>×</button>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder="Rechercher un patient…" style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
              {patients.slice(0, 5).map(p => (
                <div key={p.id} onClick={() => setSelectedPatient(p)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, marginBottom: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1565C0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                    {p.prenom.charAt(0)}{p.nom.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 600 }}>{p.prenom} {p.nom}</span>
                  <span style={{ fontSize: 11, color: '#90A4AE' }}>{p.ipp ?? ''}</span>
                </div>
              ))}
            </>
          )}
        </Card>

        {/* Lit */}
        <Card title="Lit d'hospitalisation *">
          <label style={labelStyle}>Sélectionner un lit disponible</label>
          <select value={selectedLit} onChange={e => setSelectedLit(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">— Choisir un lit —</option>
            {lits.map(l => (
              <option key={l.id} value={l.id}>{l.numero}{l.chambre ? ` · Ch.${l.chambre}` : ''}{l.service ? ` · ${l.service}` : ''}{l.type ? ` (${l.type})` : ''}</option>
            ))}
          </select>
        </Card>

        {/* Médecin */}
        <Card title="Médecin référent">
          {selectedMedecin ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E0E0E0' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{medecins.find(m => m.id === selectedMedecin)?.prenom ?? ''} {medecins.find(m => m.id === selectedMedecin)?.nom ?? ''}</span>
              <button type="button" onClick={() => setSelectedMedecin('')} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A' }}>×</button>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                <input value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder="Rechercher un médecin…" style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
              {medecins.slice(0, 4).map(m => (
                <div key={m.id} onClick={() => setSelectedMedecin(m.id)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, marginBottom: 4, fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  Dr {m.prenom} {m.nom}
                </div>
              ))}
            </>
          )}
        </Card>

        {/* Motif */}
        <Card title="Motif & Diagnostic">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Motif d'admission</label>
              <textarea value={motifAdmission} onChange={e => setMotifAdmission(e.target.value)} rows={2} placeholder="Raison principale de l'hospitalisation…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Diagnostic d'admission</label>
              <textarea value={diagnostic} onChange={e => setDiagnostic(e.target.value)} rows={2} placeholder="Diagnostic initial, code CIM-10…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </Card>

        {error && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, marginBottom: 14, color: '#C62828', fontSize: 13 }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
          <button type="button" onClick={() => router.push('/hospitalisation')}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>Annuler</button>
          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={14} /> {loading ? 'Admission…' : 'Admettre le patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
