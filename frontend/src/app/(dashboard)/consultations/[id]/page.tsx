'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Activity, Thermometer, Heart, Weight, Ruler, Wind, Pill, FlaskConical, FileText, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';

type Consultation = {
  id: string; numero?: string; statut?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string; dateNaissance?: string; groupeSanguin?: string; allergies?: string };
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  dateHeure?: string; motif?: string; anamnese?: string; examenClinique?: string;
  diagnostic?: string; codeCIM10?: string; conclusion?: string; planSoins?: string;
  constantesVitales?: { ta?: string; fc?: number; temperature?: number; poids?: number; taille?: number; spo2?: number };
  ordonnances?: { id: string; numero?: string; statut?: string; lignes?: string[] }[];
  demandesAnalyses?: string[];
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_cours:  { label: 'En cours',  color: '#1565C0', bg: '#EFF6FF' },
  terminee:  { label: 'Terminée',  color: '#2E7D32', bg: '#E8F5E9' },
  facturee:  { label: 'Facturée',  color: '#6A1B9A', bg: '#F3E5F5' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function calcAge(dateNaissance?: string) {
  if (!dateNaissance) return '';
  return ` • ${Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 24 * 3600000))} ans`;
}

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient<Consultation>(`/consultations/${params.id}`);
      setConsultation(data);
    } catch (e: any) {
      setError(e?.message ?? 'Impossible de charger la consultation');
    } finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const handleFichePDF = () => {
    if (!consultation) return;
    const cv = consultation.constantesVitales ?? {};
    exportFichePDF(
      `Consultation ${consultation.numero ?? consultation.id.slice(0, 8).toUpperCase()}`,
      [
        { label: 'Consultation', fields: [
          { key: 'N° Consultation', value: consultation.numero ?? consultation.id.slice(0, 8).toUpperCase() },
          { key: 'Date', value: consultation.dateHeure ? new Date(consultation.dateHeure).toLocaleString('fr-FR') : '—' },
          { key: 'Statut', value: STATUT_CONFIG[consultation.statut ?? '']?.label ?? consultation.statut ?? '—' },
          { key: 'Médecin', value: consultation.medecin ? `Dr. ${consultation.medecin.prenom} ${consultation.medecin.nom}` : '—' },
          { key: 'Spécialité', value: consultation.medecin?.specialite ?? '—' },
        ]},
        { label: 'Patient', fields: [
          { key: 'Nom', value: consultation.patient ? `${consultation.patient.prenom} ${consultation.patient.nom}` : '—' },
          { key: 'IPP', value: consultation.patient?.ipp ?? '—' },
          { key: 'Groupe sanguin', value: consultation.patient?.groupeSanguin ?? '—' },
          { key: 'Allergies', value: consultation.patient?.allergies ?? '—' },
        ]},
        { label: 'Constantes vitales', fields: [
          { key: 'Tension', value: cv.ta ? `${cv.ta} mmHg` : '—' },
          { key: 'Fréq. cardiaque', value: cv.fc != null ? `${cv.fc} bpm` : '—' },
          { key: 'Température', value: cv.temperature != null ? `${cv.temperature} °C` : '—' },
          { key: 'Poids', value: cv.poids != null ? `${cv.poids} kg` : '—' },
          { key: 'Taille', value: cv.taille != null ? `${cv.taille} cm` : '—' },
          { key: 'SpO2', value: cv.spo2 != null ? `${cv.spo2} %` : '—' },
        ]},
        { label: 'Observations', fields: [
          { key: 'Motif', value: consultation.motif ?? '—' },
          { key: 'Anamnèse', value: consultation.anamnese ?? '—' },
          { key: 'Examen clinique', value: consultation.examenClinique ?? '—' },
          { key: 'Diagnostic', value: consultation.diagnostic ? `${consultation.diagnostic}${consultation.codeCIM10 ? ` (${consultation.codeCIM10})` : ''}` : '—' },
          { key: 'Conclusion', value: consultation.conclusion ?? '—' },
          { key: 'Plan de soins', value: consultation.planSoins ?? '—' },
        ]},
      ],
      `consultation-${consultation.numero ?? consultation.id.slice(0, 8)}`,
    );
  };

  const VITAUX = [
    { key: 'ta',          label: 'Tension artérielle', unit: 'mmHg', icon: <Activity size={16} />,    color: '#C62828', bg: '#FFEBEE' },
    { key: 'fc',          label: 'Fréquence cardiaque', unit: 'bpm', icon: <Heart size={16} />,       color: '#AD1457', bg: '#FCE4EC' },
    { key: 'temperature', label: 'Température',         unit: '°C',  icon: <Thermometer size={16} />, color: '#E65100', bg: '#FFF3E0' },
    { key: 'poids',       label: 'Poids',               unit: 'kg',  icon: <Weight size={16} />,      color: '#0D47A1', bg: '#EFF6FF' },
    { key: 'taille',      label: 'Taille',              unit: 'cm',  icon: <Ruler size={16} />,       color: '#6A1B9A', bg: '#F3E5F5' },
    { key: 'spo2',        label: 'SpO₂',                unit: '%',   icon: <Wind size={16} />,        color: '#00695C', bg: '#E0F2F1' },
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back nav */}
      <button onClick={() => router.push('/consultations')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Retour aux consultations
      </button>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#90A4AE', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} />
          Chargement…
          <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: '24px 28px', color: '#C62828', fontSize: 14 }}>
          ⚠ {error}
          <button onClick={load} style={{ marginLeft: 16, padding: '6px 12px', borderRadius: 6, border: '1px solid #C62828', background: 'transparent', color: '#C62828', cursor: 'pointer', fontSize: 12 }}>Réessayer</button>
        </div>
      ) : !consultation ? null : (
        <>
          {/* Header card */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#1565C0" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1A2332' }}>{consultation.numero ?? `CONS-${consultation.id.slice(0,8).toUpperCase()}`}</h1>
                  <p style={{ margin: 0, fontSize: 12, color: '#546E7A' }}>{fmtDate(consultation.dateHeure)}</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {consultation.statut && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: STATUT_CONFIG[consultation.statut]?.bg ?? '#F5F5F5', color: STATUT_CONFIG[consultation.statut]?.color ?? '#546E7A' }}>
                  {STATUT_CONFIG[consultation.statut]?.label ?? consultation.statut}
                </span>
              )}
              <button onClick={handleFichePDF}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #90CAF9', cursor: 'pointer', fontSize: 12, color: '#1565C0', fontWeight: 600 }}>
                <FileText size={13} /> Fiche PDF
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Colonne gauche — Patient */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Patient */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0D47A1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{consultation.patient ? `${consultation.patient.prenom} ${consultation.patient.nom}` : '—'}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE' }}>{consultation.patient?.ipp}{calcAge(consultation.patient?.dateNaissance)}</div>
                  </div>
                </div>
                {consultation.patient?.groupeSanguin && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #F5F7FA' }}>
                    <span style={{ fontSize: 12, color: '#90A4AE' }}>Groupe sanguin</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#C62828' }}>{consultation.patient.groupeSanguin}</span>
                  </div>
                )}
                {consultation.patient?.allergies && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#FFEBEE', borderRadius: 6, fontSize: 12, color: '#C62828' }}>
                    ⚠ Allergies: {consultation.patient.allergies}
                  </div>
                )}
              </div>

              {/* Médecin */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Médecin</p>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#37474F' }}>
                  {consultation.medecin ? `Dr. ${consultation.medecin.prenom} ${consultation.medecin.nom}` : '—'}
                </div>
                {consultation.medecin?.specialite && <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>{consultation.medecin.specialite}</div>}
              </div>

              {/* Constantes vitales */}
              {consultation.constantesVitales && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Constantes vitales</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {VITAUX.map(v => {
                      const val = (consultation.constantesVitales as any)?.[v.key];
                      if (!val) return null;
                      return (
                        <div key={v.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: v.bg, borderRadius: 8 }}>
                          <span style={{ color: v.color }}>{v.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: v.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{v.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: v.color }}>{val} <span style={{ fontSize: 11, fontWeight: 400 }}>{v.unit}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite — Contenu médical */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Motif de consultation', value: consultation.motif, icon: '💬' },
                { title: 'Anamnèse', value: consultation.anamnese, icon: '📋' },
                { title: 'Examen clinique', value: consultation.examenClinique, icon: '🔬' },
                { title: 'Diagnostic', value: consultation.diagnostic ? `${consultation.diagnostic}${consultation.codeCIM10 ? ` (${consultation.codeCIM10})` : ''}` : null, icon: '🎯' },
                { title: 'Conclusion', value: consultation.conclusion, icon: '📝' },
                { title: 'Plan de soins', value: consultation.planSoins, icon: '📌' },
              ].filter(s => s.value).map(s => (
                <div key={s.title} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{s.icon} {s.title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.value}</p>
                </div>
              ))}

              {/* Ordonnances */}
              {consultation.ordonnances && consultation.ordonnances.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill size={15} /> Ordonnances
                  </p>
                  {consultation.ordonnances.map(ord => (
                    <div key={ord.id} style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #1565C0' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>{ord.numero ?? ord.id}</div>
                      {ord.lignes?.map((l, i) => <div key={i} style={{ fontSize: 12, color: '#37474F', padding: '3px 0', borderTop: i > 0 ? '1px solid #F0F0F0' : 'none' }}>• {l}</div>)}
                    </div>
                  ))}
                </div>
              )}

              {/* Demandes d'analyses */}
              {consultation.demandesAnalyses && consultation.demandesAnalyses.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FlaskConical size={15} /> Demandes d'analyses
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {consultation.demandesAnalyses.map((a, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 20, background: '#EFF6FF', color: '#1565C0', fontSize: 12, fontWeight: 600 }}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
