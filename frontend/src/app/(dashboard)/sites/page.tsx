'use client';

/**
 * GESTION MULTI-SITES — Sites / Réseau.
 * Le SITE est une dimension supplémentaire À L'INTÉRIEUR du tenant courant.
 *
 * TODO (filtrage métier par site — plus tard, hors périmètre actuel) : une fois
 * qu'un `siteId` optionnel aura été ajouté aux entités métier (patients, stocks,
 * factures) côté backend, ajouter ici un sélecteur de site global qui propagera
 * `?siteId=` aux autres pages pour filtrer leurs données par site.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Network, RefreshCw, Plus, X, Trash2, Pencil,
  MapPin, Phone, BedDouble, Star, Users, Save,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type TypeSite = 'siege' | 'antenne' | 'clinique' | 'pharmacie' | 'laboratoire';
type StatutSite = 'actif' | 'inactif';

interface Site {
  id: string;
  code: string;
  nom: string;
  type: TypeSite;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  responsableRef?: string | null;
  capaciteLits: number;
  statut: StatutSite;
  estPrincipal: boolean;
}

interface Affectation {
  id: string;
  siteId: string;
  userId: string;
  fonction?: string | null;
  dateDebut: string;
  dateFin?: string | null;
}

interface Consolidation {
  nbSites: number;
  litsTotal: number;
  personnelTotal: number;
  sites: Array<{
    id: string; code: string; nom: string; type: TypeSite;
    ville?: string | null; statut: StatutSite; estPrincipal: boolean;
    capaciteLits: number; personnelActif: number;
  }>;
}

interface Stats {
  nbSites: number;
  sitesActifs: number;
  sitesInactifs: number;
  litsTotal: number;
  personnelTotal: number;
  parType: Record<string, number>;
}

const TYPES: TypeSite[] = ['siege', 'antenne', 'clinique', 'pharmacie', 'laboratoire'];
const STATUTS: StatutSite[] = ['actif', 'inactif'];

const TYPE_CFG: Record<TypeSite, { icon: string; color: string; bg: string }> = {
  siege:       { icon: '🏛️', color: '#1E40AF', bg: '#DBEAFE' },
  antenne:     { icon: '🏥', color: '#0F766E', bg: '#CCFBF1' },
  clinique:    { icon: '🩺', color: '#9D174D', bg: '#FCE7F3' },
  pharmacie:   { icon: '💊', color: '#92400E', bg: '#FEF3C7' },
  laboratoire: { icon: '🧪', color: '#5B21B6', bg: '#EDE9FE' },
};

const emptyForm = {
  code: '', nom: '', type: 'antenne' as TypeSite, adresse: '', ville: '',
  telephone: '', responsableRef: '', capaciteLits: 0,
  statut: 'actif' as StatutSite, estPrincipal: false,
};

export default function SitesPage() {
  const t = useTranslations('sites');
  const [tab, setTab] = useState<'reseau' | 'sites' | 'affectations'>('reseau');

  const [sites, setSites] = useState<Site[]>([]);
  const [consolidation, setConsolidation] = useState<Consolidation | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  // Affectations
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [affForm, setAffForm] = useState({ userId: '', fonction: '', dateDebut: '', dateFin: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, st] = await Promise.all([
        apiClient<Site[]>('/sites'),
        apiClient<Consolidation>('/sites/consolidation'),
        apiClient<Stats>('/sites/stats'),
      ]);
      setSites(s);
      setConsolidation(c);
      setStats(st);
    } catch {
      setError(t('erreur'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const loadAffectations = useCallback(async (siteId: string) => {
    if (!siteId) { setAffectations([]); return; }
    try {
      const list = await apiClient<Affectation[]>(`/sites/${siteId}/affectations`);
      setAffectations(list);
    } catch {
      setError(t('erreur'));
    }
  }, [t]);

  useEffect(() => {
    if (tab === 'affectations' && !selectedSiteId && sites.length > 0) {
      setSelectedSiteId(sites[0].id);
    }
  }, [tab, sites, selectedSiteId]);

  useEffect(() => { loadAffectations(selectedSiteId); }, [selectedSiteId, loadAffectations]);

  // ── Formulaire site ──────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }
  function openEdit(site: Site) {
    setEditing(site);
    setForm({
      code: site.code, nom: site.nom, type: site.type,
      adresse: site.adresse ?? '', ville: site.ville ?? '',
      telephone: site.telephone ?? '', responsableRef: site.responsableRef ?? '',
      capaciteLits: site.capaciteLits, statut: site.statut,
      estPrincipal: site.estPrincipal,
    });
    setShowForm(true);
  }

  async function saveSite() {
    setSaving(true);
    setError('');
    try {
      const body = { ...form, capaciteLits: Number(form.capaciteLits) || 0 };
      if (editing) {
        await apiClient(`/sites/${editing.id}`, { method: 'PATCH', body });
      } else {
        await apiClient('/sites', { method: 'POST', body });
      }
      setShowForm(false);
      await load();
    } catch {
      setError(t('erreur'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSite(site: Site) {
    if (!window.confirm(t('confirmerSuppression'))) return;
    try {
      await apiClient(`/sites/${site.id}`, { method: 'DELETE' });
      await load();
    } catch {
      setError(t('erreur'));
    }
  }

  // ── Affectations ───────────────────────────────────────────────────────
  async function addAffectation() {
    if (!selectedSiteId || !affForm.userId) return;
    try {
      await apiClient(`/sites/${selectedSiteId}/affectations`, {
        method: 'POST',
        body: {
          userId: affForm.userId,
          fonction: affForm.fonction || undefined,
          dateDebut: affForm.dateDebut || undefined,
          dateFin: affForm.dateFin || undefined,
        },
      });
      setAffForm({ userId: '', fonction: '', dateDebut: '', dateFin: '' });
      await loadAffectations(selectedSiteId);
      await load();
    } catch {
      setError(t('erreur'));
    }
  }

  async function removeAffectation(id: string) {
    if (!window.confirm(t('confirmerSuppressionAffectation'))) return;
    try {
      await apiClient(`/sites/${selectedSiteId}/affectations/${id}`, { method: 'DELETE' });
      await loadAffectations(selectedSiteId);
      await load();
    } catch {
      setError(t('erreur'));
    }
  }

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, fontWeight: 700, margin: 0 }}>
            <Network size={28} /> {t('title')}
          </h1>
          <p style={{ color: '#64748B', marginTop: 4 }}>{t('subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={btnGhost}>
            <RefreshCw size={16} /> {t('actualiser')}
          </button>
          <button onClick={openCreate} style={btnPrimary}>
            <Plus size={16} /> {t('nouveauSite')}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#FEF2F2', color: '#B91C1C', borderRadius: 8, border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '1px solid #E2E8F0' }}>
        {(['reseau', 'sites', 'affectations'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, color: tab === k ? '#1E40AF' : '#64748B',
              borderBottom: tab === k ? '2px solid #1E40AF' : '2px solid transparent',
            }}
          >
            {t(`tabs.${k}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ marginTop: 24, color: '#64748B' }}>{t('chargement')}</p>
      ) : (
        <div style={{ marginTop: 24 }}>
          {tab === 'reseau' && <ReseauView t={t} consolidation={consolidation} stats={stats} />}
          {tab === 'sites' && (
            <SitesList sites={sites} t={t} onEdit={openEdit} onDelete={deleteSite} />
          )}
          {tab === 'affectations' && (
            <AffectationsView
              t={t}
              sites={sites}
              selectedSiteId={selectedSiteId}
              setSelectedSiteId={setSelectedSiteId}
              affectations={affectations}
              affForm={affForm}
              setAffForm={setAffForm}
              onAdd={addAffectation}
              onRemove={removeAffectation}
              fmtDate={fmtDate}
            />
          )}
        </div>
      )}

      {/* Modale formulaire site */}
      {showForm && (
        <SiteForm
          t={t}
          form={form}
          setForm={setForm}
          editing={!!editing}
          saving={saving}
          onSave={saveSite}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ── Sous-vues ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ flex: '1 1 160px', padding: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: '#64748B' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function ReseauView({ t, consolidation, stats }: {
  t: ReturnType<typeof useTranslations>;
  consolidation: Consolidation | null;
  stats: Stats | null;
}) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label={t('stats.nbSites')} value={stats?.nbSites ?? 0} />
        <StatCard label={t('stats.sitesActifs')} value={stats?.sitesActifs ?? 0} />
        <StatCard label={t('stats.litsTotal')} value={stats?.litsTotal ?? 0} />
        <StatCard label={t('stats.personnelTotal')} value={stats?.personnelTotal ?? 0} />
      </div>

      <h3 style={{ marginTop: 28, marginBottom: 12, fontSize: 17, fontWeight: 700 }}>
        <Building2 size={18} style={{ verticalAlign: -3, marginRight: 6 }} />
        {t('tabs.sites')}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {(consolidation?.sites ?? []).map((s) => {
          const cfg = TYPE_CFG[s.type];
          return (
            <div key={s.id} style={{ padding: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>{cfg?.icon}</span>
                {s.estPrincipal && (
                  <span style={{ ...badge, background: '#FEF9C3', color: '#854D0E' }}>
                    <Star size={11} style={{ verticalAlign: -1 }} /> {t('principal')}
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{s.nom}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{s.code} · {s.ville || '—'}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13 }}>
                <span><BedDouble size={14} style={{ verticalAlign: -2 }} /> {s.capaciteLits}</span>
                <span><Users size={14} style={{ verticalAlign: -2 }} /> {s.personnelActif}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SitesList({ sites, t, onEdit, onDelete }: {
  sites: Site[];
  t: ReturnType<typeof useTranslations>;
  onEdit: (s: Site) => void;
  onDelete: (s: Site) => void;
}) {
  if (sites.length === 0) {
    return <p style={{ color: '#64748B' }}>{t('aucunSite')}</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {sites.map((s) => {
        const cfg = TYPE_CFG[s.type];
        return (
          <div key={s.id} style={{ padding: 16, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{cfg?.icon}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.nom}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{s.code}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => onEdit(s)} style={iconBtn} aria-label="edit"><Pencil size={15} /></button>
                <button onClick={() => onDelete(s)} style={{ ...iconBtn, color: '#DC2626' }} aria-label="delete"><Trash2 size={15} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={{ ...badge, background: cfg?.bg, color: cfg?.color }}>{t(`type.${s.type}`)}</span>
              <span style={{ ...badge, background: s.statut === 'actif' ? '#DCFCE7' : '#F1F5F9', color: s.statut === 'actif' ? '#15803D' : '#475569' }}>
                {t(`statut.${s.statut}`)}
              </span>
              {s.estPrincipal && (
                <span style={{ ...badge, background: '#FEF9C3', color: '#854D0E' }}>
                  <Star size={11} style={{ verticalAlign: -1 }} /> {t('principal')}
                </span>
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(s.ville || s.adresse) && <span><MapPin size={13} style={{ verticalAlign: -2 }} /> {[s.adresse, s.ville].filter(Boolean).join(', ')}</span>}
              {s.telephone && <span><Phone size={13} style={{ verticalAlign: -2 }} /> {s.telephone}</span>}
              <span><BedDouble size={13} style={{ verticalAlign: -2 }} /> {s.capaciteLits} {t('champs.capaciteLits')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AffectationsView({
  t, sites, selectedSiteId, setSelectedSiteId, affectations, affForm, setAffForm, onAdd, onRemove, fmtDate,
}: {
  t: ReturnType<typeof useTranslations>;
  sites: Site[];
  selectedSiteId: string;
  setSelectedSiteId: (v: string) => void;
  affectations: Affectation[];
  affForm: { userId: string; fonction: string; dateDebut: string; dateFin: string };
  setAffForm: (v: { userId: string; fonction: string; dateDebut: string; dateFin: string }) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  fmtDate: (iso?: string | null) => string;
}) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={label}>{t('affectations.choisirSite')}</label>
        <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} style={input}>
          {sites.length === 0 && <option value="">—</option>}
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>
          ))}
        </select>
      </div>

      {/* Formulaire d'ajout */}
      <div style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>{t('affectations.ajouter')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <div>
            <label style={label}>{t('affectations.userId')}</label>
            <input value={affForm.userId} onChange={(e) => setAffForm({ ...affForm, userId: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('affectations.fonction')}</label>
            <input value={affForm.fonction} onChange={(e) => setAffForm({ ...affForm, fonction: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('affectations.dateDebut')}</label>
            <input type="date" value={affForm.dateDebut} onChange={(e) => setAffForm({ ...affForm, dateDebut: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('affectations.dateFin')}</label>
            <input type="date" value={affForm.dateFin} onChange={(e) => setAffForm({ ...affForm, dateFin: e.target.value })} style={input} />
          </div>
        </div>
        <button onClick={onAdd} disabled={!selectedSiteId || !affForm.userId} style={{ ...btnPrimary, marginTop: 12 }}>
          <Plus size={16} /> {t('affectations.ajouter')}
        </button>
      </div>

      {/* Liste */}
      {affectations.length === 0 ? (
        <p style={{ color: '#64748B' }}>{t('aucuneAffectation')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {affectations.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{a.userId}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {a.fonction || '—'} · {fmtDate(a.dateDebut)} → {a.dateFin ? fmtDate(a.dateFin) : t('affectations.enCours')}
                </div>
              </div>
              <button onClick={() => onRemove(a.id)} style={{ ...iconBtn, color: '#DC2626' }} aria-label="remove"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SiteForm({ t, form, setForm, editing, saving, onSave, onClose }: {
  t: ReturnType<typeof useTranslations>;
  form: typeof emptyForm;
  setForm: (v: typeof emptyForm) => void;
  editing: boolean;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {editing ? t('modifierSite') : t('nouveauSite')}
          </h2>
          <button onClick={onClose} style={iconBtn} aria-label="close"><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label style={label}>{t('champs.code')} *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('champs.nom')} *</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('champs.type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TypeSite })} style={input}>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`type.${ty}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>{t('champs.statut')}</label>
            <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as StatutSite })} style={input}>
              {STATUTS.map((st) => <option key={st} value={st}>{t(`statut.${st}`)}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>{t('champs.ville')}</label>
            <input value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('champs.telephone')}</label>
            <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} style={input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>{t('champs.adresse')}</label>
            <input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('champs.responsableRef')}</label>
            <input value={form.responsableRef} onChange={(e) => setForm({ ...form, responsableRef: e.target.value })} style={input} />
          </div>
          <div>
            <label style={label}>{t('champs.capaciteLits')}</label>
            <input type="number" min={0} value={form.capaciteLits} onChange={(e) => setForm({ ...form, capaciteLits: Number(e.target.value) })} style={input} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 14 }}>
          <input type="checkbox" checked={form.estPrincipal} onChange={(e) => setForm({ ...form, estPrincipal: e.target.checked })} />
          {t('champs.estPrincipal')}
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnGhost}>{t('annuler')}</button>
          <button onClick={onSave} disabled={saving || !form.code || !form.nom} style={btnPrimary}>
            <Save size={16} /> {t('enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
  background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer',
};
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
  background: '#fff', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer',
};
const iconBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, background: '#F1F5F9', border: '1px solid #E2E8F0',
  borderRadius: 8, cursor: 'pointer', color: '#334155',
};
const badge: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
  borderRadius: 999, fontSize: 12, fontWeight: 600,
};
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 };
const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff',
};
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50,
};
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 24, width: '100%',
  maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
};
