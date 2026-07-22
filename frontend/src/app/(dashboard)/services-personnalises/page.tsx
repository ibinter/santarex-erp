'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Puzzle, Plus, Search, RefreshCw, ChevronRight, ArrowLeft, Trash2,
  Pencil, LayoutGrid, Activity, CheckCircle, Calendar, X, GripVertical,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────
type Categorie = 'clinique' | 'administratif' | 'technique' | 'autre';
type TypeChamp = 'texte' | 'nombre' | 'date' | 'liste' | 'booleen' | 'patient';
type Statut = 'brouillon' | 'valide' | 'archive';

type ChampDefinition = {
  id: string;
  libelle: string;
  type: TypeChamp;
  options?: string[];
  requis: boolean;
};

type ServicePersonnalise = {
  id: string;
  nom: string;
  description: string | null;
  categorie: Categorie;
  icone: string | null;
  champsSchema: ChampDefinition[];
  actif: boolean;
  createdAt: string;
};

type Enregistrement = {
  id: string;
  patientId: string | null;
  valeurs: Record<string, unknown>;
  statut: Statut;
  creePar: string;
  date: string;
  createdAt: string;
};

type Stats = {
  totalServices: number;
  servicesActifs: number;
  totalEnregistrements: number;
  parCategorie: Record<string, number>;
  enregistrementsDuMois: number;
};

const CATEGORIES: Categorie[] = ['clinique', 'administratif', 'technique', 'autre'];
const TYPES_CHAMP: TypeChamp[] = ['texte', 'nombre', 'date', 'liste', 'booleen', 'patient'];

