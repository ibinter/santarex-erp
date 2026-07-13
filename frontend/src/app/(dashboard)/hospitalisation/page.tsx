'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, RefreshCw, Plus, Users, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutLit = 'libre' | 'occupe' | 'nettoyage' | 'reserve';

type Lit = {
  id: string; numero: string; service?: string; salle?: string; statut: StatutLit;
  patient?: { id: string; nom: string; prenom: string };
  patientNom?: string; joursHospitalisation?: number;
};

type Sejour = {
  id: string; numero?: string; service?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  lit?: { id: string; numero: string; service?: string };
  medecin?: { id: string; nom: string; prenom: string };
  diagnosticEntree?: string; dateAdmission: string; statut: string;
};

type StatsHospitalisation = { litsLibres?: number; litsOccupes?: number; totalLits?: number; tauxOccupation?: number };

const LIT_CONFIG: Record<StatutLit, { bg: string; border: string; text: string; label: string; icon: string }> = {
  libre:      { bg: '#fff',    border: '#CBD5E1', text: '#64748B', label: 'Libre',      icon: '🛏️' },
  occupe:     { bg: '#E3F2FD', border: '#1976D2', text: '#0D47A1', label: 'Occupé',     icon: '👤' },
  nettoyage:  { bg: '#F5F5F5', border: '#90A4AE', text: '#546E7A', label: 'Nettoyage', icon: '🧹' },
  reserve:    { bg: '#FFFDE7', border: '#F9A825', text: '#E65100', label: 'Réservé',    icon: '📋' },
};

const SERVICES_ORDER = ['Médecine Générale', 'Chirurgie', 'Maternité', 'Pédiatrie', 'Réanimation', 'Orthopédie', 'Ophtalmologie'];

function joursDepuis(dateAdmission: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateAdmission).getTime()) / (1000 * 60 * 60 * 24)));
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

export default function HospitalisationPage() {
  const router = useRouter();
  const [lits, setLits] = useState<Lit[]>([]);
  const [sejours, setSejours] = useState<Sejour[]>([]);
  const [stats, setStats] = useState<StatsHospitalisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('');
  const [tab, setTab] = useState<'lits' | 'sejours'>('lits');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [litsRes, sejoursRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/hospitalisation/lits'),
        apiClient<any>('/hospitalisation/sejours/actifs'),
        apiClient<StatsHospitalisation>('/hospitalisation/sejours/stats'),
      ]);
      if (litsRes.status === 'fulfilled') {
        const d = litsRes.value;
        setLits(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      if (sejoursRes.status === 'fulfilled') {
        const d = sejoursRes.value;
        setSejours(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const litsAffiches = lits.filter(l => !serviceFilter || l.service === serviceFilter);
  const services = Array.from(new Set(lits.map(l => l.service).filter(Boolean) as string[])).sort((a, b) => {
    const ia = SERVICES_ORDER.indexOf(a); const ib = SERVICES_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const libres = lits.filter(l => l.statut === 'libre').length;
  const occupes = lits.filter(l => l.statut === 'occupe').length;
  const taux = lits.length > 0 ? Math.round((occupes / lits.length) * 100) : 0;

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BedDouble size={20} color="#1976D2" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Hospitalisation</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${lits.length} lits — ${occupes} occupés`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button onClick={() => router.push('/hospitalisation/admettre')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1976D2', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Admettre un patient
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total lits', value: loading ? '…' : lits.length, color: '#546E7A', bg: '#F5F5F5', icon: <BedDouble size={18} color="#546E7A" /> },
          { label: 'Lits occupés', value: loading ? '…' : occupes, color: '#1976D2', bg: '#E3F2FD', icon: <Users size={18} color="#1976D2" /> },
          { label: 'Lits libres', value: loading ? '…' : libres, color: '#2E7D32', bg: '#E8F5E9', icon: <BedDouble size={18} color="#2E7D32" /> },
          { label: 'Taux occupation', value: loading ? '…' : `${taux}%`, color: taux > 90 ? '#C62828' : taux > 70 ? '#E65100' : '#2E7D32', bg: taux > 90 ? '#FFEBEE' : taux > 70 ? '#FFF3E0' : '#E8F5E9', icon: <AlertTriangle size={18} color={taux > 80 ? '#E65100' : '#2E7D32'} /> },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[{ id: 'lits' as const, label: 'Plan des lits' }, { id: 'sejours' as const, label: `Séjours actifs (${sejours.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${tab === t.id ? '#1976D2' : '#E0E0E0'}`, background: tab === t.id ? '#1976D2' : '#fff', color: tab === t.id ? '#fff' : '#546E7A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lits' ? (
        <>
          {/* Filtre service */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['', ...services].map(s => (
              <button key={s || 'tous'} onClick={() => setServiceFilter(s)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${serviceFilter === s ? '#1976D2' : '#E0E0E0'}`, background: serviceFilter === s ? '#1976D2' : '#fff', color: serviceFilter === s ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {s || 'Tous les services'}
              </button>
            ))}
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            {Object.entries(LIT_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#546E7A' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: v.bg, border: `2px solid ${v.border}` }} />
                {v.label}
              </div>
            ))}
          </div>

          {/* Grille des lits */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ height: 100, background: '#F0F0F0', borderRadius: 10, animation: 'none' }} />
              ))}
            </div>
          ) : litsAffiches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#90A4AE' }}>
              <BedDouble size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              Aucun lit trouvé
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
              {litsAffiches.map(l => {
                const cfg = LIT_CONFIG[l.statut] ?? LIT_CONFIG.libre;
                const nomPatient = l.patientNom || (l.patient ? `${l.patient.prenom} ${l.patient.nom}` : null);
                return (
                  <div key={l.id} style={{ borderRadius: 10, border: `2px solid ${cfg.border}`, background: cfg.bg, padding: '10px 12px', minHeight: 95, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: cfg.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l.numero}</div>
                      {l.service && <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 2 }}>{l.service}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 18 }}>{cfg.icon}</div>
                      {nomPatient && <div style={{ fontSize: 11, fontWeight: 600, color: cfg.text, marginTop: 4, lineHeight: 1.2 }}>{nomPatient}</div>}
                      {l.joursHospitalisation !== undefined && <div style={{ fontSize: 10, color: '#90A4AE' }}>{l.joursHospitalisation}j</div>}
                      {!nomPatient && <div style={{ fontSize: 11, color: cfg.text, marginTop: 4 }}>{cfg.label}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Vue séjours */
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead style={{ background: '#F8FAFC' }}>
                <tr>
                  {['N° Séjour', 'Patient', 'Lit / Service', 'Médecin', 'Admission', 'Durée', 'Diagnostic', 'Statut'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 70 }} /></td>
                    ))}
                  </tr>
                )) : sejours.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#90A4AE' }}>
                    Aucun séjour actif
                  </td></tr>
                ) : sejours.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid #F5F7FA', cursor: 'pointer' }}
                    onClick={() => router.push(`/hospitalisation/${s.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#546E7A', fontFamily: 'monospace' }}>{s.numero || s.id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{s.patient ? `${s.patient.prenom} ${s.patient.nom}` : '—'}</div>
                      {s.patient?.ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{s.patient.ipp}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1976D2' }}>{s.lit?.numero || '—'}</div>
                      <div style={{ fontSize: 11, color: '#90A4AE' }}>{s.service || s.lit?.service || '—'}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{s.medecin ? `Dr. ${s.medecin.prenom} ${s.medecin.nom}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(s.dateAdmission)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{joursDepuis(s.dateAdmission)}j</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.diagnosticEntree || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#E3F2FD', color: '#1976D2' }}>Actif</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
