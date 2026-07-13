'use client';

import { useState, useEffect, useCallback } from 'react';
import { Scan, RefreshCw, Plus, Clock, CheckCircle, AlertCircle, FileImage, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutExamen = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'VALIDE' | string;

type Examen = {
  id: string;
  numero?: string;
  patient?: { id: string; nom: string; prenom: string };
  medecin?: { id: string; nom: string; prenom: string };
  typeExamen?: string; type?: string;
  regionAnatomique?: string; region?: string;
  statut: StatutExamen;
  dateExamen?: string; date?: string;
  heure?: string;
  urgence?: boolean;
  resultat?: string | null;
};

type Stats = { total?: number; enAttente?: number; enCours?: number; termines?: number };

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  EN_ATTENTE: { label: 'En attente', color: '#E65100', bg: '#FFF3E0', icon: <Clock size={12} /> },
  EN_COURS:   { label: 'En cours',   color: '#1565C0', bg: '#EFF6FF', icon: <RefreshCw size={12} /> },
  TERMINE:    { label: 'Terminé',    color: '#00695C', bg: '#E0F2F1', icon: <CheckCircle size={12} /> },
  VALIDE:     { label: 'Validé',     color: '#2E7D32', bg: '#E8F5E9', icon: <CheckCircle size={12} /> },
};

function patientName(e: Examen) {
  if (!e.patient) return '—';
  return `${e.patient.prenom} ${e.patient.nom}`;
}

function typeLabel(e: Examen) { return e.typeExamen ?? e.type ?? '—'; }
function regionLabel(e: Examen) { return e.regionAnatomique ?? e.region ?? '—'; }

export default function ImagériePage() {
  const [examens, setExamens] = useState<Examen[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<string>('TOUS');
  const [selected, setSelected] = useState<Examen | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [examRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/imagerie/examens?limit=100'),
        apiClient<any>('/imagerie/stats/jour'),
      ]);
      if (examRes.status === 'fulfilled') {
        const data = examRes.value;
        setExamens(Array.isArray(data) ? data : data?.items ?? data?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value ?? {});
      }
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filtre === 'TOUS' ? examens : examens.filter(e => e.statut === filtre);

  const kpis = [
    { label: 'Total du jour', value: stats.total ?? examens.length, color: '#0D47A1', bg: '#EFF6FF' },
    { label: 'En attente', value: stats.enAttente ?? examens.filter(e => e.statut === 'EN_ATTENTE').length, color: '#E65100', bg: '#FFF3E0' },
    { label: 'En cours', value: stats.enCours ?? examens.filter(e => e.statut === 'EN_COURS').length, color: '#1565C0', bg: '#E3F2FD' },
    { label: 'Terminés', value: stats.termines ?? examens.filter(e => ['TERMINE','VALIDE'].includes(e.statut)).length, color: '#2E7D32', bg: '#E8F5E9' },
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E0F2F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scan size={20} color="#00695C" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Imagerie Médicale</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${filtered.length} examen(s) affiché(s)`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#00695C', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouvel examen
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>
              {loading ? <div style={{ height: 24, width: 40, background: '#F0F0F0', borderRadius: 4 }} /> : k.value}
            </div>
            <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {['TOUS', 'EN_ATTENTE', 'EN_COURS', 'TERMINE', 'VALIDE'].map(f => {
          const cfg = f === 'TOUS' ? null : STATUT_CONFIG[f];
          const active = filtre === f;
          return (
            <button key={f} onClick={() => setFiltre(f)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? (cfg?.color ?? '#0D47A1') : '#E0E0E0'}`, background: active ? (cfg?.bg ?? '#EFF6FF') : '#fff', color: active ? (cfg?.color ?? '#0D47A1') : '#546E7A', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {f === 'TOUS' ? 'Tous' : cfg?.label ?? f}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: selected ? '1fr 380px' : '1fr', alignItems: 'start' }}>
        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  {['N°', 'Patient', 'Type d\'examen', 'Région', 'Médecin', 'Urgence', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 13, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 80 }} /></td>
                    ))}
                  </tr>
                )) : filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#90A4AE' }}>
                    <FileImage size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                    Aucun examen
                  </td></tr>
                ) : filtered.map(e => {
                  const cfg = STATUT_CONFIG[e.statut] ?? STATUT_CONFIG.EN_ATTENTE;
                  const active = selected?.id === e.id;
                  return (
                    <tr key={e.id} onClick={() => setSelected(active ? null : e)}
                      style={{ borderTop: '1px solid #F5F7FA', cursor: 'pointer', background: active ? '#F0F7FF' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={ev => !active && (ev.currentTarget.style.background = '#FAFBFC')}
                      onMouseLeave={ev => !active && (ev.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#546E7A' }}>{e.numero ?? e.id.slice(0,8).toUpperCase()}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{patientName(e)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F' }}>{typeLabel(e)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{regionLabel(e)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>
                        {e.medecin ? `Dr. ${e.medecin.prenom} ${e.medecin.nom}` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {e.urgence && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C62828', fontWeight: 700 }}>
                            <Zap size={12} /> Urgent
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panneau détail */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: '20px', position: 'sticky', top: 76 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Détail de l'examen</p>
                <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{typeLabel(selected)}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E0E0E0', background: '#F5F7FA', cursor: 'pointer', fontSize: 16, color: '#546E7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {[
              { label: 'Patient', value: patientName(selected) },
              { label: 'Région', value: regionLabel(selected) },
              { label: 'Médecin', value: selected.medecin ? `Dr. ${selected.medecin.prenom} ${selected.medecin.nom}` : '—' },
              { label: 'Statut', value: STATUT_CONFIG[selected.statut]?.label ?? selected.statut },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F7FA' }}>
                <span style={{ fontSize: 12, color: '#90A4AE' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#37474F' }}>{row.value}</span>
              </div>
            ))}

            {selected.resultat && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, borderLeft: '3px solid #00695C' }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Résultat</p>
                <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.5 }}>{selected.resultat}</p>
              </div>
            )}

            {!selected.resultat && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#FFF3E0', borderRadius: 8, borderLeft: '3px solid #E65100' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#E65100' }}>Résultat en attente</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
