'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Plus, Search, RefreshCw, Send, PackageCheck,
  X, Trash2, Ban, ClipboardList, Building2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────
type TypeFournisseur = 'grossiste' | 'laboratoire' | 'consommables' | 'autre';
type StatutBon = 'brouillon' | 'envoyee' | 'partiellement_recue' | 'recue' | 'annulee';

type Fournisseur = {
  id: string; nom: string; type: TypeFournisseur; contact?: string;
  telephone?: string; email?: string; adresse?: string; ville?: string; actif: boolean;
};
type Ligne = {
  id: string; designation: string; medicamentId?: string | null;
  quantiteCommandee: number; quantiteRecue: number; prixUnitaire: string; montantLigne: string;
};
type Bon = {
  id: string; numero: string; fournisseurId: string; dateCommande: string;
  dateLivraisonPrevue?: string; statut: StatutBon; montantTotal: string; devise: string;
  notes?: string; fournisseur?: { id: string; nom: string; type: TypeFournisseur } | null;
  lignes?: Ligne[];
};
type Medicament = { id: string; nom: string; dosage?: string; prixUnitaire?: string };
type Stats = {
  fournisseursActifs: number; commandesEnCours: number;
  montantEngageXOF: number; totalCommandes: number;
};

function fmtXOF(v?: number | string | null) {
  return new Intl.NumberFormat('fr-FR').format(Number(v) || 0) + ' F';
}
function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUT_CFG: Record<StatutBon, { color: string; bg: string; border: string }> = {
  brouillon:            { color: '#475569', bg: '#F1F5F9', border: '#CBD5E1' },
  envoyee:              { color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  partiellement_recue:  { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  recue:                { color: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  annulee:              { color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5' },
};

// ── Page ─────────────────────────────────────────────────────────────
export default function ApprovisionnementPage() {
  const t = useTranslations('approvisionnement');
  const [tab, setTab] = useState<'fournisseurs' | 'commandes'>('commandes');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [bons, setBons] = useState<Bon[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showFournModal, setShowFournModal] = useState(false);
  const [showCmdModal, setShowCmdModal] = useState(false);
  const [receptionBon, setReceptionBon] = useState<Bon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, b, s] = await Promise.all([
        apiClient<Fournisseur[]>('/approvisionnement/fournisseurs'),
        apiClient<any>('/approvisionnement/commandes?limit=200'),
        apiClient<Stats>('/approvisionnement/stats'),
      ]);
      setFournisseurs(Array.isArray(f) ? f : []);
      setBons(b?.data ?? (Array.isArray(b) ? b : []));
      setStats(s);
    } catch { /* silencieux */ } finally { setLoading(false); }
  }, []);

  const loadMedicaments = useCallback(async () => {
    try {
      const d = await apiClient<any>('/pharmacie/medicaments?limit=500');
      setMedicaments(Array.isArray(d) ? d : d?.data ?? d?.items ?? []);
    } catch { /* pharmacie optionnelle */ }
  }, []);

  useEffect(() => { load(); loadMedicaments(); }, [load, loadMedicaments]);

  const displayedFourn = fournisseurs.filter(f => {
    const q = search.toLowerCase();
    return !search || f.nom.toLowerCase().includes(q) || (f.ville ?? '').toLowerCase().includes(q) || (f.contact ?? '').toLowerCase().includes(q);
  });
  const displayedBons = bons.filter(b => !search || b.numero.toLowerCase().includes(search.toLowerCase()) || (b.fournisseur?.nom ?? '').toLowerCase().includes(search.toLowerCase()));

  const envoyer = async (b: Bon) => {
    if (!confirm(t('commandes.confirmEnvoyer'))) return;
    try { await apiClient(`/approvisionnement/commandes/${b.id}/envoyer`, { method: 'PATCH' }); load(); }
    catch { alert(t('errors.action')); }
  };
  const annuler = async (b: Bon) => {
    if (!confirm(t('commandes.confirmAnnuler'))) return;
    try { await apiClient(`/approvisionnement/commandes/${b.id}/annuler`, { method: 'PATCH' }); load(); }
    catch { alert(t('errors.action')); }
  };

  const KPIS = [
    { label: t('kpi.fournisseurs'), val: stats?.fournisseursActifs ?? 0, color: '#BFDBFE' },
    { label: t('kpi.commandesEnCours'), val: stats?.commandesEnCours ?? 0, color: '#FCD34D' },
    { label: t('kpi.montantEngage'), val: fmtXOF(stats?.montantEngageXOF), color: '#fff', small: true },
    { label: t('kpi.totalCommandes'), val: stats?.totalCommandes ?? 0, color: '#A7F3D0' },
  ];

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .appro-row:hover{background:#F8FAFF!important;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#2563EB 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(30,58,138,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('hero.title')}</h1>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{loading ? t('hero.loading') : t('hero.subtitle')}</span>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('hero.refresh')}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {KPIS.map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: k.small ? 15 : 26, fontWeight: 900, color: k.color, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS + SEARCH */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#fff', borderRadius: 11, padding: 4, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          {([['commandes', ClipboardList], ['fournisseurs', Building2]] as const).map(([id, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', background: tab === id ? 'linear-gradient(135deg,#1D4ED8,#2563EB)' : 'transparent', color: tab === id ? '#fff' : '#546E7A', fontSize: 12, fontWeight: tab === id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Icon size={14} /> {t(`tabs.${id}`)}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t(`${tab}.searchPlaceholder`)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <button onClick={() => tab === 'fournisseurs' ? setShowFournModal(true) : setShowCmdModal(true)}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#1D4ED8', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800 }}>
          <Plus size={14} /> {tab === 'fournisseurs' ? t('fournisseurs.new') : t('commandes.new')}
        </button>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
        <div style={{ overflowX: 'auto' }}>
          {tab === 'fournisseurs'
            ? <FournisseursTable t={t} rows={displayedFourn} loading={loading} />
            : <CommandesTable t={t} rows={displayedBons} loading={loading} onEnvoyer={envoyer} onAnnuler={annuler} onReception={setReceptionBon} />}
        </div>
      </div>

      {showFournModal && <FournisseurModal t={t} onClose={() => setShowFournModal(false)} onSaved={() => { setShowFournModal(false); load(); }} />}
      {showCmdModal && <CommandeModal t={t} fournisseurs={fournisseurs.filter(f => f.actif)} medicaments={medicaments} onClose={() => setShowCmdModal(false)} onSaved={() => { setShowCmdModal(false); load(); }} />}
      {receptionBon && <ReceptionModal t={t} bonId={receptionBon.id} onClose={() => setReceptionBon(null)} onSaved={() => { setReceptionBon(null); load(); }} />}
    </div>
  );
}

