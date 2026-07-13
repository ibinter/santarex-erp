'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, AlertTriangle, Stethoscope, FlaskConical, FileText,
  Pill, Heart, Scissors, Users, Baby, RefreshCw, ChevronRight, Calendar,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type Patient = {
  id: string; ipp?: string; nom: string; prenom: string;
  dateNaissance?: string; sexe?: 'M' | 'F'; groupeSanguin?: string;
  allergies?: string; statut?: string; telephone?: string;
};

type Antecedent = {
  id: string; type: string; description: string;
  gravite?: string; traitement?: string; date?: string; createdAt?: string;
};

type ConsultationSummary = {
  id: string; dateHeure?: string; motif?: string; diagnostic?: string; statut?: string;
  medecin?: { nom: string; prenom: string };
};

type AnalyseSummary = { id: string; dateCreation?: string; typeAnalyse?: string; statut?: string };
type OrdonnanceSummary = { id: string; dateCreation?: string; statut?: string; lignes?: string[] };

const GRAVITE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  leger:  { label: 'Léger',  color: '#2E7D32', bg: '#E8F5E9' },
  modere: { label: 'Modéré', color: '#E65100', bg: '#FFF3E0' },
  grave:  { label: 'Grave',  color: '#C62828', bg: '#FFEBEE' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  medical:      { label: 'Médical',       color: '#C62828', bg: '#FFEBEE', icon: <Heart size={14} /> },
  chirurgical:  { label: 'Chirurgical',   color: '#0D47A1', bg: '#EFF6FF', icon: <Scissors size={14} /> },
  familial:     { label: 'Familial',      color: '#6A1B9A', bg: '#F3E5F5', icon: <Users size={14} /> },
  allergie:     { label: 'Allergie',      color: '#E65100', bg: '#FFF3E0', icon: <AlertTriangle size={14} /> },
  gynecologique:{ label: 'Gynécologique', color: '#AD1457', bg: '#FCE4EC', icon: <Baby size={14} /> },
  autre:        { label: 'Autre',         color: '#546E7A', bg: '#ECEFF1', icon: <FileText size={14} /> },
};

const STATUT_CONS: Record<string, { label: string; color: string; bg: string }> = {
  en_cours:  { label: 'En cours', color: '#1565C0', bg: '#EFF6FF' },
  terminee:  { label: 'Terminée', color: '#2E7D32', bg: '#E8F5E9' },
  facturee:  { label: 'Facturée', color: '#6A1B9A', bg: '#F3E5F5' },
};

function calcAge(dateNaissance?: string) {
  if (!dateNaissance) return '';
  return Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600000));
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

const TABS = [
  { id: 'resume',        label: 'Résumé',        icon: <User size={14} /> },
  { id: 'antecedents',   label: 'Antécédents',   icon: <Heart size={14} /> },
  { id: 'consultations', label: 'Consultations',  icon: <Stethoscope size={14} /> },
  { id: 'ordonnances',   label: 'Ordonnances',    icon: <Pill size={14} /> },
  { id: 'analyses',      label: 'Analyses',       icon: <FlaskConical size={14} /> },
];

