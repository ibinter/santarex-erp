'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, AlertTriangle, TrendingDown, Plus, Search, RefreshCw, ArrowDownToLine, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';

function exportStock() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://santarex.ibigsoft.com/api/v1';
  const a = document.createElement('a');
  a.href = `${base}/exports/pharmacie/stock/xlsx` + (token ? `?token=${encodeURIComponent(token)}` : '');
  a.download = 'stock-pharmacie.xlsx'; a.click();
}

type Medicament = {
  id: string; code: string; nom: string; nomCommercial?: string; dci?: string;
  forme?: string; dosage?: string; categorie?: string;
  stockActuel: number; stockMinimum: number; prixUnitaireAchat: number; prixVente: number;
  actif: boolean; createdAt: string;
};

type StatsJour = {
  totalMouvements?: number; valeurStock?: number; ruptures?: number; alertes?: number;
};

function fmtXOF(v: number) { return v.toLocaleString('fr-FR') + ' XOF'; }

function stockBadge(m: Medicament) {
  if (m.stockActuel <= 0) return { label: 'Rupture', bg: '#FFEBEE', color: '#C62828' };
  if (m.stockActuel <= m.stockMinimum) return { label: 'Alerte', bg: '#FFF3E0', color: '#E65100' };
  return { label: 'OK', bg: '#E8F5E9', color: '#2E7D32' };
}

const CATEGORIE_LABELS: Record<string, string> = {
  antibiotique: 'Antibiotique', antalgique: 'Antalgique', antihypertenseur: 'Antihypertenseur',
  antipaludeen: 'Antipaludéen', antidiabetique: 'Antidiabétique', autre: 'Autre',
};

export default function PharmaciePage() {
  const router = useRouter();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [stats, setStats] = useState<StatsJour | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'tous' | 'rupture' | 'alerte'>('tous');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [medsRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/pharmacie/medicaments?limit=200'),
        apiClient<StatsJour>('/pharmacie/stats/jour'),
      ]);
      if (medsRes.status === 'fulfilled') {
        const d = medsRes.value;
        setMedicaments(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const ruptures = medicaments.filter(m => m.stockActuel <= 0).length;
  const alertes = medicaments.filter(m => m.stockActuel > 0 && m.stockActuel <= m.stockMinimum).length;
  const valeurTotale = medicaments.reduce((acc, m) => acc + m.stockActuel * m.prixUnitaireAchat, 0);

  const displayed = medicaments.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search || m.nom.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || (m.dci || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (tab === 'rupture') return m.stockActuel <= 0;
    if (tab === 'alerte') return m.stockActuel > 0 && m.stockActuel <= m.stockMinimum;
    return true;
  });

  const TABS = [
    { id: 'tous' as const, label: 'Tous', count: medicaments.length },
    { id: 'rupture' as const, label: 'Rupture', count: ruptures, color: '#C62828' },
    { id: 'alerte' as const, label: 'Alerte stock', count: alertes, color: '#E65100' },
  ];

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#2E7D32" />
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A2332' }}>Pharmacie</h1>
          </div>
          <p style={{ margin: '4px 0 0 48px', fontSize: 12, color: '#546E7A' }}>
            Stock médicaments{lastRefresh && <span style={{ marginLeft: 8, color: '#90A4AE' }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#F5F7FA', border: '1px solid #E0E0E0', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>
          <button onClick={exportStock} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: '#E8F5E9', border: '1px solid #A5D6A7', cursor: 'pointer', fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>
            <Download size={14} /> XLSX
          </button>
          <button onClick={() => router.push('/pharmacie/medicaments/nouveau')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#2E7D32', border: 'none', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
            <Plus size={14} /> Nouveau
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total médicaments', value: loading ? '…' : medicaments.length, icon: <Package size={18} color="#0D47A1" />, color: '#0D47A1', bg: '#EFF6FF' },
          { label: 'Valeur du stock', value: loading ? '…' : fmtXOF(valeurTotale), icon: <TrendingDown size={18} color="#2E7D32" />, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'En rupture', value: loading ? '…' : ruptures, icon: <AlertTriangle size={18} color="#C62828" />, color: '#C62828', bg: '#FFEBEE' },
          { label: 'En alerte', value: loading ? '…' : alertes, icon: <AlertTriangle size={18} color="#E65100" />, color: '#E65100', bg: '#FFF3E0' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Recherche */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F5F7FA', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${tab === t.id ? '#0D47A1' : '#E0E0E0'}`, background: tab === t.id ? '#0D47A1' : '#fff', color: tab === t.id ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                {t.label}
                {t.count !== undefined && (
                  <span style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : (t.color ? t.color : '#E0E0E0'), color: tab === t.id ? '#fff' : (t.color ? '#fff' : '#546E7A'), borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto', minWidth: 220 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE', pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                style={{ width: '100%', padding: '7px 10px 7px 32px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['Code', 'Médicament', 'DCI / Forme', 'Stock actuel', 'Stock min.', 'Prix vente', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 14, background: '#F0F0F0', borderRadius: 4, width: j === 1 ? 140 : 70 }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#90A4AE', fontSize: 13 }}>
                  <Package size={32} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  Aucun médicament trouvé
                </td></tr>
              ) : displayed.map(m => {
                const badge = stockBadge(m);
                const pct = m.stockMinimum > 0 ? Math.min(100, Math.round((m.stockActuel / (m.stockMinimum * 3)) * 100)) : 100;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid #F5F7FA' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#546E7A', fontFamily: 'monospace' }}>{m.code}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{m.nom}</div>
                      {m.nomCommercial && <div style={{ fontSize: 11, color: '#90A4AE' }}>{m.nomCommercial}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>
                      {m.dci && <div>{m.dci}</div>}
                      {m.forme && <div style={{ fontSize: 11, color: '#90A4AE', textTransform: 'capitalize' }}>{m.forme}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: badge.color }}>{m.stockActuel}</div>
                      <div style={{ marginTop: 4, height: 4, background: '#F0F0F0', borderRadius: 2, width: 60 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: badge.color, borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{m.stockMinimum}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#1A2332', whiteSpace: 'nowrap' }}>{fmtXOF(m.prixVente)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => router.push(`/pharmacie/medicaments/${m.id}`)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff', cursor: 'pointer', color: '#546E7A', fontWeight: 600 }}>
                        Voir
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