// ── Fournisseurs table ───────────────────────────────────────────────
function FournisseursTable({ t, rows, loading }: { t: any; rows: Fournisseur[]; loading: boolean }) {
  const cols = [t('fournisseurs.colNom'), t('fournisseurs.colType'), t('fournisseurs.colContact'), t('fournisseurs.colTelephone'), t('fournisseurs.colVille'), t('fournisseurs.colStatut')];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
      <thead><tr style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
        {cols.map((h, i) => <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>)}
      </tr></thead>
      <tbody>
        {loading ? <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>…</td></tr>
          : rows.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}><Building2 size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#BFDBFE' }} /><p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('fournisseurs.empty')}</p></td></tr>
            : rows.map(f => (
              <tr key={f.id} className="appro-row" style={{ borderTop: '1px solid #F0F4F8', transition: 'background .1s' }}>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{f.nom}</td>
                <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 12, background: '#EEF2FF', color: '#4338CA' }}>{t(`typeFournisseur.${f.type}`)}</span></td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{f.contact || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{f.telephone || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{f.ville || '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: f.actif ? '#DCFCE7' : '#FEE2E2', color: f.actif ? '#15803D' : '#DC2626' }}>{f.actif ? t('fournisseurs.actif') : t('fournisseurs.inactif')}</span>
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  );
}

// ── Commandes table ──────────────────────────────────────────────────
function CommandesTable({ t, rows, loading, onEnvoyer, onAnnuler, onReception }: { t: any; rows: Bon[]; loading: boolean; onEnvoyer: (b: Bon) => void; onAnnuler: (b: Bon) => void; onReception: (b: Bon) => void }) {
  const cols = [t('commandes.colNumero'), t('commandes.colFournisseur'), t('commandes.colDate'), t('commandes.colLivraison'), t('commandes.colMontant'), t('commandes.colStatut'), t('commandes.colActions')];
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
      <thead><tr style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
        {cols.map((h, i) => <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>)}
      </tr></thead>
      <tbody>
        {loading ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>…</td></tr>
          : rows.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}><ClipboardList size={38} style={{ display: 'block', margin: '0 auto 12px', color: '#BFDBFE' }} /><p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('commandes.empty')}</p></td></tr>
            : rows.map(b => {
              const cfg = STATUT_CFG[b.statut];
              return (
                <tr key={b.id} className="appro-row" style={{ borderTop: '1px solid #F0F4F8', transition: 'background .1s' }}>
                  <td style={{ padding: '11px 14px' }}><span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, color: '#1E3A8A', background: '#DBEAFE', padding: '2px 8px', borderRadius: 6 }}>{b.numero}</span></td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{b.fournisseur?.nom || '—'}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{fmtDate(b.dateCommande)}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569' }}>{fmtDate(b.dateLivraisonPrevue)}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#1A2332', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(b.montantTotal)}</td>
                  <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>{t(`statut.${b.statut}`)}</span></td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {b.statut === 'brouillon' && <ActionBtn onClick={() => onEnvoyer(b)} color="#1D4ED8" icon={<Send size={12} />} label={t('commandes.envoyer')} />}
                      {(b.statut === 'envoyee' || b.statut === 'partiellement_recue') && <ActionBtn onClick={() => onReception(b)} color="#15803D" icon={<PackageCheck size={12} />} label={t('commandes.reception')} />}
                      {b.statut !== 'recue' && b.statut !== 'annulee' && <ActionBtn onClick={() => onAnnuler(b)} color="#DC2626" icon={<Ban size={12} />} label={t('commandes.annuler')} />}
                    </div>
                  </td>
                </tr>
              );
            })}
      </tbody>
    </table>
  );
}

