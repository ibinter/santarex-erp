'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, CreditCard, RefreshCw, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportFichePDF } from '@/lib/export';

type LigneFacture = { id: string; libelle?: string; type?: string; quantite?: number; prixUnitaire?: number; remise?: number; total?: number };
type Paiement = { id: string; reference?: string; dateCreation?: string; modePaiement?: string; montant?: number; statut?: string; notes?: string };

type Facture = {
  id: string; numero?: string; reference?: string; statut?: string;
  patient?: { id: string; ipp?: string; nom: string; prenom: string; dateNaissance?: string };
  consultation?: { id: string; numero?: string; motif?: string };
  lignes?: LigneFacture[];
  sousTotal?: number; tva?: number; total?: number; montantTotal?: number;
  montantPaye?: number; resteAPayer?: number;
  partAssurance?: number; partPatient?: number;
  dateEmission?: string; dateCreation?: string;
  paiements?: Paiement[];
  assuranceNom?: string; assuranceNumero?: string; tiersPayant?: boolean;
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  brouillon:           { label: 'Brouillon',           color: '#546E7A', bg: '#ECEFF1', icon: <Clock size={12} /> },
  emise:               { label: 'Émise',               color: '#1565C0', bg: '#EFF6FF', icon: <Clock size={12} /> },
  partiellement_payee: { label: 'Part. payée',         color: '#E65100', bg: '#FFF3E0', icon: <Clock size={12} /> },
  payee:               { label: 'Payée',               color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={12} /> },
  annulee:             { label: 'Annulée',             color: '#9E9E9E', bg: '#F5F5F5', icon: <XCircle size={12} /> },
};

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  especes:      { label: 'Espèces',      color: '#2E7D32' },
  mobile_money: { label: 'Mobile Money', color: '#E65100' },
  carte:        { label: 'Carte',        color: '#0D47A1' },
  assurance:    { label: 'Assurance',    color: '#6A1B9A' },
  virement:     { label: 'Virement',     color: '#37474F' },
};

