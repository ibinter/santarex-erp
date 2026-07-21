'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FlaskConical, RefreshCw, CheckCircle, Clock, Zap, AlertTriangle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';

type Parametre = { id: string; nom: string; unite?: string; valeurNormaleMin?: number; valeurNormaleMax?: number };
type TypeAnalyse = { id: string; code?: string; nom: string; categorie?: string; parametres?: Parametre[] };
type Resultat = { parametreId: string; valeur?: string; interpretation?: string };

type Demande = {
  id: string; numero?: string; statut?: string; urgence?: boolean;
  dateCreation?: string; datePrelevement?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string; dateNaissance?: string; sexe?: string };
  medecin?: { id: string; nom: string; prenom: string; specialite?: string };
  typesAnalyse?: TypeAnalyse[];
  resultats?: Resultat[];
  commentaire?: string;
};

const STATUT_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  en_attente:  { color: '#E65100', bg: '#FFF3E0', icon: <Clock size={12} /> },
  en_analyse:  { color: '#1565C0', bg: '#EFF6FF', icon: <RefreshCw size={12} /> },
  disponible:  { color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={12} /> },
  valide:      { color: '#00695C', bg: '#E0F2F1', icon: <CheckCircle size={12} /> },
};

const INTERP_CONFIG: Record<string, { color: string; bg: string }> = {
  normal:  { color: '#2E7D32', bg: '#E8F5E9' },
  eleve:   { color: '#C62828', bg: '#FFEBEE' },
  bas:     { color: '#1565C0', bg: '#EFF6FF' },
  critique:{ color: '#7B1FA2', bg: '#F3E5F5' },
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DemandeLaboPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('laboratoire');
  const [demande, setDemande] = useState<Demande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient<Demande>(`/laboratoire/demandes/${params.id}`);
      setDemande(data);
      if (data.typesAnalyse?.length) setExpanded([data.typesAnalyse[0].id]);
    } catch (e: any) { setError(e?.message ?? t('detail.errLoad')); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getResultat = (parametreId: string) =>
    demande?.resultats?.find(r => r.parametreId === parametreId);

  const scfg = STATUT_CONFIG[demande?.statut ?? 'en_attente'] ?? STATUT_CONFIG.en_attente;
  const scfgLabel = t(('statut.' + (demande?.statut ?? 'en_attente')) as any);

  const handleFichePDF = () => {
    if (!demande) return;
    const resultatsFields = (demande.typesAnalyse ?? []).flatMap(ta =>
      (ta.parametres ?? []).map(p => {
        const res = demande.resultats?.find(r => r.parametreId === p.id);
        const normes = p.valeurNormaleMin != null && p.valeurNormaleMax != null
          ? ' ' + t('fiche.norme', { min: p.valeurNormaleMin, max: p.valeurNormaleMax, unite: p.unite ? ' ' + p.unite : '' })
          : '';
        const val = res?.valeur ? `${res.valeur}${p.unite ? ' ' + p.unite : ''}${res.interpretation ? ` — ${res.interpretation}` : ''}${normes}` : '—';
        return { key: p.nom, value: val };
      }),
    );
    exportFichePDF(
      t('fiche.titlePrefix', { ref: demande.numero ?? demande.id.slice(0, 8).toUpperCase() }),
      [
        { label: t('fiche.sectionDemande'), fields: [
          { key: t('fiche.fNumero'), value: demande.numero ?? demande.id.slice(0, 8).toUpperCase() },
          { key: t('fiche.fStatut'), value: scfgLabel },
          { key: t('fiche.fUrgence'), value: demande.urgence ? t('fiche.yes') : t('fiche.no') },
          { key: t('fiche.fDateDemande'), value: fmtDate(demande.dateCreation) },
          { key: t('fiche.fPrelevement'), value: fmtDate(demande.datePrelevement) },
        ]},
        { label: t('fiche.sectionPatient'), fields: [
          { key: t('fiche.fNom'), value: demande.patient ? `${demande.patient.prenom} ${demande.patient.nom}` : '—' },
          { key: t('fiche.fIpp'), value: demande.patient?.ipp ?? '—' },
          { key: t('fiche.fSexe'), value: demande.patient?.sexe === 'M' ? t('fiche.homme') : demande.patient?.sexe === 'F' ? t('fiche.femme') : '—' },
        ]},
        { label: t('fiche.sectionPrescripteur'), fields: [
          { key: t('fiche.fMedecin'), value: demande.medecin ? `Dr. ${demande.medecin.prenom} ${demande.medecin.nom}` : '—' },
          { key: t('fiche.fSpecialite'), value: demande.medecin?.specialite ?? '—' },
        ]},
        { label: t('fiche.sectionAnalyses'), fields: (demande.typesAnalyse ?? []).length > 0
          ? (demande.typesAnalyse ?? []).map(ta => ({ key: ta.nom, value: [ta.code, ta.categorie].filter(Boolean).join(' • ') || '—' }))
          : [{ key: t('fiche.fAnalyses'), value: '—' }] },
        ...(resultatsFields.length > 0 ? [{ label: t('fiche.sectionResultats'), fields: resultatsFields }] : []),
        ...(demande.commentaire ? [{ label: t('fiche.sectionCommentaire'), fields: [{ key: t('fiche.fNote'), value: demande.commentaire }] }] : []),
      ],
      `demande-labo-${demande.numero ?? demande.id.slice(0, 8)}`,
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <button onClick={() => router.push('/laboratoire')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={14} /> {t('detail.back')}
      </button>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#90A4AE' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} /> {t('detail.loading')}
        </div>
      ) : error ? (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: 24, color: '#C62828' }}>⚠ {error}</div>
      ) : !demande ? null : (
        <>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <FlaskConical size={20} color="#6A1B9A" />
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1A2332' }}>{demande.numero ?? `LAB-${demande.id.slice(0,8).toUpperCase()}`}</h1>
                  {demande.urgence && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#C62828', padding: '2px 10px', borderRadius: 10, background: '#FFEBEE' }}>
                      <Zap size={11} /> {t('detail.urgentBadge')}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: '#90A4AE' }}>
                  {t('detail.requestedOn', { date: fmtDate(demande.dateCreation) })}
                  {demande.datePrelevement && t('detail.sampledOn', { date: fmtDate(demande.datePrelevement) })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: scfg.bg, color: scfg.color }}>
                  {scfg.icon} {scfgLabel}
                </span>
                <button onClick={handleFichePDF}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #90CAF9', cursor: 'pointer', fontSize: 12, color: '#1565C0', fontWeight: 600 }}>
                  <FileText size={13} /> {t('detail.fichePdf')}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Patient & Médecin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {demande.patient && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('detail.patient')}</p>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{demande.patient.prenom} {demande.patient.nom}</div>
                  {demande.patient.ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{demande.patient.ipp}</div>}
                  {demande.patient.sexe && (
                    <div style={{ fontSize: 12, color: '#546E7A', marginTop: 4 }}>{demande.patient.sexe === 'M' ? t('detail.homme') : t('detail.femme')}</div>
                  )}
                </div>
              )}
              {demande.medecin && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('detail.prescripteur')}</p>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>Dr. {demande.medecin.prenom} {demande.medecin.nom}</div>
                  {demande.medecin.specialite && <div style={{ fontSize: 12, color: '#90A4AE' }}>{demande.medecin.specialite}</div>}
                </div>
              )}
            </div>

            {/* Analyses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(!demande.typesAnalyse || demande.typesAnalyse.length === 0) ? (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 32, textAlign: 'center', color: '#90A4AE' }}>
                  {t('detail.noAnalyseDetail')}
                </div>
              ) : demande.typesAnalyse.map(ta => {
                const isOpen = expanded.includes(ta.id);
                return (
                  <div key={ta.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <button onClick={() => toggleExpand(ta.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3E5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FlaskConical size={15} color="#6A1B9A" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332' }}>{ta.nom}</div>
                        {ta.code && <div style={{ fontSize: 11, color: '#90A4AE' }}>{ta.code}{ta.categorie && ` • ${ta.categorie}`}</div>}
                      </div>
                      {isOpen ? <ChevronUp size={16} color="#90A4AE" /> : <ChevronDown size={16} color="#90A4AE" />}
                    </button>

                    {isOpen && ta.parametres && ta.parametres.length > 0 && (
                      <div style={{ borderTop: '1px solid #F5F7FA' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#F8FAFC' }}>
                            <tr>
                              {[t('detail.colParametre'), t('detail.colResultat'), t('detail.colNormes'), t('detail.colInterpretation')].map((h,hi) => (
                                <th key={hi} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ta.parametres.map(p => {
                              const res = getResultat(p.id);
                              const icfg = INTERP_CONFIG[res?.interpretation ?? 'normal'] ?? INTERP_CONFIG.normal;
                              return (
                                <tr key={p.id} style={{ borderTop: '1px solid #F5F7FA' }}>
                                  <td style={{ padding: '10px 14px', fontSize: 13, color: '#37474F', fontWeight: 500 }}>{p.nom}</td>
                                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: res?.valeur ? 800 : 400, color: res?.valeur ? (INTERP_CONFIG[res.interpretation ?? 'normal']?.color ?? '#37474F') : '#CFD8DC', fontVariantNumeric: 'tabular-nums' }}>
                                    {res?.valeur ?? '—'}
                                    {p.unite && res?.valeur && <span style={{ fontSize: 11, fontWeight: 400, color: '#90A4AE', marginLeft: 4 }}>{p.unite}</span>}
                                  </td>
                                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#90A4AE', fontVariantNumeric: 'tabular-nums' }}>
                                    {p.valeurNormaleMin != null && p.valeurNormaleMax != null
                                      ? `${p.valeurNormaleMin} – ${p.valeurNormaleMax} ${p.unite ?? ''}`
                                      : '—'}
                                  </td>
                                  <td style={{ padding: '10px 14px' }}>
                                    {res?.interpretation && (
                                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: icfg.bg, color: icfg.color, textTransform: 'capitalize' }}>
                                        {res.interpretation}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {demande.commentaire && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('detail.commentaireBiologiste')}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.6 }}>{demande.commentaire}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