const CAT_CFG: Record<Categorie, { bg: string; color: string; border: string; dot: string }> = {
  clinique:      { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  administratif: { bg: '#EDE9FE', color: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  technique:     { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
  autre:         { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
};

const UNWRAP = (r: any) =>
  Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? r?.items ?? []);

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || `champ_${Date.now().toString(36)}`;
}

// ══════════════════════════════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════════════════════════════
type Mode =
  | { view: 'list' }
  | { view: 'builder'; service?: ServicePersonnalise }
  | { view: 'detail'; id: string };

export default function ServicesPersonnalisesPage() {
  const t = useTranslations('servicesPersonnalises');
  const [mode, setMode] = useState<Mode>({ view: 'list' });

  if (mode.view === 'builder') {
    return (
      <Builder
        t={t}
        service={mode.service}
        onDone={() => setMode({ view: 'list' })}
        onCancel={() => setMode({ view: 'list' })}
      />
    );
  }
  if (mode.view === 'detail') {
    return (
      <Detail
        t={t}
        id={mode.id}
        onBack={() => setMode({ view: 'list' })}
        onEdit={(svc) => setMode({ view: 'builder', service: svc })}
      />
    );
  }
  return (
    <ListView
      t={t}
      onCreate={() => setMode({ view: 'builder' })}
      onOpen={(id) => setMode({ view: 'detail', id })}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════
//  LIST
// ══════════════════════════════════════════════════════════════════════
function ListView({
  t, onCreate, onOpen,
}: {
  t: any; onCreate: () => void; onOpen: (id: string) => void;
}) {
  const [services, setServices] = useState<ServicePersonnalise[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fCat, setFCat] = useState<Categorie | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        apiClient<any>('/services-personnalises'),
        apiClient<any>('/services-personnalises/stats'),
      ]);
      setServices(UNWRAP(listRes));
      setStats((statsRes?.data ?? statsRes) as Stats);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = services.filter((s) => {
    const q = search.toLowerCase();
    const matchQ = !search
      || (s.nom ?? '').toLowerCase().includes(q)
      || (s.description ?? '').toLowerCase().includes(q);
    const matchC = !fCat || s.categorie === fCat;
    return matchQ && matchC;
  });

  const totalServices = stats?.totalServices ?? services.length;
  const actifs = stats?.servicesActifs ?? services.filter((s) => s.actif).length;
  const enregistrements = stats?.totalEnregistrements ?? 0;
  const mois = stats?.enregistrementsDuMois ?? 0;

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .svc-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(99,102,241,0.18)!important;}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#4338CA 0%,#6366F1 50%,#818CF8 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(99,102,241,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Puzzle size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('list.heroTitle')}</h1>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 3 }}>
                {loading ? t('list.loading') : t('list.summary', { total: totalServices, actifs })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading} style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={onCreate} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', color: '#4338CA', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('list.newService')}
            </button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('list.kpiServices'), val: totalServices, icon: <LayoutGrid size={13} />, c: '#fff' },
            { label: t('list.kpiActifs'), val: actifs, icon: <CheckCircle size={13} />, c: '#BBF7D0' },
            { label: t('list.kpiEnregistrements'), val: enregistrements, icon: <Activity size={13} />, c: '#FDE68A' },
            { label: t('list.kpiMois'), val: mois, icon: <Calendar size={13} />, c: '#C7D2FE' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>
                {k.icon}
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.c, lineHeight: 1 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('list.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFCat('')} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${fCat === '' ? '#4338CA' : '#E0E8F0'}`, background: fCat === '' ? '#4338CA' : '#fff', color: fCat === '' ? '#fff' : '#546E7A', fontSize: 11, fontWeight: fCat === '' ? 800 : 500, cursor: 'pointer' }}>
            {t('list.filterAll')}
          </button>
          {CATEGORIES.map((c) => {
            const cfg = CAT_CFG[c]; const on = fCat === c;
            return (
              <button key={c} onClick={() => setFCat(on ? '' : c)} style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${on ? cfg.border : '#E0E8F0'}`, background: on ? cfg.bg : '#fff', color: on ? cfg.color : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                {t(`categorie.${c}`)}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, marginBottom: 10 }}>{t('list.displayedCount', { count: displayed.length })}</div>}

      {/* CARDS */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 130, background: '#fff', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, padding: '60px 20px', textAlign: 'center', color: '#90A4AE' }}>
          <Puzzle size={40} style={{ display: 'block', margin: '0 auto 12px', color: '#C7D2FE' }} />
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#546E7A' }}>{t('list.emptyTitle')}</p>
          <p style={{ margin: 0, fontSize: 12 }}>{t('list.emptySubtitle')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {displayed.map((s) => {
            const cfg = CAT_CFG[s.categorie] ?? CAT_CFG.autre;
            return (
              <div key={s.id} className="svc-card" onClick={() => onOpen(s.id)}
                style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'all .18s', border: '1px solid #EEF2F7', animation: 'fadeUp .25s ease', opacity: s.actif ? 1 : 0.62 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Puzzle size={20} color={cfg.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {t(`categorie.${s.categorie}`)}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2332', marginBottom: 4 }}>{s.nom}</div>
                <div style={{ fontSize: 12, color: '#78909C', minHeight: 32, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {s.description || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>
                    {t('list.fieldsCount', { count: (s.champsSchema ?? []).length })}
                    {!s.actif && <span style={{ marginLeft: 8, color: '#EF4444' }}>• {t('list.inactive')}</span>}
                  </span>
                  <ChevronRight size={16} color="#B0BEC5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  BUILDER (constructeur de champs)
// ══════════════════════════════════════════════════════════════════════
function Builder({
  t, service, onDone, onCancel,
}: {
  t: any; service?: ServicePersonnalise; onDone: () => void; onCancel: () => void;
}) {
  const editing = !!service;
  const [nom, setNom] = useState(service?.nom ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [categorie, setCategorie] = useState<Categorie>(service?.categorie ?? 'clinique');
  const [icone, setIcone] = useState(service?.icone ?? '');
  const [actif, setActif] = useState(service?.actif ?? true);
  const [champs, setChamps] = useState<ChampDefinition[]>(service?.champsSchema ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addChamp = () => {
    setChamps((c) => [...c, { id: `champ_${Date.now().toString(36)}`, libelle: '', type: 'texte', requis: false }]);
  };
  const updateChamp = (idx: number, patch: Partial<ChampDefinition>) => {
    setChamps((c) => c.map((ch, i) => (i === idx ? { ...ch, ...patch } : ch)));
  };
  const removeChamp = (idx: number) => setChamps((c) => c.filter((_, i) => i !== idx));

  const submit = async () => {
    setError('');
    if (!nom.trim()) { setError(t('builder.errorNom')); return; }
    if (champs.length === 0) { setError(t('builder.errorFields')); return; }

    const champsSchema = champs.map((ch) => ({
      id: ch.libelle.trim() ? slugify(ch.libelle) : ch.id,
      libelle: ch.libelle.trim(),
      type: ch.type,
      requis: ch.requis,
      ...(ch.type === 'liste' ? { options: (ch.options ?? []).map((o) => o.trim()).filter(Boolean) } : {}),
    }));

    setSaving(true);
    try {
      const body = { nom: nom.trim(), description: description.trim(), categorie, icone: icone.trim(), actif, champsSchema };
      if (editing) {
        await apiClient(`/services-personnalises/${service!.id}`, { method: 'PATCH', body });
      } else {
        await apiClient('/services-personnalises', { method: 'POST', body });
      }
      onDone();
    } catch (e: any) {
      setError(e?.message || t('builder.errorSave'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4338CA', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={16} /> {t('builder.cancel')}
      </button>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A2332', margin: '0 0 18px' }}>
          {editing ? t('builder.editTitle') : t('builder.title')}
        </h1>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{error}</div>
        )}

        {/* Infos générales */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label={t('builder.nom')}>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t('builder.nomPlaceholder')} style={inputStyle} />
            </Field>
            <Field label={t('builder.categorie')}>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{t(`categorie.${c}`)}</option>)}
              </select>
            </Field>
            <Field label={t('builder.description')} full>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('builder.descriptionPlaceholder')} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label={t('builder.icone')}>
              <input value={icone} onChange={(e) => setIcone(e.target.value)} placeholder={t('builder.iconePlaceholder')} style={inputStyle} />
            </Field>
            <Field label={t('builder.actif')}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 8 }}>
                <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#455A64' }}>{t('builder.actif')}</span>
              </label>
            </Field>
          </div>
        </div>

        {/* Constructeur de champs */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1A2332' }}>{t('builder.fields')}</div>
            <button onClick={addChamp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: 'none', background: '#4338CA', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={14} /> {t('builder.addField')}
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#90A4AE', marginBottom: 14 }}>{t('builder.fieldsHint')}</div>

          {champs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#B0BEC5', fontSize: 13, border: '1.5px dashed #E0E8F0', borderRadius: 10 }}>{t('builder.noFields')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {champs.map((ch, idx) => (
                <div key={idx} style={{ border: '1px solid #EEF2F7', borderRadius: 11, padding: 12, background: '#FAFBFD' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <GripVertical size={16} color="#CFD8DC" style={{ marginTop: 30 }} />
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={labelStyle}>{t('builder.fieldLabel')}</div>
                      <input value={ch.libelle} onChange={(e) => updateChamp(idx, { libelle: e.target.value })} placeholder={t('builder.fieldLabelPlaceholder')} style={inputStyle} />
                    </div>
                    <div style={{ flex: '0 0 150px' }}>
                      <div style={labelStyle}>{t('builder.fieldType')}</div>
                      <select value={ch.type} onChange={(e) => updateChamp(idx, { type: e.target.value as TypeChamp })} style={inputStyle}>
                        {TYPES_CHAMP.map((tp) => <option key={tp} value={tp}>{t(`typeChamp.${tp}`)}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: '0 0 auto' }}>
                      <div style={labelStyle}>{t('builder.fieldRequired')}</div>
                      <label style={{ display: 'flex', alignItems: 'center', height: 38, cursor: 'pointer' }}>
                        <input type="checkbox" checked={ch.requis} onChange={(e) => updateChamp(idx, { requis: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      </label>
                    </div>
                    <button onClick={() => removeChamp(idx)} title={t('builder.removeField')} style={{ marginTop: 22, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {ch.type === 'liste' && (
                    <div style={{ marginTop: 10, marginLeft: 26 }}>
                      <div style={labelStyle}>{t('builder.fieldOptions')}</div>
                      <input
                        value={(ch.options ?? []).join(', ')}
                        onChange={(e) => updateChamp(idx, { options: e.target.value.split(',').map((o) => o.trim()) })}
                        placeholder={t('builder.fieldOptionsPlaceholder')}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '11px 22px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{t('builder.cancel')}</button>
          <button onClick={submit} disabled={saving} style={{ padding: '11px 26px', borderRadius: 10, border: 'none', background: '#4338CA', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? t('builder.saving') : t('builder.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  DETAIL + dynamic record form
// ══════════════════════════════════════════════════════════════════════
function Detail({
  t, id, onBack, onEdit,
}: {
  t: any; id: string; onBack: () => void; onEdit: (svc: ServicePersonnalise) => void;
}) {
  const [service, setService] = useState<ServicePersonnalise | null>(null);
  const [records, setRecords] = useState<Enregistrement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, recRes] = await Promise.all([
        apiClient<any>(`/services-personnalises/${id}`),
        apiClient<any>(`/services-personnalises/${id}/enregistrements`),
      ]);
      setService((svcRes?.data ?? svcRes) as ServicePersonnalise);
      setRecords(UNWRAP(recRes));
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    if (!service) return;
    if (!window.confirm(t('detail.confirmDelete'))) return;
    await apiClient(`/services-personnalises/${service.id}`, { method: 'DELETE' });
    onBack();
  };

  if (loading || !service) {
    return (
      <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
        <div style={{ height: 120, background: '#fff', borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const cfg = CAT_CFG[service.categorie] ?? CAT_CFG.autre;
  const champs = service.champsSchema ?? [];

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4338CA', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}>
        <ArrowLeft size={16} /> {t('detail.back')}
      </button>

      {/* header card */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Puzzle size={26} color={cfg.color} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#1A2332' }}>{service.nom}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{t(`categorie.${service.categorie}`)}</span>
                {!service.actif && <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>{t('list.inactive')}</span>}
              </div>
              {service.description && <div style={{ fontSize: 13, color: '#78909C', marginTop: 8, maxWidth: 520 }}>{service.description}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onEdit(service)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #E0E8F0', background: '#fff', color: '#455A64', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Pencil size={14} /> {t('detail.edit')}
            </button>
            <button onClick={remove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Trash2 size={14} /> {t('detail.delete')}
            </button>
          </div>
        </div>

        {/* fields summary */}
        <div style={{ marginTop: 16, borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#455A64', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>{t('detail.fieldsTitle')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {champs.map((c) => (
              <span key={c.id} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, background: '#F1F5F9', color: '#455A64' }}>
                {c.libelle} <span style={{ color: '#90A4AE', fontSize: 10 }}>· {t(`typeChamp.${c.type}`)}{c.requis ? ' *' : ''}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* records */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2332' }}>
          {t('detail.records')} <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600 }}>· {t('detail.recordsCount', { count: records.length })}</span>
        </div>
        {service.actif && (
          <button onClick={() => setShowForm((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#4338CA', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? t('detail.cancel') : t('detail.addRecord')}
          </button>
        )}
      </div>

      {showForm && (
        <RecordForm t={t} service={service} onSaved={() => { setShowForm(false); load(); }} />
      )}

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr style={{ background: '#F5F7FF' }}>
                <th style={thStyle}>{t('detail.colDate')}</th>
                {champs.slice(0, 4).map((c) => <th key={c.id} style={thStyle}>{c.libelle}</th>)}
                <th style={thStyle}>{t('detail.colPatient')}</th>
                <th style={thStyle}>{t('detail.colStatut')}</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={champs.slice(0, 4).length + 3} style={{ textAlign: 'center', padding: '50px 20px', color: '#90A4AE', fontSize: 13 }}>{t('detail.noRecords')}</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                  {champs.slice(0, 4).map((c) => (
                    <td key={c.id} style={{ padding: '11px 14px', fontSize: 12, color: '#37474F' }}>
                      {c.type === 'booleen'
                        ? (r.valeurs[c.id] ? t('detail.yes') : t('detail.no'))
                        : (r.valeurs[c.id] !== undefined && r.valeurs[c.id] !== null && r.valeurs[c.id] !== '' ? `${r.valeurs[c.id]}` : '—')}
                    </td>
                  ))}
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#78909C', fontFamily: 'monospace' }}>{r.patientId ? r.patientId.slice(0, 8) : '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EEF2FF', color: '#4338CA' }}>{t(`statut.${r.statut}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Dynamic record form ──────────────────────────────────────────────
function RecordForm({
  t, service, onSaved,
}: {
  t: any; service: ServicePersonnalise; onSaved: () => void;
}) {
  const champs = service.champsSchema ?? [];
  const [valeurs, setValeurs] = useState<Record<string, any>>({});
  const [patientId, setPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (cid: string, v: any) => setValeurs((prev) => ({ ...prev, [cid]: v }));

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      const body: any = { valeurs };
      if (patientId.trim()) body.patientId = patientId.trim();
      await apiClient(`/services-personnalises/${service.id}/enregistrements`, { method: 'POST', body });
      onSaved();
    } catch (e: any) {
      setError(e?.message || t('detail.errorSubmit'));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 14, border: '1.5px solid #E0E7FF' }}>
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '9px 13px', borderRadius: 9, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        {champs.map((c) => (
          <Field key={c.id} label={`${c.libelle}${c.requis ? ' *' : ''}`}>
            {c.type === 'booleen' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!valeurs[c.id]} onChange={(e) => set(c.id, e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#546E7A' }}>{valeurs[c.id] ? t('detail.yes') : t('detail.no')}</span>
              </label>
            ) : c.type === 'liste' ? (
              <select value={valeurs[c.id] ?? ''} onChange={(e) => set(c.id, e.target.value)} style={inputStyle}>
                <option value="">—</option>
                {(c.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={c.type === 'nombre' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                value={valeurs[c.id] ?? ''}
                onChange={(e) => set(c.id, e.target.value)}
                placeholder={c.type === 'patient' ? t('detail.patientPlaceholder') : ''}
                style={inputStyle}
              />
            )}
          </Field>
        ))}
        <Field label={t('detail.patientOptional')}>
          <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder={t('detail.patientPlaceholder')} style={inputStyle} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <button onClick={submit} disabled={saving} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: '#4338CA', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? t('detail.submitting') : t('detail.submit')}
        </button>
      </div>
    </div>
  );
}

// ── Small UI helpers ─────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0',
  background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332',
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#78909C', marginBottom: 5 };
const thStyle: React.CSSProperties = {
  padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#4338CA',
  textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap',
};

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={labelStyle}>{label}</div>
      {children}
    </div>
  );
}
