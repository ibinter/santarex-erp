'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Biohazard, Plus, Search, RefreshCw, Truck, BarChart3,
  AlertTriangle, Scale, Trash2, CheckCircle, X, FileCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Categorie = 'dasri' | 'anatomique' | 'chimique' | 'pharmaceutique' | 'radioactif' | 'menager_assimile';
type Conditionnement = 'carton' | 'fut' | 'boite_opct';
type StatutCollecte = 'collecte' | 'en_stockage' | 'enleve' | 'incinere';
type ModeTraitement = 'incineration' | 'banalisation' | 'enfouissement';
type StatutEnlevement = 'planifie' | 'enleve' | 'traite';

type Collecte = {
  id: string; numero: string; categorie: Categorie; serviceProducteur: string;
  uniteProducteur?: string | null; poidsKg: number; typeConditionnement: Conditionnement;
  dateCollecte: string; agentRef?: string | null; statut: StatutCollecte;
  enlevementId?: string | null; observations?: string | null;
};

type Enlevement = {
  id: string; bordereauNumero: string; prestataire: string; dateEnlevement: string;
  poidsTotal: number; modeTraitement: ModeTraitement; statut: StatutEnlevement;
  certificatDestruction?: string | null; dateTraitement?: string | null;
};

type Stats = {
  totalCollectes: number; poidsTotalKg: number;
  poidsParCategorie: Record<string, number>; poidsParMois: Record<string, number>;
  parStatut: Record<string, number>; enAttenteEnlevement: number;
  poidsEnAttenteKg: number; stockageProlonge: number;
  enlevementsTotal: number; enlevementsATraiter: number;
};

const CATEGORIES: Categorie[] = ['dasri', 'anatomique', 'chimique', 'pharmaceutique', 'radioactif', 'menager_assimile'];
const CONDITIONNEMENTS: Conditionnement[] = ['carton', 'fut', 'boite_opct'];
const MODES: ModeTraitement[] = ['incineration', 'banalisation', 'enfouissement'];