function ActionBtn({ onClick, color, icon, label }: { onClick: () => void; color: string; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} title={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: `1px solid ${color}33`, background: `${color}11`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {icon} {label}
    </button>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────
function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, zIndex: 1000, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: wide ? 720 : 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeUp .2s ease', marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0F4F8' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: '#F1F5F9', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#64748B" /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' };

// ── Fournisseur modal ────────────────────────────────────────────────
function FournisseurModal({ t, onClose, onSaved }: { t: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ nom: '', type: 'grossiste' as TypeFournisseur, contact: '', telephone: '', email: '', adresse: '', ville: '', actif: true });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      await apiClient('/approvisionnement/fournisseurs', { method: 'POST', body: { ...form, email: form.email || undefined } });
      onSaved();
    } catch { alert(t('errors.save')); setSaving(false); }
  };

  return (
    <ModalShell title={t('formFournisseur.title')} onClose={onClose}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div><label style={labelStyle}>{t('formFournisseur.nom')} *</label><input style={inputStyle} value={form.nom} onChange={e => set('nom', e.target.value)} /></div>
        <div><label style={labelStyle}>{t('formFournisseur.type')}</label>
          <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            {(['grossiste', 'laboratoire', 'consommables', 'autre'] as const).map(ty => <option key={ty} value={ty}>{t(`typeFournisseur.${ty}`)}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t('formFournisseur.contact')}</label><input style={inputStyle} value={form.contact} onChange={e => set('contact', e.target.value)} /></div>
          <div><label style={labelStyle}>{t('formFournisseur.telephone')}</label><input style={inputStyle} value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>{t('formFournisseur.email')}</label><input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label style={labelStyle}>{t('formFournisseur.ville')}</label><input style={inputStyle} value={form.ville} onChange={e => set('ville', e.target.value)} /></div>
        </div>
        <div><label style={labelStyle}>{t('formFournisseur.adresse')}</label><input style={inputStyle} value={form.adresse} onChange={e => set('adresse', e.target.value)} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1A2332', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} /> {t('formFournisseur.actif')}
        </label>
      </div>
      <ModalFooter t={t} onClose={onClose} onSubmit={submit} saving={saving} disabled={!form.nom.trim()} saveLabel={t('formFournisseur.save')} savingLabel={t('formFournisseur.saving')} />
    </ModalShell>
  );
}