function fmtXOF(v?: number) { return v != null ? v.toLocaleString('fr-FR') + ' XOF' : '—'; }
function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FactureDetailPage() {
  const t = useTranslations('facturation');
  const params = useParams();
  const router = useRouter();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [payMode, setPayMode] = useState('especes');
  const [payMontant, setPayMontant] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiClient<Facture>(`/facturation/${params.id}`);
      setFacture(data);
    } catch (e: any) {
      setError(e?.message ?? t('errChargement'));
    } finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const handlePay = async () => {
    if (!payMontant || isNaN(Number(payMontant))) return;
    setPaying(true);
    try {
      await apiClient(`/paiements`, {
        method: 'POST',
        body: { factureId: params.id, montant: Number(payMontant), modePaiement: payMode },
      });
      setPayModal(false); setPayMontant('');
      await load();
    } catch (e: any) {
      alert(e?.message ?? t('errPaiement'));
    } finally { setPaying(false); }
  };

  const total = facture?.montantTotal ?? facture?.total ?? 0;
  const paye = facture?.montantPaye ?? 0;
  const reste = facture?.resteAPayer ?? (total - paye);
  const pct = total > 0 ? Math.round((paye / total) * 100) : 0;
  const scfg = STATUT_CONFIG[facture?.statut ?? 'emise'] ?? STATUT_CONFIG.emise;
  const statutKey = facture?.statut && STATUT_CONFIG[facture.statut] ? facture.statut : 'emise';

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <button onClick={() => router.push('/facturation')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', marginBottom: 20, fontWeight: 600 }}>
        <ArrowLeft size={14} /> {t('retourFacturation')}
      </button>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', color: '#90A4AE' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 12px' }} /> {t('chargement')}
        </div>
      ) : error ? (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 12, padding: 24, color: '#C62828' }}>⚠ {error}</div>
      ) : !facture ? null : (
        <>
          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: '#1A2332' }}>{facture.numero ?? `FAC-${facture.id.slice(0,8).toUpperCase()}`}</h1>
                <p style={{ margin: 0, fontSize: 12, color: '#90A4AE' }}>{t('emiseLe', { date: fmtDate(facture.dateEmission ?? facture.dateCreation) })}</p>
                {facture.patient && (
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: '#37474F', fontWeight: 600 }}>
                    {facture.patient.prenom} {facture.patient.nom} {facture.patient.ipp && <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 400 }}>({facture.patient.ipp})</span>}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: scfg.bg, color: scfg.color }}>
                  {scfg.icon} {t(`statut.${statutKey}`)}
                </span>
                <button onClick={() => exportFichePDF(
                  t('fpTitre', { ref: facture.numero ?? facture.reference ?? facture.id.slice(0,8) }),
                  [
                    { label: t('fpInformations'), fields: [
                      { key: t('fpNumero'), value: facture.numero ?? facture.reference ?? '—' },
                      { key: t('fpDateEmission'), value: facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : '—' },
                      { key: t('fpStatut'), value: facture.statut ?? '—' },
                      { key: t('fpPatient'), value: facture.patient ? `${facture.patient.prenom} ${facture.patient.nom}` : '—' },
                      { key: t('fpIpp'), value: facture.patient?.ipp ?? '—' },
                    ]},
                    { label: t('fpMontants'), fields: [
                      { key: t('fpSousTotal'), value: `${(facture.sousTotal ?? 0).toLocaleString('fr-FR')} XOF` },
                      { key: t('fpTotal'), value: `${(facture.total ?? facture.montantTotal ?? 0).toLocaleString('fr-FR')} XOF` },
                      { key: t('fpMontantPaye'), value: `${(facture.montantPaye ?? 0).toLocaleString('fr-FR')} XOF` },
                      { key: t('fpResteDu'), value: `${(facture.resteAPayer ?? 0).toLocaleString('fr-FR')} XOF` },
                    ]},
                  ],
                  `facture-${facture.numero ?? facture.id.slice(0,8)}`,
                )} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #90CAF9', cursor: 'pointer', fontSize: 12, color: '#1565C0', fontWeight: 600 }}>
                  <Download size={13} /> PDF
                </button>
                <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#F5F7FA', cursor: 'pointer', fontSize: 12, color: '#546E7A', fontWeight: 600 }}>
                  <Printer size={13} /> {t('imprimer')}
                </button>
                {reste > 0 && facture.statut !== 'annulee' && (
                  <button onClick={() => setPayModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 600 }}>
                    <CreditCard size={13} /> {t('enregistrerPaiement')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
            {/* Lignes de facturation */}
            <div>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #F5F7FA', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('detailPrestations')}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                    <thead style={{ background: '#F8FAFC' }}>
                      <tr>
                        {[t('thPrestation'), t('thQte'), t('thPrixUnitaire'), t('thTotal')].map(h => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(facture.lignes ?? []).map((l, i) => (
                        <tr key={l.id} style={{ borderTop: '1px solid #F5F7FA' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, color: '#37474F', fontWeight: 600 }}>{l.libelle ?? '—'}</div>
                            {l.type && <div style={{ fontSize: 11, color: '#90A4AE', textTransform: 'capitalize' }}>{l.type}</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#546E7A' }}>{l.quantite ?? 1}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: '#546E7A', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(l.prixUnitaire)}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(l.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historique paiements */}
              {facture.paiements && facture.paiements.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #F5F7FA', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('paiementsRecus')}</div>
                  <div style={{ padding: '8px 0' }}>
                    {facture.paiements.map(p => {
                      const mc = MODE_CONFIG[p.modePaiement ?? 'especes'] ?? MODE_CONFIG.especes;
                      const mKey = p.modePaiement && MODE_CONFIG[p.modePaiement] ? p.modePaiement : 'especes';
                      return (
                        <div key={p.id} style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F5F7FA' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#37474F' }}>{p.reference ?? p.id.slice(0,12).toUpperCase()}</div>
                            <div style={{ fontSize: 11, color: '#90A4AE' }}>{fmtDate(p.dateCreation)}{p.notes && ` • ${p.notes}`}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#F5F7FA', color: mc.color }}>{t(`mode.${mKey}`)}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#2E7D32', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(p.montant)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Panneau total */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px' }}>
                <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('recapitulatif')}</p>
                {[
                  { label: t('sousTotal'), value: facture.sousTotal },
                  { label: t('tva'), value: facture.tva ?? 0 },
                  { label: t('total'), value: total, bold: true },
                  ...(facture.tiersPayant ? [
                    { label: t('partAssurance'), value: facture.partAssurance },
                    { label: t('partPatient'), value: facture.partPatient },
                  ] : []),
                ].filter(r => r.value != null).map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: r.bold ? '1px solid #E0E0E0' : 'none', marginTop: r.bold ? 6 : 0 }}>
                    <span style={{ fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400, color: r.bold ? '#1A2332' : '#546E7A' }}>{r.label}</span>
                    <span style={{ fontSize: r.bold ? 14 : 13, fontWeight: r.bold ? 800 : 500, color: '#37474F', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(r.value)}</span>
                  </div>
                ))}

                {/* Barre de paiement */}
                <div style={{ marginTop: 16, padding: '12px 14px', background: reste > 0 ? '#FFF3E0' : '#E8F5E9', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#546E7A' }}>{t('paye')}</span>
                    <span style={{ fontSize: 11, color: '#546E7A' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', background: reste > 0 ? '#E65100' : '#2E7D32', width: `${pct}%`, borderRadius: 3, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#90A4AE' }}>{t('montantPaye')}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#2E7D32', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(paye)}</div>
                    </div>
                    {reste > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: '#90A4AE' }}>{t('resteAPayer')}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#C62828', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(reste)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {facture.tiersPayant && (
                <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '18px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('tiersPayantTitre')}</p>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{facture.assuranceNom ?? '—'}</div>
                  {facture.assuranceNumero && <div style={{ fontSize: 12, color: '#90A4AE' }}>{t('numeroLabel', { numero: facture.assuranceNumero })}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Modal paiement */}
          {payModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{t('enregistrerPaiement')}</h2>
                  <button onClick={() => setPayModal(false)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E0E0E0', background: '#F5F7FA', cursor: 'pointer', color: '#546E7A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>×</button>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{t('montantXof')}</label>
                  <input type="number" value={payMontant} onChange={e => setPayMontant(e.target.value)} placeholder={t('maxMontant', { montant: reste.toLocaleString('fr-FR') })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{t('modePaiement')}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(MODE_CONFIG).map(([key, { color }]) => (
                      <button key={key} onClick={() => setPayMode(key)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${payMode === key ? color : '#E0E0E0'}`, background: payMode === key ? '#F0F7FF' : '#fff', color: payMode === key ? color : '#546E7A', fontSize: 12, fontWeight: payMode === key ? 700 : 400, cursor: 'pointer' }}>
                        {t(`mode.${key}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handlePay} disabled={paying || !payMontant}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#1565C0', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700, opacity: (paying || !payMontant) ? 0.7 : 1 }}>
                  {paying ? t('enregistrement') : t('confirmerPaiement')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
