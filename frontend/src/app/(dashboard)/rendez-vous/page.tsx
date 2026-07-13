'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutRdv = 'planifie' | 'confirme' | 'annule' | 'absent' | 'honore';

type Rdv = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?: { id: string; nom: string; prenom: string };
  dateHeure: string; duree?: number; motif?: string; statut: StatutRdv;
};

const STATUT_CONFIG: Record<StatutRdv, { label: string; bg: string; color: string; border: string }> = {
  planifie: { label: 'Planifié',  bg: '#EFF6FF', color: '#1565C0', border: '#1565C0' },
  confirme: { label: 'Confirmé',  bg: '#1565C0', color: '#fff',    border: '#0D47A1' },
  annule:   { label: 'Annulé',   bg: '#F5F5F5', color: '#9E9E9E', border: '#BDBDBD' },
  absent:   { label: 'Absent',   bg: '#FFEBEE', color: '#C62828', border: '#C62828' },
  honore:   { label: 'Honoré',   bg: '#E8F5E9', color: '#2E7D32', border: '#2E7D32' },
};

const JOURS_COURT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtHeure(iso: string) {
  try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function RendezVousPage() {
  const router = useRouter();
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [view, setView] = useState<'semaine' | 'liste'>('semaine');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateDebut = weekStart.toISOString().split('T')[0];
      const dateFin = addDays(weekStart, 6).toISOString().split('T')[0];
      const data = await apiClient<any>(`/rendez-vous?dateDebut=${dateDebut}&dateFin=${dateFin}&limit=200`);
      const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      setRdvs(list);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const semaineDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = new Date().toDateString();

  const getRdvsForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return rdvs.filter(r => r.dateHeure.startsWith(dayStr)).sort((a, b) => a.dateHeure.localeCompare(b.dateHeure));
  };

  const patientName = (r: Rdv) => r.patient ? `${r.patient.prenom} ${r.patient.nom}` : '—';

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EDE7F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#6A1B9A" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Rendez-vous</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${rdvs.length} RDV cette semaine`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
            {(['semaine', 'liste'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '7px 14px', border: 'none', background: view === v ? '#6A1B9A' : '#fff', color: view === v ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {v === 'semaine' ? 'Semaine' : 'Liste'}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => router.push('/rendez-vous/nouveau')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#6A1B9A', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouveau RDV
          </button>
        </div>
      </div>

      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setWeekStart(d => addDays(d, -7))}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={16} color="#546E7A" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#37474F' }}>
          {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} — {addDays(weekStart, 6).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={16} color="#546E7A" />
        </button>
        <button onClick={() => setWeekStart(getWeekStart(new Date()))}
          style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#546E7A', fontWeight: 600 }}>
          Aujourd'hui
        </button>
      </div>

      {view === 'semaine' ? (
        /* Vue semaine */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {semaineDays.map((day, i) => {
            const dayRdvs = getRdvsForDay(day);
            const isToday = day.toDateString() === todayStr;
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', border: isToday ? '2px solid #6A1B9A' : '1px solid #E0E0E0' }}>
                <div style={{ padding: '8px 10px', background: isToday ? '#6A1B9A' : '#F8FAFC', borderBottom: '1px solid #E0E0E0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'rgba(255,255,255,0.8)' : '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{JOURS_COURT[i]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? '#fff' : '#1A2332', lineHeight: 1.2 }}>{day.getDate()}</div>
                </div>
                <div style={{ padding: '6px', minHeight: 80 }}>
                  {loading ? (
                    <div style={{ height: 40, background: '#F0F0F0', borderRadius: 6, margin: '4px 0' }} />
                  ) : dayRdvs.length === 0 ? (
                    <p style={{ fontSize: 10, color: '#CFD8DC', textAlign: 'center', marginTop: 16 }}>Libre</p>
                  ) : dayRdvs.map(r => {
                    const cfg = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.planifie;
                    return (
                      <div key={r.id} onClick={() => router.push(`/rendez-vous/${r.id}`)}
                        style={{ padding: '5px 7px', borderRadius: 6, background: cfg.bg, borderLeft: `3px solid ${cfg.border}`, marginBottom: 4, cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.opacity = '0.8')}
                        onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.opacity = '1')}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{fmtHeure(r.dateHeure)}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#37474F', marginTop: 1, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patientName(r)}</div>
                        {r.motif && <div style={{ fontSize: 10, color: '#90A4AE', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.motif}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vue liste */
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  {['Date & Heure', 'Patient', 'Médecin', 'Motif', 'Durée', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 80 }} /></td>
                    ))}
                  </tr>
                )) : rdvs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#90A4AE' }}>
                    <Calendar size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    Aucun rendez-vous cette semaine
                  </td></tr>
                ) : rdvs.map(r => {
                  const cfg = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.planifie;
                  return (
                    <tr key={r.id} style={{ borderTop: '1px solid #F5F7FA', cursor: 'pointer' }}
                      onClick={() => router.push(`/rendez-vous/${r.id}`)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} color="#90A4AE" />
                          {new Date(r.dateHeure).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{patientName(r)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{r.medecin ? `Dr. ${r.medecin.prenom} ${r.medecin.nom}` : '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', maxWidth: 160 }}>{r.motif || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{r.duree ? `${r.duree} min` : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
