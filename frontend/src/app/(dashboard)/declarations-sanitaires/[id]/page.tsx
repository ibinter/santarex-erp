'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  FileWarning, ArrowLeft, Send, Clock, MapPin, User, Activity,
  AlertTriangle, CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'a_declarer' | 'declaree' | 'transmise' | 'confirmee' | 'classee';
type Gravite = 'benin' | 'modere' | 'severe' | 'critique';

type Declaration = {
  id: string; numero: string; maladieNom: string; codeCIM10?: string | null;
  statut: Statut; gravite: Gravite; evolution: string;
  patientId?: string | null; patientNom?: string | null; patientAge?: number | null; patientSexe: string;
  localite?: string | null; dateDiagnostic: string; dateDeclaration?: string | null;
  medecinDeclarantRef: string; mesuresPrises?: string | null;
  autoriteDestinataire?: string | null; referenceTransmission?: string | null; dateTransmission?: string | null;
  urgent?: boolean; enRetard?: boolean; echeance?: string | null; delaiHeures?: number | null;
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string }> = {
  a_declarer: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  declaree:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  transmise:  { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  confirmee:  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  classee:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
};

// Transitions autorisées côté UI (miroir du service).
const NEXT: Record<Statut, Statut[]> = {
  a_declarer: ['declaree'],
  declaree: ['transmise', 'a_declarer'],
  transmise: ['confirmee', 'classee', 'declaree'],
  confirmee: ['classee', 'transmise'],
  classee: ['confirmee'],
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' };

function fmt(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function DeclarationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations('declarationsSanitaires');

  const [decl, setDecl] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [autorite, setAutorite] = useState('');
  const [reference, setReference] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(`/declarations-sanitaires/${id}`);
      setDecl((res?.data ?? res) as Declaration);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const changerStatut = async (statut: Statut) => {
    setError(''); setBusy(true);
    try {
      await apiClient(`/declarations-sanitaires/${id}/statut`, { method: 'PATCH', body: { statut } });
      await load();
    } catch (e: any) { setError(e?.message || t('detail.error')); }
    finally { setBusy(false); }
  };

  const transmettre = async () => {
    setError('');
    if (!autorite.trim()) { setError(t('detail.autoriteRequired')); return; }
    setBusy(true);
    try {
      await apiClient(`/declarations-sanitaires/${id}/transmettre`, {
        method: 'PATCH',
        body: { autoriteDestinataire: autorite.trim(), referenceTransmission: reference.trim() || undefined },
      });
      setAutorite(''); setReference('');
      await load();
    } catch (e: any) { setError(e?.message || t('detail.error')); }
    finally { setBusy(false); }
  };

  if (loading) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('detail.loading')}</div>;
  if (!decl) return <div style={{ padding: 40, color: '#90A4AE' }}>{t('detail.notFound')}</div>;

  const sc = STATUT_CFG[decl.statut] ?? STATUT_CFG.a_declarer;
  const canTransmettre = decl.statut === 'a_declarer' || decl.statut === 'declaree';
  const nexts = (NEXT[decl.statut] ?? []).filter(s => s !== 'transmise');

  const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '.4px' }}>{icon}{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#37474F' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/declarations-sanitaires')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#0D9488', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0F766E,#0D9488)', borderRadius: '16px 16px 0 0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileWarning size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>{decl.maladieNom}</h1>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{decl.numero}{decl.codeCIM10 ? ` • ${decl.codeCIM10}` : ''}</span>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '6px 14px', borderRadius: 20, background: '#fff', color: sc.color }}>{t(`statut.${decl.statut}`)}</span>
        </div>

        <div style={{ background: '#fff', borderRadius: '0 0 16px 16px', padding: '22px 24px', boxShadow: '0 4px 18px rgba(0,0,0,0.07)' }}>
          {(decl.urgent || decl.enRetard) && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#B91C1C" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#991B1B' }}>
                {decl.enRetard ? t('detail.echeanceDepassee', { date: fmt(decl.echeance) }) : t('detail.echeanceProche', { date: fmt(decl.echeance) })}
              </span>
            </div>
          )}

          {/* Infos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 18, marginBottom: 22 }}>
            <Field icon={<User size={11} />} label={t('detail.patient')} value={decl.patientNom || (decl.patientId ? t('detail.patientLie') : '—')} />
            <Field icon={<User size={11} />} label={t('detail.ageSexe')} value={`${decl.patientAge ?? '—'} • ${t(`sexe.${decl.patientSexe}`)}`} />
            <Field icon={<MapPin size={11} />} label={t('detail.localite')} value={decl.localite || '—'} />
            <Field icon={<Activity size={11} />} label={t('detail.gravite')} value={t(`gravite.${decl.gravite}`)} />
            <Field icon={<Activity size={11} />} label={t('detail.evolution')} value={t(`evolution.${decl.evolution}`)} />
            <Field icon={<Clock size={11} />} label={t('detail.dateDiagnostic')} value={fmt(decl.dateDiagnostic)} />
            <Field icon={<Clock size={11} />} label={t('detail.dateDeclaration')} value={fmt(decl.dateDeclaration)} />
            <Field icon={<Clock size={11} />} label={t('detail.delai')} value={decl.delaiHeures ? t('detail.delaiValue', { heures: decl.delaiHeures }) : '—'} />
          </div>

          {decl.mesuresPrises && (
            <div style={{ marginBottom: 22 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '.4px' }}>{t('detail.mesuresPrises')}</span>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#37474F', lineHeight: 1.5 }}>{decl.mesuresPrises}</p>
            </div>
          )}

          {/* Transmission info si transmise */}
          {decl.dateTransmission && (
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '12px 16px', marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <CheckCircle size={15} color="#6D28D9" />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9' }}>{t('detail.transmiseTitle')}</span>
              </div>
              <div style={{ fontSize: 12, color: '#4C1D95' }}>
                {t('detail.transmiseA', { autorite: decl.autoriteDestinataire ?? '—' })} • {fmt(decl.dateTransmission)}
                {decl.referenceTransmission && <> • {t('detail.reference')}: <span style={{ fontFamily: 'monospace' }}>{decl.referenceTransmission}</span></>}
              </div>
            </div>
          )}

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

          {/* Transmission action */}
          {canTransmettre && (
            <div style={{ borderTop: '1px solid #ECEFF1', paddingTop: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', marginBottom: 10 }}>{t('detail.transmettreTitle')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 12 }}>
                <input value={autorite} onChange={e => setAutorite(e.target.value)} placeholder={t('detail.autoritePlaceholder')} style={inputStyle} />
                <input value={reference} onChange={e => setReference(e.target.value)} placeholder={t('detail.referencePlaceholder')} style={inputStyle} />
              </div>
              <button onClick={transmettre} disabled={busy}
                style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#6D28D9', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Send size={15} /> {t('detail.transmettreBtn')}
              </button>
            </div>
          )}

          {/* Transitions de statut */}
          {nexts.length > 0 && (
            <div style={{ borderTop: '1px solid #ECEFF1', paddingTop: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#455A64', marginBottom: 10 }}>{t('detail.changerStatut')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {nexts.map(s => (
                  <button key={s} onClick={() => changerStatut(s)} disabled={busy}
                    style={{ padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${STATUT_CFG[s].border}`, background: STATUT_CFG[s].bg, color: STATUT_CFG[s].color, fontSize: 12, fontWeight: 800, cursor: busy ? 'default' : 'pointer' }}>
                    → {t(`statut.${s}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