const CAT_CFG: Record<Categorie, { bg: string; color: string; border: string }> = {
  dasri:            { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  anatomique:       { bg: '#FDF2F8', color: '#BE185D', border: '#FBCFE8' },
  chimique:         { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  pharmaceutique:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  radioactif:       { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  menager_assimile: { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' },
};

const STATUT_CFG: Record<StatutCollecte, { bg: string; color: string; border: string }> = {
  collecte:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  en_stockage: { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  enleve:      { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE' },
  incinere:    { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
};

const ENL_STATUT_CFG: Record<StatutEnlevement, { bg: string; color: string; border: string }> = {
  planifie: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  enleve:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  traite:   { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
};

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return '—'; }
}

const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);

export default function DechetsMedicauxPage() {
  const t = useTranslations('dechetsMedicaux');
  const [tab, setTab] = useState<'collectes' | 'enlevements' | 'stats'>('collectes');
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [enlevements, setEnlevements] = useState<Enlevement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCollecteForm, setShowCollecteForm] = useState(false);
  const [showEnlevementForm, setShowEnlevementForm] = useState(false);
  const [traiterId, setTraiterId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e, s] = await Promise.all([
        apiClient<any>('/dechets-medicaux/collectes?limit=100'),
        apiClient<any>('/dechets-medicaux/enlevements?limit=100'),
        apiClient<any>('/dechets-medicaux/stats'),
      ]);
      setCollectes(unwrap(c));
      setEnlevements(unwrap(e));
      setStats((s?.data ?? s) as Stats);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const collectesEnAttente = collectes.filter(c => c.statut === 'en_stockage' && !c.enlevementId);

  const displayedCollectes = collectes.filter(c => {
    const q = search.toLowerCase();
    return !search
      || (c.numero ?? '').toLowerCase().includes(q)
      || (c.serviceProducteur ?? '').toLowerCase().includes(q)
      || (c.agentRef ?? '').toLowerCase().includes(q);
  });

  const displayedEnlevements = enlevements.filter(e => {
    const q = search.toLowerCase();
    return !search
      || (e.bordereauNumero ?? '').toLowerCase().includes(q)
      || (e.prestataire ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #FECACA' }}>
            <Biohazard size={26} color="#B91C1C" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#111827' }}>{t('title')}</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{t('subtitle')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnGhost}>
            <RefreshCw size={15} /> {t('actions.refresh')}
          </button>
          {tab === 'collectes' && (
            <button onClick={() => setShowCollecteForm(true)} style={btnPrimary}>
              <Plus size={15} /> {t('actions.newCollecte')}
            </button>
          )}
          {tab === 'enlevements' && (
            <button onClick={() => setShowEnlevementForm(true)} style={btnPrimary}>
              <Plus size={15} /> {t('actions.newEnlevement')}
            </button>
          )}
        </div>
      </div>

      {/* Alerte stockage prolongé */}
      {stats && stats.stockageProlonge > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, marginBottom: 16, color: '#92400E', fontSize: 13 }}>
          <AlertTriangle size={18} /> {t('alerts.stockageProlonge')} ({stats.stockageProlonge})
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 18 }}>
        {([['collectes', Trash2], ['enlevements', Truck], ['stats', BarChart3]] as const).map(([k, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', background: 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
            color: tab === k ? '#B91C1C' : '#6B7280',
            borderBottom: tab === k ? '2px solid #B91C1C' : '2px solid transparent',
          }}>
            <Icon size={16} /> {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {/* Search (collectes / enlevements) */}
      {tab !== 'stats' && (
        <div style={{ position: 'relative', marginBottom: 14, maxWidth: 360 }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('actions.search')}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>…</div>
      ) : tab === 'collectes' ? (
        <CollectesTable rows={displayedCollectes} t={t} />
      ) : tab === 'enlevements' ? (
        <EnlevementsTable rows={displayedEnlevements} t={t} onTraiter={setTraiterId} />
      ) : (
        <StatsView stats={stats} t={t} />
      )}

      {showCollecteForm && (
        <CollecteForm t={t} onClose={() => setShowCollecteForm(false)} onSaved={() => { setShowCollecteForm(false); load(); }} />
      )}
      {showEnlevementForm && (
        <EnlevementForm t={t} collectes={collectesEnAttente} onClose={() => setShowEnlevementForm(false)} onSaved={() => { setShowEnlevementForm(false); load(); }} />
      )}
      {traiterId && (
        <TraiterForm t={t} id={traiterId} onClose={() => setTraiterId(null)} onSaved={() => { setTraiterId(null); load(); }} />
      )}
    </div>
  );
}

function Badge({ children, cfg }: { children: React.ReactNode; cfg: { bg: string; color: string; border: string } }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {children}
    </span>
  );
}

function CollectesTable({ rows, t }: { rows: Collecte[]; t: any }) {
  if (rows.length === 0) return <Empty text={t('empty.collectes')} />;
  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead>
          <tr>
            {['numero', 'categorie', 'serviceProducteur', 'poidsKg', 'conditionnement', 'dateCollecte', 'statutCollecte'].map(h => (
              <th key={h} style={th}>{h === 'categorie' ? t('categorie.label') : h === 'conditionnement' ? t('conditionnement.label') : h === 'statutCollecte' ? t('statutCollecte.label') : t(`fields.${h}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} style={{ borderTop: '1px solid #F3F4F6' }}>
              <td style={{ ...td, fontWeight: 600 }}>{c.numero}</td>
              <td style={td}><Badge cfg={CAT_CFG[c.categorie]}>{t(`categorie.${c.categorie}`)}</Badge></td>
              <td style={td}>{c.serviceProducteur}{c.uniteProducteur ? ` · ${c.uniteProducteur}` : ''}</td>
              <td style={td}>{Number(c.poidsKg).toFixed(2)}</td>
              <td style={td}>{t(`conditionnement.${c.typeConditionnement}`)}</td>
              <td style={td}>{fmtDate(c.dateCollecte)}</td>
              <td style={td}><Badge cfg={STATUT_CFG[c.statut]}>{t(`statutCollecte.${c.statut}`)}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnlevementsTable({ rows, t, onTraiter }: { rows: Enlevement[]; t: any; onTraiter: (id: string) => void }) {
  if (rows.length === 0) return <Empty text={t('empty.enlevements')} />;
  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead>
          <tr>
            {['bordereauNumero', 'prestataire', 'dateEnlevement', 'poidsTotal'].map(h => <th key={h} style={th}>{t(`fields.${h}`)}</th>)}
            <th style={th}>{t('modeTraitement.label')}</th>
            <th style={th}>{t('statutEnlevement.label')}</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id} style={{ borderTop: '1px solid #F3F4F6' }}>
              <td style={{ ...td, fontWeight: 600 }}>{e.bordereauNumero}</td>
              <td style={td}>{e.prestataire}</td>
              <td style={td}>{fmtDate(e.dateEnlevement)}</td>
              <td style={td}>{Number(e.poidsTotal).toFixed(2)}</td>
              <td style={td}>{t(`modeTraitement.${e.modeTraitement}`)}</td>
              <td style={td}><Badge cfg={ENL_STATUT_CFG[e.statut]}>{t(`statutEnlevement.${e.statut}`)}</Badge></td>
              <td style={td}>
                {e.statut !== 'traite' ? (
                  <button onClick={() => onTraiter(e.id)} style={{ ...btnGhost, padding: '5px 10px', fontSize: 12 }}>
                    <FileCheck size={13} /> {t('actions.traiter')}
                  </button>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#047857', fontSize: 12 }}>
                    <CheckCircle size={13} /> {e.certificatDestruction}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsView({ stats, t }: { stats: Stats | null; t: any }) {
  if (!stats) return <Empty text="—" />;
  const cards = [
    { k: 'totalCollectes', v: stats.totalCollectes, icon: Trash2 },
    { k: 'poidsTotal', v: `${stats.poidsTotalKg} kg`, icon: Scale },
    { k: 'enAttente', v: stats.enAttenteEnlevement, icon: AlertTriangle },
    { k: 'poidsEnAttente', v: `${stats.poidsEnAttenteKg} kg`, icon: Scale },
    { k: 'enlevementsTotal', v: stats.enlevementsTotal, icon: Truck },
    { k: 'enlevementsATraiter', v: stats.enlevementsATraiter, icon: FileCheck },
  ];
  const maxCat = Math.max(1, ...Object.values(stats.poidsParCategorie || {}));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        {cards.map(({ k, v, icon: Icon }) => (
          <div key={k} style={{ padding: 16, border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff' }}>
            <Icon size={18} color="#B91C1C" />
            <div style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 2px', color: '#111827' }}>{v}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t(`stats.${k}`)}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 18, border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#111827' }}>{t('stats.poidsParCategorie')}</h3>
        {Object.keys(stats.poidsParCategorie || {}).length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>—</p>
        ) : CATEGORIES.filter(c => stats.poidsParCategorie[c]).map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 130, fontSize: 13, color: '#374151' }}>{t(`categorie.${c}`)}</div>
            <div style={{ flex: 1, height: 12, background: '#F3F4F6', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(stats.poidsParCategorie[c] / maxCat) * 100}%`, height: '100%', background: CAT_CFG[c].color }} />
            </div>
            <div style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#111827' }}>{stats.poidsParCategorie[c]} kg</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#111827' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

function CollecteForm({ t, onClose, onSaved }: { t: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ categorie: 'dasri', serviceProducteur: '', uniteProducteur: '', poidsKg: '', typeConditionnement: 'carton', dateCollecte: new Date().toISOString().slice(0, 10), agentRef: '', observations: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.serviceProducteur || !f.poidsKg) return;
    setSaving(true);
    try {
      await apiClient('/dechets-medicaux/collectes', { method: 'POST', body: {
        categorie: f.categorie, serviceProducteur: f.serviceProducteur,
        uniteProducteur: f.uniteProducteur || undefined, poidsKg: Number(f.poidsKg),
        typeConditionnement: f.typeConditionnement, dateCollecte: new Date(f.dateCollecte).toISOString(),
        agentRef: f.agentRef || undefined, observations: f.observations || undefined,
      } });
      onSaved();
    } finally { setSaving(false); }
  };
  return (
    <Modal title={t('form.createCollecteTitle')} onClose={onClose}>
      <Field label={t('categorie.label')}>
        <select value={f.categorie} onChange={e => setF({ ...f, categorie: e.target.value })} style={input}>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`categorie.${c}`)}</option>)}
        </select>
      </Field>
      <Field label={t('fields.serviceProducteur')}>
        <input value={f.serviceProducteur} onChange={e => setF({ ...f, serviceProducteur: e.target.value })} style={input} />
      </Field>
      <Field label={t('fields.uniteProducteur')}>
        <input value={f.uniteProducteur} onChange={e => setF({ ...f, uniteProducteur: e.target.value })} style={input} />
      </Field>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label={t('fields.poidsKg')}>
            <input type="number" step="0.001" value={f.poidsKg} onChange={e => setF({ ...f, poidsKg: e.target.value })} style={input} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label={t('conditionnement.label')}>
            <select value={f.typeConditionnement} onChange={e => setF({ ...f, typeConditionnement: e.target.value })} style={input}>
              {CONDITIONNEMENTS.map(c => <option key={c} value={c}>{t(`conditionnement.${c}`)}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label={t('fields.dateCollecte')}>
        <input type="date" value={f.dateCollecte} onChange={e => setF({ ...f, dateCollecte: e.target.value })} style={input} />
      </Field>
      <Field label={t('fields.agentRef')}>
        <input value={f.agentRef} onChange={e => setF({ ...f, agentRef: e.target.value })} style={input} />
      </Field>
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit} />
    </Modal>
  );
}

function EnlevementForm({ t, collectes, onClose, onSaved }: { t: any; collectes: Collecte[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ prestataire: '', dateEnlevement: new Date().toISOString().slice(0, 10), modeTraitement: 'incineration', bordereauNumero: '', observations: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const submit = async () => {
    if (!f.prestataire || selected.length === 0) return;
    setSaving(true);
    try {
      await apiClient('/dechets-medicaux/enlevements', { method: 'POST', body: {
        prestataire: f.prestataire, dateEnlevement: new Date(f.dateEnlevement).toISOString(),
        modeTraitement: f.modeTraitement, collecteIds: selected,
        bordereauNumero: f.bordereauNumero || undefined, observations: f.observations || undefined,
      } });
      onSaved();
    } finally { setSaving(false); }
  };
  const poids = collectes.filter(c => selected.includes(c.id)).reduce((s, c) => s + Number(c.poidsKg || 0), 0);
  return (
    <Modal title={t('form.createEnlevementTitle')} onClose={onClose}>
      <Field label={t('fields.prestataire')}>
        <input value={f.prestataire} onChange={e => setF({ ...f, prestataire: e.target.value })} style={input} />
      </Field>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label={t('fields.dateEnlevement')}>
            <input type="date" value={f.dateEnlevement} onChange={e => setF({ ...f, dateEnlevement: e.target.value })} style={input} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label={t('modeTraitement.label')}>
            <select value={f.modeTraitement} onChange={e => setF({ ...f, modeTraitement: e.target.value })} style={input}>
              {MODES.map(m => <option key={m} value={m}>{t(`modeTraitement.${m}`)}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <Field label={`${t('form.selectCollectes')} — ${poids.toFixed(2)} kg`}>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8 }}>
          {collectes.length === 0 ? (
            <div style={{ padding: 14, fontSize: 13, color: '#9CA3AF' }}>{t('empty.selectCollectes')}</div>
          ) : collectes.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderTop: '1px solid #F3F4F6', cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
              <span style={{ fontWeight: 600 }}>{c.numero}</span>
              <span style={{ color: '#6B7280' }}>{t(`categorie.${c.categorie}`)} · {Number(c.poidsKg).toFixed(2)} kg · {c.serviceProducteur}</span>
            </label>
          ))}
        </div>
      </Field>
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit} disabled={selected.length === 0} />
    </Modal>
  );
}

function TraiterForm({ t, id, onClose, onSaved }: { t: any; id: string; onClose: () => void; onSaved: () => void }) {
  const [cert, setCert] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!cert) return;
    setSaving(true);
    try {
      await apiClient(`/dechets-medicaux/enlevements/${id}/traiter`, { method: 'PATCH', body: {
        certificatDestruction: cert, dateTraitement: new Date(date).toISOString(),
      } });
      onSaved();
    } finally { setSaving(false); }
  };
  return (
    <Modal title={t('form.traiterTitle')} onClose={onClose}>
      <Field label={t('fields.certificatDestruction')}>
        <input value={cert} onChange={e => setCert(e.target.value)} style={input} />
      </Field>
      <Field label={t('fields.dateTraitement')}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} />
      </Field>
      <FormActions t={t} saving={saving} onClose={onClose} onSubmit={submit} submitLabel={t('actions.traiter')} />
    </Modal>
  );
}

function FormActions({ t, saving, onClose, onSubmit, disabled, submitLabel }: { t: any; saving: boolean; onClose: () => void; onSubmit: () => void; disabled?: boolean; submitLabel?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
      <button onClick={onClose} style={btnGhost}>{t('actions.cancel')}</button>
      <button onClick={onSubmit} disabled={saving || disabled} style={{ ...btnPrimary, opacity: (saving || disabled) ? 0.6 : 1 }}>
        {submitLabel ?? t('actions.create')}
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF', fontSize: 14, border: '1px dashed #E5E7EB', borderRadius: 12 }}>{text}</div>;
}

const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#B91C1C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const input: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };
const tableWrap: React.CSSProperties = { border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'auto', background: '#fff' };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 };
const th: React.CSSProperties = { textAlign: 'left', padding: '11px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#F9FAFB' };
const td: React.CSSProperties = { padding: '11px 14px', color: '#374151' };
