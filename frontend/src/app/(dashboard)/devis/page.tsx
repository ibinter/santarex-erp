'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Calculator, Plus, Search, RefreshCw, Send, Check, X, FileText,
  Trash2, TrendingUp, Clock, Percent, CheckCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import PatientSearch, { PatientLite } from '@/components/PatientSearch';

type StatutDevis = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' | 'facture';
type TypeLigne = 'consultation' | 'acte' | 'medicament' | 'hospitalisation' | 'autre';

type LigneDevis = {
  id?: string;
  type: TypeLigne;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montantLigne?: number;
};

type Devis = {
  id: string;
  numero?: string;
  patientId: string;
  patient?: { id: string; nom: string; prenom: string; ipp?: string };
  objet: string;
  statut: StatutDevis;
  montantHT?: number;
  remisePourcent?: number;
  montantRemise?: number;
  montantTTC?: number;
  devise?: string;
  dateEmission?: string;
  dateValidite?: string;
  motifRefus?: string;
  factureId?: string;
  notes?: string;
  lignes?: LigneDevis[];
  createdAt: string;
};

type Patient = { id: string; nom: string; prenom: string; ipp?: string };

const STATUT_CONFIG: Record<StatutDevis, { bg: string; color: string; dot: string }> = {
  brouillon: { bg: '#F5F5F5', color: '#546E7A', dot: '#90A4AE' },
  envoye:    { bg: '#EFF6FF', color: '#1565C0', dot: '#1565C0' },
  accepte:   { bg: '#E8F5E9', color: '#2E7D32', dot: '#43A047' },
  refuse:    { bg: '#FFEBEE', color: '#C62828', dot: '#EF5350' },
  expire:    { bg: '#FFF8E1', color: '#F57F17', dot: '#FBC02D' },
  facture:   { bg: '#F3E5F5', color: '#6A1B9A', dot: '#8E24AA' },
};

const TYPES: TypeLigne[] = ['consultation', 'acte', 'medicament', 'hospitalisation', 'autre'];