// ── Commande modal ───────────────────────────────────────────────────
type DraftLigne = { designation: string; medicamentId: string; quantiteCommandee: string; prixUnitaire: string };

function CommandeModal({ t, fournisseurs, medicaments, onClose, onSaved }: { t: any; fournisseurs: Fournisseur[]; medicaments: Medicament[]; onClose: () => void; onSaved: () => void }) {
  const [fournisseurId, setFournisseurId] = useState('');
  const [dateLivraisonPrevue, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<DraftLigne[]>([{ designation: '', medicamentId: '', quantiteCommandee: '', prixUnitaire: '' }]);
  const [saving, setSaving] = useState(false);

  const setLigne = (i: number, k: keyof DraftLigne, v: string) => setLignes(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const onMedChange = (i: number, medId: string) => {
    const med = medicaments.find(m => m.id === medId);
    setLignes(p => p.map((l, idx) => idx === i ? {
      ...l, medicamentId: medId,
      designation: med ? `${med.nom}${med.dosage ? ' ' + med.dosage : ''}` : l.designation,
      prixUnitaire: med?.prixUnitaire && !l.prixUnitaire ? String(med.prixUnitaire) : l.prixUnitaire,
    } : l));
  };
  const addLigne = () => setLignes(p => [...p, { designation: '', medicamentId: '', quantiteCommandee: '', prixUnitaire: '' }]);
  const removeLigne = (i: number) => setLignes(p => p.filter((_, idx) => idx !== i));

  const total = lignes.reduce((acc, l) => acc + (Number(l.quantiteCommandee) || 0) * (Number(l.prixUnitaire) || 0), 0);
  const validLignes = lignes.filter(l => l.designation.trim() && Number(l.quantiteCommandee) > 0);
  const canSave = !!fournisseurId && validLignes.length > 0;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await apiClient('/approvisionnement/commandes', {
        method: 'POST',
        body: {
          fournisseurId,
          dateLivraisonPrevue: dateLivraisonPrevue || undefined,
          notes: notes || undefined,
          lignes: validLignes.map(l => ({
            designation: l.designation.trim(),
            medicamentId: l.medicamentId || undefined,
            quantiteCommandee: Number(l.quantiteCommandee),
            prixUnitaire: Number(l.prixUnitaire) || 0,
          })),
        },
      });
      onSaved();
    } catch { alert(t('errors.save')); setSaving(false); }
  };

  return (
    <ModalShell title={t('formCommande.title')} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div><label style={labelStyle}>{t('formCommande.fournisseur')} *</label>
          <select style={inputStyle} value={fournisseurId} onChange={e => setFournisseurId(e.target.value)}>
            <option value="">{t('formCommande.selectFournisseur')}</option>
            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
          </select>
        </div>
        <div><label style={labelStyle}>{t('formCommande.dateLivraison')}</label><input type="date" style={inputStyle} value={dateLivraisonPrevue} onChange={e => setDate(e.target.value)} /></div>
      </div>

      <label style={labelStyle}>{t('formCommande.lignes')}</label>
      <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
        {lignes.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 0.7fr 0.9fr auto', gap: 6, alignItems: 'center' }}>
            <select style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }} value={l.medicamentId} onChange={e => onMedChange(i, e.target.value)}>
              <option value="">{t('formCommande.aucunMedicament')}</option>
              {medicaments.map(m => <option key={m.id} value={m.id}>{m.nom}{m.dosage ? ' ' + m.dosage : ''}</option>)}
            </select>
            <input style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }} placeholder={t('formCommande.designation')} value={l.designation} onChange={e => setLigne(i, 'designation', e.target.value)} />
            <input type="number" min="0" style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }} placeholder={t('formCommande.quantite')} value={l.quantiteCommandee} onChange={e => setLigne(i, 'quantiteCommandee', e.target.value)} />
            <input type="number" min="0" style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }} placeholder={t('formCommande.prixUnitaire')} value={l.prixUnitaire} onChange={e => setLigne(i, 'prixUnitaire', e.target.value)} />
            <button onClick={() => removeLigne(i)} disabled={lignes.length === 1} style={{ border: 'none', background: 'transparent', cursor: lignes.length === 1 ? 'not-allowed' : 'pointer', opacity: lignes.length === 1 ? 0.3 : 1, padding: 4 }}><Trash2 size={15} color="#DC2626" /></button>
          </div>
        ))}
      </div>
      <button onClick={addLigne} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1.5px dashed #93C5FD', background: '#EFF6FF', color: '#1D4ED8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        <Plus size={13} /> {t('formCommande.addLigne')}
      </button>

      <div style={{ marginTop: 14 }}><label style={labelStyle}>{t('formCommande.notes')}</label><textarea style={{ ...inputStyle, minHeight: 54, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} /></div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 12, padding: '10px 0', borderTop: '1px solid #F0F4F8' }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{t('formCommande.total')}</span>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#1E3A8A', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(total)}</span>
      </div>

      <ModalFooter t={t} onClose={onClose} onSubmit={submit} saving={saving} disabled={!canSave} saveLabel={t('formCommande.save')} savingLabel={t('formCommande.saving')} />
    </ModalShell>
  );
}

