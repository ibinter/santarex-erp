'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle, RefreshCw, Plus, X, Send, AlertTriangle, Save,
  Info, CheckCircle2, Clock, XCircle, FlaskConical, CalendarClock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

type Canal = 'sms' | 'whatsapp' | string;
type Statut = 'en_attente' | 'envoye' | 'echoue' | 'simule' | string;
type CodeModele = 'rappel_rdv' | 'resultat_pret' | 'relance' | 'bienvenue' | string;

type Message = {
  id: string; tenantId: string; patientId?: string | null; destinataire: string;
  canal: Canal; contenu: string; statut: Statut; dateEnvoi?: string | null;
  erreur?: string | null; modeleCode?: string | null; provider?: string | null;
  createdAt: string;
};
type Modele = {
  id: string; code: CodeModele; libelle: string; canal: Canal; contenu: string; actif: boolean;
};
type Stats = {
  providerSimule?: boolean; providerNom?: string;
  global?: { total?: number; enAttente?: number; envoyes?: number; echoues?: number; simules?: number };
  jour?: { envoyes?: number; echoues?: number; simules?: number };
};

const STATUT_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  en_attente: { color: '#C2410C', bg: '#FFF7ED', icon: Clock },
  envoye:     { color: '#15803D', bg: '#DCFCE7', icon: CheckCircle2 },
  echoue:     { color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  simule:     { color: '#6D28D9', bg: '#F5F3FF', icon: FlaskConical },
};
const CANAL_CFG: Record<string, { color: string; bg: string; label: string }> = {
  sms:      { color: '#1D4ED8', bg: '#EFF6FF', label: 'SMS' },
  whatsapp: { color: '#15803D', bg: '#DCFCE7', label: 'WhatsApp' },
};
const CANAUX = ['sms', 'whatsapp'];
const CODES = ['rappel_rdv', 'resultat_pret', 'relance', 'bienvenue'];
const STATUTS = ['en_attente', 'envoye', 'echoue', 'simule'];

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default function MessagesSortantsPage() {
  const t = useTranslations('messagesSortants');
  const [messages, setMessages] = useState<Message[]>([]);
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'historique' | 'modeles'>('historique');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [search, setSearch] = useState('');
  const [showSend, setShowSend] = useState(false);
  const [showModele, setShowModele] = useState(false);
  const [editModele, setEditModele] = useState<Modele | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mR, tR, sR] = await Promise.allSettled([
        apiClient<any>('/messages-sortants?limit=200'),
        apiClient<any>('/messages-sortants/modeles'),
        apiClient<any>('/messages-sortants/stats'),
      ]);
      if (mR.status === 'fulfilled') { const d = mR.value; setMessages(Array.isArray(d) ? d : d?.data ?? []); }
      if (tR.status === 'fulfilled') setModeles(Array.isArray(tR.value) ? tR.value : tR.value?.data ?? []);
      if (sR.status === 'fulfilled') setStats(sR.value ?? {});
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const genererRappels = async () => {
    try {
      const r = await apiClient<{ crees: number }>('/messages-sortants/generer-rappels', { method: 'POST' });
      setNotice(t('generatedCount', { count: r?.crees ?? 0 }));
      load();
      setTimeout(() => setNotice(null), 5000);
    } catch { setNotice(t('errors.generate')); }
  };

  const g = stats.global ?? {};
  const j = stats.jour ?? {};
  const kpis = [
    { label: t('hero.kpiEnvoyes'), val: g.envoyes ?? 0, f: 'envoye' },
    { label: t('hero.kpiSimules'), val: g.simules ?? 0, f: 'simule' },
    { label: t('hero.kpiEchoues'), val: g.echoues ?? 0, f: 'echoue' },
    { label: t('hero.kpiJour'), val: (j.envoyes ?? 0) + (j.simules ?? 0), f: null as any },
    { label: t('hero.kpiTotal'), val: g.total ?? messages.length, f: 'TOUS' },
  ];

  const filtered = messages.filter(m =>
    (filtreStatut === 'TOUS' || m.statut === filtreStatut) &&
    (!search ||
      m.destinataire.toLowerCase().includes(search.toLowerCase()) ||
      (m.contenu ?? '').toLowerCase().includes(search.toLowerCase())));

  const simuleActif = stats.providerSimule ?? true;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .msg-row:hover{background:#EFF6FF!important;}
        .msg-kpi{cursor:pointer;transition:all .15s;}
        .msg-kpi:hover{transform:translateY(-2px);}
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1E3A8A 0%,#2563EB 50%,#3B82F6 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px rgba(30,58,138,0.35)' }}>
        <div style={{ position: 'absolute', top: -50, right: 80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('hero.title')}</h1>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>
                  {loading ? t('hero.loading') : t('hero.displayedCount', { count: filtered.length })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {kpis.map(k => {
                const active = filtreStatut === k.f;
                return (
                  <div key={k.label} className="msg-kpi"
                    onClick={() => { if (k.f) { setTab('historique'); setFiltreStatut(k.f); } }}
                    style={{ background: active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.12)', border: `1px solid ${active ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{loading ? '…' : k.val}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{k.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={load} disabled={loading}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff' }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={genererRappels}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
              <CalendarClock size={14} /> {t('generateReminders')}
            </button>
            <button onClick={() => setShowSend(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#1E3A8A', fontWeight: 800, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
              <Plus size={14} /> {t('hero.newMessage')}
            </button>
          </div>
        </div>
      </div>

      {/* BANDEAU MODE SIMULÉ */}
      {simuleActif && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <Info size={18} color="#6D28D9" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#6D28D9' }}>{t('simuleBanner.title')}</div>
            <div style={{ fontSize: 12, color: '#5B21B6', lineHeight: 1.5, marginTop: 2 }}>{t('simuleBanner.text')}</div>
          </div>
        </div>
      )}

      {notice && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 700 }}>{notice}</div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['historique', 'modeles'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${tab === tb ? '#2563EB' : '#E0E8F0'}`, background: tab === tb ? '#2563EB' : '#fff', color: tab === tb ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {t(`tabs.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'historique' ? (
        <>
          {/* FILTRES */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('filters.searchPlaceholder')}
              style={{ flex: 1, minWidth: 200, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['TOUS', ...STATUTS].map(f => {
                const active = filtreStatut === f;
                return (
                  <button key={f} onClick={() => setFiltreStatut(f)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? '#2563EB' : '#E0E8F0'}`, background: active ? '#EFF6FF' : '#fff', color: active ? '#1D4ED8' : '#546E7A', fontSize: 11, fontWeight: active ? 800 : 500, cursor: 'pointer' }}>
                    {f === 'TOUS' ? t('filters.all') : t(`statut.${f}` as any)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TABLE */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
                    {[t('list.colDestinataire'), t('list.colCanal'), t('list.colContenu'), t('list.colModele'), t('list.colStatut'), t('list.colDate')].map((h, i) => (
                      <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F0F4FA' }}>
                      {Array.from({ length: 6 }).map((_, jj) => (
                        <td key={jj} style={{ padding: '12px 14px' }}><div style={{ height: 13, background: '#F0F4FA', borderRadius: 4, width: jj === 2 ? 200 : 70, animation: 'pulse 1.5s ease infinite' }} /></td>
                      ))}
                    </tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px', color: '#90A4AE' }}>
                      <MessageCircle size={36} style={{ display: 'block', margin: '0 auto 12px', color: '#BFDBFE' }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('list.empty')}</p>
                    </td></tr>
                  ) : filtered.map(m => {
                    const sc = STATUT_CFG[m.statut] ?? STATUT_CFG.en_attente;
                    const cc = CANAL_CFG[m.canal] ?? CANAL_CFG.sms;
                    const SIcon = sc.icon;
                    return (
                      <tr key={m.id} className="msg-row" style={{ borderTop: '1px solid #F0F4FA' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332', whiteSpace: 'nowrap' }}>{m.destinataire}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: cc.bg, color: cc.color }}>{cc.label}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.contenu}</td>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: '#90A4AE', whiteSpace: 'nowrap' }}>{m.modeleCode ? t(`code.${m.modeleCode}` as any) : '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                            <SIcon size={11} />{t(`statut.${m.statut}` as any)}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', whiteSpace: 'nowrap' }}>{fmtDateTime(m.dateEnvoi ?? m.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* MODÈLES */
        <div style={{ animation: 'fadeUp .25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => { setEditModele(null); setShowModele(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#2563EB', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 700 }}>
              <Plus size={14} /> {t('modeles.new')}
            </button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)' }}>
                    {[t('modeles.colLibelle'), t('modeles.colCode'), t('modeles.colCanal'), t('modeles.colContenu'), t('modeles.colActif')].map((h, i) => (
                      <th key={i} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modeles.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '50px 20px', color: '#90A4AE', fontSize: 13, fontWeight: 600 }}>{t('modeles.empty')}</td></tr>
                  ) : modeles.map(md => {
                    const cc = CANAL_CFG[md.canal] ?? CANAL_CFG.sms;
                    return (
                      <tr key={md.id} className="msg-row" onClick={() => { setEditModele(md); setShowModele(true); }} style={{ borderTop: '1px solid #F0F4FA', cursor: 'pointer' }}>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{md.libelle}</td>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: '#90A4AE' }}>{t(`code.${md.code}` as any)}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: cc.bg, color: cc.color }}>{cc.label}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#546E7A', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{md.contenu}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: md.actif ? '#DCFCE7' : '#F1F5F9', color: md.actif ? '#15803D' : '#94A3B8' }}>
                            {md.actif ? t('modeles.actif') : t('modeles.inactif')}
                          </span>
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

      {showSend && (
        <SendModal t={t} modeles={modeles}
          onClose={() => setShowSend(false)}
          onSaved={() => { setShowSend(false); load(); }} />
      )}
      {showModele && (
        <ModeleModal t={t} modele={editModele}
          onClose={() => { setShowModele(false); setEditModele(null); }}
          onSaved={() => { setShowModele(false); setEditModele(null); load(); }} />
      )}
    </div>
  );
}

/* ── Modales ─────────────────────────────────────────────────────── */
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 1000, overflowY: 'auto' };
const modalBox: React.CSSProperties = { width: '100%', maxWidth: 540, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeUp .2s ease' };
const modalHead: React.CSSProperties = { background: 'linear-gradient(135deg,#1E3A8A,#2563EB)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', color: '#1A2332', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#546E7A', display: 'block', marginBottom: 6 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>;
}
function ErrBox({ msg }: { msg: string }) {
  return <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', color: '#DC2626', fontSize: 12 }}><AlertTriangle size={13} /> {msg}</div>;
}

function SendModal({ t, modeles, onClose, onSaved }: any) {
  const [mode, setMode] = useState<'modele' | 'libre'>('modele');
  const [modeleCode, setModeleCode] = useState<string>(modeles?.[0]?.code ?? 'rappel_rdv');
  const [canal, setCanal] = useState<string>('sms');
  const [patientId, setPatientId] = useState('');
  const [destinataire, setDestinataire] = useState('');
  const [contenu, setContenu] = useState('');
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!patientId.trim() && !destinataire.trim()) { setErr(t('errors.destinataireRequired')); return; }
    if (mode === 'libre' && !contenu.trim()) { setErr(t('errors.contenuRequired')); return; }
    setSaving(true); setErr(null);
    const body: any = {
      patientId: patientId.trim() || undefined,
      destinataire: destinataire.trim() || undefined,
      canal,
    };
    if (mode === 'modele') body.modeleCode = modeleCode;
    else body.contenu = contenu;
    try {
      await apiClient('/messages-sortants', { method: 'POST', body });
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.send')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Send size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{t('send.title')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['modele', 'libre'] as const).map(mo => (
              <button key={mo} onClick={() => setMode(mo)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1.5px solid ${mode === mo ? '#2563EB' : '#E0E8F0'}`, background: mode === mo ? '#EFF6FF' : '#fff', color: mode === mo ? '#1D4ED8' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {mo === 'modele' ? t('send.modeModele') : t('send.modeLibre')}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {mode === 'modele' && (
              <Field label={t('send.modele')}>
                <select style={inp} value={modeleCode} onChange={e => setModeleCode(e.target.value)}>
                  {(modeles ?? []).map((m: any) => <option key={m.id} value={m.code}>{m.libelle}</option>)}
                </select>
              </Field>
            )}
            <Field label={t('send.canal')}>
              <select style={inp} value={canal} onChange={e => setCanal(e.target.value)}>
                {CANAUX.map(c => <option key={c} value={c}>{t(`canal.${c}` as any)}</option>)}
              </select>
            </Field>
            <Field label={t('send.patientId')}><input style={inp} value={patientId} onChange={e => setPatientId(e.target.value)} placeholder={t('send.phPatientId')} /></Field>
            <Field label={t('send.destinataire')}><input style={inp} value={destinataire} onChange={e => setDestinataire(e.target.value)} placeholder={t('send.phDestinataire')} /></Field>
          </div>
          {mode === 'libre' && (
            <Field label={t('send.contenu')}><textarea style={{ ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} value={contenu} onChange={e => setContenu(e.target.value)} placeholder={t('send.phContenu')} /></Field>
          )}
          <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('send.hintPatient')}</div>
          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('send.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#2563EB', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Send size={15} /> {saving ? t('send.sending') : t('send.send')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeleModal({ t, modele, onClose, onSaved }: any) {
  const isEdit = !!modele;
  const [code, setCode] = useState<string>(isEdit ? modele.code : 'rappel_rdv');
  const [libelle, setLibelle] = useState(isEdit ? modele.libelle : '');
  const [canal, setCanal] = useState<string>(isEdit ? modele.canal : 'sms');
  const [contenu, setContenu] = useState(isEdit ? modele.contenu : '');
  const [actif, setActif] = useState<boolean>(isEdit ? modele.actif : true);
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!libelle.trim()) { setErr(t('errors.libelleRequired')); return; }
    if (!contenu.trim()) { setErr(t('errors.contenuRequired')); return; }
    setSaving(true); setErr(null);
    try {
      if (isEdit) {
        await apiClient(`/messages-sortants/modeles/${modele.id}`, { method: 'PATCH', body: { libelle, canal, contenu, actif } });
      } else {
        await apiClient('/messages-sortants/modeles', { method: 'POST', body: { code, libelle, canal, contenu, actif } });
      }
      onSaved();
    } catch (e: any) { setErr(e?.message ?? t('errors.save')); } finally { setSaving(false); }
  };

  return (
    <div style={overlay} onClick={() => !saving && onClose()}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><MessageCircle size={20} color="#fff" /><h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>{isEdit ? t('modeleForm.titleEdit') : t('modeleForm.titleCreate')}</h2></div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', color: '#fff' }}><X size={14} /></button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('modeleForm.code')}>
              <select style={inp} value={code} disabled={isEdit} onChange={e => setCode(e.target.value)}>
                {CODES.map(c => <option key={c} value={c}>{t(`code.${c}` as any)}</option>)}
              </select>
            </Field>
            <Field label={t('modeleForm.canal')}>
              <select style={inp} value={canal} onChange={e => setCanal(e.target.value)}>
                {CANAUX.map(c => <option key={c} value={c}>{t(`canal.${c}` as any)}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t('modeleForm.libelle')}><input style={inp} value={libelle} onChange={e => setLibelle(e.target.value)} /></Field>
          <Field label={t('modeleForm.contenu')}><textarea style={{ ...inp, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }} value={contenu} onChange={e => setContenu(e.target.value)} /></Field>
          <div style={{ fontSize: 11, color: '#90A4AE' }}>{t('modeles.variablesHint')}</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 600 }}>
            <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} /> {t('modeleForm.actif')}
          </label>
          {err && <ErrBox msg={err} />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#546E7A', fontWeight: 700 }}>{t('modeleForm.cancel')}</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#94A3B8' : '#2563EB', cursor: saving ? 'default' : 'pointer', fontSize: 13, color: '#fff', fontWeight: 800 }}><Save size={15} /> {saving ? t('modeleForm.saving') : t('modeleForm.save')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
