'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Droplet, Droplets, Plus, RefreshCw, X, AlertTriangle, CheckCircle,
  XCircle, Clock, Search, Activity,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import PatientSearch, { PatientLite } from '@/components/PatientSearch';

// ── Types ──────────────────────────────────────────────────────────
type GroupeABO = 'A' | 'B' | 'AB' | 'O';
type Rhesus = '+' | '-';
type TypeProduit = 'sang_total' | 'CGR' | 'plasma' | 'plaquettes';
type StatutPoche = 'disponible' | 'reservee' | 'transfusee' | 'perimee' | 'detruite';

type Poche = {
  id: string; numero: string; groupe: GroupeABO; rhesus: Rhesus;
  typeProduit: TypeProduit; volumeMl: number; datePrelevement: string;
  datePeremption: string; statut: StatutPoche; donneurRef?: string;
  provenance?: string; localisation?: string;
};
type Transfusion = {
  id: string; patientId: string; pocheId: string; pocheNumero?: string;
  date: string; groupePatient: GroupeABO; rhesusPatient: Rhesus;
  compatibiliteVerifiee: boolean; medecin?: string; indication?: string;
  reactionTransfusionnelle?: string; observations?: string;
};
type Stats = {
  stockParGroupe: { groupe: string; rhesus: string; libelle: string; count: number }[];
  totalDisponible: number; prochesPeremption: Poche[]; perimees: number;
  transfusionsTotal: number;
};

// ── Compatibilité (miroir de la règle backend) ─────────────────────
const ABO_ACCEPTE: Record<GroupeABO, GroupeABO[]> = {
  O: ['O'], A: ['A', 'O'], B: ['B', 'O'], AB: ['A', 'B', 'AB', 'O'],
};
function estCompatible(gR: GroupeABO, rR: Rhesus, gP: GroupeABO, rP: Rhesus): boolean {
  const aboOk = ABO_ACCEPTE[gR]?.includes(gP) ?? false;
  const rhOk = rR === '+' ? true : rP === '-';
  return aboOk && rhOk;
}

const GROUPES: GroupeABO[] = ['A', 'B', 'AB', 'O'];
const RHESUS: Rhesus[] = ['+', '-'];
const TYPES: TypeProduit[] = ['sang_total', 'CGR', 'plasma', 'plaquettes'];

function joursAvant(iso: string): number {
  const d = new Date(iso); const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}
function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

