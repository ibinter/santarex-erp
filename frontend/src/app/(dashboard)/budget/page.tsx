'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  PiggyBank,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lock,
  Trash2,
  X,
  ArrowLeft,
  BarChart3,
  LayoutGrid,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

// ── Types (miroir du backend budget) ────────────────────────────────────
type TypeBudget = 'recettes' | 'depenses';
type StatutBudget = 'brouillon' | 'valide' | 'cloture';

interface LigneBudget {
  id: string;
  budgetId: string;
  poste: string;
  categorie?: string;
  montantPrevu: number | string;
  montantRealise: number | string;
  ecart: number | string;
  tauxRealisation: number | string;
  notes?: string;
}
interface Budget {
  id: string;
  libelle: string;
  exercice: number;
  type: TypeBudget;
  service?: string;
  poste?: string;
  statut: StatutBudget;
  devise: string;
  notes?: string;
  lignes?: LigneBudget[];
}
interface TableauBord {
  exercice: number;
  nbBudgets: number;
  recettes: { prevu: number; realise: number; ecart: number; taux: number };
  depenses: { prevu: number; realise: number; ecart: number; taux: number };
  resultatPrevu: number;
  resultatRealise: number;
  parService: { service: string; prevu: number; realise: number; ecart: number; taux: number }[];
}
interface Stats {
  exercice: number;
  totalPrevu: number;
  totalRealise: number;
  ecartGlobal: number;
  tauxGlobal: number;
  nbDepassements: number;
  topEcarts: {
    id: string;
    poste: string;
    categorie?: string;
    montantPrevu: number;
    montantRealise: number;
    ecart: number;
    tauxRealisation: number;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────
const n = (v: unknown): number => Number(v) || 0;
const fmt = (v: unknown, devise = 'XOF'): string =>
  `${n(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${devise}`;

function tauxColor(taux: number): string {
  if (taux > 100) return '#DC2626';
  if (taux >= 90) return '#D97706';
  if (taux >= 50) return '#059669';
  return '#2563EB';
}
function ecartColor(ecart: number, type: TypeBudget): string {
  // Pour les dépenses, un écart positif (réalisé > prévu) est défavorable.
  if (ecart === 0) return '#6B7280';
  const defavorable = type === 'depenses' ? ecart > 0 : ecart < 0;
  return defavorable ? '#DC2626' : '#059669';
}

const CARD: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 16,
};
const BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #D1D5DB',
  background: '#fff',
  fontSize: 14,
  cursor: 'pointer',
};
const BTN_PRIMARY: React.CSSProperties = {
  ...BTN,
  background: '#4F46E5',
  color: '#fff',
  border: '1px solid #4F46E5',
};

// ── Barre de progression prévu/réalisé ───────────────────────────────────
function ProgressBar({ taux }: { taux: number }) {
  const width = Math.min(taux, 150);
  return (
    <div style={{ background: '#F3F4F6', borderRadius: 6, height: 10, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          width: `${(width / 150) * 100}%`,
          height: '100%',
          background: tauxColor(taux),
          transition: 'width .3s',
        }}
      />
    </div>
  );
}

