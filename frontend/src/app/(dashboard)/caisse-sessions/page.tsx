'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Wallet, RefreshCw, Lock, Unlock, Receipt, Plus, Printer,
  TrendingUp, Hash, AlertTriangle, CheckCircle2, X, Banknote, ClipboardList,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const MODES = ['especes', 'carte_bancaire', 'mobile_money', 'virement', 'cheque', 'assurance', 'autre'] as const;

function fmtXOF(val: unknown) { return (Number(val) || 0).toLocaleString('fr-FR') + ' XOF'; }
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

interface Recu {
  id: string; numero: string; sessionId?: string | null; patientId?: string | null;
  factureRef?: string | null; montant: number; devise?: string; modePaiement: string;
  date: string; objet?: string | null; emisParRef?: string | null;
}
interface Session {
  id: string; numero: string; caissierRef: string; dateOuverture: string; dateCloture?: string | null;
  fondCaisseInitial: number; montantTheoriqueEspeces: number; montantCompteEspeces?: number | null;
  ecart: number; totalEncaisse: number; totauxParMode?: Record<string, number>;
  statut: string; notes?: string | null; recus?: Recu[];
}
interface Stats {
  nbSessionsJour: number; sessionsOuvertes: number; sessionsCloturees: number;
  totalEncaisseJour: number; totalEcarts: number; nbRecusJour: number; totalRecusJour: number;
}

