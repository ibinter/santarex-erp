'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Stethoscope, Plus, Search, RefreshCw, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Consultation = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  medecin?: { id: string; nom: string; prenom: string };
  dateHeure: string; motif?: string; diagnostic?: string;
  statut: 'en_cours' | 'terminee' | 'facturee';
};

const STATUT_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  en_cours: { label: 'En cours',  bg: '#EFF6FF', color: '#1565C0' },
  terminee: { label: 'Terminée',  bg: '#E8F5E9', color: '#2E7D32' },
  facturee: { label: 'Facturée',  bg: '#F5F5F5', color: '#546E7A' },
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<any>('/consultations?limit=100');
      const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      setConsultations(list);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = consultations.filter(c => {
    const q = search.toLowerCase();
    const nomPatient = c.patient ? `${c.patient.prenom} ${c.patient.nom}`.toLowerCase() : '';
    const matchSearch = !search || nomPatient.includes(q) || (c.patient?.ipp || '').toLowerCase().includes(q) || (c.numero || '').toLowerCase().includes(q);
    const matchStatut = !statutFilter || c.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const patientName = (c: Consultation) => c.patient ? `${c.patient.prenom} ${c.patient.nom}` : '—';
  const medecinName = (c: Consultation) => c.medecin ? `Dr. ${c.medecin.prenom} ${c.medecin.nom}` : '—';

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="#1565C0" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Consultations</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            {loading ? '…' : `${consultations.length} consultation(s)`}
            {lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <button onClick={() => router.push('/consultations/nouvelle')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#1565C0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouvelle consultation
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F5F7FA', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher patient, N° consultation…"
              style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, color: '#37474F', outline: 'none', background: '#fff' }}>
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="facturee">Facturée</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['N° Consultation', 'Patient', 'Médecin', 'Date & Heure', 'Motif', 'Diagnostic', 'Statut', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 120 : 80 }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#90A4AE', fontSize: 13 }}>
                  <Stethoscope size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Aucune consultation trouvée
                </td></tr>
              ) : displayed.map(c => {
                const cfg = STATUT_CONFIG[c.statut] ?? STATUT_CONFIG.terminee;
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#546E7A', fontFamily: 'monospace' }}>{c.numero || c.id.slice(0, 8)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{patientName(c)}</div>
                      {c.patient?.ipp && <div style={{ fontSize: 11, color: '#90A4AE' }}>{c.patient.ipp}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{medecinName(c)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', whiteSpace: 'nowrap' }}>{fmtDate(c.dateHeure)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#37474F', maxWidth: 180 }}>{c.motif || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.diagnostic ? '#1A2332' : '#90A4AE', maxWidth: 160 }}>{c.diagnostic || (c.statut === 'en_cours' ? 'En cours…' : '—')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => router.push(`/consultations/${c.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', color: '#546E7A', fontWeight: 600 }}>
                        <Eye size={12} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