export default function BudgetPage() {
  const t = useTranslations('budget');
  const [tab, setTab] = useState<'tableauBord' | 'budgets'>('tableauBord');
  const [exercice, setExercice] = useState<number>(new Date().getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [tb, setTb] = useState<TableauBord | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const annees = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i + 1);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [tbRes, stRes] = await Promise.all([
        apiClient<TableauBord>(`/budget/tableau-bord?exercice=${exercice}`),
        apiClient<Stats>(`/budget/stats?exercice=${exercice}`),
      ]);
      setTb(tbRes);
      setStats(stRes);
    } finally {
      setLoading(false);
    }
  }, [exercice]);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<Budget[]>(`/budget?exercice=${exercice}`);
      setBudgets(res);
    } finally {
      setLoading(false);
    }
  }, [exercice]);

  useEffect(() => {
    if (tab === 'tableauBord') loadDashboard();
    else loadBudgets();
  }, [tab, loadDashboard, loadBudgets]);

  const openBudget = async (id: string) => {
    const b = await apiClient<Budget>(`/budget/${id}`);
    setSelected(b);
  };

  // ── Rendu détail d'un budget ───────────────────────────────────────────
  if (selected) {
    return (
      <BudgetDetail
        budget={selected}
        onBack={() => {
          setSelected(null);
          loadBudgets();
        }}
        onChanged={(b) => setSelected(b)}
      />
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PiggyBank size={28} color="#4F46E5" />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t('title')}</h1>
            <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>{t('subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={exercice}
            onChange={(e) => setExercice(Number(e.target.value))}
            style={{ ...BTN, cursor: 'pointer' }}
          >
            {annees.map((a) => (
              <option key={a} value={a}>{t('exercice')} {a}</option>
            ))}
          </select>
          <button style={BTN_PRIMARY} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> {t('nouveauBudget')}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
        {(['tableauBord', 'budgets'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: tab === k ? '#4F46E5' : '#6B7280',
              borderBottom: tab === k ? '2px solid #4F46E5' : '2px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {k === 'tableauBord' ? <BarChart3 size={16} /> : <LayoutGrid size={16} />}
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#6B7280' }}>{t('chargement')}</p>}

      {/* Tableau de bord */}
      {tab === 'tableauBord' && tb && stats && !loading && (
        <Dashboard t={t} tb={tb} stats={stats} />
      )}

      {/* Liste des budgets */}
      {tab === 'budgets' && !loading && (
        <BudgetList t={t} budgets={budgets} onOpen={openBudget} />
      )}

      {showCreate && (
        <CreateBudgetModal
          t={t}
          exercice={exercice}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadBudgets();
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}

// ── Composant Tableau de bord ─────────────────────────────────────────────
function Dashboard({ t, tb, stats }: { t: ReturnType<typeof useTranslations>; tb: TableauBord; stats: Stats }) {
  const maxBar = Math.max(tb.recettes.prevu, tb.recettes.realise, tb.depenses.prevu, tb.depenses.realise, 1);
  const bar = (v: number) => `${(v / maxBar) * 100}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={CARD}>
          <div style={{ color: '#6B7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="#059669" /> {t('tableauBord.recettes')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{fmt(tb.recettes.realise)}</div>
          <div style={{ color: '#6B7280', fontSize: 12 }}>/ {fmt(tb.recettes.prevu)} · {tb.recettes.taux}%</div>
        </div>
        <div style={CARD}>
          <div style={{ color: '#6B7280', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingDown size={16} color="#DC2626" /> {t('tableauBord.depenses')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{fmt(tb.depenses.realise)}</div>
          <div style={{ color: '#6B7280', fontSize: 12 }}>/ {fmt(tb.depenses.prevu)} · {tb.depenses.taux}%</div>
        </div>
        <div style={CARD}>
          <div style={{ color: '#6B7280', fontSize: 13 }}>{t('tableauBord.resultatRealise')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: tb.resultatRealise >= 0 ? '#059669' : '#DC2626' }}>
            {fmt(tb.resultatRealise)}
          </div>
          <div style={{ color: '#6B7280', fontSize: 12 }}>{t('tableauBord.resultatPrevu')}: {fmt(tb.resultatPrevu)}</div>
        </div>
        <div style={CARD}>
          <div style={{ color: '#6B7280', fontSize: 13 }}>{t('tableauBord.tauxGlobal')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: tauxColor(stats.tauxGlobal) }}>{stats.tauxGlobal}%</div>
          <div style={{ color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {stats.nbDepassements > 0 && <AlertTriangle size={13} color="#D97706" />}
            {t('tableauBord.depassements')}: {stats.nbDepassements}
          </div>
        </div>
      </div>

      {/* Graphe prévu vs réalisé */}
      <div style={CARD}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{t('tableauBord.prevuVsRealise')}</h3>
        {([
          { label: t('tableauBord.recettes'), d: tb.recettes },
          { label: t('tableauBord.depenses'), d: tb.depenses },
        ]).map((row) => (
          <div key={row.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{row.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 60, fontSize: 12, color: '#6B7280' }}>{t('champs.montantPrevu')}</span>
              <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 5, height: 18 }}>
                <div style={{ width: bar(row.d.prevu), height: '100%', background: '#93C5FD', borderRadius: 5 }} />
              </div>
              <span style={{ width: 120, fontSize: 12, textAlign: 'right' }}>{fmt(row.d.prevu)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 60, fontSize: 12, color: '#6B7280' }}>{t('champs.montantRealise')}</span>
              <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 5, height: 18 }}>
                <div style={{ width: bar(row.d.realise), height: '100%', background: '#4F46E5', borderRadius: 5 }} />
              </div>
              <span style={{ width: 120, fontSize: 12, textAlign: 'right' }}>{fmt(row.d.realise)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Consolidation par service */}
        <div style={CARD}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{t('tableauBord.parService')}</h3>
          {tb.parService.length === 0 && <p style={{ color: '#6B7280', fontSize: 13 }}>—</p>}
          {tb.parService.map((s) => (
            <div key={s.service} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{s.service}</span>
                <span style={{ color: tauxColor(s.taux) }}>{s.taux}%</span>
              </div>
              <ProgressBar taux={s.taux} />
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {fmt(s.realise)} / {fmt(s.prevu)}
              </div>
            </div>
          ))}
        </div>

        {/* Top écarts */}
        <div style={CARD}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{t('tableauBord.topEcarts')}</h3>
          {stats.topEcarts.length === 0 && <p style={{ color: '#6B7280', fontSize: 13 }}>{t('tableauBord.aucunEcart')}</p>}
          {stats.topEcarts.map((l) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{l.poste}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{l.categorie || '—'} · {l.tauxRealisation}%</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: l.ecart > 0 ? '#DC2626' : '#059669' }}>
                {l.ecart > 0 ? '+' : ''}{fmt(l.ecart)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Liste des budgets ──────────────────────────────────────────────────────
function BudgetList({
  t,
  budgets,
  onOpen,
}: {
  t: ReturnType<typeof useTranslations>;
  budgets: Budget[];
  onOpen: (id: string) => void;
}) {
  if (budgets.length === 0) {
    return <p style={{ color: '#6B7280' }}>{t('aucunBudget')}</p>;
  }
  const statutBadge = (s: StatutBudget) => {
    const map: Record<StatutBudget, [string, string]> = {
      brouillon: ['#6B7280', '#F3F4F6'],
      valide: ['#059669', '#D1FAE5'],
      cloture: ['#4338CA', '#E0E7FF'],
    };
    const [c, bg] = map[s];
    return (
      <span style={{ color: c, background: bg, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
        {t(`statut.${s}`)}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
      {budgets.map((b) => {
        const prevu = (b.lignes || []).reduce((s, l) => s + n(l.montantPrevu), 0);
        const realise = (b.lignes || []).reduce((s, l) => s + n(l.montantRealise), 0);
        const taux = prevu > 0 ? Math.round((realise / prevu) * 100) : 0;
        return (
          <div key={b.id} style={{ ...CARD, cursor: 'pointer' }} onClick={() => onOpen(b.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{b.libelle}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {t(`type.${b.type}`)} · {b.exercice}{b.service ? ` · ${b.service}` : ''}
                </div>
              </div>
              {statutBadge(b.statut)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: '#6B7280' }}>{fmt(realise, b.devise)} / {fmt(prevu, b.devise)}</span>
              <span style={{ fontWeight: 600, color: tauxColor(taux) }}>{taux}%</span>
            </div>
            <ProgressBar taux={taux} />
          </div>
        );
      })}
    </div>
  );
}

// ── Détail d'un budget ──────────────────────────────────────────────────────
function BudgetDetail({
  budget,
  onBack,
  onChanged,
}: {
  budget: Budget;
  onBack: () => void;
  onChanged: (b: Budget) => void;
}) {
  const t = useTranslations('budget');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ poste: '', categorie: '', montantPrevu: '', montantRealise: '' });
  const readOnly = budget.statut === 'cloture';

  const reload = async () => {
    const b = await apiClient<Budget>(`/budget/${budget.id}`);
    onChanged(b);
  };

  const addLigne = async () => {
    if (!form.poste) return;
    await apiClient(`/budget/${budget.id}/lignes`, {
      method: 'POST',
      body: {
        poste: form.poste,
        categorie: form.categorie || undefined,
        montantPrevu: n(form.montantPrevu),
        montantRealise: n(form.montantRealise),
      },
    });
    setForm({ poste: '', categorie: '', montantPrevu: '', montantRealise: '' });
    setAddOpen(false);
    reload();
  };

  const saisirRealise = async (ligne: LigneBudget, value: string) => {
    await apiClient(`/budget/${budget.id}/lignes/${ligne.id}/realise`, {
      method: 'PATCH',
      body: { montantRealise: n(value) },
    });
    reload();
  };

  const removeLigne = async (ligneId: string) => {
    if (!confirm(t('confirmSuppression'))) return;
    await apiClient(`/budget/${budget.id}/lignes/${ligneId}`, { method: 'DELETE' });
    reload();
  };

  const changeStatut = async (action: 'valider' | 'cloturer') => {
    await apiClient(`/budget/${budget.id}/${action}`, { method: 'PATCH' });
    reload();
  };

  const lignes = budget.lignes || [];
  const totalPrevu = lignes.reduce((s, l) => s + n(l.montantPrevu), 0);
  const totalRealise = lignes.reduce((s, l) => s + n(l.montantRealise), 0);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <button style={{ ...BTN, marginBottom: 16 }} onClick={onBack}>
        <ArrowLeft size={16} /> {t('actions.retour')}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{budget.libelle}</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
            {t(`type.${budget.type}`)} · {t('exercice')} {budget.exercice}
            {budget.service ? ` · ${budget.service}` : ''} · {t(`statut.${budget.statut}`)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {budget.statut === 'brouillon' && (
            <button style={BTN} onClick={() => changeStatut('valider')}>
              <CheckCircle size={16} /> {t('actions.valider')}
            </button>
          )}
          {budget.statut !== 'cloture' && (
            <button style={BTN} onClick={() => changeStatut('cloturer')}>
              <Lock size={16} /> {t('actions.cloturer')}
            </button>
          )}
        </div>
      </div>

      {/* Totaux */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...CARD, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{t('detail.totalPrevu')}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(totalPrevu, budget.devise)}</div>
        </div>
        <div style={{ ...CARD, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{t('detail.totalRealise')}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(totalRealise, budget.devise)}</div>
        </div>
        <div style={{ ...CARD, flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{t('champs.ecart')}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: ecartColor(totalRealise - totalPrevu, budget.type) }}>
            {totalRealise - totalPrevu > 0 ? '+' : ''}{fmt(totalRealise - totalPrevu, budget.devise)}
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div style={{ ...CARD, padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>{t('detail.lignes')}</h3>
          {!readOnly && (
            <button style={BTN_PRIMARY} onClick={() => setAddOpen(!addOpen)}>
              <Plus size={16} /> {t('actions.ajouterLigne')}
            </button>
          )}
        </div>

        {addOpen && !readOnly && (
          <div style={{ display: 'flex', gap: 8, padding: 16, borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Field label={t('champs.poste')} value={form.poste} onChange={(v) => setForm({ ...form, poste: v })} />
            <Field label={t('champs.categorie')} value={form.categorie} onChange={(v) => setForm({ ...form, categorie: v })} />
            <Field label={t('champs.montantPrevu')} value={form.montantPrevu} onChange={(v) => setForm({ ...form, montantPrevu: v })} type="number" />
            <Field label={t('champs.montantRealise')} value={form.montantRealise} onChange={(v) => setForm({ ...form, montantRealise: v })} type="number" />
            <button style={BTN_PRIMARY} onClick={addLigne}>{t('actions.enregistrer')}</button>
          </div>
        )}

        {lignes.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: 14, padding: 16 }}>{t('detail.aucuneLigne')}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6B7280', background: '#F9FAFB' }}>
                  <th style={{ padding: '10px 16px' }}>{t('champs.poste')}</th>
                  <th style={{ padding: '10px 8px' }}>{t('champs.categorie')}</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>{t('champs.montantPrevu')}</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>{t('champs.montantRealise')}</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>{t('champs.ecart')}</th>
                  <th style={{ padding: '10px 8px', minWidth: 120 }}>{t('champs.tauxRealisation')}</th>
                  <th style={{ padding: '10px 16px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => {
                  const taux = n(l.tauxRealisation);
                  const depassement = taux > 100;
                  return (
                    <tr key={l.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                        {l.poste}
                        {depassement && <AlertTriangle size={13} color="#DC2626" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#6B7280' }}>{l.categorie || '—'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(l.montantPrevu, budget.devise)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {readOnly ? (
                          fmt(l.montantRealise, budget.devise)
                        ) : (
                          <input
                            type="number"
                            defaultValue={n(l.montantRealise)}
                            onBlur={(e) => {
                              if (n(e.target.value) !== n(l.montantRealise)) saisirRealise(l, e.target.value);
                            }}
                            style={{ width: 110, padding: '4px 6px', border: '1px solid #D1D5DB', borderRadius: 6, textAlign: 'right', fontSize: 13 }}
                          />
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: ecartColor(n(l.ecart), budget.type) }}>
                        {n(l.ecart) > 0 ? '+' : ''}{fmt(l.ecart, budget.devise)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ProgressBar taux={taux} />
                          <span style={{ fontSize: 12, color: tauxColor(taux), minWidth: 42, textAlign: 'right' }}>{taux}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        {!readOnly && (
                          <button onClick={() => removeLigne(l.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Champ de saisie réutilisable ──────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280' }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, minWidth: 140 }}
      />
    </label>
  );
}

// ── Modale de création de budget ───────────────────────────────────────────
function CreateBudgetModal({
  t,
  exercice,
  onClose,
  onCreated,
}: {
  t: ReturnType<typeof useTranslations>;
  exercice: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    libelle: '',
    exercice: String(exercice),
    type: 'depenses' as TypeBudget,
    service: '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.libelle) return;
    setSaving(true);
    try {
      await apiClient('/budget', {
        method: 'POST',
        body: {
          libelle: form.libelle,
          exercice: n(form.exercice),
          type: form.type,
          service: form.service || undefined,
        },
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div style={{ ...CARD, width: 420, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{t('nouveauBudget')}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label={t('champs.libelle')} value={form.libelle} onChange={(v) => setForm({ ...form, libelle: v })} />
          <Field label={t('exercice')} value={form.exercice} onChange={(v) => setForm({ ...form, exercice: v })} type="number" />
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6B7280' }}>
            {t('type.label')}
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TypeBudget })}
              style={{ padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }}
            >
              <option value="depenses">{t('type.depenses')}</option>
              <option value="recettes">{t('type.recettes')}</option>
            </select>
          </label>
          <Field label={t('champs.service')} value={form.service} onChange={(v) => setForm({ ...form, service: v })} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button style={BTN} onClick={onClose}>{t('actions.annuler')}</button>
          <button style={BTN_PRIMARY} onClick={submit} disabled={saving}>{t('actions.creer')}</button>
        </div>
      </div>
    </div>
  );
}
