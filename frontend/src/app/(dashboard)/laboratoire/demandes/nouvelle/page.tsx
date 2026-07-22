'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, FlaskConical, ChevronDown, ChevronUp, Zap, AlertTriangle, Check, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Patient = { id: string; ipp?: string; nom: string; prenom: string };
type Analyse = { id: string; code?: string; nom: string; prix?: number };
type CategorieAnalyse = { categorie: string; label: string; analyses: Analyse[] };

// Catalogue local — utilisé si /laboratoire/types-analyses n'existe pas encore
const CATALOGUE_LOCAL: CategorieAnalyse[] = [
  { categorie: 'hematologie', label: 'Hématologie', analyses: [
    { id: 'NFS', code: 'NFS', nom: 'NFS (Numération Formule Sanguine)', prix: 3500 },
    { id: 'GRP', code: 'GRP', nom: 'Groupage sanguin + Rhésus', prix: 4000 },
    { id: 'INR', code: 'INR', nom: 'INR / TP', prix: 3000 },
    { id: 'VS', code: 'VS', nom: 'Vitesse de sédimentation', prix: 1500 },
  ]},
  { categorie: 'biochimie', label: 'Biochimie', analyses: [
    { id: 'GLYC', code: 'GLYC', nom: 'Glycémie à jeun', prix: 2000 },
    { id: 'CREAT', code: 'CREAT', nom: 'Créatinine', prix: 2000 },
    { id: 'TGOTGP', code: 'TGOTGP', nom: 'Transaminases (TGO/TGP)', prix: 3500 },
    { id: 'BILI', code: 'BILI', nom: 'Bilan lipidique', prix: 5000 },
    { id: 'CRP', code: 'CRP', nom: 'CRP (Protéine C-réactive)', prix: 2500 },
    { id: 'HBA1C', code: 'HBA1C', nom: 'HbA1c', prix: 6000 },
    { id: 'IONOG', code: 'IONOG', nom: 'Ionogramme sanguin', prix: 4500 },
  ]},
  { categorie: 'serologie', label: 'Sérologie', analyses: [
    { id: 'HIV', code: 'HIV', nom: 'Sérologie HIV 1&2', prix: 8000 },
    { id: 'HEP', code: 'HEP', nom: 'Hépatite B & C', prix: 7500 },
    { id: 'SYPHI', code: 'SYPHI', nom: 'TPHA / VDRL (Syphilis)', prix: 5000 },
  ]},
  { categorie: 'bacteriologie', label: 'Bactériologie', analyses: [
    { id: 'ECBU', code: 'ECBU', nom: 'ECBU + Antibiogramme', prix: 6000 },
    { id: 'HEMO', code: 'HEMO', nom: 'Hémoculture', prix: 8000 },
    { id: 'PARASIT', code: 'PARASIT', nom: 'Examen parasitologique des selles', prix: 4000 },
    { id: 'GE', code: 'GE', nom: 'Goutte épaisse / TDR Paludisme', prix: 3500 },
  ]},
];

function fmtXOF(v?: number | null) { return (Number(v) || 0).toLocaleString('fr-FR') + ' XOF'; }