// ── Reception modal ──────────────────────────────────────────────────
function ReceptionModal({ t, bonId, onClose, onSaved }: { t: any; bonId: string; onClose: () => void; onSaved: () => void }) {
  const [bon, setBon] = useState<Bon | null>(null);
  const [qtes, setQtes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient<Bon>(`/approvisionnement/commandes/${bonId}`).then(b => {
      setBon(b);
      const init: Record<string, string> = {};
      (b.lignes ?? []).forEach(l => { init[l.id] = ''; });
      setQtes(init);
    }).catch(() => {});
  }, [bonId]);

  const submit = async () => {
    if (!bon) return;
    const lignes = (bon.lignes ?? [])
      .map(l => ({ ligneId: l.id, quantiteRecue: Number(qtes[l.id]) || 0 }))
      .filter(x => x.quantiteRecue > 0);
    if (lignes.length === 0) return;
    setSaving(true);
    try {
      await apiClient(`/approvisionnement/commandes/${bonId}/reception`, { method: 'POST', body: { lignes, notes: notes || undefined } });
      onSaved();
    } catch { alert(t('errors.action')); setSaving(false); }
  };

  return (
    <ModalShell title={t('reception.title', { numero: bon?.numero ?? '…' })} onClose={onClose} wide>
      {!bon ? <div style={{ padding: 30, textAlign: 'center', color: '#90A4AE' }}>…</div> : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr style={{ background: '#F8FAFC' }}>
                {[t('reception.designation'), t('reception.commandee'), t('reception.dejaRecue'), t('reception.aRecevoir')].map((h, i) => (
                  <th key={i} style={{ padding: '8px 10px', textAlign: i === 0 ? 'left' : 'center', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(bon.lignes ?? []).map(l => {
                  const reste = l.quantiteCommandee - l.quantiteRecue;
                  return (
                    <tr key={l.id} style={{ borderTop: '1px solid #F0F4F8' }}>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: '#1A2332', fontWeight: 600 }}>{l.designation}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12 }}>{l.quantiteCommandee}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontSize: 12, color: '#64748B' }}>{l.quantiteRecue}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input type="number" min="0" max={reste} disabled={reste <= 0} value={qtes[l.id] ?? ''} onChange={e => setQtes(p => ({ ...p, [l.id]: e.target.value }))}
                          style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 12, textAlign: 'center', outline: 'none', background: reste <= 0 ? '#F1F5F9' : '#fff' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}><label style={labelStyle}>{t('reception.notes')}</label><textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <p style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 10px', margin: '12px 0 0' }}>{t('reception.stockInfo')}</p>
          <ModalFooter t={t} onClose={onClose} onSubmit={submit} saving={saving} disabled={false} saveLabel={t('reception.save')} savingLabel={t('reception.saving')} />
        </>
      )}
    </ModalShell>
  );
}

// ── Shared footer ────────────────────────────────────────────────────
function ModalFooter({ t, onClose, onSubmit, saving, disabled, saveLabel, savingLabel }: { t: any; onClose: () => void; onSubmit: () => void; saving: boolean; disabled: boolean; saveLabel: string; savingLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
      <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('formFournisseur.cancel')}</button>
      <button onClick={onSubmit} disabled={saving || disabled} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: disabled ? '#93C5FD' : '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving || disabled ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? savingLabel : saveLabel}</button>
    </div>
  );
}