function n(v: unknown): number { return Number(v) || 0; }
function fmtXOF(v?: number | null, devise = 'XOF') {
  return (Number(v) || 0).toLocaleString('fr-FR') + ' ' + devise;
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

export default function DevisPage() {
  const t = useTranslations('devis');
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, sRes, pRes] = await Promise.allSettled([
        apiClient<any>('/devis?limit=100'),
        apiClient<any>('/devis/stats'),
        apiClient<any>('/patients?limit=100'),
      ]);
      const pList: Patient[] = pRes.status === 'fulfilled' ? unwrap(pRes.value) : [];
      setPatients(pList);
      const pMap: Record<string, Patient> = Object.fromEntries(pList.map(p => [p.id, p]));
      if (dRes.status === 'fulfilled') {
        const list = unwrap(dRes.value).map((d: any) => ({
          ...d,
          patient: d.patient ?? pMap[d.patientId],
        }));
        setDevisList(list);
      }
      if (sRes.status === 'fulfilled') setStats(sRes.value);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => devisList.filter(d => {
    const q = search.toLowerCase();
    const nomP = d.patient ? `${d.patient.prenom} ${d.patient.nom}`.toLowerCase() : '';
    const matchS = !search || nomP.includes(q) || (d.numero || '').toLowerCase().includes(q) || (d.objet || '').toLowerCase().includes(q);
    const matchSt = !statutFilter || d.statut === statutFilter;
    return matchS && matchSt;
  }), [devisList, search, statutFilter]);

  const tauxAcceptation = n(stats?.tauxAcceptation);
  const montantEnAttente = n(stats?.montantEnAttente);
  const nbAcceptes = (n(stats?.parStatut?.accepte?.count) + n(stats?.parStatut?.facture?.count));

  const router = useRouter();

  async function act(fn: () => Promise<any>, key: string) {
    setBusy(key);
    try { await fn(); await load(); }
    catch { alert(t('toast.erreur')); }
    finally { setBusy(null); }
  }

  const envoyer = (d: Devis) => act(() => apiClient(`/devis/${d.id}/envoyer`, { method: 'PATCH' }), d.id);
  const accepter = (d: Devis) => act(() => apiClient(`/devis/${d.id}/repondre`, { method: 'PATCH', body: { reponse: 'accepte' } }), d.id);
  const refuser = (d: Devis) => {
    const motif = window.prompt(t('dialog.refusMotif')) ?? undefined;
    return act(() => apiClient(`/devis/${d.id}/repondre`, { method: 'PATCH', body: { reponse: 'refuse', motifRefus: motif } }), d.id);
  };
  const convertir = async (d: Devis) => {
    if (!window.confirm(t('dialog.convertirConfirme'))) return;
    setBusy(d.id);
    try {
      const res: any = await apiClient(`/devis/${d.id}/convertir-facture`, { method: 'PATCH', body: {} });
      await load();
      // La facture est réellement créée dans le module Facturation : on y redirige.
      const factureId = res?.data?.facture?.id ?? res?.facture?.id;
      if (factureId) router.push(`/facturation/${factureId}`);
    } catch {
      alert(t('toast.erreur'));
    } finally {
      setBusy(null);
    }
  };
  const supprimer = (d: Devis) => {
    if (!window.confirm(t('dialog.supprimerConfirme'))) return;
    return act(() => apiClient(`/devis/${d.id}`, { method: 'DELETE' }), d.id);
  };

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        .dv-row:hover { background: #F8FAFF !important; }
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0D3B6E 0%,#1565C0 55%,#0288D1 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(13,59,110,0.35)' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={26} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('titre')}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                {loading ? '…' : t('nbDevis', { count: devisList.length })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading} style={btnGhost}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('actualiser')}
            </button>
            <button onClick={() => setShowForm(true)} style={btnPrimary}>
              <Plus size={14} /> {t('nouveau')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, position: 'relative', zIndex: 1 }}>
          {[
            { label: t('kpiTotal'), val: loading ? '…' : n(stats?.total) || devisList.length, icon: <FileText size={11} /> },
            { label: t('kpiEnAttente'), val: loading ? '…' : fmtXOF(montantEnAttente), icon: <Clock size={11} /> },
            { label: t('kpiTauxAcceptation'), val: loading ? '…' : `${tauxAcceptation}%`, icon: <Percent size={11} /> },
            { label: t('kpiAcceptes'), val: loading ? '…' : nbAcceptes, icon: <CheckCircle size={11} /> },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.val}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FILTRES */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#90A4AE' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('rechercher')}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 11, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ val: '', label: t('filtreTous') }, ...Object.keys(STATUT_CONFIG).map(k => ({ val: k, label: t(`statut.${k}`) }))].map(s => (
            <button key={s.val} onClick={() => setStatutFilter(s.val)}
              style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${statutFilter === s.val ? '#1565C0' : '#E0E8F0'}`, background: statutFilter === s.val ? '#1565C0' : '#fff', color: statutFilter === s.val ? '#fff' : '#546E7A', fontSize: 12, fontWeight: statutFilter === s.val ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {[t('thNumero'), t('thPatient'), t('thObjet'), t('thValidite'), t('thMontant'), t('thStatut'), t('actions')].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F5F7FA' }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '13px 14px' }}>
                      <div style={{ height: 13, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', borderRadius: 4, width: j === 1 ? 130 : 70, animation: 'pulse 1.5s ease infinite' }} />
                    </td>
                  ))}
                </tr>
              )) : displayed.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                  <Calculator size={36} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#37474F' }}>{t('vide')}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{search ? t('videRecherche', { q: search }) : t('videBase')}</div>
                </td></tr>
              ) : displayed.map(d => {
                const cfg = STATUT_CONFIG[d.statut] ?? STATUT_CONFIG.brouillon;
                const isBusy = busy === d.id;
                return (
                  <tr key={d.id} className="dv-row" style={{ borderTop: '1px solid #F0F4FA', transition: 'background .15s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#1565C0', background: '#EFF6FF', padding: '3px 9px', borderRadius: 6, fontFamily: 'monospace' }}>
                        {d.numero || d.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>
                      {d.patient ? `${d.patient.prenom} ${d.patient.nom}` : '—'}
                      {d.patient?.ipp && <div style={{ fontSize: 10, color: '#90A4AE', fontFamily: 'monospace' }}>{d.patient.ipp}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', maxWidth: 200 }}>{d.objet}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDate(d.dateValidite)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: '#1A2332', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(d.montantTTC, d.devise as any)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                        {t(`statut.${d.statut}`)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {d.statut === 'brouillon' && (
                          <>
                            <button disabled={isBusy} onClick={() => envoyer(d)} style={actBtn('#1565C0')} title={t('envoyer')}><Send size={13} /></button>
                            <button disabled={isBusy} onClick={() => supprimer(d)} style={actBtn('#C62828')} title={t('supprimer')}><Trash2 size={13} /></button>
                          </>
                        )}
                        {d.statut === 'envoye' && (
                          <>
                            <button disabled={isBusy} onClick={() => accepter(d)} style={actBtn('#2E7D32')} title={t('accepter')}><Check size={13} /></button>
                            <button disabled={isBusy} onClick={() => refuser(d)} style={actBtn('#C62828')} title={t('refuser')}><X size={13} /></button>
                          </>
                        )}
                        {d.statut === 'accepte' && (
                          <button disabled={isBusy} onClick={() => convertir(d)} style={{ ...actBtn('#6A1B9A'), width: 'auto', padding: '0 10px', gap: 5 }} title={t('convertir')}>
                            <FileText size={13} /> <span style={{ fontSize: 11, fontWeight: 700 }}>{t('convertir')}</span>
                          </button>
                        )}
                        {(d.statut === 'refuse' || d.statut === 'expire' || d.statut === 'facture') && (
                          <span style={{ fontSize: 11, color: '#B0BEC5' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <DevisForm
          onClose={() => setShowForm(false)}
          onSaved={async () => { setShowForm(false); await load(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulaire de création (modal) avec lignes + total live
// ─────────────────────────────────────────────────────────────────────────────
function DevisForm({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('devis');
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const patientId = patient?.id ?? '';
  const [objet, setObjet] = useState('');
  const [dateValidite, setDateValidite] = useState('');
  const [remisePourcent, setRemisePourcent] = useState(0);
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<LigneDevis[]>([
    { type: 'acte', designation: '', quantite: 1, prixUnitaire: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const sousTotal = lignes.reduce((s, l) => s + n(l.quantite) * n(l.prixUnitaire), 0);
  const montantRemise = sousTotal * (n(remisePourcent) / 100);
  const totalTTC = sousTotal - montantRemise;

  const setLigne = (i: number, patch: Partial<LigneDevis>) =>
    setLignes(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLigne = () => setLignes(ls => [...ls, { type: 'autre', designation: '', quantite: 1, prixUnitaire: 0 }]);
  const removeLigne = (i: number) => setLignes(ls => ls.filter((_, idx) => idx !== i));

  async function submit() {
    if (!patientId) return alert(t('form.erreurPatient'));
    if (!objet.trim()) return alert(t('form.erreurObjet'));
    const valides = lignes.filter(l => l.designation.trim() && n(l.quantite) > 0);
    if (valides.length === 0) return alert(t('form.erreurLignes'));
    setSaving(true);
    try {
      await apiClient('/devis', {
        method: 'POST',
        body: {
          patientId,
          objet: objet.trim(),
          dateValidite: dateValidite || undefined,
          remisePourcent: n(remisePourcent),
          notes: notes.trim() || undefined,
          lignes: valides.map(l => ({
            type: l.type,
            designation: l.designation.trim(),
            quantite: n(l.quantite),
            prixUnitaire: n(l.prixUnitaire),
          })),
        },
      });
      onSaved();
    } catch { alert(t('toast.erreur')); }
    finally { setSaving(false); }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,50,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, zIndex: 100, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0D3B6E' }}>{t('form.titreCreation')}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#90A4AE' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={lblStyle}>{t('form.patient')}</div>
              <PatientSearch selected={patient} onSelect={(p) => setPatient(p)} accent="#1565C0" placeholder={t('form.choisirPatient')} />
            </div>
            <label style={{ width: 160 }}>
              <div style={lblStyle}>{t('form.dateValidite')}</div>
              <input type="date" value={dateValidite} onChange={e => setDateValidite(e.target.value)} style={inputStyle} />
            </label>
          </div>

          <label>
            <div style={lblStyle}>{t('form.objet')}</div>
            <input value={objet} onChange={e => setObjet(e.target.value)} placeholder={t('form.objetPlaceholder')} style={inputStyle} />
          </label>

          {/* Lignes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ ...lblStyle, marginBottom: 0 }}>{t('form.lignes')}</div>
              <button onClick={addLigne} style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1.5px solid #1565C0', background: '#EFF6FF', color: '#1565C0', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={12} /> {t('form.ajouterLigne')}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lignes.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', background: '#F8FAFC', padding: 8, borderRadius: 10 }}>
                  <select value={l.type} onChange={e => setLigne(i, { type: e.target.value as TypeLigne })} style={{ ...inputStyle, width: 130, marginTop: 0 }}>
                    {TYPES.map(ty => <option key={ty} value={ty}>{t(`form.type${ty.charAt(0).toUpperCase() + ty.slice(1)}`)}</option>)}
                  </select>
                  <input value={l.designation} onChange={e => setLigne(i, { designation: e.target.value })} placeholder={t('form.designationPlaceholder')} style={{ ...inputStyle, flex: 1, minWidth: 140, marginTop: 0 }} />
                  <input type="number" min={0} value={l.quantite} onChange={e => setLigne(i, { quantite: Number(e.target.value) })} style={{ ...inputStyle, width: 64, marginTop: 0 }} title={t('form.quantite')} />
                  <input type="number" min={0} value={l.prixUnitaire} onChange={e => setLigne(i, { prixUnitaire: Number(e.target.value) })} style={{ ...inputStyle, width: 110, marginTop: 0 }} title={t('form.prixUnitaire')} />
                  <span style={{ width: 100, textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#1A2332', fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(n(l.quantite) * n(l.prixUnitaire))}</span>
                  <button onClick={() => removeLigne(i)} style={{ border: 'none', background: 'transparent', color: '#C62828', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ width: 160 }}>
              <div style={lblStyle}>{t('form.remise')}</div>
              <input type="number" min={0} max={100} value={remisePourcent} onChange={e => setRemisePourcent(Number(e.target.value))} style={inputStyle} />
            </label>
            <label style={{ flex: 1, minWidth: 220 }}>
              <div style={lblStyle}>{t('form.notes')}</div>
              <input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} />
            </label>
          </div>

          {/* Totaux live */}
          <div style={{ background: '#F4F6FA', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={totalRow}><span>{t('form.sousTotal')}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(sousTotal)}</span></div>
            <div style={{ ...totalRow, color: '#C62828' }}><span>{t('form.montantRemise')} ({n(remisePourcent)}%)</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>- {fmtXOF(montantRemise)}</span></div>
            <div style={{ ...totalRow, borderTop: '1px solid #E0E8F0', paddingTop: 8, fontSize: 15, fontWeight: 900, color: '#0D3B6E' }}>
              <span>{t('form.totalTTC')}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtXOF(totalTTC)}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid #EEF2F8', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ ...btnGhost, color: '#546E7A', border: '1.5px solid #E0E8F0', background: '#fff' }}>{t('form.annuler')}</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPrimary, background: '#1565C0', color: '#fff', opacity: saving ? 0.6 : 1 }}>
            {saving ? '…' : t('form.enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const btnGhost: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 };
const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#1565C0', fontWeight: 800 };
const thStyle: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1.5px solid #EEF2F8' };
const lblStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff', marginTop: 0 };
const totalRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#546E7A', fontWeight: 600 };
const actBtn = (color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${color}33`, background: `${color}11`, color, cursor: 'pointer' });
