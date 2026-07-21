'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  UserCog, Plus, Search, Users, Calendar, Clock,
  TrendingUp, CheckCircle, XCircle, Download, Banknote, FileSpreadsheet,
  RefreshCw, X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { exportXLSX, exportPDF } from '@/lib/export';

// ── Types (miroir du backend src/rh) ────────────────────────────────────────
interface Employe {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  departement?: string | null;
  dateEmbauche?: string | null;
  typeContrat: 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT';
  salaireBase: number | string;
  statut: 'actif' | 'suspendu' | 'parti';
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  enConge?: boolean;
}
interface Conge {
  id: string;
  employeId: string;
  employe?: { nom: string; prenom: string } | null;
  type: 'conge' | 'maladie' | 'maternite' | 'formation' | 'autre';
  dateDebut: string;
  dateFin: string;
  jours: number;
  statut: 'demande' | 'approuve' | 'refuse';
  motif?: string | null;
}
interface Bulletin {
  id: string;
  employeId: string;
  employe?: { nom: string; prenom: string; departement?: string | null } | null;
  mois: string;
  salaireBase: number | string;
  primes: number | string;
  retenues: number | string;
  cotisations: number | string;
  netAPayer: number | string;
  statut: string;
}
interface RhStats {
  effectif: number;
  totalEmployes: number;
  masseSalariale: number;
  congesEnCours: number;
  congesEnAttente: number;
  nbDepartements: number;
}

const SERVICE_COLORS: Record<string, [string, string]> = {
  'Chirurgie': ['#1E40AF', '#DBEAFE'],
  'Gynécologie': ['#9D174D', '#FCE7F3'],
  'Soins intensifs': ['#991B1B', '#FEE2E2'],
  'Finance': ['#065F46', '#D1FAE5'],
  'Laboratoire': ['#5B21B6', '#EDE9FE'],
  'Pharmacie': ['#92400E', '#FEF3C7'],
  'Accueil': ['#374151', '#F3F4F6'],
  'Imagerie': ['#0F766E', '#CCFBF1'],
};

const AVATAR_COLORS: [string, string][] = [
  ['#1D4ED8', '#DBEAFE'], ['#7C3AED', '#EDE9FE'], ['#0F766E', '#CCFBF1'],
  ['#B45309', '#FEF3C7'], ['#9D174D', '#FCE7F3'], ['#065F46', '#D1FAE5'],
  ['#7C2D12', '#FEE2E2'], ['#1E40AF', '#DBEAFE'],
];
function avatarColor(name: string): [string, string] {
  let h = 0; for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(nom: string, prenom: string) {
  return `${(prenom || '').trim()[0] ?? ''}${(nom || '').trim()[0] ?? ''}`.toUpperCase() || '?';
}
function num(v: number | string | null | undefined): number { return Number(v ?? 0) || 0; }
function fmtXOF(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }
function ancienneteYears(d?: string | null): number | null {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600000));
}
function fullName(e: { nom: string; prenom: string }) { return `${e.prenom} ${e.nom}`.trim(); }

const TABS = [
  { key: 'personnel', icon: '👥' },
  { key: 'conges', icon: '🌴' },
  { key: 'paie', icon: '💳' },
] as const;

function currentMois() { return new Date().toISOString().slice(0, 7); }

const unwrap = (r: any): any[] =>
  Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);