export default function DMEPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [antecedents, setAntecedents] = useState<Antecedent[]>([]);
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [analyses, setAnalyses] = useState<AnalyseSummary[]>([]);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>('resume');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [patRes, antRes, consRes, anaRes, ordRes] = await Promise.allSettled([
        apiClient<Patient>(`/patients/${patientId}`),
        apiClient<any>(`/patients/${patientId}/antecedents`),
        apiClient<any>(`/consultations?patientId=${patientId}&limit=20`),
        apiClient<any>(`/laboratoire/demandes?patientId=${patientId}&limit=20`),
        apiClient<any>(`/ordonnances?patientId=${patientId}&limit=20`),
      ]);
      if (patRes.status === 'fulfilled') setPatient(patRes.value);
      else { setError('Patient introuvable'); setLoading(false); return; }
      if (antRes.status === 'fulfilled') {
        const d = antRes.value;
        setAntecedents(Array.isArray(d) ? d : d?.items ?? []);
      }
      if (consRes.status === 'fulfilled') {
        const d = consRes.value;
        setConsultations(Array.isArray(d) ? d : d?.items ?? []);
      }
      if (anaRes.status === 'fulfilled') {
        const d = anaRes.value;
        setAnalyses(Array.isArray(d) ? d : d?.items ?? []);
      }
      if (ordRes.status === 'fulfilled') {
        const d = ordRes.value;
        setOrdonnances(Array.isArray(d) ? d : d?.items ?? []);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
      Chargement du dossier médical…
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 16 }}>
      <button onClick={() => router.push('/patients')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 16 }}>
        <ArrowLeft size={14} /> Retour
      </button>
      <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: 24, color: '#C62828' }}>⚠ {error}</div>
    </div>
  );

  if (!patient) return null;

  const age = calcAge(patient.dateNaissance);

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => router.push('/patients')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 16, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Retour aux patients
      </button>

      {/* Patient header */}
      <div style={{ background: 'linear-gradient(135deg, #0D47A1, #00838F)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
          {patient.prenom.charAt(0)}{patient.nom.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{patient.prenom} {patient.nom}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>
            {patient.ipp} • {patient.sexe === 'M' ? 'Homme' : patient.sexe === 'F' ? 'Femme' : '—'} • {age} ans
            {patient.dateNaissance && ` • Né(e) le ${fmtDate(patient.dateNaissance)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {patient.groupeSanguin && (
            <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Groupe sanguin</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{patient.groupeSanguin}</div>
            </div>
          )}
          {patient.allergies && (
            <div style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(198,40,40,0.4)' }}>
              <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠ Allergies</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{patient.allergies}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: tab === t.id ? '#0D47A1' : 'transparent', color: tab === t.id ? '#fff' : '#546E7A', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 20 }}>
        {tab === 'resume' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Consultations', count: consultations.length, icon: <Stethoscope size={16} />, color: '#1565C0', bg: '#EFF6FF' },
              { label: 'Antécédents', count: antecedents.length, icon: <Heart size={16} />, color: '#C62828', bg: '#FFEBEE' },
              { label: 'Analyses', count: analyses.length, icon: <FlaskConical size={16} />, color: '#6A1B9A', bg: '#F3E5F5' },
              { label: 'Ordonnances', count: ordonnances.length, icon: <Pill size={16} />, color: '#2E7D32', bg: '#E8F5E9' },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px 18px', borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: s.color, opacity: 0.8 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'antecedents' && (
          antecedents.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#90A4AE', padding: '40px 0' }}>Aucun antécédent enregistré</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {antecedents.map(a => {
                const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.autre;
                const gcfg = GRAVITE_CONFIG[a.gravite ?? 'leger'] ?? GRAVITE_CONFIG.leger;
                return (
                  <div key={a.id} style={{ padding: '12px 16px', borderRadius: 10, background: '#F8FAFC', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: gcfg.bg, color: gcfg.color }}>{gcfg.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{a.description}</div>
                      {a.traitement && <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>Traitement: {a.traitement}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: '#90A4AE', flexShrink: 0 }}>{fmtDate(a.date ?? a.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'consultations' && (
          consultations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#90A4AE', padding: '40px 0' }}>Aucune consultation enregistrée</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {consultations.map(c => {
                const scfg = STATUT_CONS[c.statut ?? 'en_cours'] ?? STATUT_CONS.en_cours;
                return (
                  <div key={c.id} onClick={() => router.push(`/consultations/${c.id}`)}
                    style={{ padding: '12px 16px', borderRadius: 10, background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0F4F8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}>
                    <Calendar size={16} color="#90A4AE" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{c.motif ?? 'Consultation'}</div>
                      <div style={{ fontSize: 11, color: '#90A4AE' }}>
                        {fmtDate(c.dateHeure)}
                        {c.medecin && ` • Dr. ${c.medecin.prenom} ${c.medecin.nom}`}
                      </div>
                      {c.diagnostic && <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>Diagnostic: {c.diagnostic}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: scfg.bg, color: scfg.color }}>{scfg.label}</span>
                    <ChevronRight size={14} color="#90A4AE" />
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'ordonnances' && (
          ordonnances.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#90A4AE', padding: '40px 0' }}>Aucune ordonnance enregistrée</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ordonnances.map(o => (
                <div key={o.id} style={{ padding: '12px 16px', borderRadius: 10, background: '#F8FAFC', borderLeft: '3px solid #1565C0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1565C0' }}>ORD-{o.id.slice(0,8).toUpperCase()}</span>
                    <span style={{ fontSize: 11, color: '#90A4AE' }}>{fmtDate(o.dateCreation)}</span>
                  </div>
                  {o.lignes?.map((l, i) => <div key={i} style={{ fontSize: 12, color: '#37474F', padding: '2px 0' }}>• {l}</div>)}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'analyses' && (
          analyses.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#90A4AE', padding: '40px 0' }}>Aucune analyse enregistrée</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analyses.map(a => (
                <div key={a.id} style={{ padding: '10px 16px', borderRadius: 10, background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{a.typeAnalyse ?? 'Analyse'}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE' }}>{fmtDate(a.dateCreation)}</div>
                  </div>
                  {a.statut && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: a.statut === 'disponible' ? '#E8F5E9' : '#EFF6FF', color: a.statut === 'disponible' ? '#2E7D32' : '#1565C0' }}>{a.statut}</span>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
