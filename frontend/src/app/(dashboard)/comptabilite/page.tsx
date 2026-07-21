'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Plus, TrendingUp, TrendingDown, DollarSign, FileText, BookOpen, BarChart3, Scale, X, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

// ── Types (miroir du backend comptabilite) ─────────────────────────────
type StatutEcriture = 'brouillon' | 'validee';

interface LigneEcriture {
  id?: string;
  compteNumero: string;
  libelle: string;
  debit: number | string;
  credit: number | string;
}
interface Ecriture {
  id: string;
  numero: string;
  date: string;
  journal: string;
  libelle: string;
  reference?: string;
  statut: StatutEcriture;
  lignes: LigneEcriture[];
}
interface Compte {
  numero: string;
  libelle: string;
  classe: number;
  type: 'actif' | 'passif' | 'charge' | 'produit' | 'tresorerie';
}
interface BalanceLigne {
  numero: string; libelle: string; classe: number; type: string;
  debit: number; credit: number; solde: number;
  soldeDebiteur: number; soldeCrediteur: number;
}
interface Balance {
  lignes: BalanceLigne[]; totalDebit: number; totalCredit: number; equilibre: boolean;
}
interface Stats {
  produits: number; charges: number; resultat: number; nbEcritures: number; nbBrouillons: number;
}
interface BilanPoste { numero: string; libelle: string; valeur: number; }
interface Bilan {
  actif: BilanPoste[]; passif: BilanPoste[];
  totalActif: number; totalPassif: number; equilibre: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────
const COMPTE_TYPE_COLORS: Record<string, [string, string, string]> = {
  '7': ['#065F46', '#D1FAE5', '#A7F3D0'],
  '6': ['#991B1B', '#FEE2E2', '#FECACA'],
  '4': ['#1E40AF', '#DBEAFE', '#BFDBFE'],
  '5': ['#5B21B6', '#EDE9FE', '#DDD6FE'],
};
function compteStyle(code: string): [string, string, string] {
  return COMPTE_TYPE_COLORS[code.charAt(0)] ?? ['#374151', '#F3F4F6', '#E5E7EB'];
}
const fmt = (n: number) => (Number(n) || 0).toLocaleString('fr-FR') + ' XOF';
const num = (n: number) => (Number(n) || 0).toLocaleString('fr-FR');
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);
const unwrapObj = (r: any) => (r?.data && !Array.isArray(r.data) && typeof r.data === 'object' ? r.data : r) ?? {};

const JOURNAUX = [
  { code: 'OD', label: 'Opérations diverses' },
  { code: 'VTE', label: 'Ventes' },
  { code: 'ACH', label: 'Achats' },
  { code: 'BAN', label: 'Banque' },
  { code: 'CAI', label: 'Caisse' },
  { code: 'PAY', label: 'Paie' },
];

const emptyLigne = (): LigneEcriture => ({ compteNumero: '', libelle: '', debit: '', credit: '' });