const STATUT_CFG: Record<StatutPoche, { bg: string; color: string; border: string }> = {
  disponible: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  reservee:   { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  transfusee: { bg: '#E0E7FF', color: '#3730A3', border: '#C7D2FE' },
  perimee:    { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  detruite:   { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' },
};

export default function BanqueSangPage() {
  const t = useTranslations('banqueSang');
  const [onglet, setOnglet] = useState<'inventaire' | 'transfusions'>('inventaire');
  const [poches, setPoches] = useState<Poche[]>([]);
  const [transfusions, setTransfusions] = useState<Transfusion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalPoche, setModalPoche] = useState(false);
  const [modalTransfusion, setModalTransfusion] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [p, tr, st] = await Promise.all([
        apiClient<{ data: Poche[] }>('/banque-sang/poches?limit=100'),
        apiClient<{ data: Transfusion[] }>('/banque-sang/transfusions?limit=100'),
        apiClient<Stats>('/banque-sang/stats'),
      ]);
      setPoches(p?.data ?? []);
      setTransfusions(tr?.data ?? []);
      setStats(st ?? null);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const pochesFiltrees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return poches;
    return poches.filter(p =>
      p.numero.toLowerCase().includes(q) ||
      `${p.groupe}${p.rhesus}`.toLowerCase().includes(q) ||
      (p.donneurRef ?? '').toLowerCase().includes(q));
  }, [poches, search]);

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={24} color="#DC2626" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{t('titre')}</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{t('sousTitre')}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={charger} style={btnGhost}>
            <RefreshCw size={15} /> {t('actions.rafraichir')}
          </button>
          <button onClick={() => setModalPoche(true)} style={btnGhost}>
            <Plus size={15} /> {t('actions.nouvellePoche')}
          </button>
          <button onClick={() => setModalTransfusion(true)} style={btnPrimary}>
            <Droplet size={15} /> {t('actions.nouvelleTransfusion')}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard icon={<Droplets size={18} color="#DC2626" />} label={t('stats.totalDisponible')} value={stats.totalDisponible} />
          <StatCard icon={<Clock size={18} color="#B45309" />} label={t('stats.prochesPeremption')} value={stats.prochesPeremption?.length ?? 0} />
          <StatCard icon={<AlertTriangle size={18} color="#B91C1C" />} label={t('stats.perimees')} value={stats.perimees} />
          <StatCard icon={<Activity size={18} color="#3730A3" />} label={t('stats.transfusions')} value={stats.transfusionsTotal} />
        </div>
      )}

      {/* Répartition par groupe */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 10, marginBottom: 24 }}>
          {GROUPES.flatMap(g => RHESUS.map(r => {
            const item = stats.stockParGroupe.find(s => s.groupe === g && s.rhesus === r);
            const count = item?.count ?? 0;
            return (
              <div key={`${g}${r}`} style={{ background: '#fff', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{g}{r}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: count > 0 ? '#111827' : '#D1D5DB' }}>{count}</div>
              </div>
            );
          }))}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 16 }}>
        {(['inventaire', 'transfusions'] as const).map(o => (
          <button key={o} onClick={() => setOnglet(o)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: onglet === o ? '#DC2626' : '#6B7280',
            borderBottom: onglet === o ? '2px solid #DC2626' : '2px solid transparent',
          }}>{t(`onglets.${o}`)}</button>
        ))}
      </div>

      {loading && <p style={{ color: '#6B7280' }}>…</p>}

      {/* Inventaire */}
      {!loading && onglet === 'inventaire' && (
        <>
          <div style={{ position: 'relative', marginBottom: 12, maxWidth: 320 }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('poche.numero')}
              style={{ width: '100%', padding: '8px 8px 8px 32px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
          </div>
          {pochesFiltrees.length === 0 ? (
            <Empty text={t('vide.poches')} />
          ) : (
            <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                    <Th>{t('poche.numero')}</Th><Th>{t('poche.groupe')}</Th><Th>{t('poche.typeProduit')}</Th>
                    <Th>{t('poche.volumeMl')}</Th><Th>{t('poche.datePeremption')}</Th><Th>{t('poche.statut')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {pochesFiltrees.map(p => {
                    const j = joursAvant(p.datePeremption);
                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                        <Td><strong>{p.numero}</strong>{p.donneurRef && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.donneurRef}</div>}</Td>
                        <Td><span style={{ fontWeight: 800, color: '#DC2626' }}>{p.groupe}{p.rhesus}</span></Td>
                        <Td>{t(`typeProduit.${p.typeProduit}`)}</Td>
                        <Td>{p.volumeMl}</Td>
                        <Td>
                          {fmtDate(p.datePeremption)}
                          {p.statut === 'disponible' && j <= 7 && (
                            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: j < 0 ? '#B91C1C' : '#B45309' }}>
                              {j < 0 ? t('peremption.expiree') : t('peremption.jours', { n: j })}
                            </span>
                          )}
                        </Td>
                        <Td><Badge cfg={STATUT_CFG[p.statut]} label={t(`statut.${p.statut}`)} /></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Transfusions */}
      {!loading && onglet === 'transfusions' && (
        transfusions.length === 0 ? <Empty text={t('vide.transfusions')} /> : (
          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB', textAlign: 'left' }}>
                  <Th>{t('transfusion.date')}</Th><Th>{t('transfusion.patient')}</Th>
                  <Th>{t('transfusion.groupePatient')}</Th><Th>{t('transfusion.poche')}</Th>
                  <Th>{t('transfusion.compatibilite')}</Th><Th>{t('transfusion.reaction')}</Th>
                </tr>
              </thead>
              <tbody>
                {transfusions.map(tr => (
                  <tr key={tr.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <Td>{fmtDate(tr.date)}</Td>
                    <Td>{tr.patientId}</Td>
                    <Td><span style={{ fontWeight: 800, color: '#DC2626' }}>{tr.groupePatient}{tr.rhesusPatient}</span></Td>
                    <Td>{tr.pocheNumero ?? tr.pocheId}</Td>
                    <Td>
                      {tr.compatibiliteVerifiee
                        ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', color: '#15803D', fontWeight: 600 }}><CheckCircle size={14} />{t('compat.verifiee')}</span>
                        : <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', color: '#B91C1C', fontWeight: 600 }}><XCircle size={14} />{t('compat.nonVerifiee')}</span>}
                    </Td>
                    <Td>{tr.reactionTransfusionnelle
                      ? <span style={{ color: '#B91C1C' }}>{tr.reactionTransfusionnelle}</span>
                      : <span style={{ color: '#D1D5DB' }}>—</span>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {modalPoche && <PocheModal t={t} onClose={() => setModalPoche(false)} onDone={() => { setModalPoche(false); charger(); }} />}
      {modalTransfusion && <TransfusionModal t={t} poches={poches} onClose={() => setModalTransfusion(false)} onDone={() => { setModalTransfusion(false); charger(); }} />}
    </div>
  );
}

// ── Modal : nouvelle poche ─────────────────────────────────────────
function PocheModal({ t, onClose, onDone }: { t: any; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<any>({
    groupe: 'O', rhesus: '+', typeProduit: 'CGR', volumeMl: 450,
    datePrelevement: new Date().toISOString().slice(0, 10),
    datePeremption: new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10),
    donneurRef: '', provenance: '', localisation: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await apiClient('/banque-sang/poches', { method: 'POST', body: f });
      onDone();
    } catch (e: any) { setErr(e?.message || t('messages.erreur')); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={t('actions.nouvellePoche')} onClose={onClose}>
      <Row>
        <Field label={t('poche.groupe')}><Select value={f.groupe} onChange={v => setF({ ...f, groupe: v })} options={GROUPES} /></Field>
        <Field label={t('poche.rhesus')}><Select value={f.rhesus} onChange={v => setF({ ...f, rhesus: v })} options={RHESUS} /></Field>
      </Row>
      <Row>
        <Field label={t('poche.typeProduit')}><Select value={f.typeProduit} onChange={v => setF({ ...f, typeProduit: v })} options={TYPES} labels={TYPES.map(x => t(`typeProduit.${x}`))} /></Field>
        <Field label={t('poche.volumeMl')}><Input type="number" value={f.volumeMl} onChange={v => setF({ ...f, volumeMl: +v })} /></Field>
      </Row>
      <Row>
        <Field label={t('poche.datePrelevement')}><Input type="date" value={f.datePrelevement} onChange={v => setF({ ...f, datePrelevement: v })} /></Field>
        <Field label={t('poche.datePeremption')}><Input type="date" value={f.datePeremption} onChange={v => setF({ ...f, datePeremption: v })} /></Field>
      </Row>
      <Field label={t('poche.donneurRef')}><Input value={f.donneurRef} onChange={v => setF({ ...f, donneurRef: v })} /></Field>
      <Field label={t('poche.provenance')}><Input value={f.provenance} onChange={v => setF({ ...f, provenance: v })} /></Field>
      {err && <p style={{ color: '#B91C1C', fontSize: 13 }}>{err}</p>}
      <ModalActions t={t} busy={busy} onClose={onClose} onSubmit={submit} />
    </Modal>
  );
}

// ── Modal : transfusion avec contrôle de compatibilité ─────────────
function TransfusionModal({ t, poches, onClose, onDone }: { t: any; poches: Poche[]; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<any>({
    patientId: '', groupePatient: 'O', rhesusPatient: '+', pocheId: '',
    medecin: '', indication: '', observations: '', forcer: false,
  });
  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const dispo = useMemo(() => poches.filter(p => p.statut === 'disponible'), [poches]);
  const pocheSel = dispo.find(p => p.id === f.pocheId);
  const compatible = pocheSel
    ? estCompatible(f.groupePatient, f.rhesusPatient, pocheSel.groupe, pocheSel.rhesus)
    : null;

  const submit = async () => {
    if (!f.patientId) { setErr(t('transfusion.patientId')); return; }
    if (!f.pocheId) { setErr(t('compat.aucunePocheCompatible')); return; }
    setBusy(true); setErr('');
    try {
      await apiClient('/banque-sang/transfusions', {
        method: 'POST',
        body: { ...f, forcer: compatible === false ? true : false },
      });
      onDone();
    } catch (e: any) { setErr(e?.message || t('messages.erreur')); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={t('actions.nouvelleTransfusion')} onClose={onClose}>
      <Field label={t('transfusion.patient')}>
        <PatientSearch
          selected={patient}
          onSelect={(p) => { setPatient(p); setF((prev: any) => ({ ...prev, patientId: p?.id ?? '' })); }}
          accent="#DC2626"
        />
      </Field>
      <Row>
        <Field label={t('transfusion.groupePatient')}><Select value={f.groupePatient} onChange={v => setF({ ...f, groupePatient: v })} options={GROUPES} /></Field>
        <Field label={t('transfusion.rhesusPatient')}><Select value={f.rhesusPatient} onChange={v => setF({ ...f, rhesusPatient: v })} options={RHESUS} /></Field>
      </Row>
      <Field label={t('transfusion.poche')}>
        <select value={f.pocheId} onChange={e => setF({ ...f, pocheId: e.target.value })} style={inputStyle}>
          <option value="">—</option>
          {dispo.map(p => {
            const ok = estCompatible(f.groupePatient, f.rhesusPatient, p.groupe, p.rhesus);
            return <option key={p.id} value={p.id}>{p.numero} · {p.groupe}{p.rhesus} · {t(`typeProduit.${p.typeProduit}`)} {ok ? '✓' : '✕'}</option>;
          })}
        </select>
      </Field>

      {/* Bandeau de compatibilité */}
      {pocheSel && (
        <div style={{
          padding: 12, borderRadius: 10, marginTop: 4,
          background: compatible ? '#DCFCE7' : '#FEE2E2',
          border: `1px solid ${compatible ? '#86EFAC' : '#FECACA'}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {compatible ? <CheckCircle size={18} color="#15803D" /> : <XCircle size={18} color="#B91C1C" />}
          <span style={{ fontWeight: 700, color: compatible ? '#15803D' : '#B91C1C' }}>
            {compatible ? t('compat.compatible') : t('compat.incompatible')}
          </span>
          <span style={{ color: '#6B7280', fontSize: 13 }}>
            {f.groupePatient}{f.rhesusPatient} ← {pocheSel.groupe}{pocheSel.rhesus}
          </span>
        </div>
      )}

      <Field label={t('transfusion.medecin')}><Input value={f.medecin} onChange={v => setF({ ...f, medecin: v })} /></Field>
      <Field label={t('transfusion.indication')}><Input value={f.indication} onChange={v => setF({ ...f, indication: v })} /></Field>

      {err && <p style={{ color: '#B91C1C', fontSize: 13 }}>{err}</p>}
      <ModalActions t={t} busy={busy} onClose={onClose} onSubmit={submit} disabled={!pocheSel} danger={compatible === false} />
    </Modal>
  );
}

// ── UI primitives ──────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#fff', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' };

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>{icon}<span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{label}</span></div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{value}</div>
    </div>
  );
}
const Th = ({ children }: { children: React.ReactNode }) => <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{children}</th>;
const Td = ({ children }: { children: React.ReactNode }) => <td style={{ padding: '10px 12px', color: '#374151' }}>{children}</td>;
function Badge({ cfg, label }: { cfg: { bg: string; color: string; border: string }; label: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{label}</span>;
}
function Empty({ text }: { text: string }) {
  return <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', background: '#fff', border: '1px dashed #E5E7EB', borderRadius: 12 }}>{text}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6B7280" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
const Row = ({ children }: { children: React.ReactNode }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>;
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>{children}</div>;
}
function Input({ value, onChange, type = 'text' }: { value: any; onChange: (v: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />;
}
function Select({ value, onChange, options, labels }: { value: string; onChange: (v: string) => void; options: string[]; labels?: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
      {options.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
    </select>
  );
}
function ModalActions({ t, busy, onClose, onSubmit, disabled, danger }: { t: any; busy: boolean; onClose: () => void; onSubmit: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
      <button onClick={onClose} style={btnGhost}>{t('actions.annuler')}</button>
      <button onClick={onSubmit} disabled={busy || disabled} style={{ ...btnPrimary, background: danger ? '#B45309' : '#DC2626', opacity: busy || disabled ? 0.6 : 1 }}>
        {t('actions.enregistrer')}
      </button>
    </div>
  );
}
