'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarClock, Plus, RefreshCw, X, ChevronLeft, ChevronRight,
  Users, ShieldCheck, Moon, Sun, Bell, Clock, AlertTriangle,
  CheckCircle, XCircle, Repeat,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types (miroir du backend src/plannings-gardes) ──────────────────────────
type TypeGarde = 'garde_jour' | 'garde_nuit' | 'astreinte' | '24h';
type StatutGarde = 'planifiee' | 'effectuee' | 'absente' | 'remplacee';

interface Personne { id: string; nom: string; prenom: string }
interface Garde {
  id: string;
  personnelRef: string;
  service: string;
  typeGarde: TypeGarde;
  date: string;
  heureDebut: string;
  heureFin: string;
  statut: StatutGarde;
  remplacantRef?: string | null;
  notes?: string | null;
  personnel?: Personne | null;
  remplacant?: Personne | null;
}
interface UserLite { id: string; firstName: string; lastName: string; role?: string }
interface Stats {
  totalSemaine: number;
  planifiees: number;
  effectuees: number;
  absentes: number;
  remplacees: number;
  tauxCouverture: number;
  parService: { service: string; count: number }[];
}

const TYPE_META: Record<TypeGarde, { bg: string; color: string; border: string; icon: JSX.Element }> = {
  garde_jour: { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', icon: <Sun size={11} /> },
  garde_nuit: { bg: '#E0E7FF', color: '#3730A3', border: '#A5B4FC', icon: <Moon size={11} /> },
  astreinte: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', icon: <Bell size={11} /> },
  '24h': { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', icon: <Clock size={11} /> },
};
const STATUT_META: Record<StatutGarde, { bg: string; color: string }> = {
  planifiee: { bg: '#E0E8F0', color: '#546E7A' },
  effectuee: { bg: '#D1FAE5', color: '#065F46' },
  absente: { bg: '#FEE2E2', color: '#991B1B' },
  remplacee: { bg: '#FEF3C7', color: '#92400E' },
};

const unwrap = (r: any): any[] =>
  Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
const fullName = (p?: Personne | null) => (p ? `${p.prenom} ${p.nom}`.trim() : '—');
const iso = (d: Date) => d.toISOString().slice(0, 10);

function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function PlanningsGardesPage() {
  const t = useTranslations('planningsGardes');
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [gardes, setGardes] = useState<Garde[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [serviceFilter, setServiceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [remplacerFor, setRemplacerFor] = useState<Garde | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart],
  );
  const weekEnd = weekDays[6];

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const debut = iso(weekStart);
      const fin = iso(weekEnd);
      const [gRes, uRes, sRes] = await Promise.allSettled([
        apiClient<any>(`/plannings-gardes/calendrier?debut=${debut}&fin=${fin}`),
        apiClient<any>('/users'),
        apiClient<any>(`/plannings-gardes/stats?date=${debut}`),
      ]);
      if (gRes.status === 'fulfilled') setGardes(unwrap(gRes.value));
      if (uRes.status === 'fulfilled') setUsers(unwrap(uRes.value));
      if (sRes.status === 'fulfilled') setStats(sRes.value as Stats);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const services = useMemo(
    () => [...new Set(gardes.map(g => g.service))].sort(),
    [gardes],
  );
  const visible = useMemo(
    () => gardes.filter(g => !serviceFilter || g.service === serviceFilter),
    [gardes, serviceFilter],
  );

  const handleCreate = async (form: Record<string, string>) => {
    setBusy(true); setError(null);
    try {
      await apiClient('/plannings-gardes', {
        method: 'POST',
        body: {
          personnelRef: form.personnelRef,
          service: form.service,
          typeGarde: form.typeGarde,
          date: form.date,
          heureDebut: form.heureDebut,
          heureFin: form.heureFin,
          notes: form.notes || undefined,
        },
      });
      setShowModal(false);
      await load();
    } catch (e: any) { setError(e?.message || t('errCreate')); throw e; }
    finally { setBusy(false); }
  };

  const handleStatut = async (id: string, statut: StatutGarde) => {
    setBusy(true); setError(null);
    try {
      await apiClient(`/plannings-gardes/${id}/statut`, { method: 'PATCH', body: { statut } });
      await load();
    } catch (e: any) { setError(e?.message || t('errStatut')); }
    finally { setBusy(false); }
  };

  const handleRemplacer = async (id: string, remplacantRef: string) => {
    setBusy(true); setError(null);
    try {
      await apiClient(`/plannings-gardes/${id}/remplacer`, { method: 'PATCH', body: { remplacantRef } });
      setRemplacerFor(null);
      await load();
    } catch (e: any) { setError(e?.message || t('errRemplacer')); throw e; }
    finally { setBusy(false); }
  };

  const gardesOf = (d: Date) =>
    visible
      .filter(g => g.date.slice(0, 10) === iso(d))
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const shiftWeek = (n: number) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + n * 7);
    setWeekStart(mondayOf(d));
  };

  const todayISO = iso(new Date());
  const kpis = [
    { label: t('kpiTotal'), val: stats?.totalSemaine ?? visible.length, icon: <CalendarClock size={11} /> },
    { label: t('kpiPlanifiees'), val: stats?.planifiees ?? 0, icon: <Clock size={11} /> },
    { label: t('kpiEffectuees'), val: stats?.effectuees ?? 0, icon: <CheckCircle size={11} /> },
    { label: t('kpiCouverture'), val: (stats?.tauxCouverture ?? 100) + '%', icon: <ShieldCheck size={11} /> },
  ];

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .g-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.14); transform:translateY(-1px); }
      `}</style>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E293B 50%,#334155 100%)', borderRadius: 18, padding: '22px 26px 18px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.4)' }}>
        <div style={{ position: 'absolute', top: -60, right: 50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarClock size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('titre')}</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{t('sousTitre')}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={load} disabled={loading} style={heroBtn}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('actualiser')}
              </button>
              <button onClick={() => { setError(null); setShowModal(true); }} style={{ ...heroBtn, background: '#fff', color: '#0F172A', border: 'none', fontWeight: 800 }}>
                <Plus size={14} /> {t('planifier')}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {kpis.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '5px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{loading ? '…' : s.val}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: 11, border: '1.5px solid #E0E8F0', padding: 4 }}>
          <button onClick={() => shiftWeek(-1)} style={navBtn}><ChevronLeft size={16} color="#546E7A" /></button>
          <button onClick={() => setWeekStart(mondayOf(new Date()))} style={{ ...navBtn, width: 'auto', padding: '0 12px', fontSize: 12, fontWeight: 700, color: '#37474F' }}>{t('aujourdhui')}</button>
          <button onClick={() => shiftWeek(1)} style={navBtn}><ChevronRight size={16} color="#546E7A" /></button>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>
          {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} – {weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <div style={{ flex: 1 }} />
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, color: '#1A2332', outline: 'none' }}>
          <option value="">{t('tousServices')}</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── CALENDRIER HEBDO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginBottom: 18 }}>
        {weekDays.map((d, i) => {
          const list = gardesOf(d);
          const isToday = iso(d) === todayISO;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: isToday ? '1.5px solid #6366F1' : '1.5px solid transparent', overflow: 'hidden', minHeight: 140, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '9px 12px', borderBottom: '1.5px solid #EEF2F8', background: isToday ? '#EEF0FF' : '#F8FAFC' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: isToday ? '#4338CA' : '#1A2332' }}>{d.getDate()}</div>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {!loading && list.length === 0 && (
                  <div style={{ fontSize: 11, color: '#B0BEC5', textAlign: 'center', marginTop: 12 }}>—</div>
                )}
                {list.map(g => {
                  const meta = TYPE_META[g.typeGarde];
                  const st = STATUT_META[g.statut];
                  return (
                    <div key={g.id} className="g-card" style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 9, padding: '7px 8px', transition: 'all .12s', cursor: 'default' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: meta.color }}>{g.heureDebut.slice(0, 5)}–{g.heureFin.slice(0, 5)}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1A2332', lineHeight: 1.2 }}>{fullName(g.personnel) !== '—' ? fullName(g.personnel) : g.personnelRef.slice(0, 8)}</div>
                      <div style={{ fontSize: 10, color: '#546E7A', marginTop: 1 }}>{g.service}</div>
                      {g.statut === 'remplacee' && g.remplacant && (
                        <div style={{ fontSize: 10, color: '#92400E', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Repeat size={9} /> {fullName(g.remplacant)}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10, background: st.bg, color: st.color }}>{t(`statut.${g.statut}`)}</span>
                        {g.statut === 'planifiee' && (
                          <>
                            <button title={t('marquerEffectuee')} onClick={() => handleStatut(g.id, 'effectuee')} disabled={busy} style={miniBtn('#D1FAE5')}><CheckCircle size={11} color="#065F46" /></button>
                            <button title={t('marquerAbsente')} onClick={() => handleStatut(g.id, 'absente')} disabled={busy} style={miniBtn('#FEE2E2')}><XCircle size={11} color="#991B1B" /></button>
                            <button title={t('remplacer')} onClick={() => setRemplacerFor(g)} disabled={busy} style={miniBtn('#FEF3C7')}><Repeat size={11} color="#92400E" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── COUVERTURE PAR SERVICE ── */}
      {stats && stats.parService.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '18px 22px', marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>{t('gardesParService')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.parService.map(s => {
              const pct = stats.totalSemaine > 0 ? Math.round((s.count / stats.totalSemaine) * 100) : 0;
              return (
                <div key={s.service}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: '#37474F' }}>{s.service}</span>
                    <span style={{ fontWeight: 800, color: '#4338CA' }}>{t('nGardes', { count: s.count })}</span>
                  </div>
                  <div style={{ height: 7, background: '#F0F4FA', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#4338CA,#6366F1)', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <GardeModal busy={busy} users={users} services={services} onClose={() => setShowModal(false)} onSubmit={handleCreate} />
      )}
      {remplacerFor && (
        <RemplacerModal busy={busy} garde={remplacerFor} users={users} onClose={() => setRemplacerFor(null)} onSubmit={(ref) => handleRemplacer(remplacerFor.id, ref)} />
      )}
    </div>
  );
}

// ── Styles partagés ──────────────────────────────────────────────────────────
const heroBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 };
const navBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const miniBtn = (bg: string): React.CSSProperties => ({ width: 22, height: 22, borderRadius: 6, border: 'none', background: bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 });
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };
const cardS: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' };
const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5, display: 'block' };
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#1A2332' }}>{title}</h2>
      <button onClick={onClose} style={{ border: 'none', background: '#F3F4F6', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#546E7A" /></button>
    </div>
  );
}

function GardeModal({ busy, users, services, onClose, onSubmit }: { busy: boolean; users: UserLite[]; services: string[]; onClose: () => void; onSubmit: (f: Record<string, string>) => Promise<void> }) {
  const t = useTranslations('planningsGardes');
  const [f, setF] = useState<Record<string, string>>({ typeGarde: 'garde_jour', date: new Date().toISOString().slice(0, 10), heureDebut: '08:00', heureFin: '20:00' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const overlaps = f.heureFin <= f.heureDebut && f.typeGarde !== 'garde_nuit' && f.typeGarde !== '24h';
  const valid = f.personnelRef && f.service && f.date && f.heureDebut && f.heureFin;
  return (
    <div style={overlay} onClick={onClose}>
      <div style={cardS} onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('modalPlanifier')} onClose={onClose} />
        <div style={{ display: 'grid', gap: 12 }}>
          <div><label style={labelS}>{t('mPersonnel')}</label>
            <select style={inputS} value={f.personnelRef ?? ''} onChange={e => set('personnelRef', e.target.value)}>
              <option value="">{t('mSelectionner')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}{u.role ? ` — ${u.role}` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelS}>{t('mService')}</label>
              <input style={inputS} list="svc-list" value={f.service ?? ''} onChange={e => set('service', e.target.value)} placeholder={t('mServicePlaceholder')} />
              <datalist id="svc-list">{services.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div><label style={labelS}>{t('mTypeGarde')}</label>
              <select style={inputS} value={f.typeGarde} onChange={e => set('typeGarde', e.target.value)}>
                <option value="garde_jour">{t('type.garde_jour')}</option>
                <option value="garde_nuit">{t('type.garde_nuit')}</option>
                <option value="astreinte">{t('type.astreinte')}</option>
                <option value="24h">{t('type.24h')}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelS}>{t('mDate')}</label><input style={inputS} type="date" value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label style={labelS}>{t('mDebut')}</label><input style={inputS} type="time" value={f.heureDebut} onChange={e => set('heureDebut', e.target.value)} /></div>
            <div><label style={labelS}>{t('mFin')}</label><input style={inputS} type="time" value={f.heureFin} onChange={e => set('heureFin', e.target.value)} /></div>
          </div>
          {overlaps && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
              <AlertTriangle size={14} /> {t('alerteHoraire')}
            </div>
          )}
          <div><label style={labelS}>{t('mNotes')}</label><input style={inputS} value={f.notes ?? ''} onChange={e => set('notes', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('annuler')}</button>
          <button onClick={() => { if (valid) onSubmit(f).catch(() => {}); }} disabled={!valid || busy} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4338CA', color: '#fff', fontSize: 13, fontWeight: 800, cursor: (!valid || busy) ? 'not-allowed' : 'pointer', opacity: (!valid || busy) ? 0.5 : 1 }}>{busy ? t('enregistrement') : t('planifier')}</button>
        </div>
      </div>
    </div>
  );
}

function RemplacerModal({ busy, garde, users, onClose, onSubmit }: { busy: boolean; garde: Garde; users: UserLite[]; onClose: () => void; onSubmit: (ref: string) => Promise<void> }) {
  const t = useTranslations('planningsGardes');
  const [ref, setRef] = useState('');
  const candidats = users.filter(u => u.id !== garde.personnelRef);
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...cardS, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <ModalHeader title={t('modalRemplacer')} onClose={onClose} />
        <div style={{ fontSize: 13, color: '#546E7A', marginBottom: 14 }}>
          {t('remplacerInfo', { personne: fullName(garde.personnel) !== '—' ? fullName(garde.personnel) : garde.personnelRef.slice(0, 8), date: new Date(garde.date).toLocaleDateString('fr-FR'), debut: garde.heureDebut.slice(0, 5), fin: garde.heureFin.slice(0, 5) })}
        </div>
        <label style={labelS}>{t('mRemplacant')}</label>
        <select style={inputS} value={ref} onChange={e => setRef(e.target.value)}>
          <option value="">{t('mSelectionner')}</option>
          {candidats.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('annuler')}</button>
          <button onClick={() => { if (ref) onSubmit(ref).catch(() => {}); }} disabled={!ref || busy} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#92400E', color: '#fff', fontSize: 13, fontWeight: 800, cursor: (!ref || busy) ? 'not-allowed' : 'pointer', opacity: (!ref || busy) ? 0.5 : 1 }}>{busy ? t('enregistrement') : t('confirmerRemplacement')}</button>
        </div>
      </div>
    </div>
  );
}
