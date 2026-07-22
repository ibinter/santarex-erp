'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileSpreadsheet, Plus, Search, RefreshCw, Send, CheckCircle,
  XCircle, Clock, Building2, TrendingUp, X, Eye, Trash2, Banknote,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type StatutBordereau =
  | 'brouillon' | 'emis' | 'envoye' | 'paye_partiel' | 'paye' | 'rejete';

type Assureur = { id: string; nom: string; type?: string; actif?: boolean };

type Ligne = {
  id: string; bordereauId: string; factureRef?: string; patientNom: string;
  acte: string; dateActe: string; montantTotal: number; tauxCouverture: number;
  montantCouvert: number; numeroBPC?: string;
};

type Bordereau = {
  id: string; numero: string; assureurId: string;
  assureur?: { id: string; nom: string; type?: string } | null;
  periodeDebut: string; periodeFin: string;
  montantTotalCouvert: number; nbActes: number; statut: StatutBordereau;
  dateEmission?: string; dateEnvoi?: string;
  montantPaye: number; datePaiement?: string; reference?: string;
  ecart?: number; motifRejet?: string; notes?: string;
  lignes?: Ligne[]; createdAt: string;
};

type Creance = {
  assureurId: string; assureurNom: string; nbBordereaux: number;
  montantCouvert: number; montantPaye: number; enAttente: number;
};

type Stats = {
  totalBordereaux?: number;
  parStatut?: Record<string, number>;
  montantTotalCouvert?: number;
  montantPaye?: number;
  montantEnAttente?: number;
  nbImpayes?: number;
  creancesParAssureur?: Creance[];
};