export default function CaisseSessionsPage() {
  const t = useTranslations('caisseSessions');
  const [stats, setStats] = useState<Stats | null>(null);
  const [ouverte, setOuverte] = useState<Session | null>(null);
  const [detail, setDetail] = useState<Session | null>(null);
  const [historique, setHistorique] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // formulaires
  const [showOuvrir, setShowOuvrir] = useState(false);
  const [fondInitial, setFondInitial] = useState('');
  const [ouvrirNotes, setOuvrirNotes] = useState('');
  const [showRecu, setShowRecu] = useState(false);
  const [rObjet, setRObjet] = useState(''); const [rMontant, setRMontant] = useState('');
  const [rMode, setRMode] = useState<string>('especes'); const [rPatient, setRPatient] = useState('');
  const [rFacture, setRFacture] = useState('');
  const [showCloturer, setShowCloturer] = useState(false);
  const [compte, setCompte] = useState('');
  const [apercu, setApercu] = useState<Recu | null>(null);

  const modeLabel = (m: string) => (MODES.includes(m as any) ? t(`mode.${m}`) : m);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const [s, o, h] = await Promise.allSettled([
        apiClient('/caisse-sessions/stats'),
        apiClient('/caisse-sessions/ouverte'),
        apiClient('/caisse-sessions?limit=20'),
      ]);
      if (s.status === 'fulfilled') setStats(s.value as Stats);
      const openSession = o.status === 'fulfilled' ? (o.value as Session | null) : null;
      setOuverte(openSession);
      if (openSession?.id) {
        try { setDetail(await apiClient(`/caisse-sessions/${openSession.id}`)); } catch { setDetail(openSession); }
      } else { setDetail(null); }
      if (h.status === 'fulfilled') {
        const arr = (h.value as any)?.data ?? h.value ?? [];
        setHistorique(Array.isArray(arr) ? arr : []);
      }
    } catch (e: any) { setErr(e?.message || t('erreurChargement')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const doOuvrir = async () => {
    setErr('');
    try {
      await apiClient('/caisse-sessions/ouvrir', { method: 'POST', body: { fondCaisseInitial: Number(fondInitial) || 0, notes: ouvrirNotes || undefined } });
      setShowOuvrir(false); setFondInitial(''); setOuvrirNotes(''); await load();
    } catch (e: any) { setErr(e?.message || t('erreurAction')); }
  };

  const doRecu = async () => {
    setErr('');
    try {
      const created = await apiClient<Recu>('/caisse-sessions/recus', { method: 'POST', body: {
        sessionId: ouverte?.id, montant: Number(rMontant) || 0, modePaiement: rMode,
        objet: rObjet || undefined, patientId: rPatient || undefined, factureRef: rFacture || undefined,
      }});
      setShowRecu(false); setRObjet(''); setRMontant(''); setRMode('especes'); setRPatient(''); setRFacture('');
      await load();
      setApercu(created);
    } catch (e: any) { setErr(e?.message || t('erreurAction')); }
  };

  const doCloturer = async () => {
    setErr('');
    if (!ouverte?.id) return;
    try {
      await apiClient(`/caisse-sessions/${ouverte.id}/cloturer`, { method: 'PATCH', body: { montantCompteEspeces: Number(compte) || 0 } });
      setShowCloturer(false); setCompte(''); await load();
    } catch (e: any) { setErr(e?.message || t('erreurAction')); }
  };

  const cur = detail ?? ouverte;
  const totaux = cur?.totauxParMode ?? {};
  const compteNum = Number(compte) || 0;
  const theoriquePrevu = (Number(cur?.fondCaisseInitial) || 0) + (Number(totaux['especes']) || 0);
  const ecartPrevu = compteNum - theoriquePrevu;

  const kpis = [
    { label: t('kpiSessionsJour'), val: stats?.nbSessionsJour ?? 0, icon: <ClipboardList size={11}/> },
    { label: t('kpiOuvertes'), val: stats?.sessionsOuvertes ?? 0, icon: <Unlock size={11}/> },
    { label: t('kpiEncaisseJour'), val: fmtXOF(stats?.totalEncaisseJour), icon: <TrendingUp size={11}/> },
    { label: t('kpiRecusJour'), val: stats?.nbRecusJour ?? 0, icon: <Receipt size={11}/> },
    { label: t('kpiEcarts'), val: fmtXOF(stats?.totalEcarts), icon: <AlertTriangle size={11}/> },
  ];

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:translateY(0);} }
        .cs-input { width:100%; padding:9px 12px; border:1.5px solid #E0E8F0; borderRadius:9px; fontSize:13px; outline:none; box-sizing:border-box; }
        .cs-input:focus { border-color:#065F46; }
        @media print { body * { visibility:hidden; } #recu-print, #recu-print * { visibility:visible; } #recu-print { position:absolute; left:0; top:0; width:100%; } }
      `}</style>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#047857 100%)', borderRadius: 18, padding: '24px 28px 20px', marginBottom: 20, boxShadow: '0 8px 28px rgba(6,78,59,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('titre')}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{t('sousTitre')}</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> {t('actualiser')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{k.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{loading ? '…' : k.val}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>{err}</div>}

      {/* SESSION EN COURS ou OUVERTURE */}
      {!ouverte ? (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: 36, textAlign: 'center', animation: 'fadeUp .25s ease' }}>
          <Wallet size={44} style={{ opacity: 0.25, marginBottom: 12 }}/>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#37474F' }}>{t('aucuneSession')}</div>
          <div style={{ fontSize: 13, color: '#90A4AE', margin: '6px 0 18px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{t('aucuneSessionDesc')}</div>
          <button onClick={() => setShowOuvrir(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 20px', borderRadius: 11, border: 'none', background: '#065F46', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
            <Unlock size={16}/> {t('ouvrirCaisse')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
          {/* col gauche : reçus */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .25s ease' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 5, fontFamily: 'monospace' }}>{cur?.numero}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: '#90A4AE' }}>{t('ouvertLe')} {fmtDate(cur?.dateOuverture)}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowRecu(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 9, border: 'none', background: '#065F46', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={13}/> {t('nouveauRecu')}
                </button>
                <button onClick={() => setShowCloturer(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 9, border: '1.5px solid #C62828', background: '#fff', color: '#C62828', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Lock size={13}/> {t('cloturer')}
                </button>
              </div>
            </div>

            <div style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('recusEmis')}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {[t('recuNumero'), t('recuObjet'), t('recuMode'), t('recuMontant'), '']?.map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: i === 3 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', borderBottom: '1.5px solid #EEF2F8', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(cur?.recus ?? []).length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#90A4AE', fontSize: 13 }}>{t('aucunRecu')}</td></tr>
                  ) : (cur?.recus ?? []).map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid #F0F4FA' }}>
                      <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#065F46', fontFamily: 'monospace' }}>{r.numero}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#37474F' }}>{r.objet || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{modeLabel(r.modePaiement)}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, color: '#065F46', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtXOF(r.montant)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button onClick={() => setApercu(r)} title={t('imprimer')} style={{ border: 'none', background: '#F0F4FA', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#546E7A' }}><Printer size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* col droite : synthèse session */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: 18, animation: 'fadeUp .3s ease' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('sessionEnCours')}</h3>
            <div style={{ background: 'linear-gradient(135deg,#064E3B,#047857)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>{t('totalEncaisse')}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4 }}>{fmtXOF(cur?.totalEncaisse)}</div>
            </div>
            <Row label={t('fond')} val={fmtXOF(cur?.fondCaisseInitial)} />
            <Row label={t('theorique')} val={fmtXOF(cur?.montantTheoriqueEspeces)} />
            <div style={{ margin: '14px 0 8px', fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase' }}>{t('repartition')}</div>
            {Object.keys(totaux).length === 0 ? (
              <div style={{ fontSize: 12, color: '#B0BEC5' }}>—</div>
            ) : Object.entries(totaux).map(([m, v]) => (
              <Row key={m} label={modeLabel(m)} val={fmtXOF(v)} />
            ))}
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginTop: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #EEF2F8', fontSize: 13, fontWeight: 800, color: '#37474F' }}>{t('historique')}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {[t('numero'), t('ouvertLe'), t('clotureeLe'), t('totalEncaisse'), t('ecart'), t('statut')].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', borderBottom: '1.5px solid #EEF2F8', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#90A4AE', fontSize: 13 }}>{t('aucuneHistorique')}</td></tr>
              ) : historique.map(s => {
                const ec = Number(s.ecart) || 0;
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid #F0F4FA' }}>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#065F46', fontFamily: 'monospace' }}>{s.numero}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{fmtDate(s.dateOuverture)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#546E7A' }}>{fmtDate(s.dateCloture)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, color: '#065F46' }}>{fmtXOF(s.totalEncaisse)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 800, color: ec < 0 ? '#C62828' : ec > 0 ? '#EF6C00' : '#546E7A' }}>{s.statut === 'cloturee' ? fmtXOF(ec) : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: s.statut === 'ouverte' ? '#D1FAE5' : '#ECEFF1', color: s.statut === 'ouverte' ? '#065F46' : '#546E7A' }}>
                        {s.statut === 'ouverte' ? t('statutOuverte') : t('statutCloturee')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OUVRIR */}
      {showOuvrir && (
        <Modal onClose={() => setShowOuvrir(false)} title={t('ouvrirCaisse')} icon={<Unlock size={18}/>}>
          <Field label={t('fondInitial')} help={t('fondInitialAide')}>
            <input className="cs-input" type="number" value={fondInitial} onChange={e => setFondInitial(e.target.value)} placeholder="0" />
          </Field>
          <Field label={t('notesOptionnel')}>
            <input className="cs-input" value={ouvrirNotes} onChange={e => setOuvrirNotes(e.target.value)} />
          </Field>
          <Actions onCancel={() => setShowOuvrir(false)} cancelLabel={t('annuler')} onOk={doOuvrir} okLabel={t('confirmerOuverture')} />
        </Modal>
      )}

      {/* MODAL RECU */}
      {showRecu && (
        <Modal onClose={() => setShowRecu(false)} title={t('recuTitre')} icon={<Receipt size={18}/>}>
          <Field label={t('recuObjet')}><input className="cs-input" value={rObjet} onChange={e => setRObjet(e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('recuMontant')}><input className="cs-input" type="number" value={rMontant} onChange={e => setRMontant(e.target.value)} placeholder="0" /></Field>
            <Field label={t('recuMode')}>
              <select className="cs-input" value={rMode} onChange={e => setRMode(e.target.value)}>
                {MODES.map(m => <option key={m} value={m}>{t(`mode.${m}`)}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label={t('recuPatient')}><input className="cs-input" value={rPatient} onChange={e => setRPatient(e.target.value)} /></Field>
            <Field label={t('recuFacture')}><input className="cs-input" value={rFacture} onChange={e => setRFacture(e.target.value)} /></Field>
          </div>
          <Actions onCancel={() => setShowRecu(false)} cancelLabel={t('annuler')} onOk={doRecu} okLabel={t('emettre')} />
        </Modal>
      )}

      {/* MODAL CLOTURER */}
      {showCloturer && (
        <Modal onClose={() => setShowCloturer(false)} title={t('cloturer')} icon={<Lock size={18}/>}>
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <Row label={t('fond')} val={fmtXOF(cur?.fondCaisseInitial)} />
            <Row label={`${modeLabel('especes')}`} val={fmtXOF(totaux['especes'])} />
            <Row label={t('theorique')} val={fmtXOF(theoriquePrevu)} bold />
          </div>
          <Field label={t('montantCompte')} help={t('montantCompteAide')}>
            <input className="cs-input" type="number" value={compte} onChange={e => setCompte(e.target.value)} placeholder="0" />
          </Field>
          {compte !== '' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginTop: 4,
              background: ecartPrevu === 0 ? '#E8F5E9' : ecartPrevu < 0 ? '#FFEBEE' : '#FFF3E0',
              color: ecartPrevu === 0 ? '#2E7D32' : ecartPrevu < 0 ? '#C62828' : '#EF6C00' }}>
              {ecartPrevu === 0 ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                {ecartPrevu === 0 ? t('ecartNul') : `${ecartPrevu < 0 ? t('ecartNegatif') : t('ecartPositif')} : ${fmtXOF(Math.abs(ecartPrevu))}`}
              </span>
            </div>
          )}
          <Actions onCancel={() => setShowCloturer(false)} cancelLabel={t('annuler')} onOk={doCloturer} okLabel={t('confirmerCloture')} okColor="#C62828" />
        </Modal>
      )}

      {/* APERCU / IMPRESSION RECU */}
      {apercu && (
        <Modal onClose={() => setApercu(null)} title={t('apercuRecu')} icon={<Printer size={18}/>}>
          <div id="recu-print" style={{ border: '1px dashed #90A4AE', borderRadius: 10, padding: 20, fontFamily: 'monospace', background: '#fff' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #B0BEC5', paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1 }}>SANTAREX</div>
              <div style={{ fontSize: 11, color: '#546E7A' }}>{t('recuTitre')}</div>
            </div>
            <RecuLine label={t('recuNumero')} val={apercu.numero} />
            <RecuLine label={t('recuDate')} val={fmtDate(apercu.date)} />
            {apercu.objet && <RecuLine label={t('recuObjet')} val={apercu.objet} />}
            <RecuLine label={t('recuMode')} val={modeLabel(apercu.modePaiement)} />
            {apercu.patientId && <RecuLine label={t('recuPatient')} val={apercu.patientId} />}
            {apercu.factureRef && <RecuLine label={t('recuFacture')} val={apercu.factureRef} />}
            <div style={{ borderTop: '1px dashed #B0BEC5', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
              <span>{t('recuMontant')}</span><span>{fmtXOF(apercu.montant)}</span>
            </div>
            {apercu.emisParRef && <div style={{ fontSize: 10, color: '#90A4AE', marginTop: 10 }}>{t('recuEmisPar')}: {apercu.emisParRef}</div>}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#546E7A', marginTop: 12 }}>{t('recuMerci')}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setApercu(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t('fermer')}</button>
            <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: 'none', background: '#065F46', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <Printer size={15}/> {t('imprimer')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
      <span style={{ color: '#78909C' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: '#37474F' }}>{val}</span>
    </div>
  );
}
function RecuLine({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: '#37474F' }}>
      <span style={{ color: '#78909C' }}>{label}</span><span style={{ fontWeight: 700 }}>{val}</span>
    </div>
  );
}
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#546E7A', marginBottom: 5 }}>{label}</label>
      {children}
      {help && <div style={{ fontSize: 11, color: '#B0BEC5', marginTop: 4 }}>{help}</div>}
    </div>
  );
}
function Actions({ onCancel, cancelLabel, onOk, okLabel, okColor = '#065F46' }: { onCancel: () => void; cancelLabel: string; onOk: () => void; okLabel: string; okColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #E0E8F0', background: '#fff', color: '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{cancelLabel}</button>
      <button onClick={onOk} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: okColor, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{okLabel}</button>
    </div>
  );
}
function Modal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeUp .2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1.5px solid #EEF2F8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#065F46', fontWeight: 800, fontSize: 15 }}>{icon}{title}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#90A4AE' }}><X size={20}/></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
