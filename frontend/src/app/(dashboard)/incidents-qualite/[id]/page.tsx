'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ShieldAlert, ArrowLeft, Calendar, MapPin, User,
  Send, Clock, ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'declare' | 'en_analyse' | 'action_en_cours' | 'cloture';
type Gravite = 'mineure' | 'moderee' | 'grave' | 'critique';
type TypeAction = 'commentaire' | 'analyse' | 'action_corrective' | 'changement_statut';

type ActionEntry = {
  id: string; type: TypeAction; auteurId: string; contenu: string;
  ancienStatut?: Statut; nouveauStatut?: Statut; createdAt: string;
};

type Incident = {
  id: string; numero: string; type: string; gravite: Gravite; statut: Statut;
  serviceConcerne: string; dateSurvenue: string; createdAt: string; dateCloture?: string | null;
  patientId?: string | null; declarantId: string; description: string;
  causesIdentifiees?: string | null; mesuresCorrectives?: string | null;
  actions: ActionEntry[];
};

const GRAVITE_CFG: Record<Gravite, { bg: string; color: string; border: string; dot: string }> = {
  mineure:  { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  moderee:  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  grave:    { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  critique: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string; dot: string }> = {
  declare:         { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  en_analyse:      { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  action_en_cours: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  cloture:         { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
};

// Transitions autorisées (miroir du service backend).
const NEXT_STATUTS: Record<Statut, Statut[]> = {
  declare: ['en_analyse', 'cloture'],
  en_analyse: ['action_en_cours', 'declare', 'cloture'],
  action_en_cours: ['cloture', 'en_analyse'],
  cloture: ['action_en_cours'],
};

const ACTION_TYPES: TypeAction[] = ['commentaire', 'analyse', 'action_corrective'];

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function IncidentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const t = useTranslations('incidentsQualite');

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [newAction, setNewAction] = useState('');
  const [newActionType, setNewActionType] = useState<TypeAction>('commentaire');
  const [statusComment, setStatusComment] = useState('');
  const [pendingStatut, setPendingStatut] = useState<Statut | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<any>(`/incidents-qualite/${id}`);
      setIncident((res?.data ?? res) as Incident);
    } catch (e: any) {
      setError(e?.message || t('detail.loadError'));
    } finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { if (id) load(); }, [id, load]);

  const changerStatut = async (statut: Statut) => {
    if (!incident) return;
    setBusy(true); setError('');
    try {
      const res = await apiClient<any>(`/incidents-qualite/${id}/statut`, {
        method: 'PATCH',
        body: { statut, commentaire: statusComment.trim() || undefined },
      });
      setIncident((res?.data ?? res) as Incident);
      setStatusComment(''); setPendingStatut('');
    } catch (e: any) {
      setError(e?.message || t('detail.updateError'));
    } finally { setBusy(false); }
  };

  const ajouterAction = async () => {
    if (!newAction.trim()) return;
    setBusy(true); setError('');
    try {
      const res = await apiClient<any>(`/incidents-qualite/${id}/action`, {
        method: 'POST',
        body: { contenu: newAction.trim(), type: newActionType },
      });
      setIncident((res?.data ?? res) as Incident);
      setNewAction('');
    } catch (e: any) {
      setError(e?.message || t('detail.updateError'));
    } finally { setBusy(false); }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#90A4AE', background: '#F4F6FA', minHeight: '100vh' }}>{t('list.loading')}</div>;
  }
  if (!incident) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#F4F6FA', minHeight: '100vh' }}>
        <ShieldAlert size={40} color="#FECACA" style={{ marginBottom: 12 }} />
        <p style={{ color: '#546E7A', fontWeight: 700 }}>{error || t('detail.loadError')}</p>
        <button onClick={() => router.push('/incidents-qualite')} style={{ marginTop: 12, padding: '8px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', color: '#546E7A', fontWeight: 700 }}>{t('detail.back')}</button>
      </div>
    );
  }

  const gc = GRAVITE_CFG[incident.gravite] ?? GRAVITE_CFG.mineure;
  const sc = STATUT_CFG[incident.statut] ?? STATUT_CFG.declare;
  const nextOptions = NEXT_STATUTS[incident.statut] ?? [];
  const timeline = [...(incident.actions ?? [])].reverse();

  const infoRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
      <span style={{ color: '#B0BEC5', display: 'flex' }}>{icon}</span>
      <span style={{ color: '#90A4AE', fontWeight: 600, minWidth: 110 }}>{label}</span>
      <span style={{ color: '#37474F', fontWeight: 700 }}>{value}</span>
    </div>
  );

  const block = (title: string, value?: string | null) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: value ? '#37474F' : '#B0BEC5', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{value || t('detail.noneProvided')}</div>
    </div>
  );

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={() => router.push('/incidents-qualite')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#B91C1C', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={15} /> {t('detail.back')}
      </button>

      {/* Header card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 16, borderLeft: `5px solid ${gc.dot}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '3px 10px', borderRadius: 8 }}>{incident.numero}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: gc.bg, color: gc.color, border: `1px solid ${gc.border}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: gc.dot }} /> {t(`gravite.${incident.gravite}`)}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} /> {t(`statut.${incident.statut}`)}
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1A2332' }}>{t(`type.${incident.type}`)}</h1>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 16 }}>
          {infoRow(<Calendar size={14} />, t('detail.occurredOn'), fmtDate(incident.dateSurvenue))}
          {infoRow(<Clock size={14} />, t('detail.declaredOn'), fmtDate(incident.createdAt))}
          {infoRow(<MapPin size={14} />, t('detail.service'), incident.serviceConcerne)}
          {incident.patientId && infoRow(<User size={14} />, t('detail.patient'),
            <a onClick={() => router.push(`/patients/${incident.patientId}`)} style={{ color: '#B91C1C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 2 }}>{incident.patientId.slice(0, 8)} <ChevronRight size={12} /></a>)}
          {incident.dateCloture && infoRow(<Clock size={14} />, t('detail.closedOn'), fmtDate(incident.dateCloture))}
        </div>
      </div>

      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>
        {/* Left: content */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          {block(t('detail.description'), incident.description)}
          {block(t('detail.causes'), incident.causesIdentifiees)}
          {block(t('detail.mesures'), incident.mesuresCorrectives)}

          {/* Change status */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('detail.changeStatus')}</div>
            {nextOptions.length > 0 ? (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {nextOptions.map(s => {
                    const cfg = STATUT_CFG[s];
                    const on = pendingStatut === s;
                    return (
                      <button key={s} onClick={() => setPendingStatut(on ? '' : s)} disabled={busy}
                        style={{ padding: '8px 14px', borderRadius: 20, border: `2px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 12, fontWeight: on ? 800 : 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} /> {t(`statut.${s}`)}
                      </button>
                    );
                  })}
                </div>
                {pendingStatut && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input value={statusComment} onChange={e => setStatusComment(e.target.value)} placeholder={t('detail.statusComment')}
                      style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', color: '#1A2332' }} />
                    <button onClick={() => changerStatut(pendingStatut)} disabled={busy}
                      style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#B91C1C', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
                      {t('detail.confirm')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#B0BEC5' }}>—</div>
            )}
          </div>
        </div>

        {/* Right: timeline */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>{t('detail.timeline')}</div>

          {/* Add action */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {ACTION_TYPES.map(at => {
                const on = newActionType === at;
                return (
                  <button key={at} onClick={() => setNewActionType(at)}
                    style={{ padding: '5px 12px', borderRadius: 16, border: `1.5px solid ${on ? '#B91C1C' : '#E0E8F0'}`, background: on ? '#FEE2E2' : '#fff', color: on ? '#B91C1C' : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 600, cursor: 'pointer' }}>
                    {t(`actionType.${at}`)}
                  </button>
                );
              })}
            </div>
            <textarea value={newAction} onChange={e => setNewAction(e.target.value)} placeholder={t('detail.actionPlaceholder')} rows={2}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', color: '#1A2332' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={ajouterAction} disabled={busy || !newAction.trim()}
                style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: newAction.trim() ? '#B91C1C' : '#E0E8F0', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: newAction.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={13} /> {busy ? t('detail.adding') : t('detail.add')}
              </button>
            </div>
          </div>

          {/* Entries */}
          {timeline.length === 0 ? (
            <div style={{ fontSize: 12, color: '#B0BEC5', textAlign: 'center', padding: '16px 0' }}>{t('detail.emptyTimeline')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.map(a => {
                const isStatut = a.type === 'changement_statut';
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: isStatut ? '#8B5CF6' : '#B91C1C', marginTop: 4, flexShrink: 0 }} />
                      <span style={{ flex: 1, width: 2, background: '#F1F5F9' }} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px', color: isStatut ? '#6D28D9' : '#B91C1C' }}>{t(`actionType.${a.type}`)}</span>
                        {a.nouveauStatut && <span style={{ fontSize: 10, fontWeight: 700, color: STATUT_CFG[a.nouveauStatut]?.color }}>→ {t(`statut.${a.nouveauStatut}`)}</span>}
                        <span style={{ fontSize: 10, color: '#B0BEC5' }}>{fmtDate(a.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#37474F', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.contenu}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
