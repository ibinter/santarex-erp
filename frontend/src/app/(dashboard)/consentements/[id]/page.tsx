'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FileSignature, ArrowLeft, PenTool, XCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'a_signer' | 'signe' | 'refuse' | 'revoque';
type Lien = 'patient' | 'parent' | 'tuteur' | 'representant_legal' | 'conjoint' | 'autre';

type Consentement = {
  id: string; numero: string; type: string; statut: Statut;
  acteConcerne: string; titre: string; texteConsentement: string;
  patientId: string; medecinRef?: string; patientMineur: boolean;
  dateSignature?: string | null; signataireNom?: string; signataireLien?: Lien | null;
  temoinNom?: string; motif?: string; dateRevocation?: string | null;
  observations?: string; createdAt: string;
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string }> = {
  a_signer: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  signe:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  refuse:   { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  revoque:  { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
};
const LIENS: Lien[] = ['patient', 'parent', 'tuteur', 'representant_legal', 'conjoint', 'autre'];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function ConsentementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? '');
  const t = useTranslations('consentements');

  const [c, setC] = useState<Consentement | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'sign' | 'refuse' | 'revoke' | null>(null);

  // form states
  const [sigNom, setSigNom] = useState('');
  const [sigLien, setSigLien] = useState<Lien>('patient');
  const [temoin, setTemoin] = useState('');
  const [obs, setObs] = useState('');
  const [motif, setMotif] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient<any>(`/consentements/${id}`);
      setC((r?.data ?? r) as Consentement);
    } catch { setC(null); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const act = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'sign') {
        if (!sigNom.trim()) { setError(t('sign.errNom')); setBusy(false); return; }
        await apiClient(`/consentements/${id}/signer`, {
          method: 'PATCH',
          body: { signataireNom: sigNom.trim(), signataireLien: sigLien, temoinNom: temoin.trim() || undefined, observations: obs.trim() || undefined },
        });
      } else if (mode === 'refuse') {
        if (!motif.trim()) { setError(t('refuse.errMotif')); setBusy(false); return; }
        await apiClient(`/consentements/${id}/refuser`, { method: 'PATCH', body: { motif: motif.trim(), signataireNom: sigNom.trim() || undefined } });
      } else if (mode === 'revoke') {
        if (!motif.trim()) { setError(t('revoke.errMotif')); setBusy(false); return; }
        await apiClient(`/consentements/${id}/revoquer`, { method: 'PATCH', body: { motif: motif.trim() } });
      }
      setMode(null); setSigNom(''); setTemoin(''); setObs(''); setMotif('');
      await load();
    } catch (e: any) {
      setError(e?.message || t('toast.error'));
    } finally { setBusy(false); }
  };

  const label = { fontSize: 12, fontWeight: 700, color: '#37474F', marginBottom: 6, display: 'block' } as const;
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' } as const;

  if (loading) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('list.loading')}</div>;
  if (!c) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('detail.notFound')}</div>;

  const sc = STATUT_CFG[c.statut];
  const Info = ({ k, v }: { k: string; v?: string | null }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{v || '—'}</div>
    </div>
  );

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/consentements')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSignature size={22} color="#4F46E5" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1A2332' }}>{t('detail.title', { numero: c.numero })}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#90A4AE' }}>{c.acteConcerne}</p>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{t(`statut.${c.statut}`)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* Text + actions */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{c.titre}</h2>
          <div style={{ fontSize: 11, color: '#90A4AE', marginBottom: 14 }}>{t(`type.${c.type}`)}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.8, color: '#37474F', whiteSpace: 'pre-wrap', borderLeft: '3px solid #E0E7FF', paddingLeft: 14 }}>{c.texteConsentement}</p>

          {c.patientMineur && (
            <div style={{ marginTop: 14, padding: '9px 12px', borderRadius: 8, background: '#FFFBEB', color: '#B45309', fontSize: 12, fontWeight: 600 }}>
              {t('sign.mineurWarning')}
            </div>
          )}

          {/* Action buttons */}
          {c.statut === 'a_signer' && !mode && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={() => setMode('sign')} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><PenTool size={15} /> {t('actions.sign')}</button>
              <button onClick={() => setMode('refuse')} style={{ padding: '11px 20px', borderRadius: 10, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><XCircle size={15} /> {t('actions.refuse')}</button>
            </div>
          )}
          {c.statut === 'signe' && !mode && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setMode('revoke')} style={{ padding: '11px 20px', borderRadius: 10, border: '1.5px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><RotateCcw size={15} /> {t('actions.revoke')}</button>
            </div>
          )}

          {/* SIGN form */}
          {mode === 'sign' && (
            <div style={{ marginTop: 20, padding: 18, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E0E8F0' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 7 }}><ShieldCheck size={16} color="#10B981" /> {t('sign.title')}</h3>
              <p style={{ fontSize: 12, color: '#90A4AE', margin: '0 0 14px' }}>{t('sign.intro')}</p>
              <label style={label}>{t('sign.signataireNom')}</label>
              <input value={sigNom} onChange={e => setSigNom(e.target.value)} placeholder={t('sign.signataireNomPlaceholder')} style={{ ...inputStyle, marginBottom: 14 }} />
              <label style={label}>{t('sign.lien')}</label>
              <select value={sigLien} onChange={e => setSigLien(e.target.value as Lien)} style={{ ...inputStyle, marginBottom: 14 }}>
                {LIENS.map(l => <option key={l} value={l}>{t(`lien.${l}`)}</option>)}
              </select>
              <label style={label}>{t('sign.temoin')}</label>
              <input value={temoin} onChange={e => setTemoin(e.target.value)} placeholder={t('sign.temoinPlaceholder')} style={{ ...inputStyle, marginBottom: 14 }} />
              <label style={label}>{t('sign.observations')}</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
              {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setMode(null); setError(''); }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('create.cancel')}</button>
                <button onClick={act} disabled={busy} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? t('sign.signing') : t('sign.confirm')}</button>
              </div>
            </div>
          )}

          {/* REFUSE / REVOKE form */}
          {(mode === 'refuse' || mode === 'revoke') && (
            <div style={{ marginTop: 20, padding: 18, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E0E8F0' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{mode === 'refuse' ? t('refuse.title') : t('revoke.title')}</h3>
              {mode === 'revoke' && <p style={{ fontSize: 12, color: '#B45309', margin: '0 0 12px' }}>{t('revoke.warning')}</p>}
              {mode === 'refuse' && (
                <>
                  <label style={label}>{t('refuse.signataireNom')}</label>
                  <input value={sigNom} onChange={e => setSigNom(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />
                </>
              )}
              <label style={label}>{mode === 'refuse' ? t('refuse.motif') : t('revoke.motif')}</label>
              <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={3} placeholder={mode === 'refuse' ? t('refuse.motifPlaceholder') : t('revoke.motifPlaceholder')} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />
              {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setMode(null); setError(''); }} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('create.cancel')}</button>
                <button onClick={act} disabled={busy} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: mode === 'refuse' ? '#EF4444' : '#64748B', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{mode === 'refuse' ? t('refuse.confirm') : t('revoke.confirm')}</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <Info k={t('detail.patient')} v={c.patientId} />
          <Info k={t('detail.medecin')} v={c.medecinRef} />
          <Info k={t('detail.type')} v={t(`type.${c.type}`)} />
          <Info k={t('detail.createdAt')} v={fmtDate(c.createdAt)} />
          {c.statut === 'signe' && (
            <>
              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('detail.signature')}</div>
              <Info k={t('detail.signataire')} v={c.signataireNom} />
              <Info k={t('detail.lien')} v={c.signataireLien ? t(`lien.${c.signataireLien}`) : '—'} />
              <Info k={t('detail.dateSignature')} v={fmtDate(c.dateSignature)} />
              <Info k={t('detail.temoin')} v={c.temoinNom} />
            </>
          )}
          {(c.statut === 'refuse' || c.statut === 'revoque') && (
            <>
              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
              <Info k={t('detail.motif')} v={c.motif} />
              {c.statut === 'revoque' && <Info k={t('detail.dateRevocation')} v={fmtDate(c.dateRevocation)} />}
            </>
          )}
          {c.observations && (
            <>
              <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />
              <Info k={t('detail.observations')} v={c.observations} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
