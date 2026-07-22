'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Plus, Trash2, Save, Receipt, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Patient = { id: string; ipp?: string; nom: string; prenom: string; assuranceTiersPayant?: boolean; assuranceNom?: string };
type LigneForm = { id: string; type: string; libelle: string; quantite: number; prixUnitaire: number };

const TYPES_LIGNES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'medicament', label: 'Médicament' },
  { value: 'analyse', label: 'Analyse' },
  { value: 'acte_chirurgical', label: 'Acte chirurgical' },
  { value: 'hospitalisation', label: 'Hospitalisation' },
  { value: 'materiel', label: 'Matériel médical' },
  { value: 'autre', label: 'Autre' },
];

function newLigne(): LigneForm {
  return { id: Math.random().toString(36).slice(2), type: 'consultation', libelle: '', quantite: 1, prixUnitaire: 0 };
}

function fmtXOF(v?: number | null) { return (Number(v) || 0).toLocaleString('fr-FR') + ' XOF'; }

export default function NouvelleFacturePage() {
  const t = useTranslations('facturation');
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [lignes, setLignes] = useState<LigneForm[]>([newLigne()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const searchPatients = useCallback(async (q: string) => {
    try {
      const data = await apiClient<any>(`/patients?q=${encodeURIComponent(q)}&limit=6`);
      setPatients(Array.isArray(data) ? data : data?.items ?? []);
    } catch { setPatients([]); }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => searchPatients(pSearch), 300);
    return () => clearTimeout(timerRef.current);
  }, [pSearch, searchPatients]);

  useEffect(() => { searchPatients(''); }, []);

  const total = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

  const updLigne = (id: string, key: keyof LigneForm, value: any) =>
    setLignes(ls => ls.map(l => l.id === id ? { ...l, [key]: value } : l));

  const handleSubmit = async () => {
    if (!selectedPatient) { setError(t('errPatient')); return; }
    if (lignes.some(l => !l.libelle.trim())) { setError(t('errLibelles')); return; }
    setLoading(true); setError(null);
    try {
      const created = await apiClient<any>('/facturation', {
        method: 'POST',
        body: {
          patientId: selectedPatient.id,
          lignes: lignes.map(l => ({ type: l.type, libelle: l.libelle.trim(), quantite: l.quantite, prixUnitaire: l.prixUnitaire })),
        },
      });
      router.push(created?.id ? `/facturation/${created.id}` : '/facturation');
    } catch (e: any) {
      setError(e?.message ?? t('errCreation'));
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E0E0E0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/facturation')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t('retour')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Receipt size={18} color="#1565C0" />
          </div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A2332' }}>{t('nouvelleFacture')}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Patient */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 20px' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{t('patient')}</h2>
            {selectedPatient ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', border: '2px solid #1565C0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
                  <div style={{ fontSize: 11, color: '#90A4AE' }}>{selectedPatient.ipp ?? '—'}{selectedPatient.assuranceTiersPayant && ` • ${selectedPatient.assuranceNom ?? t('tiersPayant')}`}</div>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#546E7A', fontSize: 14 }}>×</button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                  <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder={t('rechercherPatient')} style={{ ...inputStyle, paddingLeft: 28 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {patients.map(p => (
                    <div key={p.id} onClick={() => setSelectedPatient(p)}
                      style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #E0E0E0', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1565C0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {p.prenom.charAt(0)}{p.nom.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{p.prenom} {p.nom}</div>
                        <div style={{ fontSize: 11, color: '#90A4AE' }}>{p.ipp ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Lignes */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{t('prestations')}</h2>
              <button onClick={() => setLignes(ls => [...ls, newLigne()])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: '#EFF6FF', border: 'none', cursor: 'pointer', color: '#1565C0', fontSize: 12, fontWeight: 700 }}>
                <Plus size={13} /> {t('ajouter')}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lignes.map((l, i) => (
                <div key={l.id} style={{ padding: '12px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E8EAED' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px 110px 28px', gap: 8, alignItems: 'start' }}>
                    <div>
                      {i === 0 && <label style={labelStyle}>{t('lblType')}</label>}
                      <select value={l.type} onChange={e => updLigne(l.id, 'type', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {TYPES_LIGNES.map(opt => <option key={opt.value} value={opt.value}>{t(`typeLigne.${opt.value}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>{t('lblLibelle')}</label>}
                      <input value={l.libelle} onChange={e => updLigne(l.id, 'libelle', e.target.value)} placeholder={t('phDescription')} style={inputStyle} />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>{t('lblQte')}</label>}
                      <input type="number" min={1} value={l.quantite} onChange={e => updLigne(l.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))} style={{ ...inputStyle, textAlign: 'right' }} />
                    </div>
                    <div>
                      {i === 0 && <label style={labelStyle}>{t('lblPrixUnitaire')}</label>}
                      <input type="number" min={0} value={l.prixUnitaire} onChange={e => updLigne(l.id, 'prixUnitaire', parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'right' }} />
                    </div>
                    <div style={{ paddingTop: i === 0 ? 22 : 0 }}>
                      <button onClick={() => setLignes(ls => ls.filter(x => x.id !== l.id))} disabled={lignes.length === 1}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FFCDD2', background: '#FFEBEE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C62828', opacity: lignes.length === 1 ? 0.4 : 1 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#0D47A1', marginTop: 4 }}>
                    = {fmtXOF(l.quantite * l.prixUnitaire)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 20px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('total')}</p>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0D47A1', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(total)}</div>
            <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 4 }}>{t('nbPrestations', { count: lignes.length })}</div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', color: '#C62828', fontSize: 12 }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !selectedPatient}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: (!selectedPatient || loading) ? '#E0E0E0' : '#1565C0', border: 'none', cursor: (!selectedPatient || loading) ? 'default' : 'pointer', fontSize: 14, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={15} /> {loading ? t('creation') : t('creerFacture')}
          </button>
        </div>
      </div>
    </div>
  );
}