export default function ComptabilitePage() {
  const t = useTranslations('comptabilite');
  const [tab, setTab] = useState<'journal' | 'grand-livre' | 'bilan'>('journal');
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modale de saisie
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    journal: 'OD',
    libelle: '',
    reference: '',
    lignes: [emptyLigne(), emptyLigne()] as LigneEcriture[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ecrRes, compRes, balRes, statsRes, bilanRes] = await Promise.allSettled([
        apiClient<any>('/comptabilite/ecritures?limit=200'),
        apiClient<any>('/comptabilite/comptes'),
        apiClient<any>('/comptabilite/balance'),
        apiClient<Stats>('/comptabilite/stats'),
        apiClient<Bilan>('/comptabilite/bilan'),
      ]);
      if (ecrRes.status === 'fulfilled') setEcritures(unwrap(ecrRes.value));
      if (compRes.status === 'fulfilled') setComptes(unwrap(compRes.value));
      if (balRes.status === 'fulfilled') setBalance(unwrapObj(balRes.value) as Balance);
      if (statsRes.status === 'fulfilled') setStats(unwrapObj(statsRes.value) as Stats);
      if (bilanRes.status === 'fulfilled') setBilan(unwrapObj(bilanRes.value) as Bilan);
      const firstErr = [ecrRes, compRes, balRes, statsRes, bilanRes].find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
      if (firstErr) setError(firstErr.reason?.message ?? t('errChargement'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Dérivés (depuis stats API, fallback bilan) ────────────────────────
  const produits = stats?.produits ?? 0;
  const charges = stats?.charges ?? 0;
  const resultat = stats?.resultat ?? (produits - charges);
  const nbAttente = stats?.nbBrouillons ?? ecritures.filter(e => e.statut === 'brouillon').length;

  // ── Modale : gestion des lignes ───────────────────────────────────────
  const setLigne = (idx: number, patch: Partial<LigneEcriture>) => {
    setForm(f => ({ ...f, lignes: f.lignes.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
  };
  const addLigne = () => setForm(f => ({ ...f, lignes: [...f.lignes, emptyLigne()] }));
  const removeLigne = (idx: number) => setForm(f => ({
    ...f,
    lignes: f.lignes.length > 2 ? f.lignes.filter((_, i) => i !== idx) : f.lignes,
  }));

  const totalDebit = form.lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = form.lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const equilibre = Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0;

  const resetForm = () => setForm({
    date: new Date().toISOString().slice(0, 10),
    journal: 'OD', libelle: '', reference: '',
    lignes: [emptyLigne(), emptyLigne()],
  });

  const submit = async (validerApres: boolean) => {
    setFormErr(null);
    if (!form.libelle.trim()) { setFormErr(t('errLibelleRequis')); return; }
    const lignes = form.lignes
      .filter(l => l.compteNumero && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0))
      .map(l => ({
        compteNumero: l.compteNumero,
        libelle: l.libelle || form.libelle,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      }));
    if (lignes.length < 2) { setFormErr(t('errDeuxLignes')); return; }
    if (!equilibre) { setFormErr(t('errEquilibre')); return; }

    setSaving(true);
    try {
      const created = await apiClient<any>('/comptabilite/ecritures', {
        method: 'POST',
        body: {
          date: form.date, journal: form.journal,
          libelle: form.libelle, reference: form.reference || undefined,
          lignes,
        },
      });
      if (validerApres) {
        const ecr = unwrapObj(created) as Ecriture;
        if (ecr?.id) {
          try { await apiClient(`/comptabilite/ecritures/${ecr.id}/valider`, { method: 'POST' }); }
          catch { /* validation best-effort ; l’écriture reste en brouillon */ }
        }
      }
      setModalOpen(false);
      resetForm();
      await load();
    } catch (e: any) {
      setFormErr(e?.message ?? t('errEnregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const validerEcriture = async (id: string) => {
    try {
      await apiClient(`/comptabilite/ecritures/${id}/valider`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('errValidation'));
    }
  };

  const tabs = [
    { key: 'journal', label: t('tabJournal'), icon: <BookOpen size={14} /> },
    { key: 'grand-livre', label: t('tabGrandLivre'), icon: <BarChart3 size={14} /> },
    { key: 'bilan', label: t('tabBilan'), icon: <Scale size={14} /> },
  ] as const;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ec-row:hover { background: #F8FAFF !important; }
        .gl-row:hover { background: #F8F8FF !important; }
        .compta-kpi { cursor:pointer; transition:all .15s; }
        .compta-kpi:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.12)!important; }
        .compta-input { width:100%; padding:8px 10px; border:1.5px solid #E2E8F0; borderRadius:8px; fontSize:13px; outline:none; boxSizing:border-box; }
        .compta-input:focus { border-color:#0F3460; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E 0%,#16213E 50%,#0F3460 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15,52,96,0.4)' }}>
        <div style={{ position: 'absolute', top: -70, right: 50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 280, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,255,255,0.025) 28px,rgba(255,255,255,0.025) 29px)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('titre')}</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                  {t('sousTitre')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={load} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', cursor: loading ? 'wait' : 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} /> {t('actualiser')}
              </button>
              <button onClick={() => { resetForm(); setFormErr(null); setModalOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#0F3460', fontWeight: 800 }}>
                <Plus size={14} /> {t('nouvelleEcriture')}
              </button>
            </div>
          </div>

          {/* KPI pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: t('kpiProduits'), val: loading ? '…' : fmt(produits), icon: <TrendingUp size={11} /> },
              { label: t('kpiCharges'), val: loading ? '…' : fmt(charges), icon: <TrendingDown size={11} /> },
              { label: t('kpiResultatNet'), val: loading ? '…' : fmt(resultat), icon: <DollarSign size={11} /> },
              { label: t('kpiBrouillons'), val: loading ? '…' : nbAttente, icon: <FileText size={11} /> },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '5px 12px' }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.val}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#991B1B', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── KPI CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: t('cardProduits'), value: loading ? '…' : fmt(produits), color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0', icon: <TrendingUp size={20} color="#065F46" />, tab: 'bilan' as const },
          { label: t('cardCharges'), value: loading ? '…' : fmt(charges), color: '#991B1B', bg: '#FEE2E2', border: '#FECACA', icon: <TrendingDown size={20} color="#991B1B" />, tab: 'bilan' as const },
          { label: t('cardResultatNet'), value: loading ? '…' : fmt(resultat), color: resultat >= 0 ? '#065F46' : '#991B1B', bg: resultat >= 0 ? '#D1FAE5' : '#FEE2E2', border: resultat >= 0 ? '#A7F3D0' : '#FECACA', icon: <DollarSign size={20} color={resultat >= 0 ? '#065F46' : '#991B1B'} />, tab: 'bilan' as const },
          { label: t('cardBrouillons'), value: loading ? '…' : nbAttente, color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: <FileText size={20} color="#92400E" />, tab: 'journal' as const },
        ].map((k, i) => (
          <div key={i} className="compta-kpi" title={t('voir', { label: k.label })} onClick={() => setTab(k.tab)}
            style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', border: `1.5px solid ${k.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: k.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#78909C', marginTop: 3, fontWeight: 600 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: '#E8EEF8', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 18 }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === tb.key ? '#fff' : 'transparent', color: tab === tb.key ? '#0F3460' : '#78909C', boxShadow: tab === tb.key ? '0 1px 6px rgba(0,0,0,0.12)' : 'none', transition: 'all .15s' }}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL ───────────────────────────────────────────── */}
      {tab === 'journal' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[t('thRef'), t('thDate'), t('thJournal'), t('thLibelle'), t('thComptes'), t('thDebitXof'), t('thCreditXof'), t('thStatut'), ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>{t('chargement')}</td></tr>
                )}
                {!loading && ecritures.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
                    {t('journalVide')}
                  </td></tr>
                )}
                {!loading && ecritures.map(e => {
                  const valide = e.statut === 'validee';
                  const td = (e.lignes || []).reduce((s, l) => s + (Number(l.debit) || 0), 0);
                  const tc = (e.lignes || []).reduce((s, l) => s + (Number(l.credit) || 0), 0);
                  const comptesTxt = (e.lignes || []).map(l => l.compteNumero).join(' / ');
                  return (
                    <tr key={e.id} className="ec-row"
                      style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s', borderLeft: `3px solid ${valide ? '#A7F3D0' : '#FDE68A'}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{e.numero}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(e.date)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#5B21B6' }}>{e.journal}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#1A2332', fontWeight: 600, maxWidth: 240 }}>{e.libelle}</td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#90A4AE', fontFamily: 'monospace', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comptesTxt}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#991B1B', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{num(td)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#065F46', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{num(tc)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: valide ? '#D1FAE5' : '#FEF3C7', color: valide ? '#065F46' : '#92400E' }}>
                          {valide ? t('badgeValide') : t('badgeBrouillon')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!valide && (
                          <button onClick={() => validerEcriture(e.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #A7F3D0', background: '#ECFDF5', color: '#065F46', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <CheckCircle size={12} /> {t('valider')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRAND LIVRE (Balance par compte) ──────────────────── */}
      {tab === 'grand-livre' && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #EEF2F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('balanceTitre')}</span>
            {balance && (
              <span style={{ fontSize: 11, fontWeight: 700, background: balance.equilibre ? '#D1FAE5' : '#FEE2E2', color: balance.equilibre ? '#065F46' : '#991B1B', padding: '3px 12px', borderRadius: 20 }}>
                {balance.equilibre ? t('equilibree') : t('desequilibree')}
              </span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {[
                    { label: t('thCode'), align: 'left' as const },
                    { label: t('thIntitule'), align: 'left' as const },
                    { label: t('thDebitXof'), align: 'right' as const },
                    { label: t('thCreditXof'), align: 'right' as const },
                    { label: t('thSoldeXof'), align: 'right' as const },
                  ].map(h => (
                    <th key={h.label} style={{ padding: '11px 16px', textAlign: h.align, fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #EEF2F8' }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>{t('chargement')}</td></tr>
                )}
                {!loading && (!balance || balance.lignes.length === 0) && (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
                    {t('balanceVide')}
                  </td></tr>
                )}
                {!loading && balance?.lignes.map(c => {
                  const [tc, tbg, tborder] = compteStyle(c.numero);
                  const soldeCredit = c.solde < 0;
                  return (
                    <tr key={c.numero} className="gl-row"
                      style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: tc, background: tbg, border: `1.5px solid ${tborder}`, padding: '3px 10px', borderRadius: 7, fontFamily: 'monospace' }}>{c.numero}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{c.libelle}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#991B1B', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(c.debit)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#065F46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(c.credit)}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: soldeCredit ? '#065F46' : '#991B1B', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {num(Math.abs(c.solde))} {soldeCredit ? 'C' : 'D'}
                      </td>
                    </tr>
                  );
                })}
                {!loading && balance && balance.lignes.length > 0 && (
                  <tr style={{ borderTop: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                    <td colSpan={2} style={{ padding: '14px 16px', fontSize: 13, fontWeight: 900, color: '#1A2332' }}>{t('totaux')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: '#991B1B', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(balance.totalDebit)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 900, color: '#065F46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{num(balance.totalCredit)}</td>
                    <td style={{ padding: '14px 16px' }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BILAN ─────────────────────────────────────────────── */}
      {tab === 'bilan' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Scale size={18} color="#0F3460" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('bilanAu', { date: fmtDate(new Date().toISOString()) })}</span>
            {bilan && (
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: bilan.equilibre ? '#D1FAE5' : '#FEE2E2', color: bilan.equilibre ? '#065F46' : '#991B1B', padding: '3px 12px', borderRadius: 20 }}>
                {bilan.equilibre ? t('equilibre') : t('nonEquilibre')}
              </span>
            )}
          </div>

          {loading && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>{t('chargement')}</div>
          )}

          {!loading && bilan && (bilan.actif.length > 0 || bilan.passif.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { titre: 'ACTIF', label: t('actif'), couleur: '#991B1B', bg: '#FEE2E2', accent: '#FECACA', postes: bilan.actif, total: bilan.totalActif },
                { titre: 'PASSIF', label: t('passif'), couleur: '#065F46', bg: '#D1FAE5', accent: '#A7F3D0', postes: bilan.passif, total: bilan.totalPassif },
              ].map(side => {
                const total = side.total || side.postes.reduce((s, p) => s + p.valeur, 0);
                return (
                  <div key={side.titre} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{ background: `linear-gradient(135deg,${side.couleur},${side.bg})`, padding: '14px 20px' }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: side.titre === 'ACTIF' ? '#fff' : side.couleur, letterSpacing: '1.5px' }}>{side.label}</h3>
                      <div style={{ fontSize: 11, color: side.titre === 'ACTIF' ? 'rgba(255,255,255,0.7)' : side.couleur, marginTop: 2, opacity: 0.8 }}>
                        {t('totalCote', { valeur: num(total) })}
                      </div>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      {side.postes.length === 0 && (
                        <div style={{ padding: '16px 0', fontSize: 12, color: '#90A4AE', textAlign: 'center' }}>{t('aucunPoste')}</div>
                      )}
                      {side.postes.map(p => {
                        const pct = total > 0 ? Math.round((p.valeur / total) * 100) : 0;
                        return (
                          <div key={p.numero + p.libelle} style={{ padding: '10px 0', borderBottom: '1px solid #F0F4FA' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: '#37474F', fontWeight: 600 }}>{p.libelle}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: side.couleur, fontVariantNumeric: 'tabular-nums' }}>{num(p.valeur)} XOF</span>
                            </div>
                            <div style={{ height: 4, background: '#F0F4FA', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: side.accent, borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 2px', marginTop: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: side.couleur }}>{t('totalCoteTitre', { cote: side.label })}</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: side.couleur, fontVariantNumeric: 'tabular-nums' }}>{num(total)} XOF</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && bilan && bilan.actif.length === 0 && bilan.passif.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
              {t('bilanVide')}
            </div>
          )}
        </div>
      )}

      {/* ── MODALE NOUVELLE ÉCRITURE ──────────────────────────── */}
      {modalOpen && (
        <div onClick={() => !saving && setModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '32px 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#16213E,#0F3460)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BookOpen size={20} color="#fff" />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#fff' }}>{t('modalTitre')}</h2>
              </div>
              <button onClick={() => !saving && setModalOpen(false)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#fff" />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* En-tête écriture */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5 }}>{t('mDate')}</label>
                  <input type="date" className="compta-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5 }}>{t('mJournal')}</label>
                  <select className="compta-input" value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))}>
                    {JOURNAUX.map(j => <option key={j.code} value={j.code}>{j.code} — {t(`journal.${j.code}`)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5 }}>{t('mReference')}</label>
                  <input className="compta-input" placeholder={t('mReferencePh')} value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 5 }}>{t('mLibelle')}</label>
                <input className="compta-input" placeholder={t('mLibellePh')} value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} />
              </div>

              {/* Lignes */}
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('mLignes')}</span>
                <button onClick={addLigne} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #C7D2FE', background: '#EEF2FF', color: '#3730A3', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={13} /> {t('mAjouterLigne')}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr>
                      {[t('mColCompte'), t('mColLibelleLigne'), t('mColDebit'), t('mColCredit'), ''].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.lignes.map((l, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px 8px', minWidth: 180 }}>
                          <select className="compta-input" value={l.compteNumero} onChange={e => setLigne(idx, { compteNumero: e.target.value })}>
                            <option value="">{t('mComptePlaceholder')}</option>
                            {comptes.map(c => <option key={c.numero} value={c.numero}>{c.numero} — {c.libelle}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px 8px', minWidth: 160 }}>
                          <input className="compta-input" placeholder={t('mLibelleLignePh')} value={l.libelle} onChange={e => setLigne(idx, { libelle: e.target.value })} />
                        </td>
                        <td style={{ padding: '4px 8px', width: 120 }}>
                          <input className="compta-input" type="number" min={0} step="0.01" style={{ textAlign: 'right' }} value={l.debit}
                            onChange={e => setLigne(idx, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} />
                        </td>
                        <td style={{ padding: '4px 8px', width: 120 }}>
                          <input className="compta-input" type="number" min={0} step="0.01" style={{ textAlign: 'right' }} value={l.credit}
                            onChange={e => setLigne(idx, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} />
                        </td>
                        <td style={{ padding: '4px 8px', width: 36 }}>
                          {form.lignes.length > 2 && (
                            <button onClick={() => removeLigne(idx)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Trash2 size={14} color="#DC2626" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #E2E8F0' }}>
                      <td colSpan={2} style={{ padding: '10px 8px', fontSize: 12, fontWeight: 800, color: '#334155', textAlign: 'right' }}>{t('mTotaux')}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 900, color: '#991B1B', fontVariantNumeric: 'tabular-nums' }}>{num(totalDebit)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 13, fontWeight: 900, color: '#065F46', fontVariantNumeric: 'tabular-nums' }}>{num(totalCredit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: equilibre ? '#ECFDF5' : '#FEF2F2', border: `1.5px solid ${equilibre ? '#A7F3D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: equilibre ? '#065F46' : '#991B1B' }}>
                  {equilibre ? t('mEquilibree') : t('mDesequilibre', { montant: num(Math.abs(totalDebit - totalCredit)) })}
                </span>
              </div>

              {formErr && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#991B1B', fontSize: 12, fontWeight: 600 }}>
                  {formErr}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button onClick={() => setModalOpen(false)} disabled={saving}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('annuler')}
                </button>
                <button onClick={() => submit(false)} disabled={saving || !equilibre}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #C7D2FE', background: saving || !equilibre ? '#EEF2FF' : '#EEF2FF', color: '#3730A3', fontSize: 13, fontWeight: 800, cursor: saving || !equilibre ? 'not-allowed' : 'pointer', opacity: saving || !equilibre ? 0.6 : 1 }}>
                  {t('enregistrerBrouillon')}
                </button>
                <button onClick={() => submit(true)} disabled={saving || !equilibre}
                  style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: saving || !equilibre ? '#94A3B8' : '#0F3460', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving || !equilibre ? 'not-allowed' : 'pointer' }}>
                  {saving ? t('enregistrement') : t('enregistrerValider')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