const STATUT_CONFIG: Record<StatutBordereau, { bg: string; color: string; dot: string }> = {
  brouillon:    { bg: '#F5F5F5', color: '#546E7A', dot: '#90A4AE' },
  emis:         { bg: '#E3F2FD', color: '#1565C0', dot: '#1E88E5' },
  envoye:       { bg: '#FFF8E1', color: '#F57F17', dot: '#FBC02D' },
  paye_partiel: { bg: '#F3E5F5', color: '#6A1B9A', dot: '#8E24AA' },
  paye:         { bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047' },
  rejete:       { bg: '#FFEBEE', color: '#C62828', dot: '#EF5350' },
};

function fmtXOF(v?: number | null) { return (Number(v) || 0).toLocaleString('fr-FR') + ' XOF'; }
function fmtDate(d?: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);

const num = (v: any) => Number(v) || 0;
const normBordereau = (b: any): Bordereau => ({
  ...b,
  montantTotalCouvert: num(b.montantTotalCouvert),
  montantPaye: num(b.montantPaye),
  nbActes: num(b.nbActes),
  ecart: b.ecart != null ? num(b.ecart) : num(b.montantTotalCouvert) - num(b.montantPaye),
});

export default function TiersPayantPage() {
  const t = useTranslations('tiersPayant');
  const [tab, setTab] = useState<'bordereaux' | 'creances'>('bordereaux');
  const [bordereaux, setBordereaux] = useState<Bordereau[]>([]);
  const [assureurs, setAssureurs] = useState<Assureur[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Bordereau | null>(null);
  const [paiementFor, setPaiementFor] = useState<Bordereau | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [borRes, assRes, statsRes] = await Promise.allSettled([
        apiClient<any>('/tiers-payant/bordereaux?limit=100'),
        apiClient<any>('/prise-en-charge/assureurs?actif=true'),
        apiClient<Stats>('/tiers-payant/stats'),
      ]);
      if (borRes.status === 'fulfilled')
        setBordereaux(unwrap(borRes.value).map(normBordereau));
      if (assRes.status === 'fulfilled') setAssureurs(unwrap(assRes.value));
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = useCallback(async (id: string) => {
    try {
      const r = await apiClient<any>(`/tiers-payant/bordereaux/${id}`);
      const b = r?.data ?? r;
      setDetail(normBordereau(b));
    } catch { alert(t('erreurChargement')); }
  }, [t]);

  const doAction = useCallback(async (path: string, body?: any) => {
    try {
      await apiClient(path, { method: 'PATCH', body });
      await load();
      return true;
    } catch { alert(t('erreurEnregistrement')); return false; }
  }, [load, t]);

  const handleEmettre = (id: string) => doAction(`/tiers-payant/bordereaux/${id}/emettre`);
  const handleEnvoyer = (id: string) => doAction(`/tiers-payant/bordereaux/${id}/envoyer`);
  const handleRejeter = async (id: string) => {
    const motif = prompt(t('motifRejet')) ?? undefined;
    await doAction(`/tiers-payant/bordereaux/${id}/rejeter`, { motif });
  };
  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmSuppression'))) return;
    try { await apiClient(`/tiers-payant/bordereaux/${id}`, { method: 'DELETE' }); await load(); }
    catch { alert(t('erreurEnregistrement')); }
  };

  const displayed = useMemo(() => bordereaux.filter(b => {
    const q = search.toLowerCase();
    const matchS = !search
      || (b.numero || '').toLowerCase().includes(q)
      || (b.assureur?.nom || '').toLowerCase().includes(q);
    const matchSt = !statutFilter || b.statut === statutFilter;
    return matchS && matchSt;
  }), [bordereaux, search, statutFilter]);

  const kpiTotal = stats?.totalBordereaux ?? bordereaux.length;
  const kpiImpayes = stats?.nbImpayes ?? 0;
  const kpiAttente = stats?.montantEnAttente ?? 0;
  const kpiEncaisse = stats?.montantPaye ?? 0;

  const creances = stats?.creancesParAssureur ?? [];

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .tp-row:hover { background: #F8FAFF !important; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#0D47A1 0%,#1565C0 55%,#1976D2 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,71,161,0.32)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={28} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 700 }}>{t('titre')}</h1>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{t('description')}</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', color: '#0D47A1', border: 'none', borderRadius: 10, padding: '11px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            <Plus size={18} /> {t('nouveauBordereau')}
          </button>
        </div>
      </div>

      {/* ── KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 18 }}>
        <KpiCard icon={<FileSpreadsheet size={20} />} label={t('kpiTotal')} value={String(kpiTotal)} color="#1565C0" />
        <KpiCard icon={<Clock size={20} />} label={t('kpiImpayes')} value={String(kpiImpayes)} color="#F57F17" />
        <KpiCard icon={<TrendingUp size={20} />} label={t('kpiEnAttente')} value={fmtXOF(kpiAttente)} color="#8E24AA" />
        <KpiCard icon={<Banknote size={20} />} label={t('kpiEncaisse')} value={fmtXOF(kpiEncaisse)} color="#2E7D32" />
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['bordereaux', 'creances'] as const).map(tk => (
          <button key={tk} onClick={() => setTab(tk)} style={{ padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, background: tab === tk ? '#1565C0' : '#fff', color: tab === tk ? '#fff' : '#546E7A' }}>
            {t(`onglets.${tk}`)}
          </button>
        ))}
      </div>

      {tab === 'bordereaux' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#90A4AE' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('rechercher')} style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 9, border: '1px solid #E0E4EC', fontSize: 13.5 }} />
            </div>
            <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid #E0E4EC', fontSize: 13.5 }}>
              <option value="">{t('colStatut')}</option>
              {Object.keys(STATUT_CONFIG).map(s => <option key={s} value={s}>{t(`statut.${s}`)}</option>)}
            </select>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 9, border: '1px solid #E0E4EC', background: '#fff', cursor: 'pointer', fontSize: 13.5, color: '#546E7A' }}>
              <RefreshCw size={15} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> {t('actualiser')}
            </button>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('chargement')}</div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <FileSpreadsheet size={40} color="#CFD8DC" />
                <p style={{ margin: '10px 0 2px', fontWeight: 600, color: '#546E7A' }}>{t('aucunBordereau')}</p>
                <p style={{ margin: 0, fontSize: 13, color: '#90A4AE' }}>{t('aucunBordereauDesc')}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 900 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', color: '#78909C', textAlign: 'left' }}>
                      <th style={thStyle}>{t('colNumero')}</th>
                      <th style={thStyle}>{t('colAssureur')}</th>
                      <th style={thStyle}>{t('colPeriode')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('colActes')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('colCouvert')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('colPaye')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('colEcart')}</th>
                      <th style={thStyle}>{t('colStatut')}</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>{t('colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(b => {
                      const sc = STATUT_CONFIG[b.statut];
                      const ecart = b.ecart ?? (b.montantTotalCouvert - b.montantPaye);
                      return (
                        <tr key={b.id} className="tp-row" style={{ borderTop: '1px solid #F0F2F6' }}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#0D47A1' }}>{b.numero}</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Building2 size={14} color="#90A4AE" /> {b.assureur?.nom ?? '—'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: '#607D8B', whiteSpace: 'nowrap' }}>{fmtDate(b.periodeDebut)} → {fmtDate(b.periodeFin)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{b.nbActes}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmtXOF(b.montantTotalCouvert)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#2E7D32' }}>{fmtXOF(b.montantPaye)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: ecart > 0 ? '#C62828' : '#607D8B' }}>{fmtXOF(ecart)}</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot }} />
                              {t(`statut.${b.statut}`)}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <IconBtn title={t('actions.voir')} onClick={() => openDetail(b.id)}><Eye size={15} /></IconBtn>
                            {b.statut === 'brouillon' && (
                              <>
                                <IconBtn title={t('actions.emettre')} color="#1565C0" onClick={() => handleEmettre(b.id)}><CheckCircle size={15} /></IconBtn>
                                <IconBtn title={t('supprimer')} color="#C62828" onClick={() => handleDelete(b.id)}><Trash2 size={15} /></IconBtn>
                              </>
                            )}
                            {b.statut === 'emis' && (
                              <IconBtn title={t('actions.envoyer')} color="#F57F17" onClick={() => handleEnvoyer(b.id)}><Send size={15} /></IconBtn>
                            )}
                            {['emis', 'envoye', 'paye_partiel'].includes(b.statut) && (
                              <>
                                <IconBtn title={t('actions.paiement')} color="#2E7D32" onClick={() => setPaiementFor(b)}><Banknote size={15} /></IconBtn>
                                <IconBtn title={t('actions.rejeter')} color="#C62828" onClick={() => handleRejeter(b.id)}><XCircle size={15} /></IconBtn>
                              </>
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
        </>
      )}

      {tab === 'creances' && (
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F2F6', fontWeight: 700, color: '#37474F' }}>{t('creancesTitre')}</div>
          {creances.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#90A4AE' }}>{t('creancesVide')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#78909C', textAlign: 'left' }}>
                    <th style={thStyle}>{t('colAssureur')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('colNbBordereaux')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('colCouvert')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('colPaye')}</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>{t('colEnAttente')}</th>
                  </tr>
                </thead>
                <tbody>
                  {creances.map(c => (
                    <tr key={c.assureurId} className="tp-row" style={{ borderTop: '1px solid #F0F2F6' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Building2 size={14} color="#90A4AE" /> {c.assureurNom}</span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{c.nbBordereaux}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtXOF(c.montantCouvert)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#2E7D32' }}>{fmtXOF(c.montantPaye)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#C62828' }}>{fmtXOF(c.enAttente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <BordereauForm
          assureurs={assureurs}
          onClose={() => setShowForm(false)}
          onSaved={async (id) => { setShowForm(false); await load(); if (id) openDetail(id); }}
        />
      )}

      {detail && (
        <DetailDrawer
          bordereau={detail}
          onClose={() => setDetail(null)}
          onChanged={async () => { await load(); await openDetail(detail.id); }}
        />
      )}

      {paiementFor && (
        <PaiementForm
          bordereau={paiementFor}
          onClose={() => setPaiementFor(null)}
          onSaved={async () => { setPaiementFor(null); await load(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = { padding: '11px 14px', fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 };
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#37474F' };

function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#263238' }}>{value}</div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, color = '#546E7A' }: { children: React.ReactNode; onClick: () => void; title: string; color?: string }) {
  return (
    <button title={title} onClick={onClick} style={{ background: `${color}12`, color, border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', marginLeft: 5, verticalAlign: 'middle' }}>
      {children}
    </button>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', justifyContent: 'flex-end', zIndex: 60 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid #E0E4EC', fontSize: 13.5, boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#546E7A', marginBottom: 5, display: 'block' };

function BordereauForm({ assureurs, onClose, onSaved }: { assureurs: Assureur[]; onClose: () => void; onSaved: (id?: string) => void }) {
  const t = useTranslations('tiersPayant');
  const [assureurId, setAssureurId] = useState('');
  const [periodeDebut, setPeriodeDebut] = useState('');
  const [periodeFin, setPeriodeFin] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!assureurId || !periodeDebut || !periodeFin) return;
    setSaving(true);
    try {
      const r = await apiClient<any>('/tiers-payant/bordereaux', { method: 'POST', body: { assureurId, periodeDebut, periodeFin, notes: notes || undefined } });
      onSaved((r?.data ?? r)?.id);
    } catch { alert(t('erreurEnregistrement')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: '#fff', height: '100%', padding: 24, overflowY: 'auto', animation: 'fadeUp .2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#263238' }}>{t('nouveauBordereau')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelStyle}>{t('form.assureur')}</label>
            <select value={assureurId} onChange={e => setAssureurId(e.target.value)} style={inputStyle}>
              <option value="">{t('form.choisirAssureur')}</option>
              {assureurs.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{t('form.periodeDebut')}</label>
            <input type="date" value={periodeDebut} onChange={e => setPeriodeDebut(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('form.periodeFin')}</label>
            <input type="date" value={periodeFin} onChange={e => setPeriodeFin(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t('form.notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 9, border: '1px solid #E0E4EC', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#546E7A' }}>{t('form.annuler')}</button>
          <button disabled={saving || !assureurId || !periodeDebut || !periodeFin} onClick={submit} style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: '#1565C0', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{t('form.creer')}</button>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ bordereau, onClose, onChanged }: { bordereau: Bordereau; onClose: () => void; onChanged: () => void }) {
  const t = useTranslations('tiersPayant');
  const [showLigneForm, setShowLigneForm] = useState(false);
  const editable = bordereau.statut === 'brouillon';
  const lignes = bordereau.lignes ?? [];
  const sc = STATUT_CONFIG[bordereau.statut];

  const removeLigne = async (ligneId: string) => {
    if (!confirm(t('confirmSuppressionLigne'))) return;
    try { await apiClient(`/tiers-payant/bordereaux/${bordereau.id}/lignes/${ligneId}`, { method: 'DELETE' }); await onChanged(); }
    catch { alert(t('erreurEnregistrement')); }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 640, maxWidth: '100%', background: '#fff', height: '100%', padding: 24, overflowY: 'auto', animation: 'fadeUp .2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#0D47A1' }}>{bordereau.numero}</h2>
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot }} /> {t(`statut.${bordereau.statut}`)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 18 }}>
          <Info label={t('colAssureur')} value={bordereau.assureur?.nom ?? '—'} />
          <Info label={t('colPeriode')} value={`${fmtDate(bordereau.periodeDebut)} → ${fmtDate(bordereau.periodeFin)}`} />
          <Info label={t('colCouvert')} value={fmtXOF(bordereau.montantTotalCouvert)} />
          <Info label={t('colPaye')} value={fmtXOF(bordereau.montantPaye)} />
          <Info label={t('colEcart')} value={fmtXOF((bordereau.ecart ?? bordereau.montantTotalCouvert - bordereau.montantPaye))} />
          <Info label={t('form.factureRef')} value={bordereau.reference ?? '—'} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#37474F' }}>{t('lignes')}</h3>
          {editable && (
            <button onClick={() => setShowLigneForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              <Plus size={15} /> {t('ajouterLigne')}
            </button>
          )}
        </div>

        {showLigneForm && editable && (
          <LigneForm bordereauId={bordereau.id} onSaved={async () => { setShowLigneForm(false); await onChanged(); }} />
        )}

        {lignes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#90A4AE', background: '#F8FAFC', borderRadius: 10, fontSize: 13 }}>{t('aucuneLigne')}</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #F0F2F6', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 560 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#78909C', textAlign: 'left' }}>
                  <th style={thStyle}>{t('colPatient')}</th>
                  <th style={thStyle}>{t('colActe')}</th>
                  <th style={thStyle}>{t('colDateActe')}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{t('colMontantTotal')}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{t('colTaux')}</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>{t('colCouvert')}</th>
                  {editable && <th style={thStyle} />}
                </tr>
              </thead>
              <tbody>
                {lignes.map(l => (
                  <tr key={l.id} style={{ borderTop: '1px solid #F0F2F6' }}>
                    <td style={tdStyle}>{l.patientNom}</td>
                    <td style={tdStyle}>{l.acte}{l.numeroBPC ? <span style={{ color: '#90A4AE', fontSize: 11 }}> · {l.numeroBPC}</span> : null}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtDate(l.dateActe)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{fmtXOF(l.montantTotal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{num(l.tauxCouverture)}%</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmtXOF(l.montantCouvert)}</td>
                    {editable && (
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <IconBtn title={t('supprimer')} color="#C62828" onClick={() => removeLigne(l.id)}><Trash2 size={14} /></IconBtn>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: '#263238', fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function LigneForm({ bordereauId, onSaved }: { bordereauId: string; onSaved: () => void }) {
  const t = useTranslations('tiersPayant');
  const [patientNom, setPatientNom] = useState('');
  const [acte, setActe] = useState('');
  const [dateActe, setDateActe] = useState('');
  const [montantTotal, setMontantTotal] = useState('');
  const [tauxCouverture, setTauxCouverture] = useState('80');
  const [factureRef, setFactureRef] = useState('');
  const [numeroBPC, setNumeroBPC] = useState('');
  const [saving, setSaving] = useState(false);

  const montantCouvert = (Number(montantTotal) || 0) * (Number(tauxCouverture) || 0) / 100;

  const submit = async () => {
    if (!patientNom || !acte || !dateActe) return;
    setSaving(true);
    try {
      await apiClient(`/tiers-payant/bordereaux/${bordereauId}/lignes`, { method: 'POST', body: {
        patientNom, acte, dateActe,
        montantTotal: Number(montantTotal) || 0,
        tauxCouverture: Number(tauxCouverture) || 0,
        factureRef: factureRef || undefined,
        numeroBPC: numeroBPC || undefined,
      } });
      onSaved();
    } catch { alert(t('erreurEnregistrement')); } finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={labelStyle}>{t('form.patientNom')}</label><input value={patientNom} onChange={e => setPatientNom(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.acte')}</label><input value={acte} onChange={e => setActe(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.dateActe')}</label><input type="date" value={dateActe} onChange={e => setDateActe(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.montantTotal')}</label><input type="number" value={montantTotal} onChange={e => setMontantTotal(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.tauxCouverture')}</label><input type="number" value={tauxCouverture} onChange={e => setTauxCouverture(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.montantCouvert')}</label><input value={fmtXOF(montantCouvert)} readOnly style={{ ...inputStyle, background: '#ECEFF1' }} /></div>
        <div><label style={labelStyle}>{t('form.factureRef')}</label><input value={factureRef} onChange={e => setFactureRef(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t('form.numeroBPC')}</label><input value={numeroBPC} onChange={e => setNumeroBPC(e.target.value)} style={inputStyle} /></div>
      </div>
      <button disabled={saving || !patientNom || !acte || !dateActe} onClick={submit} style={{ padding: '9px', borderRadius: 9, border: 'none', background: '#1565C0', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{t('form.enregistrer')}</button>
    </div>
  );
}

function PaiementForm({ bordereau, onClose, onSaved }: { bordereau: Bordereau; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations('tiersPayant');
  const [montant, setMontant] = useState('');
  const [reference, setReference] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [increment, setIncrement] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!montant) return;
    setSaving(true);
    try {
      await apiClient(`/tiers-payant/bordereaux/${bordereau.id}/paiement`, { method: 'PATCH', body: {
        montant: Number(montant) || 0,
        increment,
        reference: reference || undefined,
        datePaiement: datePaiement || undefined,
      } });
      onSaved();
    } catch { alert(t('erreurEnregistrement')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, maxWidth: '100%', background: '#fff', height: '100%', padding: 24, overflowY: 'auto', animation: 'fadeUp .2s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#263238' }}>{t('paiement.titre')}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#90A4AE' }}><X size={20} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#607D8B' }}>{bordereau.numero} · {fmtXOF(bordereau.montantTotalCouvert)}</p>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={labelStyle}>{t('paiement.montant')}</label><input type="number" value={montant} onChange={e => setMontant(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('paiement.datePaiement')}</label><input type="date" value={datePaiement} onChange={e => setDatePaiement(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('paiement.reference')}</label><input value={reference} onChange={e => setReference(e.target.value)} style={inputStyle} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#546E7A', cursor: 'pointer' }}>
            <input type="checkbox" checked={increment} onChange={e => setIncrement(e.target.checked)} /> {t('paiement.increment')}
          </label>
        </div>
        <button disabled={saving || !montant} onClick={submit} style={{ width: '100%', marginTop: 22, padding: '11px', borderRadius: 9, border: 'none', background: '#2E7D32', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{t('paiement.valider')}</button>
      </div>
    </div>
  );
}
