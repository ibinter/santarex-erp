'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BedDouble, RefreshCw, User, Activity, Thermometer, Heart, Wind, FileText, Pill, Stethoscope, Calendar } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';
import { useTranslations } from 'next-intl';

type Constantes = { tensionArterielle?: string; frequenceCardiaque?: number; temperature?: number; spo2?: number; poids?: number };
type NoteMedicale = { id: string; contenu?: string; constantes?: Constantes; createdAt?: string; medecin?: { nom: string; prenom: string } };
type Prescription = { id: string; medicament?: string; posologie?: string; duree?: string; statut?: string; createdAt?: string };
type SoinInfirmier = { id: string; type?: string; description?: string; effectuePar?: string; createdAt?: string };

type Sejour = {
  id: string; numero?: string; statut?: string;
  patient?: { id: string; ipp?: string; nom: string; prenom: string; dateNaissance?: string; sexe?: string; assuranceTiersPayant?: boolean; assuranceNom?: string };
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  lit?: { id: string; numero?: string; service?: string };
  service?: string; litNumero?: string;
  diagnosticEntree?: string; diagnosticSortie?: string;
  dateAdmission?: string; dateSortie?: string;
  typeHospitalisation?: string;
  notesMedicales?: NoteMedicale[];
  prescriptions?: Prescription[];
  soinsInfirmiers?: SoinInfirmier[];
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  actif:     { label: 'En cours',   color: '#1565C0', bg: '#EFF6FF' },
  sorti:     { label: 'Sorti',      color: '#2E7D32', bg: '#E8F5E9' },
  transfert: { label: 'Transféré',  color: '#E65100', bg: '#FFF3E0' },
  deces:     { label: 'Décédé',     color: '#9E9E9E', bg: '#F5F5F5' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function joursDepuis(dateAdmission?: string) {
  if (!dateAdmission) return '';
  const j = Math.floor((Date.now() - new Date(dateAdmission).getTime()) / 86400000);
  return `${j} jour(s) d'hospitalisation`;
}

const TABS = [
  { id: 'notes',    label: 'Notes médicales', icon: <FileText size={14} /> },
  { id: 'prescrip', label: 'Prescriptions',   icon: <Pill size={14} /> },
  { id: 'soins',    label: 'Soins infirmiers', icon: <Stethoscope size={14} /> },
];

export default function SejourDetailPage() {
  const t = useTranslations('hospitalisation');
  const params = useParams();
  const router = useRouter();
  const joursLabel = (dateAdmission?: string) => {
    if (!dateAdmission) return '';
    const j = Math.floor((Date.now() - new Date(dateAdmission).getTime()) / 86400000);
    return t('joursHospitalisation', { j });
  };
  const [sejour, setSejour] = useState<Sejour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('notes');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient<Sejour>(`/hospitalisation/sejours/${params.id}`);
      setSejour(data);
    } catch (e: any) { setError(e?.message ?? t('erreurChargement')); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const scfg = STATUT_CONFIG[sejour?.statut ?? 'actif'] ?? STATUT_CONFIG.actif;
  const statutKey = STATUT_CONFIG[sejour?.statut ?? 'actif'] ? (sejour?.statut ?? 'actif') : 'actif';
  const statutLabel = t(`statutSejour.${statutKey}`);

  const handleFichePDF = () => {
    if (!sejour) return;
    exportFichePDF(
      `${t('pdfSejour')} ${sejour.numero ?? sejour.id.slice(0, 8).toUpperCase()}`,
      [
        { label: t('pdfSejour'), fields: [
          { key: t('pdfNumeroSejour'), value: sejour.numero ?? sejour.id.slice(0, 8).toUpperCase() },
          { key: t('pdfStatut'), value: statutLabel },
          { key: t('pdfType'), value: sejour.typeHospitalisation ?? '—' },
          { key: t('pdfService'), value: sejour.service ?? sejour.lit?.service ?? '—' },
          { key: t('pdfLit'), value: sejour.litNumero ?? sejour.lit?.numero ?? '—' },
          { key: t('pdfAdmission'), value: fmtDate(sejour.dateAdmission) },
          { key: t('pdfSortie'), value: fmtDate(sejour.dateSortie) },
          { key: t('pdfDuree'), value: joursLabel(sejour.dateAdmission) || '—' },
        ]},
        { label: t('pdfPatient'), fields: [
          { key: t('pdfNom'), value: sejour.patient ? `${sejour.patient.prenom} ${sejour.patient.nom}` : '—' },
          { key: t('pdfIPP'), value: sejour.patient?.ipp ?? '—' },
          { key: t('pdfSexe'), value: sejour.patient?.sexe === 'M' ? t('sexeHomme') : sejour.patient?.sexe === 'F' ? t('sexeFemme') : '—' },
          { key: t('pdfAssurance'), value: sejour.patient?.assuranceTiersPayant ? (sejour.patient.assuranceNom ?? t('tiersPayant')) : '—' },
        ]},
        { label: t('pdfPriseEnCharge'), fields: [
          { key: t('pdfMedecin'), value: sejour.medecin ? `Dr. ${sejour.medecin.prenom} ${sejour.medecin.nom}` : '—' },
          { key: t('pdfSpecialite'), value: sejour.medecin?.specialite ?? '—' },
          { key: t('pdfDiagnosticEntree'), value: sejour.diagnosticEntree ?? '—' },
          { key: t('pdfDiagnosticSortie'), value: sejour.diagnosticSortie ?? '—' },
        ]},
      ],
      `sejour-${sejour.numero ?? sejour.id.slice(0, 8)}`,
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <button onClick={() => router.push('/hospitalisation')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={14} /> {t('retourHospitalisation')}
      </button>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#90A4AE' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} /> {t('loading')}
        </div>
      ) : error ? (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: 24, color: '#C62828' }}>⚠ {error}</div>
      ) : !sejour ? null : (
        <>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <BedDouble size={20} color="#00695C" />
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A2332' }}>{sejour.numero ?? `SEJ-${sejour.id.slice(0,8).toUpperCase()}`}</h1>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: scfg.bg, color: scfg.color }}>{statutLabel}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#37474F', fontWeight: 600 }}>
                  {sejour.patient ? `${sejour.patient.prenom} ${sejour.patient.nom}` : '—'}
                  {sejour.patient?.ipp && <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 400, marginLeft: 6 }}>{sejour.patient.ipp}</span>}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#546E7A' }}>
                  {sejour.service ?? sejour.lit?.service ?? '—'} • Lit {sejour.litNumero ?? sejour.lit?.numero ?? '—'}
                  {sejour.typeHospitalisation && ` • ${sejour.typeHospitalisation}`}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <button onClick={handleFichePDF}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#E0F2F1', border: '1px solid #80CBC4', cursor: 'pointer', fontSize: 12, color: '#00695C', fontWeight: 600 }}>
                  <FileText size={13} /> {t('fichePDF')}
                </button>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('admissionLabel')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{fmtDate(sejour.dateAdmission)}</div>
                  <div style={{ fontSize: 12, color: '#6A1B9A', fontWeight: 600, marginTop: 2 }}>{joursLabel(sejour.dateAdmission)}</div>
                </div>
              </div>
            </div>
            {sejour.diagnosticEntree && (
              <div style={{ marginTop: 14, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, borderLeft: '3px solid #00695C', fontSize: 13, color: '#37474F' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#00695C', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>{t('diagnosticEntreeLabel')}</span>
                {sejour.diagnosticEntree}
              </div>
            )}
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {sejour.medecin && (
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '14px 18px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('medecinResponsable')}</p>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>Dr. {sejour.medecin.prenom} {sejour.medecin.nom}</div>
                {sejour.medecin.specialite && <div style={{ fontSize: 11, color: '#90A4AE' }}>{sejour.medecin.specialite}</div>}
              </div>
            )}
            {sejour.patient?.assuranceTiersPayant && (
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '14px 18px' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('assurance')}</p>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{sejour.patient.assuranceNom ?? t('tiersPayant')}</div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: '#fff', borderRadius: 10, padding: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            {TABS.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: tab === tb.id ? '#00695C' : 'transparent', color: tab === tb.id ? '#fff' : '#546E7A', fontSize: 13, fontWeight: tab === tb.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                {tb.icon} {t(`tabs.${tb.id}`)}
                {tb.id === 'notes' && sejour.notesMedicales && <span style={{ marginLeft: 4, fontSize: 10, background: tab === tb.id ? 'rgba(255,255,255,0.3)' : '#F0F0F0', borderRadius: 10, padding: '1px 6px' }}>{sejour.notesMedicales.length}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tab === 'notes' && (
              (!sejour.notesMedicales || sejour.notesMedicales.length === 0) ? (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '40px', textAlign: 'center', color: '#90A4AE' }}>{t('aucuneNote')}</div>
              ) : sejour.notesMedicales.map(n => (
                <div key={n.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#546E7A' }}>
                      {n.medecin ? `Dr. ${n.medecin.prenom} ${n.medecin.nom}` : t('medecinFallback')}
                    </div>
                    <div style={{ fontSize: 11, color: '#90A4AE', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {fmtDate(n.createdAt)}
                    </div>
                  </div>
                  {n.constantes && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: t('constTA'), value: n.constantes.tensionArterielle, unit: 'mmHg', color: '#C62828' },
                        { label: t('constFC'), value: n.constantes.frequenceCardiaque, unit: 'bpm', color: '#AD1457' },
                        { label: t('constTemp'), value: n.constantes.temperature, unit: '°C', color: '#E65100' },
                        { label: 'SpO₂', value: n.constantes.spo2, unit: '%', color: '#00695C' },
                        { label: t('constPoids'), value: n.constantes.poids, unit: 'kg', color: '#0D47A1' },
                      ].filter(c => c.value != null).map(c => (
                        <div key={c.label} style={{ padding: '4px 10px', borderRadius: 8, background: '#F8FAFC', fontSize: 11 }}>
                          <span style={{ color: '#90A4AE' }}>{c.label}: </span>
                          <span style={{ fontWeight: 700, color: c.color }}>{c.value} {c.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.6 }}>{n.contenu}</p>
                </div>
              ))
            )}

            {tab === 'prescrip' && (
              (!sejour.prescriptions || sejour.prescriptions.length === 0) ? (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '40px', textAlign: 'center', color: '#90A4AE' }}>{t('aucunePrescription')}</div>
              ) : sejour.prescriptions.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Pill size={16} color="#6A1B9A" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{p.medicament ?? t('medicamentFallback')}</div>
                    {p.posologie && <div style={{ fontSize: 12, color: '#546E7A' }}>{p.posologie}{p.duree && ` — ${p.duree}`}</div>}
                  </div>
                  {p.statut && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#E8F5E9', color: '#2E7D32' }}>{p.statut}</span>}
                </div>
              ))
            )}

            {tab === 'soins' && (
              (!sejour.soinsInfirmiers || sejour.soinsInfirmiers.length === 0) ? (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '40px', textAlign: 'center', color: '#90A4AE' }}>{t('aucunSoin')}</div>
              ) : sejour.soinsInfirmiers.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{s.type ?? t('soinFallback')}</div>
                    <div style={{ fontSize: 11, color: '#90A4AE' }}>{fmtDate(s.createdAt)}</div>
                  </div>
                  {s.description && <p style={{ margin: 0, fontSize: 13, color: '#37474F' }}>{s.description}</p>}
                  {s.effectuePar && <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 4 }}>{t('parLabel',{nom:s.effectuePar})}</div>}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