export default function NouvelleDemandeLaboratoirePage() {
  const router = useRouter();
  const t = useTranslations('laboratoire');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pSearch, setPSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [catalogue, setCatalogue] = useState<CategorieAnalyse[]>(CATALOGUE_LOCAL);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['hematologie', 'biochimie']));
  const [urgence, setUrgence] = useState(false);
  const [motif, setMotif] = useState('');
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

  useEffect(() => {
    searchPatients('');
    // Essai de charger le catalogue depuis l'API
    apiClient<any>('/laboratoire/types-analyse').then(data => {
      if (Array.isArray(data) && data.length > 0) setCatalogue(data);
    }).catch(() => { /* utilise le catalogue local */ });
  }, []);

  const toggleAnalyse = (id: string) => {
    setSelectedIds(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCat = (cat: string) => {
    setExpanded(s => {
      const next = new Set(s);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const selectedAnalyses = catalogue.flatMap(c => c.analyses).filter(a => selectedIds.has(a.id));
  const total = selectedAnalyses.reduce((s, a) => s + (a.prix ?? 0), 0);

  const handleSubmit = async () => {
    if (!selectedPatient) { setError(t('form.errNoPatient')); return; }
    if (selectedIds.size === 0) { setError(t('form.errNoAnalyse')); return; }
    setLoading(true); setError(null);
    try {
      const created = await apiClient<any>('/laboratoire/demandes', {
        method: 'POST',
        body: {
          patientId: selectedPatient.id,
          urgence,
          motif: motif || undefined,
          typesAnalyseIds: Array.from(selectedIds),
        },
      });
      router.push(created?.id ? `/laboratoire/demandes/${created.id}` : '/laboratoire');
    } catch (e: any) {
      setError(e?.message ?? t('form.errCreate'));
    } finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E0E0E0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#37474F', boxSizing: 'border-box', background: '#FAFAFA' };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push('/laboratoire')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
          <ArrowLeft size={14} /> {t('form.back')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={18} color="#6A1B9A" />
          </div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A2332' }}>{t('form.title')}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Patient */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 20px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('form.patient')}</h2>
            {selectedPatient ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: '#EFF6FF', border: '2px solid #1565C0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
                  <div style={{ fontSize: 11, color: '#90A4AE' }}>{selectedPatient.ipp ?? '—'}</div>
                </div>
                <button onClick={() => setSelectedPatient(null)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#546E7A', fontSize: 14 }}>×</button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
                  <input value={pSearch} onChange={e => setPSearch(e.target.value)} placeholder={t('form.searchPatient')} style={{ ...inputStyle, paddingLeft: 28 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {patients.slice(0, 5).map(p => (
                    <div key={p.id} onClick={() => setSelectedPatient(p)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F7FA')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1565C0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {p.prenom.charAt(0)}{p.nom.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1A2332' }}>{p.prenom} {p.nom}</span>
                      <span style={{ fontSize: 11, color: '#90A4AE' }}>{p.ipp ?? ''}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Options */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 20px', display: 'flex', gap: 20, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <button type="button" onClick={() => setUrgence(!urgence)}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: urgence ? '#C62828' : '#CFD8DC', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: urgence ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: urgence ? '#C62828' : '#37474F' }}>
                  <Zap size={13} /> {t('form.urgente')}
                </div>
                <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('form.urgenteHint')}</div>
              </div>
            </label>
            <div style={{ flex: 1 }}>
              <input value={motif} onChange={e => setMotif(e.target.value)} placeholder={t('form.motifPlaceholder')} style={inputStyle} />
            </div>
          </div>

          {/* Catalogue */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F5F7FA', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('form.selectAnalyses')}</div>
            {catalogue.map(cat => (
              <div key={cat.categorie}>
                <button onClick={() => toggleCat(cat.categorie)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', border: 'none', background: '#F8FAFC', cursor: 'pointer', borderTop: '1px solid #F5F7FA', fontSize: 12, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <span>{cat.label}</span>
                  {expanded.has(cat.categorie) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expanded.has(cat.categorie) && (
                  <div style={{ padding: '6px 0' }}>
                    {cat.analyses.map(a => {
                      const sel = selectedIds.has(a.id);
                      return (
                        <div key={a.id} onClick={() => toggleAnalyse(a.id)}
                          style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: sel ? '#F0F7FF' : 'transparent', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#F8FAFC'; }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? '#1565C0' : '#CFD8DC'}`, background: sel ? '#1565C0' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {sel && <Check size={11} color="#fff" />}
                          </div>
                          {a.code && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: '#F3E5F5', color: '#6A1B9A', flexShrink: 0 }}>{a.code}</span>}
                          <span style={{ flex: 1, fontSize: 13, color: '#37474F', fontWeight: sel ? 600 : 400 }}>{a.nom}</span>
                          {a.prix != null && <span style={{ fontSize: 11, color: '#90A4AE', flexShrink: 0 }}>{fmtXOF(a.prix)}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Résumé */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 76 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px 20px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('form.recap')}</p>
            {selectedAnalyses.length === 0 ? (
              <p style={{ color: '#CFD8DC', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>{t('form.noAnalyseSelected')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {selectedAnalyses.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#37474F' }}>
                    <span>{a.nom}</span>
                    <span style={{ color: '#6A1B9A', fontWeight: 600 }}>{a.prix != null ? fmtXOF(a.prix) : '—'}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: '1px solid #F5F7FA', paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: '#90A4AE' }}>{t('form.totalLine', { count: selectedIds.size })}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#6A1B9A', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(total)}</div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start', color: '#C62828', fontSize: 12 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !selectedPatient || selectedIds.size === 0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 10, background: (!selectedPatient || selectedIds.size === 0 || loading) ? '#E0E0E0' : '#6A1B9A', border: 'none', cursor: (!selectedPatient || selectedIds.size === 0 || loading) ? 'default' : 'pointer', fontSize: 14, color: '#fff', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            <Save size={15} /> {loading ? t('form.creating') : t('form.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
