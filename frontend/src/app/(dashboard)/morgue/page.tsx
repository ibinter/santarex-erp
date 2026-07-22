'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Snowflake, RefreshCw, Plus, AlertTriangle, Loader2, FileText,
  UserX, Box, LogIn, LogOut, X, CheckCircle, Clock,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

// ── Types (miroir des entités backend) ──────────────────────────────────────
type Sexe = 'M' | 'F' | 'indetermine';
type Lieu = 'service' | 'domicile' | 'arrivee' | 'autre';
type StatutCasier = 'libre' | 'occupe' | 'maintenance';
type StatutSejour = 'en_chambre' | 'remis';

interface Deces {
  id: string;
  numero: string;
  patientId?: string | null;
  defuntNom: string;
  defuntPrenom: string;
  defuntSexe: Sexe;
  defuntAge?: number | null;
  dateHeureDeces: string;
  lieuDeces: Lieu;
  causeDeces?: string | null;
  medecinConstatantRef?: string | null;
  certificatEmis: boolean;
  numeroCertificat?: string | null;
}
interface Casier {
  id: string;
  numero: string;
  description?: string | null;
  statut: StatutCasier;
  estActif: boolean;
}
interface Sejour {
  id: string;
  decesId: string;
  casierId: string;
  dateEntree: string;
  dateSortie?: string | null;
  statut: StatutSejour;
  tarifJournalier: number;
  fraisConservation?: number | null;
  personneRemiseNom?: string | null;
  personneRemiseLien?: string | null;
  deces?: { numero: string; defuntNom: string; defuntPrenom: string } | null;
  casier?: { numero: string } | null;
}
interface Stats {
  casiers: { total: number; occupes: number; libres: number; maintenance: number; tauxOccupationPct: number };
  corpsPresents: number;
  deces: { total: number; duMois: number; certificatsEmis: number };
}

