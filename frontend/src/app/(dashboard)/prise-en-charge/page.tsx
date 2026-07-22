'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck, Plus, Search, RefreshCw, Send, CheckCircle,
  XCircle, Clock, FileText, Building2, TrendingUp, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutBon = 'brouillon' | 'demande_envoyee' | 'accepte' | 'refuse' | 'expire';
type TypeAssureur = 'mutuelle' | 'assurance_privee' | 'cmu' | 'cnam';

type Assureur = {
  id: string; nom: string; type: TypeAssureur;
  contactNom?: string; contactTelephone?: string; contactEmail?: string;
  adresse?: string; tauxCouvertureDefaut: number; plafond?: number;
  actif: boolean;
};

type Bon = {
  id: string; numero?: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string } | null;
  assureur?: { id: string; nom: string; type: TypeAssureur } | null;
  patientId: string; assureurId: string;
  numeroAssure?: string; prestation: string; description?: string;
  montantEstime: number; tauxCouverture: number; montantCouvert: number;
  statut: StatutBon; numeroAutorisation?: string; dateValidite?: string;
  motifRefus?: string; notes?: string; createdAt: string;
};

type Patient = { id: string; nom: string; prenom: string; ipp?: string };

type Stats = {
  totalBons?: number;
  parStatut?: Record<string, number>;
  montantCouvertTotal?: number;
  nbAssureursActifs?: number;
};