export default function RHPage() {
  const [tab, setTab] = useState<'personnel' | 'conges' | 'paie'>('personnel');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [conges, setConges] = useState<Conge[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [stats, setStats] = useState<RhStats | null>(null);
  const [mois, setMois] = useState(currentMois());

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showCongeModal, setShowCongeModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (moisPaie: string) => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, congRes, statsRes, paieRes] = await Promise.allSettled([
        apiClient<any>('/rh/employes'),
        apiClient<any>('/rh/conges'),
        apiClient<RhStats>('/rh/stats'),
        apiClient<any>(`/rh/paie?mois=${encodeURIComponent(moisPaie)}`),
      ]);
      if (empRes.status === 'fulfilled') setEmployes(unwrap(empRes.value));
      if (congRes.status === 'fulfilled') setConges(unwrap(congRes.value));
      if (statsRes.status === 'fulfilled') setStats(statsRes.value as RhStats);
      if (paieRes.status === 'fulfilled') setBulletins(unwrap(paieRes.value));
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(mois); }, [load, mois]);

  // ── Actions ────────────────────────────────────────────────────────────
  const handleAddEmploye = async (form: Record<string, string>) => {
    setBusy(true); setError(null);
    try {
      await apiClient('/rh/employes', {
        method: 'POST',
        body: {
          nom: form.nom,
          prenom: form.prenom,
          poste: form.poste,
          departement: form.departement || undefined,
          typeContrat: form.typeContrat || undefined,
          salaireBase: Number(form.salaireBase) || 0,
          dateEmbauche: form.dateEmbauche || undefined,
          telephone: form.telephone || undefined,
          email: form.email || undefined,
        },
      });
      setShowEmpModal(false);
      await load(mois);
    } catch (e: any) { setError(e?.message || "Échec de l'ajout"); }
    finally { setBusy(false); }
  };

  const handleAddConge = async (form: Record<string, string>) => {
    setBusy(true); setError(null);
    try {
      await apiClient('/rh/conges', {
        method: 'POST',
        body: {
          employeId: form.employeId,
          type: form.type || undefined,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          motif: form.motif || undefined,
        },
      });
      setShowCongeModal(false);
      await load(mois);
    } catch (e: any) { setError(e?.message || 'Échec de la demande'); }
    finally { setBusy(false); }
  };

  const handleApprouver = async (id: string, approuver: boolean) => {
    setBusy(true); setError(null);
    try {
      await apiClient(`/rh/conges/${id}/approuver`, {
        method: 'PATCH',
        body: { approuver },
      });
      await load(mois);
    } catch (e: any) { setError(e?.message || 'Échec du traitement'); }
    finally { setBusy(false); }
  };

  const handleGenererPaie = async () => {
    setBusy(true); setError(null);
    try {
      await apiClient('/rh/paie', { method: 'POST', body: { mois } });
      await load(mois);
      setTab('paie');
    } catch (e: any) { setError(e?.message || 'Échec de la génération'); }
    finally { setBusy(false); }
  };

  // ── Exports (données réelles) ────────────────────────────────────────────
  const handleExportXLSX = () => exportXLSX(
    employes.map(e => ({
      'Matricule': e.matricule, 'Nom': fullName(e), 'Poste': e.poste,
      'Département': e.departement ?? '', 'Type contrat': e.typeContrat,
      'Statut': e.enConge ? 'En congé' : e.statut,
      'Salaire (XOF)': num(e.salaireBase),
      "Date d'embauche": e.dateEmbauche ? e.dateEmbauche.slice(0, 10) : '',
      'Contact': e.telephone ?? '',
    })),
    `rh_personnel_${new Date().toISOString().slice(0, 10)}`, 'Personnel',
  );
  const handleExportPDF = () => exportPDF(
    [
      { header: 'Matricule', dataKey: 'matricule', width: 24 },
      { header: 'Nom', dataKey: 'nom', width: 48 },
      { header: 'Poste', dataKey: 'poste', width: 40 },
      { header: 'Département', dataKey: 'departement', width: 34 },
      { header: 'Contrat', dataKey: 'typeContrat', width: 18 },
      { header: 'Statut', dataKey: 'statut', width: 20 },
      { header: 'Salaire XOF', dataKey: 'salaire', width: 28 },
    ],
    employes.map(e => ({
      matricule: e.matricule, nom: fullName(e), poste: e.poste,
      departement: e.departement ?? '', typeContrat: e.typeContrat,
      statut: e.enConge ? 'En congé' : e.statut,
      salaire: num(e.salaireBase).toLocaleString('fr-FR'),
    })),
    'Liste du Personnel — RH',
    `rh_personnel_${new Date().toISOString().slice(0, 10)}`,
    `${employes.length} employé(s) — ${new Date().toLocaleDateString('fr-FR')}`,
  );
  const handleExportPaieXLSX = () => exportXLSX(
    bulletins.map(b => ({
      'Employé': b.employe ? fullName(b.employe) : b.employeId,
      'Mois': b.mois,
      'Salaire base (XOF)': num(b.salaireBase),
      'Primes (XOF)': num(b.primes),
      'Retenues (XOF)': num(b.retenues),
      'Cotisations (XOF)': num(b.cotisations),
      'Net à payer (XOF)': num(b.netAPayer),
      'Statut': b.statut,
    })),
    `rh_paie_${mois}`, 'Paie',
  );

  // ── Dérivés ──────────────────────────────────────────────────────────────
  const filtered = employes.filter(e => {
    const q = search.toLowerCase();
    return !q ||
      fullName(e).toLowerCase().includes(q) ||
      (e.departement ?? '').toLowerCase().includes(q) ||
      e.poste.toLowerCase().includes(q) ||
      e.matricule.toLowerCase().includes(q);
  });

  const masseSalariale = stats?.masseSalariale ??
    employes.filter(e => e.statut === 'actif').reduce((s, e) => s + num(e.salaireBase), 0);
  const nbConge = stats?.congesEnCours ?? employes.filter(e => e.enConge).length;
  const effectif = stats?.effectif ?? employes.filter(e => e.statut === 'actif').length;
  const nbAttente = conges.filter(c => c.statut === 'demande').length;

  const masseBulletins = bulletins.reduce((s, b) => s + num(b.netAPayer), 0);
  // Répartition de la paie par département (données réelles).
  const parDepartement = Object.entries(
    bulletins.reduce<Record<string, { montant: number; count: number }>>((acc, b) => {
      const dep = b.employe?.departement || 'Non affecté';
      acc[dep] = acc[dep] || { montant: 0, count: 0 };
      acc[dep].montant += num(b.netAPayer);
      acc[dep].count += 1;
      return acc;
    }, {}),
  ).map(([service, v]) => ({ service, ...v })).sort((a, b) => b.montant - a.montant);

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .emp-row:hover { background:#F5F7FF !important; }
        .rh-kpi { cursor:pointer; transition:all .15s; }
        .rh-kpi:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.12)!important; }
      `}</style>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1C1917 0%,#292524 50%,#44403C 100%)', borderRadius: 18, padding: '22px 26px 18px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(28,25,23,0.45)' }}>
        <div style={{ position: 'absolute', top: -60, right: 50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 260, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCog size={26} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Ressources Humaines</h1>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                  {loading ? '…' : `${employes.length} employé(s)`}
                  {lastRefresh && <span style={{ marginLeft: 8, opacity: 0.6 }}>• {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => load(mois)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
              </button>
              <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(239,68,68,0.25)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <Download size={13} /> PDF
              </button>
              <button onClick={handleExportXLSX} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 13px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', background: 'rgba(34,197,94,0.25)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                <FileSpreadsheet size={13} /> XLSX
              </button>
              <button onClick={() => { setError(null); setShowEmpModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#1C1917', fontWeight: 800 }}>
                <Plus size={14} /> Nouvel employé
              </button>
            </div>
          </div>

          {/* KPI pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: 'Effectif actif', val: loading ? '…' : effectif, icon: <Users size={11} /> },
              { label: 'En congé', val: loading ? '…' : nbConge, icon: <Calendar size={11} /> },
              { label: 'Congés en attente', val: loading ? '…' : nbAttente, icon: <Clock size={11} /> },
              { label: 'Masse salariale', val: loading ? '…' : fmtXOF(masseSalariale), icon: <Banknote size={11} /> },
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

      {/* ── KPI CARDS ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Effectif actif', value: loading ? '…' : effectif, sub: `${stats?.nbDepartements ?? '—'} département(s)`, color: '#374151', bg: '#F3F4F6', border: '#D1D5DB', icon: <Users size={20} color="#374151" />, tab: 'personnel' as const },
          { label: 'En congé', value: loading ? '…' : nbConge, sub: `${nbAttente} en attente`, color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', icon: <Calendar size={20} color="#92400E" />, tab: 'conges' as const },
          { label: 'Bulletins générés', value: loading ? '…' : bulletins.length, sub: mois, color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD', icon: <Clock size={20} color="#1E40AF" />, tab: 'paie' as const },
          { label: 'Masse salariale', value: loading ? '…' : fmtXOF(masseSalariale), sub: 'Employés actifs', color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7', icon: <TrendingUp size={20} color="#065F46" />, tab: 'paie' as const },
        ].map((k, i) => (
          <div key={i} className="rh-kpi" title={`Voir : ${k.label}`} onClick={() => setTab(k.tab)}
            style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', border: `1.5px solid ${k.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: k.color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#546E7A', marginTop: 2, fontWeight: 600 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 1 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: '#E8EEF8', padding: 4, borderRadius: 12, width: 'fit-content', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#1C1917' : '#78909C', boxShadow: tab === t.key ? '0 1px 6px rgba(0,0,0,0.12)' : 'none', transition: 'all .15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── PERSONNEL ─────────────────────────────────────── */}
      {tab === 'personnel' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, département, poste, matricule…"
                style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 11, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
            </div>
            <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600 }}>{filtered.length} employé{filtered.length > 1 ? 's' : ''}</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Employé', 'Poste', 'Département', 'Contrat', 'Statut', 'Salaire (XOF)', 'Ancienneté'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Aucun employé. Cliquez sur « Nouvel employé » pour commencer.</td></tr>
                  )}
                  {filtered.map(e => {
                    const [ac, ab] = avatarColor(fullName(e));
                    const dep = e.departement ?? '';
                    const [sc, sb] = SERVICE_COLORS[dep] ?? ['#374151', '#F3F4F6'];
                    return (
                      <tr key={e.id} className="emp-row" style={{ borderTop: '1px solid #F0F4FA', transition: 'background .12s' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${ab},${ac}22)`, border: `1.5px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: ac, flexShrink: 0 }}>
                              {initials(e.nom, e.prenom)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{fullName(e)}</div>
                              <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{e.matricule}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#37474F', fontWeight: 600 }}>{e.poste}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {dep
                            ? <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sb, color: sc, border: `1px solid ${sc}33` }}>{dep}</span>
                            : <span style={{ fontSize: 11, color: '#B0BEC5' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: e.typeContrat === 'CDI' ? '#D1FAE5' : '#FEF3C7', color: e.typeContrat === 'CDI' ? '#065F46' : '#92400E', border: `1px solid ${e.typeContrat === 'CDI' ? '#6EE7B7' : '#FDE68A'}` }}>
                            {e.typeContrat}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: e.enConge ? '#FEF3C7' : '#D1FAE5', color: e.enConge ? '#92400E' : '#065F46', border: `1px solid ${e.enConge ? '#FDE68A' : '#6EE7B7'}` }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.enConge ? '#F59E0B' : '#10B981', display: 'inline-block' }} />
                            {e.enConge ? 'En congé' : (e.statut === 'actif' ? 'Actif' : e.statut === 'suspendu' ? 'Suspendu' : 'Parti')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#1A2332', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtXOF(num(e.salaireBase))}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#78909C' }}>{anciennete(e.dateEmbauche)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── CONGÉS ────────────────────────────────────────── */}
      {tab === 'conges' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => { setError(null); setShowCongeModal(true); }} disabled={employes.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#1C1917', cursor: employes.length === 0 ? 'not-allowed' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800, opacity: employes.length === 0 ? 0.5 : 1 }}>
              <Plus size={14} /> Demander un congé
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1.5px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{conges.length} demande{conges.length > 1 ? 's' : ''}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '3px 12px', borderRadius: 20, border: '1px solid #FDE68A' }}>
                {nbAttente} en attente
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Employé', 'Type', 'Du', 'Au', 'Jours', 'Statut', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && conges.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>Aucune demande de congé.</td></tr>
                  )}
                  {conges.map(c => {
                    const approuve = c.statut === 'approuve';
                    const refuse = c.statut === 'refuse';
                    const attente = c.statut === 'demande';
                    return (
                      <tr key={c.id} style={{ borderTop: '1px solid #F0F4FA', borderLeft: `3px solid ${approuve ? '#6EE7B7' : refuse ? '#FCA5A5' : '#FDE68A'}` }}>
                        <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 13, color: '#1A2332' }}>{c.employe ? fullName(c.employe) : c.employeId}</td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#546E7A' }}>{CONGE_TYPE_LABEL[c.type] ?? c.type}</td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#37474F', whiteSpace: 'nowrap' }}>{new Date(c.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#37474F', whiteSpace: 'nowrap' }}>{new Date(c.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                        <td style={{ padding: '13px 16px', fontWeight: 800, fontSize: 13, color: '#1A2332' }}>{c.jours}j</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: approuve ? '#D1FAE5' : refuse ? '#FEE2E2' : '#FEF3C7', color: approuve ? '#065F46' : refuse ? '#991B1B' : '#92400E', border: `1px solid ${approuve ? '#6EE7B7' : refuse ? '#FCA5A5' : '#FDE68A'}` }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: approuve ? '#10B981' : refuse ? '#EF4444' : '#F59E0B', display: 'inline-block' }} />
                            {approuve ? 'Approuvé' : refuse ? 'Refusé' : 'En attente'}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          {attente && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleApprouver(c.id, true)} disabled={busy}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                                <CheckCircle size={11} /> Approuver
                              </button>
                              <button onClick={() => handleApprouver(c.id, false)} disabled={busy}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#991B1B', fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                                <XCircle size={11} /> Refuser
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── PAIE ──────────────────────────────────────────── */}
      {tab === 'paie' && (
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#064E3B,#065F46)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Module de paie</div>
                <input type="month" value={mois} onChange={e => setMois(e.target.value)}
                  style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 900, color: '#064E3B', outline: 'none' }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>Net à payer (généré)</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(masseBulletins)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {bulletins.length} bulletin(s) • {effectif} actif(s)
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>Répartition par département — {mois}</div>
              {parDepartement.length === 0 ? (
                <div style={{ padding: '20px 0', color: '#90A4AE', fontSize: 13 }}>
                  Aucun bulletin pour ce mois. Cliquez sur « Générer les bulletins de paie ».
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {parDepartement.map(s => {
                    const pct = masseBulletins > 0 ? Math.round((s.montant / masseBulletins) * 100) : 0;
                    return (
                      <div key={s.service}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, color: '#37474F' }}>{s.service} <span style={{ fontWeight: 400, color: '#90A4AE' }}>({s.count})</span></span>
                          <span style={{ fontWeight: 800, color: '#065F46', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(s.montant)}</span>
                        </div>
                        <div style={{ height: 7, background: '#F0F4FA', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#065F46,#10B981)', borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={handleGenererPaie} disabled={busy || loading}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 11, background: 'linear-gradient(135deg,#064E3B,#065F46)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(6,78,59,0.3)', opacity: busy ? 0.6 : 1 }}>
                  <Banknote size={16} /> {busy ? 'Génération…' : 'Générer les bulletins de paie'}
                </button>
                <button onClick={handleExportPaieXLSX} disabled={bulletins.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 11, background: '#fff', border: '1.5px solid #E0E8F0', color: '#374151', fontSize: 13, fontWeight: 700, cursor: bulletins.length === 0 ? 'not-allowed' : 'pointer', opacity: bulletins.length === 0 ? 0.5 : 1 }}>
                  <Download size={14} /> Exporter XLSX
                </button>
              </div>
            </div>

            {bulletins.length > 0 && (
              <div style={{ overflowX: 'auto', borderTop: '1.5px solid #EEF2F8' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Employé', 'Base', 'Primes', 'Retenues', 'Cotisations', 'Net à payer', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bulletins.map(b => (
                      <tr key={b.id} style={{ borderTop: '1px solid #F0F4FA' }}>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{b.employe ? fullName(b.employe) : b.employeId}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#37474F', fontVariantNumeric: 'tabular-nums' }}>{num(b.salaireBase).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#065F46', fontVariantNumeric: 'tabular-nums' }}>{num(b.primes).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#991B1B', fontVariantNumeric: 'tabular-nums' }}>{num(b.retenues).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '11px 16px', fontSize: 12, color: '#991B1B', fontVariantNumeric: 'tabular-nums' }}>{num(b.cotisations).toLocaleString('fr-FR')}</td>
                        <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 800, color: '#1A2332', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(num(b.netAPayer))}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: '#EEF2F8', color: '#546E7A' }}>{b.statut}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: NOUVEL EMPLOYÉ ─────────────────────────── */}
      {showEmpModal && (
        <EmployeModal busy={busy} onClose={() => setShowEmpModal(false)} onSubmit={handleAddEmploye} />
      )}
      {/* ── MODAL: DEMANDE DE CONGÉ ───────────────────────── */}
      {showCongeModal && (
        <CongeModal busy={busy} employes={employes} onClose={() => setShowCongeModal(false)} onSubmit={handleAddConge} />
      )}
    </div>
  );
}

// ── Modales ────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' };
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

function EmployeModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (f: Record<string, string>) => void }) {
  const [f, setF] = useState<Record<string, string>>({ typeContrat: 'CDI' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.nom && f.prenom && f.poste && f.salaireBase;
  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Nouvel employé" onClose={onClose} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelS}>Prénom *</label><input style={inputS} value={f.prenom ?? ''} onChange={e => set('prenom', e.target.value)} /></div>
          <div><label style={labelS}>Nom *</label><input style={inputS} value={f.nom ?? ''} onChange={e => set('nom', e.target.value)} /></div>
          <div><label style={labelS}>Poste *</label><input style={inputS} value={f.poste ?? ''} onChange={e => set('poste', e.target.value)} /></div>
          <div><label style={labelS}>Département</label><input style={inputS} value={f.departement ?? ''} onChange={e => set('departement', e.target.value)} /></div>
          <div><label style={labelS}>Type contrat</label>
            <select style={inputS} value={f.typeContrat} onChange={e => set('typeContrat', e.target.value)}>
              <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="STAGE">Stage</option><option value="CONSULTANT">Consultant</option>
            </select>
          </div>
          <div><label style={labelS}>Salaire base (XOF) *</label><input style={inputS} type="number" value={f.salaireBase ?? ''} onChange={e => set('salaireBase', e.target.value)} /></div>
          <div><label style={labelS}>Date embauche</label><input style={inputS} type="date" value={f.dateEmbauche ?? ''} onChange={e => set('dateEmbauche', e.target.value)} /></div>
          <div><label style={labelS}>Téléphone</label><input style={inputS} value={f.telephone ?? ''} onChange={e => set('telephone', e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelS}>Email</label><input style={inputS} type="email" value={f.email ?? ''} onChange={e => set('email', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => valid && onSubmit(f)} disabled={!valid || busy} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1C1917', color: '#fff', fontSize: 13, fontWeight: 800, cursor: (!valid || busy) ? 'not-allowed' : 'pointer', opacity: (!valid || busy) ? 0.5 : 1 }}>{busy ? 'Ajout…' : 'Ajouter'}</button>
        </div>
      </div>
    </div>
  );
}

function CongeModal({ busy, employes, onClose, onSubmit }: { busy: boolean; employes: Employe[]; onClose: () => void; onSubmit: (f: Record<string, string>) => void }) {
  const [f, setF] = useState<Record<string, string>>({ type: 'conge' });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const valid = f.employeId && f.dateDebut && f.dateFin;
  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Demande de congé" onClose={onClose} />
        <div style={{ display: 'grid', gap: 12 }}>
          <div><label style={labelS}>Employé *</label>
            <select style={inputS} value={f.employeId ?? ''} onChange={e => set('employeId', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>)}
            </select>
          </div>
          <div><label style={labelS}>Type</label>
            <select style={inputS} value={f.type} onChange={e => set('type', e.target.value)}>
              <option value="conge">Congé annuel</option><option value="maladie">Congé maladie</option>
              <option value="maternite">Maternité</option><option value="formation">Formation</option><option value="autre">Autre</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelS}>Du *</label><input style={inputS} type="date" value={f.dateDebut ?? ''} onChange={e => set('dateDebut', e.target.value)} /></div>
            <div><label style={labelS}>Au *</label><input style={inputS} type="date" value={f.dateFin ?? ''} onChange={e => set('dateFin', e.target.value)} /></div>
          </div>
          <div><label style={labelS}>Motif</label><input style={inputS} value={f.motif ?? ''} onChange={e => set('motif', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => valid && onSubmit(f)} disabled={!valid || busy} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1C1917', color: '#fff', fontSize: 13, fontWeight: 800, cursor: (!valid || busy) ? 'not-allowed' : 'pointer', opacity: (!valid || busy) ? 0.5 : 1 }}>{busy ? 'Envoi…' : 'Envoyer'}</button>
        </div>
      </div>
    </div>
  );
}