const CASIER_CFG: Record<StatutCasier, { bg: string; color: string; border: string }> = {
  libre:       { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  occupe:      { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
  maintenance: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function MorguePage() {
  const t = useTranslations('morgue');
  const [tab, setTab] = useState<'deces' | 'casiers' | 'sejours'>('deces');
  const [deces, setDeces] = useState<Deces[]>([]);
  const [casiers, setCasiers] = useState<Casier[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalDeces, setModalDeces] = useState(false);
  const [modalCasier, setModalCasier] = useState(false);
  const [entreeFor, setEntreeFor] = useState<Deces | null>(null);
  const [remiseFor, setRemiseFor] = useState<Sejour | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [d, c, s, st] = await Promise.all([
        apiClient<{ data: Deces[] }>('/morgue/deces?limit=100'),
        apiClient<Casier[]>('/morgue/casiers'),
        apiClient<Sejour[]>('/morgue/sejours'),
        apiClient<Stats>('/morgue/stats'),
      ]);
      setDeces(Array.isArray(d?.data) ? d.data : []);
      setCasiers(Array.isArray(c) ? c : []);
      setSejours(Array.isArray(s) ? s : []);
      setStats(st);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('erreurChargement'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const emettreCert = async (d: Deces) => {
    if (!window.confirm(t('confirmCertificat', { numero: d.numero }))) return;
    setBusyId(d.id);
    try {
      await apiClient(`/morgue/deces/${d.id}/certificat`, { method: 'PATCH', body: {} });
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : t('actionImpossible')); }
    finally { setBusyId(null); }
  };

  // décès n'ayant pas de séjour actif → placables
  const sejoursActifsDecesIds = new Set(sejours.filter(s => s.statut === 'en_chambre').map(s => s.decesId));

  const lbl = t('title');

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .mg-row:hover{background:#F0F4FF!important;}
        .mg-kpi{transition:all .15s;}
        .mg-kpi:hover{transform:translateY(-2px);}
        .mg-btn:disabled{opacity:.5;cursor:not-allowed;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A5F 0%,#2C5282 50%,#2B6CB0 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(30,58,95,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Snowflake size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{lbl}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginTop: 2 }}>{t('subtitle')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setModalCasier(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700 }}>
              <Box size={14} /> {t('nouveauCasier')}
            </button>
            <button onClick={() => setModalDeces(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#2C5282', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('nouveauDeces')}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 18, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpiCorpsPresents'), val: `${stats?.corpsPresents ?? 0}`, icon: <UserX size={16} />, color: '#BAE6FD' },
            { label: t('kpiCasiersLibres'), val: `${stats?.casiers.libres ?? 0}/${stats?.casiers.total ?? 0}`, icon: <Box size={16} />, color: '#A7F3D0' },
            { label: t('kpiDecesMois'), val: `${stats?.deces.duMois ?? 0}`, icon: <FileText size={16} />, color: '#FDE68A' },
            { label: t('kpiOccupation'), val: `${stats?.casiers.tauxOccupationPct ?? 0}%`, icon: <Snowflake size={16} />, color: '#E0E7FF' },
          ].map((k, i) => (
            <div key={i} className="mg-kpi" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.18)' }}>
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
          {[
            { id: 'deces' as const, label: t('tabDeces', { count: deces.length }) },
            { id: 'casiers' as const, label: t('tabCasiers', { count: casiers.length }) },
            { id: 'sejours' as const, label: t('tabSejours', { count: sejours.length }) },
          ].map(tt => (
            <button key={tt.id} onClick={() => setTab(tt.id)}
              style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: tab === tt.id ? 'linear-gradient(135deg,#1E3A5F,#2B6CB0)' : 'transparent', color: tab === tt.id ? '#fff' : '#546E7A', fontSize: 13, fontWeight: tab === tt.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tt.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="mg-btn" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#2B6CB0', fontWeight: 700 }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('actualiser')}
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, color: '#90A4AE', gap: 10 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> {t('chargement')}
        </div>
      )}

      {/* ── REGISTRE DES DÉCÈS ── */}
      {!loading && tab === 'deces' && (
        deces.length === 0 ? <Empty t={t} label={t('aucunDeces')} /> : (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[t('thNumero'), t('thDefunt'), t('thDeces'), t('thLieu'), t('thCertificat'), t('thActions')].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deces.map(d => {
                  const placable = !sejoursActifsDecesIds.has(d.id);
                  return (
                    <tr key={d.id} className="mg-row" style={{ borderTop: '1px solid #F0F4FA' }}>
                      <td style={{ padding: '13px 14px', fontWeight: 800, color: '#1A2332', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.numero}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151' }}>
                        <div style={{ fontWeight: 700 }}>{d.defuntNom} {d.defuntPrenom}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{t(`sexe.${d.defuntSexe}`)}{d.defuntAge != null ? ` · ${d.defuntAge} ${t('ans')}` : ''}</div>
                      </td>
                      <td style={{ padding: '13px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(d.dateHeureDeces)}</td>
                      <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151' }}>{t(`lieu.${d.lieuDeces}`)}</td>
                      <td style={{ padding: '13px 14px' }}>
                        {d.certificatEmis
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#15803D' }}><CheckCircle size={13} /> {d.numeroCertificat}</span>
                          : <span style={{ fontSize: 11, color: '#C2410C', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {t('certificatNonEmis')}</span>}
                      </td>
                      <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!d.certificatEmis && (
                            <button className="mg-btn" disabled={busyId === d.id} onClick={() => emettreCert(d)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#0F766E', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                              <FileText size={11} /> {t('emettreCertificat')}
                            </button>
                          )}
                          {placable && (
                            <button className="mg-btn" disabled={busyId === d.id} onClick={() => setEntreeFor(d)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#2B6CB0', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                              <LogIn size={11} /> {t('placer')}
                            </button>
                          )}
                          {!placable && (
                            <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Box size={12} /> {t('enChambre')}</span>
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
        )
      )}

      {/* ── CASIERS ── */}
      {!loading && tab === 'casiers' && (
        casiers.length === 0 ? <Empty t={t} label={t('aucunCasier')} /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, animation: 'fadeUp .25s ease' }}>
          {casiers.map(c => {
            const cfg = CASIER_CFG[c.statut];
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: `1px solid ${cfg.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#1A2332', fontFamily: 'monospace' }}>{c.numero}</span>
                  <Box size={18} color={cfg.color} />
                </div>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{t(`statutCasier.${c.statut}`)}</span>
                {c.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>{c.description}</div>}
              </div>
            );
          })}
        </div>
        )
      )}

      {/* ── SÉJOURS ── */}
      {!loading && tab === 'sejours' && (
        sejours.length === 0 ? <Empty t={t} label={t('aucunSejour')} /> : (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[t('thDefunt'), t('thCasier'), t('thEntree'), t('thSortie'), t('thStatutSejour'), t('thFrais'), t('thActions')].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sejours.map(s => (
                  <tr key={s.id} className="mg-row" style={{ borderTop: '1px solid #F0F4FA' }}>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151' }}>
                      <div style={{ fontWeight: 700 }}>{s.deces ? `${s.deces.defuntNom} ${s.deces.defuntPrenom}` : '—'}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{s.deces?.numero}</div>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: '#1A2332' }}>{s.casier?.numero ?? '—'}</td>
                    <td style={{ padding: '13px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(s.dateEntree)}</td>
                    <td style={{ padding: '13px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(s.dateSortie)}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: s.statut === 'en_chambre' ? '#EFF6FF' : '#F0FDF4', color: s.statut === 'en_chambre' ? '#1D4ED8' : '#15803D', border: `1px solid ${s.statut === 'en_chambre' ? '#93C5FD' : '#86EFAC'}` }}>{t(`statutSejour.${s.statut}`)}</span>
                    </td>
                    <td style={{ padding: '13px 14px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>
                      {s.fraisConservation != null ? `${Number(s.fraisConservation).toLocaleString('fr-FR')} FCFA` : <span style={{ color: '#9CA3AF' }}>{Number(s.tarifJournalier).toLocaleString('fr-FR')}/{t('jour')}</span>}
                    </td>
                    <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                      {s.statut === 'en_chambre' && (
                        <button className="mg-btn" disabled={busyId === s.id} onClick={() => setRemiseFor(s)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: '#15803D', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                          <LogOut size={11} /> {t('remettre')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}

      {modalDeces && <DecesModal onClose={() => setModalDeces(false)} onDone={() => { setModalDeces(false); load(); }} />}
      {modalCasier && <CasierModal onClose={() => setModalCasier(false)} onDone={() => { setModalCasier(false); load(); }} />}
      {entreeFor && <EntreeModal deces={entreeFor} casiersLibres={casiers.filter(c => c.statut === 'libre')} onClose={() => setEntreeFor(null)} onDone={() => { setEntreeFor(null); load(); }} />}
      {remiseFor && <RemiseModal sejour={remiseFor} onClose={() => setRemiseFor(null)} onDone={() => { setRemiseFor(null); load(); }} />}
    </div>
  );
}

function Empty({ t, label }: { t: ReturnType<typeof useTranslations>; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#90A4AE', background: '#fff', borderRadius: 14, border: '1px dashed #CBD5E1' }}>
      <Snowflake size={34} color="#CBD5E1" style={{ marginBottom: 10 }} />
      <p style={{ margin: 0, fontWeight: 700, color: '#546E7A' }}>{label}</p>
    </div>
  );
}

const lblSt: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 };
const inpSt: React.CSSProperties = { width: '100%', border: '1px solid #D1D9E6', borderRadius: 9, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

function ModalShell({ title, icon, onClose, children, footer }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', background: 'linear-gradient(135deg,#1E3A5F,#2B6CB0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon}<h2 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 800 }}>{title}</h2></div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
        <div style={{ display: 'flex', gap: 10, padding: '16px 22px', borderTop: '1px solid #EEF2F7' }}>{footer}</div>
      </div>
    </div>
  );
}

// ── Modale : enregistrer un décès ────────────────────────────────────────────
function DecesModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useTranslations('morgue');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<Sexe>('indetermine');
  const [age, setAge] = useState('');
  const [dateHeure, setDateHeure] = useState('');
  const [lieu, setLieu] = useState<Lieu>('service');
  const [cause, setCause] = useState('');
  const [medecin, setMedecin] = useState('');
  const [emettre, setEmettre] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = nom.trim() && prenom.trim() && dateHeure;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient('/morgue/deces', {
        method: 'POST',
        body: {
          defuntNom: nom.trim(),
          defuntPrenom: prenom.trim(),
          defuntSexe: sexe,
          defuntAge: age ? Number(age) : undefined,
          dateHeureDeces: new Date(dateHeure).toISOString(),
          lieuDeces: lieu,
          causeDeces: cause.trim() || undefined,
          medecinConstatantRef: medecin.trim() || undefined,
          emettreCertificat: emettre,
        },
      });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : t('creationImpossible')); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell title={t('modalDecesTitre')} icon={<UserX size={20} color="#fff" />} onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
        <button onClick={submit} disabled={!canSubmit || submitting} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: (!canSubmit || submitting) ? '#9DB4D4' : 'linear-gradient(135deg,#1E3A5F,#2B6CB0)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('creation')}</> : <><Plus size={15} /> {t('enregistrer')}</>}
        </button>
      </>}>
      {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><label style={lblSt}>{t('labelNom')} *</label><input style={inpSt} value={nom} onChange={e => setNom(e.target.value)} /></div>
        <div><label style={lblSt}>{t('labelPrenom')} *</label><input style={inpSt} value={prenom} onChange={e => setPrenom(e.target.value)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><label style={lblSt}>{t('labelSexe')}</label>
          <select style={inpSt} value={sexe} onChange={e => setSexe(e.target.value as Sexe)}>
            <option value="M">{t('sexe.M')}</option>
            <option value="F">{t('sexe.F')}</option>
            <option value="indetermine">{t('sexe.indetermine')}</option>
          </select>
        </div>
        <div><label style={lblSt}>{t('labelAge')}</label><input type="number" min={0} style={inpSt} value={age} onChange={e => setAge(e.target.value)} /></div>
      </div>
      <div><label style={lblSt}>{t('labelDateDeces')} *</label><input type="datetime-local" style={inpSt} value={dateHeure} onChange={e => setDateHeure(e.target.value)} /></div>
      <div><label style={lblSt}>{t('labelLieu')}</label>
        <select style={inpSt} value={lieu} onChange={e => setLieu(e.target.value as Lieu)}>
          <option value="service">{t('lieu.service')}</option>
          <option value="domicile">{t('lieu.domicile')}</option>
          <option value="arrivee">{t('lieu.arrivee')}</option>
          <option value="autre">{t('lieu.autre')}</option>
        </select>
      </div>
      <div><label style={lblSt}>{t('labelCause')}</label><textarea style={{ ...inpSt, minHeight: 54, resize: 'vertical' }} value={cause} onChange={e => setCause(e.target.value)} /></div>
      <div><label style={lblSt}>{t('labelMedecin')}</label><input style={inpSt} value={medecin} onChange={e => setMedecin(e.target.value)} /></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
        <input type="checkbox" checked={emettre} onChange={e => setEmettre(e.target.checked)} /> {t('labelEmettreCertificat')}
      </label>
    </ModalShell>
  );
}

// ── Modale : créer un casier ─────────────────────────────────────────────────
function CasierModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useTranslations('morgue');
  const [numero, setNumero] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!numero.trim()) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient('/morgue/casiers', { method: 'POST', body: { numero: numero.trim(), description: description.trim() || undefined } });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : t('creationImpossible')); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell title={t('modalCasierTitre')} icon={<Box size={20} color="#fff" />} onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
        <button onClick={submit} disabled={!numero.trim() || submitting} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: (!numero.trim() || submitting) ? '#9DB4D4' : 'linear-gradient(135deg,#1E3A5F,#2B6CB0)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (!numero.trim() || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />} {t('creer')}
        </button>
      </>}>
      {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
      <div><label style={lblSt}>{t('labelNumeroCasier')} *</label><input style={inpSt} value={numero} onChange={e => setNumero(e.target.value)} placeholder="CF-01" /></div>
      <div><label style={lblSt}>{t('labelDescription')}</label><input style={inpSt} value={description} onChange={e => setDescription(e.target.value)} /></div>
    </ModalShell>
  );
}

// ── Modale : placer un corps ─────────────────────────────────────────────────
function EntreeModal({ deces, casiersLibres, onClose, onDone }: { deces: Deces; casiersLibres: Casier[]; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('morgue');
  const [casierId, setCasierId] = useState('');
  const [dateEntree, setDateEntree] = useState('');
  const [tarif, setTarif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!casierId) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient('/morgue/sejours/entree', {
        method: 'POST',
        body: {
          decesId: deces.id,
          casierId,
          dateEntree: dateEntree ? new Date(dateEntree).toISOString() : undefined,
          tarifJournalier: tarif ? Number(tarif) : undefined,
        },
      });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : t('actionImpossible')); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell title={t('modalEntreeTitre', { defunt: `${deces.defuntNom} ${deces.defuntPrenom}` })} icon={<LogIn size={20} color="#fff" />} onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
        <button onClick={submit} disabled={!casierId || submitting} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: (!casierId || submitting) ? '#9DB4D4' : 'linear-gradient(135deg,#1E3A5F,#2B6CB0)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (!casierId || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={15} />} {t('placer')}
        </button>
      </>}>
      {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
      {casiersLibres.length === 0 && <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{t('aucunCasierLibre')}</div>}
      <div><label style={lblSt}>{t('labelCasier')} *</label>
        <select style={inpSt} value={casierId} onChange={e => setCasierId(e.target.value)}>
          <option value="">{t('choisirCasier')}</option>
          {casiersLibres.map(c => <option key={c.id} value={c.id}>{c.numero}{c.description ? ` — ${c.description}` : ''}</option>)}
        </select>
      </div>
      <div><label style={lblSt}>{t('labelDateEntree')}</label><input type="datetime-local" style={inpSt} value={dateEntree} onChange={e => setDateEntree(e.target.value)} /></div>
      <div><label style={lblSt}>{t('labelTarifJournalier')}</label><input type="number" min={0} style={inpSt} value={tarif} onChange={e => setTarif(e.target.value)} placeholder="5000" /></div>
    </ModalShell>
  );
}

// ── Modale : remise du corps ─────────────────────────────────────────────────
function RemiseModal({ sejour, onClose, onDone }: { sejour: Sejour; onClose: () => void; onDone: () => void }) {
  const t = useTranslations('morgue');
  const [nom, setNom] = useState('');
  const [lien, setLien] = useState('');
  const [piece, setPiece] = useState('');
  const [agent, setAgent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!nom.trim()) return;
    setSubmitting(true); setErr(null);
    try {
      await apiClient(`/morgue/sejours/${sejour.id}/remise`, {
        method: 'PATCH',
        body: {
          personneRemiseNom: nom.trim(),
          personneRemiseLien: lien.trim() || undefined,
          personneRemisePiece: piece.trim() || undefined,
          agentRef: agent.trim() || undefined,
        },
      });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : t('actionImpossible')); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell title={t('modalRemiseTitre')} icon={<LogOut size={20} color="#fff" />} onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #D1D9E6', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
        <button onClick={submit} disabled={!nom.trim() || submitting} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: (!nom.trim() || submitting) ? '#9DB4D4' : 'linear-gradient(135deg,#166534,#15803D)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: (!nom.trim() || submitting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <LogOut size={15} />} {t('confirmerRemise')}
        </button>
      </>}>
      {err && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600 }}>{err}</div>}
      <div style={{ background: '#F8FAFC', borderRadius: 9, padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>
        {t('remiseInfo', { defunt: sejour.deces ? `${sejour.deces.defuntNom} ${sejour.deces.defuntPrenom}` : '—', casier: sejour.casier?.numero ?? '—' })}
      </div>
      <div><label style={lblSt}>{t('labelPersonneNom')} *</label><input style={inpSt} value={nom} onChange={e => setNom(e.target.value)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><label style={lblSt}>{t('labelLien')}</label><input style={inpSt} value={lien} onChange={e => setLien(e.target.value)} placeholder={t('placeholderLien')} /></div>
        <div><label style={lblSt}>{t('labelPiece')}</label><input style={inpSt} value={piece} onChange={e => setPiece(e.target.value)} /></div>
      </div>
      <div><label style={lblSt}>{t('labelAgent')}</label><input style={inpSt} value={agent} onChange={e => setAgent(e.target.value)} /></div>
    </ModalShell>
  );
}