const STATUT_CONFIG: Record<StatutBon, { bg: string; color: string; dot: string }> = {
  brouillon:       { bg: '#F5F5F5', color: '#546E7A', dot: '#90A4AE' },
  demande_envoyee: { bg: '#FFF8E1', color: '#F57F17', dot: '#FBC02D' },
  accepte:         { bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047' },
  refuse:          { bg: '#FFEBEE', color: '#C62828', dot: '#EF5350' },
  expire:          { bg: '#ECEFF1', color: '#607D8B', dot: '#90A4AE' },
};

const AVATAR_COLORS: [string, string][] = [
  ['#1D4ED8','#DBEAFE'],['#7C3AED','#EDE9FE'],['#0F766E','#CCFBF1'],
  ['#B45309','#FEF3C7'],['#9D174D','#FCE7F3'],['#065F46','#D1FAE5'],
];
function avatarColor(name: string): [string, string] {
  let h = 0; for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function fmtXOF(v?: number | null) { return (Number(v) || 0).toLocaleString('fr-FR') + ' XOF'; }

const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);

export default function PriseEnChargePage() {
  const t = useTranslations('priseEnCharge');
  const [tab, setTab] = useState<'bons' | 'assureurs'>('bons');
  const [bons, setBons] = useState<Bon[]>([]);
  const [assureurs, setAssureurs] = useState<Assureur[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const [showBonForm, setShowBonForm] = useState(false);
  const [showAssureurForm, setShowAssureurForm] = useState(false);
  const [repondreBon, setRepondreBon] = useState<Bon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bonsRes, assurRes, patRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/prise-en-charge/bons?limit=100'),
        apiClient<any>('/prise-en-charge/assureurs'),
        apiClient<any>('/patients?limit=100'),
        apiClient<Stats>('/prise-en-charge/stats'),
      ]);
      if (bonsRes.status === 'fulfilled') {
        setBons(unwrap(bonsRes.value).map((b: any) => ({
          ...b,
          montantEstime: Number(b.montantEstime) || 0,
          tauxCouverture: Number(b.tauxCouverture) || 0,
          montantCouvert: Number(b.montantCouvert) || 0,
        })));
      }
      if (assurRes.status === 'fulfilled') {
        setAssureurs(unwrap(assurRes.value).map((a: any) => ({
          ...a,
          tauxCouvertureDefaut: Number(a.tauxCouvertureDefaut) || 0,
          plafond: a.plafond != null ? Number(a.plafond) : undefined,
        })));
      }
      if (patRes.status === 'fulfilled') setPatients(unwrap(patRes.value));
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnvoyer = async (id: string) => {
    try { await apiClient(`/prise-en-charge/bons/${id}/envoyer`, { method: 'PATCH' }); await load(); }
    catch { alert(t('erreurEnregistrement')); }
  };

  const displayedBons = useMemo(() => bons.filter(b => {
    const q = search.toLowerCase();
    const nomP = b.patient ? `${b.patient.prenom} ${b.patient.nom}`.toLowerCase() : '';
    const matchS = !search || nomP.includes(q) || (b.numero || '').toLowerCase().includes(q)
      || (b.prestation || '').toLowerCase().includes(q);
    const matchSt = !statutFilter || b.statut === statutFilter;
    return matchS && matchSt;
  }), [bons, search, statutFilter]);

  const displayedAssureurs = useMemo(() => assureurs.filter(a =>
    !search || a.nom.toLowerCase().includes(search.toLowerCase())
  ), [assureurs, search]);

  const kpiTotal = stats?.totalBons ?? bons.length;
  const kpiEnAttente = stats?.parStatut?.demande_envoyee ?? bons.filter(b => b.statut === 'demande_envoyee').length;
  const kpiAcceptes = stats?.parStatut?.accepte ?? bons.filter(b => b.statut === 'accepte').length;
  const kpiMontant = stats?.montantCouvertTotal ?? bons.filter(b => b.statut === 'accepte').reduce((a, b) => a + b.montantCouvert, 0);

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .pec-row:hover { background: #F8FAFF !important; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#4A148C 0%,#6A1B9A 55%,#8E24AA 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(74,20,140,0.35)' }}>
        <div style={{ position: 'absolute', top: -60, right: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={26} color="#fff"/>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('heroTitle')}</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  {loading ? '…' : t('heroSubtitle', { count: bons.length, assureurs: assureurs.length })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={load} disabled={loading} style={btnGhost}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> {t('actualiser')}
              </button>
              {tab === 'bons' ? (
                <button onClick={() => setShowBonForm(true)} style={btnSolid}>
                  <Plus size={14}/> {t('nouveauBon')}
                </button>
              ) : (
                <button onClick={() => setShowAssureurForm(true)} style={btnSolid}>
                  <Plus size={14}/> {t('nouvelAssureur')}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: t('kpiTotal'), val: loading ? '…' : kpiTotal, icon: <FileText size={11}/> },
              { label: t('kpiEnAttente'), val: loading ? '…' : kpiEnAttente, icon: <Clock size={11}/> },
              { label: t('kpiAcceptes'), val: loading ? '…' : kpiAcceptes, icon: <CheckCircle size={11}/> },
              { label: t('kpiMontantCouvert'), val: loading ? '…' : fmtXOF(kpiMontant), icon: <TrendingUp size={11}/> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.val}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['bons', t('tabBons'), <FileText size={14} key="a"/>], ['assureurs', t('tabAssureurs'), <Building2 size={14} key="b"/>]] as const).map(([key, label, icon]) => (
          <button key={key} onClick={() => { setTab(key as any); setSearch(''); setStatutFilter(''); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 11, border: `1.5px solid ${tab === key ? '#6A1B9A' : '#E0E8F0'}`, background: tab === key ? '#6A1B9A' : '#fff', color: tab === key ? '#fff' : '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'bons' ? t('rechercherBon') : t('rechercherAssureur')}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 11, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }}/>
        </div>
        {tab === 'bons' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[{ val: '', label: t('filtreTous') }, ...Object.keys(STATUT_CONFIG).map(k => ({ val: k, label: t(`statut.${k}`) }))].map(s => (
              <button key={s.val} onClick={() => setStatutFilter(s.val)}
                style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${statutFilter === s.val ? '#6A1B9A' : '#E0E8F0'}`, background: statutFilter === s.val ? '#6A1B9A' : '#fff', color: statutFilter === s.val ? '#fff' : '#546E7A', fontSize: 12, fontWeight: statutFilter === s.val ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <div style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>
          {t('resultats', { count: tab === 'bons' ? displayedBons.length : displayedAssureurs.length })}
        </div>
      )}

      {/* ── TABLE ── */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          {tab === 'bons'
            ? <BonsTable t={t} loading={loading} bons={displayedBons} search={search} onEnvoyer={handleEnvoyer} onRepondre={setRepondreBon}/>
            : <AssureursTable t={t} loading={loading} assureurs={displayedAssureurs} search={search}/>}
        </div>
      </div>

      {showBonForm && (
        <BonForm t={t} patients={patients} assureurs={assureurs}
          onClose={() => setShowBonForm(false)}
          onSaved={() => { setShowBonForm(false); load(); }}/>
      )}
      {showAssureurForm && (
        <AssureurForm t={t}
          onClose={() => setShowAssureurForm(false)}
          onSaved={() => { setShowAssureurForm(false); load(); }}/>
      )}
      {repondreBon && (
        <RepondreForm t={t} bon={repondreBon}
          onClose={() => setRepondreBon(null)}
          onSaved={() => { setRepondreBon(null); load(); }}/>
      )}
    </div>
  );
}

const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 };
const btnSolid: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6A1B9A', fontWeight: 800 };
const thStyle: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' };

function StatutBadge({ t, statut }: { t: any; statut: StatutBon }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.brouillon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }}/>
      {t(`statut.${statut}`)}
    </span>
  );
}

function BonsTable({ t, loading, bons, search, onEnvoyer, onRepondre }: any) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
      <thead>
        <tr style={{ background: '#F8FAFC' }}>
          {[t('thNumero'), t('thPatient'), t('thAssureur'), t('thPrestation'), t('thMontant'), t('thCouvert'), t('thStatut'), t('thActions')].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
            {Array.from({ length: 8 }).map((_, j) => (
              <td key={j} style={{ padding: '13px 14px' }}>
                <div style={{ height: 13, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', borderRadius: 4, width: j === 1 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }}/>
              </td>
            ))}
          </tr>
        )) : bons.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
              <ShieldCheck size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}/>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>{t('videBons')}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{search ? t('videBonsRecherche', { q: search }) : ''}</div>
            </td>
          </tr>
        ) : bons.map((b: Bon) => {
          const name = b.patient ? `${b.patient.prenom} ${b.patient.nom}` : '—';
          const [ac, ab] = avatarColor(name);
          const inits = b.patient ? `${b.patient.prenom?.charAt(0) ?? ''}${b.patient.nom?.charAt(0) ?? ''}`.toUpperCase() : '?';
          return (
            <tr key={b.id} className="pec-row" style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s' }}>
              <td style={{ padding: '12px 14px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#6A1B9A', background: '#F3E5F5', padding: '3px 9px', borderRadius: 6, fontFamily: 'monospace' }}>
                  {b.numero || b.id.slice(0, 8).toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${ab},${ac}22)`, border: `1.5px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: ac, flexShrink: 0 }}>{inits}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{name}</div>
                    {b.patient?.ipp && <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{b.patient.ipp}</div>}
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: '#37474F', fontWeight: 600 }}>{b.assureur?.nom ?? '—'}</td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A' }}>{b.prestation}</td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#1A2332', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(b.montantEstime)}</td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: '#2E7D32', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {fmtXOF(b.montantCouvert)} <span style={{ fontSize: 10, color: '#90A4AE' }}>({b.tauxCouverture}%)</span>
              </td>
              <td style={{ padding: '12px 14px' }}><StatutBadge t={t} statut={b.statut}/></td>
              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                {b.statut === 'brouillon' && (
                  <button onClick={() => onEnvoyer(b.id)} style={actionBtn('#1565C0', '#EFF6FF')}>
                    <Send size={12}/> {t('actionEnvoyer')}
                  </button>
                )}
                {b.statut === 'demande_envoyee' && (
                  <button onClick={() => onRepondre(b)} style={actionBtn('#6A1B9A', '#F3E5F5')}>
                    <CheckCircle size={12}/> {t('actionRepondre')}
                  </button>
                )}
                {(b.statut === 'accepte') && b.numeroAutorisation && (
                  <span style={{ fontSize: 11, color: '#2E7D32', fontFamily: 'monospace' }}>{b.numeroAutorisation}</span>
                )}
                {(b.statut === 'refuse') && b.motifRefus && (
                  <span style={{ fontSize: 11, color: '#C62828' }}>{b.motifRefus}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function actionBtn(color: string, bg: string): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: bg, color, fontSize: 11, fontWeight: 700, cursor: 'pointer' };
}

function AssureursTable({ t, loading, assureurs, search }: any) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
      <thead>
        <tr style={{ background: '#F8FAFC' }}>
          {[t('thNom'), t('thType'), t('thContact'), t('thTaux'), t('thPlafond'), t('thActif')].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
            {Array.from({ length: 6 }).map((_, j) => (
              <td key={j} style={{ padding: '13px 14px' }}>
                <div style={{ height: 13, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', borderRadius: 4, width: 80, animation: 'pulse 1.5s ease infinite' }}/>
              </td>
            ))}
          </tr>
        )) : assureurs.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
              <Building2 size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }}/>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>{t('videAssureurs')}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{search ? t('videAssureursRecherche', { q: search }) : ''}</div>
            </td>
          </tr>
        ) : assureurs.map((a: Assureur) => (
          <tr key={a.id} className="pec-row" style={{ borderTop: '1px solid #F0F4FA' }}>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{a.nom}</td>
            <td style={{ padding: '12px 14px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6A1B9A', background: '#F3E5F5', padding: '3px 10px', borderRadius: 20 }}>{t(`type.${a.type}`)}</span>
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A' }}>
              {a.contactNom || '—'}{a.contactTelephone ? ` • ${a.contactTelephone}` : ''}
            </td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{a.tauxCouvertureDefaut}%</td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{a.plafond ? fmtXOF(a.plafond) : '—'}</td>
            <td style={{ padding: '12px 14px' }}>
              {a.actif
                ? <CheckCircle size={16} color="#2E7D32"/>
                : <XCircle size={16} color="#C62828"/>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Modals ──────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeUp .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #EEF2F8' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#90A4AE' }}><X size={20}/></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#546E7A', marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const fieldWrap: React.CSSProperties = { marginBottom: 14 };

function BonForm({ t, patients, assureurs, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ patientId: '', assureurId: '', numeroAssure: '', prestation: '', description: '', montantEstime: '', tauxCouverture: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const selAssureur = assureurs.find((a: Assureur) => a.id === form.assureurId);
  const taux = form.tauxCouverture !== '' ? Number(form.tauxCouverture) : (selAssureur ? selAssureur.tauxCouvertureDefaut : 0);
  const apercu = (Number(form.montantEstime) || 0) * (Number(taux) || 0) / 100;

  const submit = async () => {
    if (!form.patientId || !form.assureurId || !form.prestation || form.montantEstime === '') { alert(t('champsRequis')); return; }
    setSaving(true);
    try {
      await apiClient('/prise-en-charge/bons', { method: 'POST', body: {
        patientId: form.patientId,
        assureurId: form.assureurId,
        numeroAssure: form.numeroAssure || undefined,
        prestation: form.prestation,
        description: form.description || undefined,
        montantEstime: Number(form.montantEstime),
        tauxCouverture: form.tauxCouverture !== '' ? Number(form.tauxCouverture) : undefined,
        notes: form.notes || undefined,
      }});
      onSaved();
    } catch { alert(t('erreurEnregistrement')); setSaving(false); }
  };

  return (
    <Modal title={t('formBonTitre')} onClose={onClose}>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champPatient')} *</label>
        <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} style={inputStyle}>
          <option value="">{t('selectionner')}</option>
          {patients.map((p: Patient) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}{p.ipp ? ` (${p.ipp})` : ''}</option>)}
        </select>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champAssureur')} *</label>
        <select value={form.assureurId} onChange={e => setForm({ ...form, assureurId: e.target.value })} style={inputStyle}>
          <option value="">{t('selectionner')}</option>
          {assureurs.filter((a: Assureur) => a.actif).map((a: Assureur) => <option key={a.id} value={a.id}>{a.nom} ({a.tauxCouvertureDefaut}%)</option>)}
        </select>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champNumeroAssure')}</label>
        <input value={form.numeroAssure} onChange={e => setForm({ ...form, numeroAssure: e.target.value })} style={inputStyle}/>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champPrestation')} *</label>
        <input value={form.prestation} onChange={e => setForm({ ...form, prestation: e.target.value })} style={inputStyle}/>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champDescription')}</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }}/>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champMontantEstime')} *</label>
          <input type="number" value={form.montantEstime} onChange={e => setForm({ ...form, montantEstime: e.target.value })} style={inputStyle}/>
        </div>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champTauxCouverture')}</label>
          <input type="number" value={form.tauxCouverture} placeholder={selAssureur ? String(selAssureur.tauxCouvertureDefaut) : ''} onChange={e => setForm({ ...form, tauxCouverture: e.target.value })} style={inputStyle}/>
        </div>
      </div>
      <div style={{ background: '#F3E5F5', borderRadius: 9, padding: '9px 12px', fontSize: 12, fontWeight: 700, color: '#6A1B9A', marginBottom: 14 }}>
        {t('montantCouvertApercu', { montant: fmtXOF(apercu) })}
      </div>
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit}/>
    </Modal>
  );
}

function AssureurForm({ t, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({ nom: '', type: 'assurance_privee', contactNom: '', contactTelephone: '', contactEmail: '', adresse: '', tauxCouvertureDefaut: '80', plafond: '', actif: true });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.nom) { alert(t('champsRequis')); return; }
    setSaving(true);
    try {
      await apiClient('/prise-en-charge/assureurs', { method: 'POST', body: {
        nom: form.nom,
        type: form.type,
        contactNom: form.contactNom || undefined,
        contactTelephone: form.contactTelephone || undefined,
        contactEmail: form.contactEmail || undefined,
        adresse: form.adresse || undefined,
        tauxCouvertureDefaut: form.tauxCouvertureDefaut !== '' ? Number(form.tauxCouvertureDefaut) : undefined,
        plafond: form.plafond !== '' ? Number(form.plafond) : undefined,
        actif: form.actif,
      }});
      onSaved();
    } catch { alert(t('erreurEnregistrement')); setSaving(false); }
  };

  return (
    <Modal title={t('formAssureurTitre')} onClose={onClose}>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champNom')} *</label>
        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle}/>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champType')}</label>
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          {['mutuelle', 'assurance_privee', 'cmu', 'cnam'].map(ty => <option key={ty} value={ty}>{t(`type.${ty}`)}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champContactNom')}</label>
          <input value={form.contactNom} onChange={e => setForm({ ...form, contactNom: e.target.value })} style={inputStyle}/>
        </div>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champContactTelephone')}</label>
          <input value={form.contactTelephone} onChange={e => setForm({ ...form, contactTelephone: e.target.value })} style={inputStyle}/>
        </div>
      </div>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champContactEmail')}</label>
        <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} style={inputStyle}/>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champTaux')} (%)</label>
          <input type="number" value={form.tauxCouvertureDefaut} onChange={e => setForm({ ...form, tauxCouvertureDefaut: e.target.value })} style={inputStyle}/>
        </div>
        <div style={{ ...fieldWrap, flex: 1 }}>
          <label style={labelStyle}>{t('champPlafond')}</label>
          <input type="number" value={form.plafond} onChange={e => setForm({ ...form, plafond: e.target.value })} style={inputStyle}/>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
        <input type="checkbox" checked={form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })}/> {t('champActif')}
      </label>
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit}/>
    </Modal>
  );
}

function RepondreForm({ t, bon, onClose, onSaved }: any) {
  const [accepte, setAccepte] = useState(true);
  const [form, setForm] = useState<any>({ numeroAutorisation: '', dateValidite: '', motifRefus: '' });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await apiClient(`/prise-en-charge/bons/${bon.id}/repondre`, { method: 'PATCH', body: {
        accepte,
        numeroAutorisation: accepte ? (form.numeroAutorisation || undefined) : undefined,
        dateValidite: accepte && form.dateValidite ? new Date(form.dateValidite).toISOString() : undefined,
        motifRefus: !accepte ? (form.motifRefus || undefined) : undefined,
      }});
      onSaved();
    } catch { alert(t('erreurEnregistrement')); setSaving(false); }
  };

  return (
    <Modal title={t('formRepondreTitre')} onClose={onClose}>
      <div style={fieldWrap}>
        <label style={labelStyle}>{t('champReponse')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAccepte(true)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1.5px solid ${accepte ? '#2E7D32' : '#E0E8F0'}`, background: accepte ? '#E8F5E9' : '#fff', color: accepte ? '#2E7D32' : '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {t('reponseAccepte')}
          </button>
          <button onClick={() => setAccepte(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `1.5px solid ${!accepte ? '#C62828' : '#E0E8F0'}`, background: !accepte ? '#FFEBEE' : '#fff', color: !accepte ? '#C62828' : '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {t('reponseRefuse')}
          </button>
        </div>
      </div>
      {accepte ? (
        <>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t('champNumeroAutorisation')}</label>
            <input value={form.numeroAutorisation} onChange={e => setForm({ ...form, numeroAutorisation: e.target.value })} style={inputStyle}/>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>{t('champDateValidite')}</label>
            <input type="date" value={form.dateValidite} onChange={e => setForm({ ...form, dateValidite: e.target.value })} style={inputStyle}/>
          </div>
        </>
      ) : (
        <div style={fieldWrap}>
          <label style={labelStyle}>{t('champMotifRefus')}</label>
          <textarea value={form.motifRefus} onChange={e => setForm({ ...form, motifRefus: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }}/>
        </div>
      )}
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit}/>
    </Modal>
  );
}

function FormActions({ t, saving, onClose, onSubmit }: any) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
      <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('annuler')}</button>
      <button onClick={onSubmit} disabled={saving} style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: '#6A1B9A', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? t('envoiEnCours') : t('enregistrer')}
      </button>
    </div>
  );
}
