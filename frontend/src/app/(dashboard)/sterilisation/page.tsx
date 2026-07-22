'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Biohazard, RefreshCw, Plus, AlertTriangle, Loader2, CheckCircle,
  XCircle, Clock, Trash2, PlayCircle, ShieldCheck, X, Thermometer,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

// ── Types (miroir des entités backend) ──────────────────────────────────────
type Methode = 'autoclave' | 'chaleur_seche' | 'chimique';
type Indicateur = 'conforme' | 'non_conforme';
type Statut = 'en_cours' | 'valide' | 'rejete' | 'utilise';

interface Lot {
  id: string;
  numero: string;
  methode: Methode;
  contenu: string;
  temperature?: number | null;
  dureeMin?: number | null;
  dateCycle: string;
  operateurRef: string;
  resultatIndicateur?: Indicateur | null;
  statut: Statut;
  datePeremptionSterilite?: string | null;
  observations?: string | null;
}
interface Stats {
  cyclesJour: number;
  enCours: number;
  valides: number;
  rejetes: number;
  utilises: number;
  perimes: number;
  tauxConformite: number;
}

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string }> = {
  en_cours: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  valide:   { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  rejete:   { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  utilise:  { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function joursRestants(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export default function SterilisationPage() {
  const t = useTranslations('sterilisation');
  const [tab, setTab] = useState<'lots' | 'perimes'>('lots');
  const [lots, setLots] = useState<Lot[]>([]);
  const [perimes, setPerimes] = useState<Lot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [validerLot, setValiderLot] = useState<Lot | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [l, p, st] = await Promise.all([
        apiClient<Lot[]>('/sterilisation/lots'),
        apiClient<Lot[]>('/sterilisation/lots/perimes'),
        apiClient<Stats>('/sterilisation/stats'),
      ]);
      setLots(Array.isArray(l) ? l : []);
      setPerimes(Array.isArray(p) ? p : []);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('erreurChargement'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const utiliser = async (lot: Lot) => {
    if (!window.confirm(t('confirmUtiliser', { numero: lot.numero }))) return;
    setBusyId(lot.id);
    try {
      await apiClient(`/sterilisation/lots/${lot.id}/utiliser`, { method: 'PATCH', body: {} });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('actionImpossible'));
    } finally { setBusyId(null); }
  };

  const supprimer = async (lot: Lot) => {
    if (!window.confirm(t('confirmSupprimer', { numero: lot.numero }))) return;
    setBusyId(lot.id);
    try {
      await apiClient(`/sterilisation/lots/${lot.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('actionImpossible'));
    } finally { setBusyId(null); }
  };

  const rows = tab === 'lots' ? lots : perimes;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .ste-row:hover{background:#F0F4FF!important;}
        .ste-kpi{transition:all .15s;}
        .ste-kpi:hover{transform:translateY(-2px);}
        .ste-btn:disabled{opacity:.5;cursor:not-allowed;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#065F46 0%,#047857 50%,#0F766E 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(6,95,70,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Biohazard size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('title')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: 2 }}>{t('subtitle')}</div>
            </div>
          </div>
          <button onClick={() => setModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#047857', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
            <Plus size={14} /> {t('nouveauCycle')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 18, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpiCyclesJour'), val: `${stats?.cyclesJour ?? 0}`, icon: <PlayCircle size={16} />, color: '#A7F3D0' },
            { label: t('kpiEnCours'), val: `${stats?.enCours ?? 0}`, icon: <Clock size={16} />, color: '#FDE68A' },
            { label: t('kpiConformite'), val: `${stats?.tauxConformite ?? 100}%`, icon: <ShieldCheck size={16} />, color: '#BAE6FD' },
            { label: t('kpiPerimes'), val: `${stats?.perimes ?? 0}`, icon: <AlertTriangle size={16} />, color: '#FECACA' },
          ].map((k, i) => (
            <div key={i} className="ste-kpi" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.18)' }}>
              <div style={{ color: k.color, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 600 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0, background: '#fff', borderRadius: 12, padding: 5, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', width: 'fit-content' }}>
          {[{ id: 'lots' as const, label: t('tabLots', { count: lots.length }) }, { id: 'perimes' as const, label: t('tabPerimes') }].map(tt => (
            <button key={tt.id} onClick={() => setTab(tt.id)}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: tab === tt.id ? 'linear-gradient(135deg,#065F46,#0F766E)' : 'transparent', color: tab === tt.id ? '#fff' : '#546E7A', fontSize: 13, fontWeight: tab === tt.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tt.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="ste-btn" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#047857', fontWeight: 700 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('actualiser')}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {loading && !rows.length && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#90A4AE', gap: 10 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> {t('chargement')}
        </div>
      )}

      {!loading && !rows.length && (
        <div style={{ textAlign: 'center', padding: 60, color: '#90A4AE', background: '#fff', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
          <Biohazard size={34} color="#CBD5E1" style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontWeight: 700, color: '#546E7A' }}>{tab === 'lots' ? t('aucunLot') : t('aucunPerime')}</p>
          <p style={{ margin: '6px 0 0', fontSize: 12 }}>{tab === 'lots' ? t('aucunLotAide') : t('aucunPerimeAide')}</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[t('thNumero'), t('thMethode'), t('thContenu'), t('thDate'), t('thIndicateur'), t('thStatut'), t('thPeremption'), t('thActions')].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(lot => {
                  const scfg = STATUT_CFG[lot.statut];
                  const jr = joursRestants(lot.datePeremptionSterilite);
                  const perime = jr !== null && jr < 0;
                  return (
                    <tr key={lot.id} className="ste-row" style={{ borderTop: '1px solid #F0F4FA' }}>
                      <td style={{ padding: '13px 14px', fontWeight: 800, color: '#1A2332', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{lot.numero}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Thermometer size={12} color="#0F766E" /> {t(`methode.${lot.methode}`)}
                          {lot.temperature ? <span style={{ color: '#9CA3AF' }}> · {lot.temperature}°C</span> : null}
                        </span>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151', maxWidth: 240 }}>{lot.contenu}</td>
                      <td style={{ padding: '13px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(lot.dateCycle)}</td>
                      <td style={{ padding: '13px 14px' }}>
                        {lot.resultatIndicateur === 'conforme' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#15803D' }}><CheckCircle size={13} /> {t('indicateur.conforme')}</span>
                        )}
                        {lot.resultatIndicateur === 'non_conforme' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#B91C1C' }}><XCircle size={13} /> {t('indicateur.non_conforme')}</span>
                        )}
                        {!lot.resultatIndicateur && (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t('indicateur.nonEvalue')}</span>
                        )}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.border}` }}>{t(`statut.${lot.statut}`)}</span>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {lot.datePeremptionSterilite ? (
                          perime
                            ? <span style={{ color: '#B91C1C', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> {t('perime')}</span>
                            : <span style={{ color: jr !== null && jr <= 7 ? '#C2410C' : '#546E7A', fontWeight: jr !== null && jr <= 7 ? 700 : 500 }}>{t('expireDans', { jours: jr ?? 0 })}</span>
                        ) : <span style={{ color: '#9CA3AF' }}>{t('sansObjet')}</span>}
                      </td>
                      <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {lot.statut === 'en_cours' && (
                            <button className="ste-btn" disabled={busyId === lot.id} onClick={() => setValiderLot(lot)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#0F766E', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                              <ShieldCheck size={11} /> {t('valider')}
                            </button>
                          )}
                          {lot.statut === 'valide' && !perime && (
                            <button className="ste-btn" disabled={busyId === lot.id} onClick={() => utiliser(lot)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#1D4ED8', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                              <PlayCircle size={11} /> {t('utiliser')}
                            </button>
                          )}
                          {lot.statut !== 'utilise' && (
                            <button className="ste-btn" disabled={busyId === lot.id} onClick={() => supprimer(lot)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #FECACA', background: '#fff', color: '#B91C1C', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <NouveauCycleModal onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); load(); }} />}
      {validerLot && <ValiderModal lot={validerLot} onClose={() => setValiderLot(null)} onValidated={() => { setValiderLot(null); load(); }} />}
    </div>
  );
}

// ── Modale : nouveau cycle ───────────────────────────────────────────────────
function NouveauCycleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const t = useTranslations('sterilisation');
  const [methode, setMethode] = useState<Methode>('autoclave');
  const [contenu, setContenu] = useState('');
  const [temperature, setTemperature] = useState('');
  const [dureeMin, setDureeMin] = useState('');
  const [dateCycle, setDateCycle] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = contenu.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient('/sterilisation/lots', {
        method: 'POST',
        body: {
          methode,
          contenu: contenu.trim(),
          temperature: temperature ? Number(temperature) : undefined,
          dureeMin: dureeMin ? Number(dureeMin) : undefined,
          dateCycle: dateCycle ? new Date(dateCycle).toISOString() : undefined,
          observations: observations.trim() || undefined,
        },
      });
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('creationImpossible'));
    } finally { setSubmitting(false); }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 };
  const inp: React.CSSProperties = { width: '100%', border: '1px solid #D1D9E6', borderRadius: 9, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: 'linear-gradient(135deg,#065F46,#0F766E)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Biohazard size={20} color="#fff" />
            <h2 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 800 }}>{t('modalTitre')}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
          <div>
            <label style={lbl}>{t('labelMethode')} <span style={{ color: '#DC2626' }}>*</span></label>
            <select style={inp} value={methode} onChange={e => setMethode(e.target.value as Methode)}>
              <option value="autoclave">{t('methode.autoclave')}</option>
              <option value="chaleur_seche">{t('methode.chaleur_seche')}</option>
              <option value="chimique">{t('methode.chimique')}</option>
            </select>
          </div>
          <div>
            <label style={lbl}>{t('labelContenu')} <span style={{ color: '#DC2626' }}>*</span></label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder={t('placeholderContenu')} value={contenu} onChange={e => setContenu(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>{t('labelTemperature')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
              <input type="number" style={inp} value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="134" />
            </div>
            <div>
              <label style={lbl}>{t('labelDuree')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
              <input type="number" min={1} style={inp} value={dureeMin} onChange={e => setDureeMin(e.target.value)} placeholder="18" />
            </div>
          </div>
          <div>
            <label style={lbl}>{t('labelDateCycle')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
            <input type="datetime-local" style={inp} value={dateCycle} onChange={e => setDateCycle(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t('labelObservations')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
            <input style={inp} value={observations} onChange={e => setObservations(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid #EEF2F7' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
          <button onClick={submit} disabled={!canSubmit || submitting}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: (!canSubmit || submitting) ? '#94D3C4' : 'linear-gradient(135deg,#065F46,#0F766E)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('creation')}</> : <><Plus size={15} /> {t('creer')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modale : validation d'un cycle ───────────────────────────────────────────
function ValiderModal({ lot, onClose, onValidated }: { lot: Lot; onClose: () => void; onValidated: () => void }) {
  const t = useTranslations('sterilisation');
  const [resultat, setResultat] = useState<Indicateur>('conforme');
  const [validite, setValidite] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true); setErr(null);
    try {
      await apiClient(`/sterilisation/lots/${lot.id}/valider`, {
        method: 'PATCH',
        body: {
          resultatIndicateur: resultat,
          dureeValiditeJours: validite ? Number(validite) : undefined,
          observations: observations.trim() || undefined,
        },
      });
      onValidated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('actionImpossible'));
    } finally { setSubmitting(false); }
  };

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 };
  const inp: React.CSSProperties = { width: '100%', border: '1px solid #D1D9E6', borderRadius: 9, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: 'linear-gradient(135deg,#065F46,#0F766E)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={20} color="#fff" />
            <h2 style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 800 }}>{t('modalValiderTitre', { numero: lot.numero })}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
          <div>
            <label style={lbl}>{t('labelResultat')} <span style={{ color: '#DC2626' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(['conforme', 'non_conforme'] as Indicateur[]).map(r => (
                <button key={r} onClick={() => setResultat(r)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                    border: `2px solid ${resultat === r ? (r === 'conforme' ? '#15803D' : '#B91C1C') : '#E5E9F0'}`,
                    background: resultat === r ? (r === 'conforme' ? '#F0FDF4' : '#FEF2F2') : '#fff',
                    color: r === 'conforme' ? '#15803D' : '#B91C1C' }}>
                  {r === 'conforme' ? <CheckCircle size={15} /> : <XCircle size={15} />} {t(`indicateur.${r}`)}
                </button>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9CA3AF' }}>{t('resultatAide')}</p>
          </div>
          {resultat === 'conforme' && (
            <div>
              <label style={lbl}>{t('labelValidite')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
              <input type="number" min={1} style={inp} value={validite} onChange={e => setValidite(e.target.value)} placeholder="180" />
            </div>
          )}
          <div>
            <label style={lbl}>{t('labelObservations')} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>{t('optionnel')}</span></label>
            <input style={inp} value={observations} onChange={e => setObservations(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid #EEF2F7' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
          <button onClick={submit} disabled={submitting}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: submitting ? '#94D3C4' : 'linear-gradient(135deg,#065F46,#0F766E)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('creation')}</> : <><ShieldCheck size={15} /> {t('confirmerValidation')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
