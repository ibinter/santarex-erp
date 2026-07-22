'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSignature, Plus, Search, RefreshCw, ChevronRight,
  ClipboardList, CheckCircle, Percent, FileText, Layers,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Statut = 'a_signer' | 'signe' | 'refuse' | 'revoque';
type TypeC = 'chirurgie' | 'anesthesie' | 'transfusion' | 'acte_invasif' | 'soins' | 'recherche';

type Consentement = {
  id: string; numero: string; type: TypeC; statut: Statut;
  acteConcerne: string; patientId: string; medecinRef?: string;
  createdAt: string;
};

type Stats = {
  total: number; aSigner: number; signes: number; refuses: number; revoques: number;
  parType: Record<string, number>; tauxSignature: number;
};

const STATUT_CFG: Record<Statut, { bg: string; color: string; border: string; dot: string }> = {
  a_signer: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  signe:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
  refuse:   { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
  revoque:  { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', dot: '#94A3B8' },
};

const TYPE_COLOR: Record<TypeC, string> = {
  chirurgie: '#6366F1', anesthesie: '#0EA5E9', transfusion: '#DC2626',
  acte_invasif: '#F59E0B', soins: '#10B981', recherche: '#8B5CF6',
};

const STATUTS: Statut[] = ['a_signer', 'signe', 'refuse', 'revoque'];
const TYPES: TypeC[] = ['chirurgie', 'anesthesie', 'transfusion', 'acte_invasif', 'soins', 'recherche'];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return '—'; }
}

const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);

export default function ConsentementsPage() {
  const router = useRouter();
  const t = useTranslations('consentements');
  const [items, setItems] = useState<Consentement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fStatut, setFStatut] = useState<Statut | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        apiClient<any>('/consentements?limit=200'),
        apiClient<any>('/consentements/stats'),
      ]);
      setItems(unwrap(listRes));
      setStats((statsRes?.data ?? statsRes) as Stats);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = items.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !search
      || (c.numero ?? '').toLowerCase().includes(q)
      || (c.acteConcerne ?? '').toLowerCase().includes(q)
      || (c.patientId ?? '').toLowerCase().includes(q);
    const matchS = !fStatut || c.statut === fStatut;
    return matchQ && matchS;
  });

  const total = stats?.total ?? items.length;
  const aSigner = stats?.aSigner ?? 0;
  const signes = stats?.signes ?? 0;
  const taux = stats?.tauxSignature ?? 0;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .cons-row:hover{background:#F5F7FF!important;}
        .chip:hover{filter:brightness(0.98);}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#3730A3 50%,#4F46E5 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(55,48,163,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSignature size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('list.heroTitle')}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  {loading ? t('list.loading') : t('list.summary', { total, aSigner })}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => router.push('/consentements/modeles')}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
              <Layers size={14} /> {t('list.manageModeles')}
            </button>
            <button onClick={() => router.push('/consentements/nouveau')}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#3730A3', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('list.newConsentement')}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('list.kpiTotal'), val: total, icon: <ClipboardList size={13} />, valColor: '#fff' },
            { label: t('list.kpiASigner'), val: aSigner, icon: <FileText size={13} />, valColor: '#FDE68A' },
            { label: t('list.kpiSignes'), val: signes, icon: <CheckCircle size={13} />, valColor: '#BBF7D0' },
            { label: t('list.kpiTaux'), val: `${taux}%`, icon: <Percent size={13} />, valColor: '#C7D2FE' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>
                {k.icon}
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.valColor, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH + FILTRES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFStatut('')}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${fStatut === '' ? '#4F46E5' : '#E0E8F0'}`, background: fStatut === '' ? '#4F46E5' : '#fff', color: fStatut === '' ? '#fff' : '#546E7A', fontSize: 11, fontWeight: fStatut === '' ? 800 : 500, cursor: 'pointer' }}>
            {t('list.filterAll')}
          </button>
          {STATUTS.map(s => {
            const cfg = STATUT_CFG[s];
            const on = fStatut === s;
            return (
              <button key={s} className="chip" onClick={() => setFStatut(on ? '' : s)}
                style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {t(`statut.${s}`)}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' }}>
                {[t('list.colNumero'), t('list.colType'), t('list.colActe'), t('list.colPatient'), t('list.colDate'), t('list.colStatut'), ''].map((h, hi) => (
                  <th key={hi} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#3730A3', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #EEF2FF' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}><div style={{ height: 13, background: '#E0E7FF', borderRadius: 4, width: j === 2 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                  <FileSignature size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#C7D2FE' }} />
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#546E7A' }}>{t('list.emptyTitle')}</p>
                  <p style={{ margin: 0, fontSize: 12 }}>{t('list.emptySubtitle')}</p>
                </td></tr>
              ) : displayed.map(c => {
                const sc = STATUT_CFG[c.statut] ?? STATUT_CFG.a_signer;
                return (
                  <tr key={c.id} className="cons-row" onClick={() => router.push(`/consentements/${c.id}`)}
                    style={{ borderTop: '1px solid #EEF2FF', cursor: 'pointer', transition: 'background .1s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: '#3730A3', background: '#E0E7FF', padding: '2px 8px', borderRadius: 6 }}>{c.numero}</span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: TYPE_COLOR[c.type] }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLOR[c.type], display: 'inline-block' }} />
                        {t(`type.${c.type}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600, color: '#37474F' }}>{c.acteConcerne}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#546E7A', fontFamily: 'monospace' }}>{c.patientId?.slice(0, 8)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {t(`statut.${c.statut}`)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}><ChevronRight size={14} color="#B0BEC5" /></td>
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
