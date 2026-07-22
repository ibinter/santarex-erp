'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plug, KeyRound, Webhook, Server, ScrollText, BookOpen,
  Plus, RefreshCw, Trash2, Send, Copy, Check, X, ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────
type CleApi = {
  id: string; nom: string; prefixe: string; scopes: string[];
  actif: boolean; dateDernierUsage?: string; createdAt: string;
};
type WebhookT = {
  id: string; url: string; evenements: string[]; actif: boolean;
  dernierStatut?: string; dateDernierEnvoi?: string; createdAt: string;
};
type ConfigInterface = {
  id: string; type: 'hl7_labo' | 'dicom_pacs'; nom: string;
  hote?: string; port?: number; statutConnexion: string; actif: boolean;
};
type MessageInterop = {
  id: string; sens: string; protocole: string; type?: string;
  statut: string; erreur?: string; createdAt: string;
};
type Stats = Record<string, number>;

const EVENTS = ['patient.cree', 'resultat.pret', 'facture.creee', 'rendezvous.cree', 'interop.message.recu'];

const unwrap = (r: any) => Array.isArray(r) ? r : (r?.data?.data ?? r?.items ?? r?.data ?? []);

export default function InteroperabilitePage() {
  const t = useTranslations('interoperabilite');
  const [tab, setTab] = useState<'cles'|'webhooks'|'interfaces'|'messages'|'docs'>('cles');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({});
  const [cles, setCles] = useState<CleApi[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookT[]>([]);
  const [configs, setConfigs] = useState<ConfigInterface[]>([]);
  const [messages, setMessages] = useState<MessageInterop[]>([]);

  // Reveal-once secrets
  const [revealed, setRevealed] = useState<{ label: string; value: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, k, w, c, m] = await Promise.all([
        apiClient<any>('/interoperabilite/stats').catch(() => ({})),
        apiClient<any>('/interoperabilite/cles').catch(() => []),
        apiClient<any>('/interoperabilite/webhooks').catch(() => []),
        apiClient<any>('/interoperabilite/interfaces').catch(() => []),
        apiClient<any>('/interoperabilite/messages?limit=50').catch(() => ({ data: [] })),
      ]);
      setStats(s?.data ?? s ?? {});
      setCles(unwrap(k)); setWebhooks(unwrap(w)); setConfigs(unwrap(c)); setMessages(unwrap(m));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Clés API ──────────────────────────────────────────────────────────────
  const [newCle, setNewCle] = useState({ nom: '', scopes: '' });
  const creerCle = async () => {
    if (!newCle.nom.trim()) return;
    const scopes = newCle.scopes.split(',').map(s => s.trim()).filter(Boolean);
    const res = await apiClient<any>('/interoperabilite/cles', {
      method: 'POST', body: { nom: newCle.nom, scopes },
    });
    const clair = res?.data?.cleEnClair ?? res?.cleEnClair;
    if (clair) setRevealed({ label: t('cles.createdTitle'), value: clair });
    setNewCle({ nom: '', scopes: '' });
    load();
  };
  const revoquerCle = async (id: string) => {
    await apiClient(`/interoperabilite/cles/${id}/revoquer`, { method: 'PATCH' });
    load();
  };

  // ── Webhooks ──────────────────────────────────────────────────────────────
  const [newWh, setNewWh] = useState<{ url: string; evenements: string[] }>({ url: '', evenements: [] });
  const creerWebhook = async () => {
    if (!newWh.url.trim() || newWh.evenements.length === 0) return;
    const res = await apiClient<any>('/interoperabilite/webhooks', {
      method: 'POST', body: newWh,
    });
    const secret = res?.data?.secret ?? res?.secret;
    if (secret) setRevealed({ label: t('webhooks.secretTitle'), value: secret });
    setNewWh({ url: '', evenements: [] });
    load();
  };
  const testerWebhook = async (id: string) => {
    const res = await apiClient<any>(`/interoperabilite/webhooks/${id}/test`, { method: 'POST' });
    const statut = res?.data?.statut ?? res?.statut ?? '?';
    alert(t('webhooks.testSent', { statut }));
    load();
  };
  const supprimerWebhook = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await apiClient(`/interoperabilite/webhooks/${id}`, { method: 'DELETE' });
    load();
  };

  // ── Interfaces ────────────────────────────────────────────────────────────
  const [newCfg, setNewCfg] = useState<{ type: 'hl7_labo'|'dicom_pacs'; nom: string; hote: string; port: string }>(
    { type: 'hl7_labo', nom: '', hote: '', port: '' });
  const creerConfig = async () => {
    if (!newCfg.nom.trim()) return;
    await apiClient('/interoperabilite/interfaces', {
      method: 'POST',
      body: {
        type: newCfg.type, nom: newCfg.nom,
        hote: newCfg.hote || undefined,
        port: newCfg.port ? +newCfg.port : undefined,
      },
    });
    setNewCfg({ type: 'hl7_labo', nom: '', hote: '', port: '' });
    load();
  };
  const testerConnexion = async (id: string) => {
    await apiClient(`/interoperabilite/interfaces/${id}/tester`, { method: 'POST' });
    load();
  };
  const supprimerConfig = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await apiClient(`/interoperabilite/interfaces/${id}`, { method: 'DELETE' });
    load();
  };

  const copyReveal = () => {
    if (!revealed) return;
    navigator.clipboard?.writeText(revealed.value);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const TABS = [
    { k: 'cles' as const, label: t('tabs.cles'), icon: <KeyRound size={15} /> },
    { k: 'webhooks' as const, label: t('tabs.webhooks'), icon: <Webhook size={15} /> },
    { k: 'interfaces' as const, label: t('tabs.interfaces'), icon: <Server size={15} /> },
    { k: 'messages' as const, label: t('tabs.messages'), icon: <ScrollText size={15} /> },
    { k: 'docs' as const, label: t('tabs.docs'), icon: <BookOpen size={15} /> },
  ];

  const statCards = [
    { label: t('stats.clesActives'), val: stats.clesActives ?? 0 },
    { label: t('stats.webhooks'), val: stats.webhooks ?? 0 },
    { label: t('stats.configs'), val: stats.configs ?? 0 },
    { label: t('stats.messages'), val: stats.messages ?? 0 },
    { label: t('stats.messagesErreur'), val: stats.messagesErreur ?? 0 },
  ];

  const input: React.CSSProperties = { padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E0E8F0', fontSize: 13, outline: 'none', color: '#1A2332', background: '#fff' };
  const btnPrimary: React.CSSProperties = { padding: '9px 16px', borderRadius: 9, border: 'none', background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
  const card: React.CSSProperties = { background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', padding: 18 };
  const pill = (bg: string, color: string): React.CSSProperties => ({ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: bg, color });

  return (
    <div style={{ padding: 18, background: '#F4F6FA', minHeight: '100vh' }}>
      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#1E1B4B 0%,#3730A3 50%,#4F46E5 100%)', borderRadius: 18, padding: '22px 26px', marginBottom: 16, boxShadow: '0 8px 28px rgba(55,48,163,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plug size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff' }}>{t('title')}</h1>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{t('subtitle')}</div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {t('refresh')}
          </button>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginTop: 16 }}>
          {statCards.map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{loading ? '…' : k.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(x => (
          <button key={x.k} onClick={() => setTab(x.k)}
            style={{ padding: '9px 15px', borderRadius: 10, border: `1.5px solid ${tab === x.k ? '#4F46E5' : '#E0E8F0'}`, background: tab === x.k ? '#4F46E5' : '#fff', color: tab === x.k ? '#fff' : '#546E7A', fontSize: 12.5, fontWeight: tab === x.k ? 800 : 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            {x.icon}{x.label}
          </button>
        ))}
      </div>

      {/* ── CLÉS API ── */}
      {tab === 'cles' && (
        <div style={card}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('cles.name')}</label>
              <input style={input} value={newCle.nom} onChange={e => setNewCle({ ...newCle, nom: e.target.value })} placeholder={t('cles.namePlaceholder')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 220 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('cles.scopes')}</label>
              <input style={input} value={newCle.scopes} onChange={e => setNewCle({ ...newCle, scopes: e.target.value })} placeholder={t('cles.scopesHint')} />
            </div>
            <button style={btnPrimary} onClick={creerCle}><Plus size={15} />{t('cles.new')}</button>
          </div>
          {cles.length === 0 ? <Empty text={t('cles.empty')} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead><tr style={{ background: '#F0EEFF' }}>
                  {[t('cles.name'), t('cles.prefix'), t('cles.scopes'), t('cles.lastUsed'), t('cles.status'), ''].map((h, i) => <Th key={i}>{h}</Th>)}
                </tr></thead>
                <tbody>{cles.map(k => (
                  <tr key={k.id} style={{ borderTop: '1px solid #F0F2F7' }}>
                    <Td><b>{k.nom}</b></Td>
                    <Td><code style={{ fontFamily: 'monospace', fontSize: 11, background: '#EDE9FE', padding: '2px 6px', borderRadius: 5, color: '#4F46E5' }}>{k.prefixe}…</code></Td>
                    <Td style={{ fontSize: 11, color: '#64748B' }}>{(k.scopes || []).join(', ') || '—'}</Td>
                    <Td style={{ fontSize: 11, color: '#64748B' }}>{k.dateDernierUsage ? new Date(k.dateDernierUsage).toLocaleDateString() : t('cles.never')}</Td>
                    <Td>{k.actif ? <span style={pill('#DCFCE7', '#15803D')}>{t('active')}</span> : <span style={pill('#FEE2E2', '#DC2626')}>{t('cles.revoked')}</span>}</Td>
                    <Td>{k.actif && <button onClick={() => revoquerCle(k.id)} style={{ ...pill('#FEE2E2', '#DC2626'), border: 'none', cursor: 'pointer' }}>{t('cles.revoke')}</button>}</Td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── WEBHOOKS ── */}
      {tab === 'webhooks' && (
        <div style={card}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 240 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('webhooks.url')}</label>
              <input style={input} value={newWh.url} onChange={e => setNewWh({ ...newWh, url: e.target.value })} placeholder={t('webhooks.urlPlaceholder')} />
            </div>
            <button style={btnPrimary} onClick={creerWebhook}><Plus size={15} />{t('webhooks.new')}</button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {EVENTS.map(ev => {
              const on = newWh.evenements.includes(ev);
              return <button key={ev} onClick={() => setNewWh({ ...newWh, evenements: on ? newWh.evenements.filter(x => x !== ev) : [...newWh.evenements, ev] })}
                style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${on ? '#4F46E5' : '#E0E8F0'}`, background: on ? '#EDE9FE' : '#fff', color: on ? '#4F46E5' : '#546E7A', fontSize: 11, fontWeight: on ? 800 : 500, cursor: 'pointer' }}>
                {t(`webhooks.evt.${ev}` as any)}
              </button>;
            })}
          </div>
          {webhooks.length === 0 ? <Empty text={t('webhooks.empty')} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead><tr style={{ background: '#F0EEFF' }}>
                  {[t('webhooks.url'), t('webhooks.events'), t('webhooks.lastStatus'), t('cles.status'), ''].map((h, i) => <Th key={i}>{h}</Th>)}
                </tr></thead>
                <tbody>{webhooks.map(w => (
                  <tr key={w.id} style={{ borderTop: '1px solid #F0F2F7' }}>
                    <Td style={{ fontSize: 11, fontFamily: 'monospace', color: '#4F46E5', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</Td>
                    <Td style={{ fontSize: 10, color: '#64748B' }}>{(w.evenements || []).length}</Td>
                    <Td style={{ fontSize: 11 }}>{w.dernierStatut || '—'}</Td>
                    <Td>{w.actif ? <span style={pill('#DCFCE7', '#15803D')}>{t('active')}</span> : <span style={pill('#F1F5F9', '#64748B')}>{t('inactive')}</span>}</Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => testerWebhook(w.id)} title={t('test')} style={iconBtn}><Send size={13} /></button>
                        <button onClick={() => supprimerWebhook(w.id)} title={t('delete')} style={{ ...iconBtn, color: '#DC2626' }}><Trash2 size={13} /></button>
                      </div>
                    </Td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── INTERFACES ── */}
      {tab === 'interfaces' && (
        <div style={card}>
          <div style={{ fontSize: 11, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '8px 12px', marginBottom: 14 }}>{t('interfaces.siteNote')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('interfaces.type')}</label>
              <select style={input as any} value={newCfg.type} onChange={e => setNewCfg({ ...newCfg, type: e.target.value as any })}>
                <option value="hl7_labo">{t('interfaces.typeHl7')}</option>
                <option value="dicom_pacs">{t('interfaces.typeDicom')}</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('interfaces.name')}</label>
              <input style={input} value={newCfg.nom} onChange={e => setNewCfg({ ...newCfg, nom: e.target.value })} placeholder={t('interfaces.namePlaceholder')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('interfaces.host')}</label>
              <input style={{ ...input, width: 130 }} value={newCfg.hote} onChange={e => setNewCfg({ ...newCfg, hote: e.target.value })} placeholder="192.168.1.50" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>{t('interfaces.port')}</label>
              <input style={{ ...input, width: 80 }} value={newCfg.port} onChange={e => setNewCfg({ ...newCfg, port: e.target.value })} placeholder="104" />
            </div>
            <button style={btnPrimary} onClick={creerConfig}><Plus size={15} />{t('interfaces.new')}</button>
          </div>
          {configs.length === 0 ? <Empty text={t('interfaces.empty')} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead><tr style={{ background: '#F0EEFF' }}>
                  {[t('interfaces.type'), t('interfaces.name'), t('interfaces.host'), t('interfaces.port'), t('interfaces.connection'), ''].map((h, i) => <Th key={i}>{h}</Th>)}
                </tr></thead>
                <tbody>{configs.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid #F0F2F7' }}>
                    <Td><span style={pill('#EDE9FE', '#4F46E5')}>{c.type === 'hl7_labo' ? 'HL7' : 'DICOM'}</span></Td>
                    <Td><b>{c.nom}</b></Td>
                    <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.hote || '—'}</Td>
                    <Td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.port || '—'}</Td>
                    <Td><span style={pill(c.statutConnexion === 'connecte' ? '#DCFCE7' : '#F1F5F9', c.statutConnexion === 'connecte' ? '#15803D' : '#64748B')}>{t(`interfaces.statut.${c.statutConnexion}` as any)}</span></Td>
                    <Td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => testerConnexion(c.id)} title={t('interfaces.testConnection')} style={iconBtn}><RefreshCw size={13} /></button>
                        <button onClick={() => supprimerConfig(c.id)} title={t('delete')} style={{ ...iconBtn, color: '#DC2626' }}><Trash2 size={13} /></button>
                      </div>
                    </Td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MESSAGES ── */}
      {tab === 'messages' && (
        <div style={card}>
          {messages.length === 0 ? <Empty text={t('messages.empty')} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead><tr style={{ background: '#F0EEFF' }}>
                  {[t('messages.direction'), t('messages.protocol'), t('messages.type'), t('messages.status'), t('messages.date'), t('messages.error')].map((h, i) => <Th key={i}>{h}</Th>)}
                </tr></thead>
                <tbody>{messages.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid #F0F2F7' }}>
                    <Td>{t(`messages.sens.${m.sens}` as any)}</Td>
                    <Td><span style={pill('#EDE9FE', '#4F46E5')}>{m.protocole.toUpperCase()}</span></Td>
                    <Td style={{ fontSize: 11 }}>{m.type || '—'}</Td>
                    <Td><span style={pill(m.statut === 'traite' ? '#DCFCE7' : m.statut === 'erreur' ? '#FEE2E2' : '#F1F5F9', m.statut === 'traite' ? '#15803D' : m.statut === 'erreur' ? '#DC2626' : '#64748B')}>{t(`messages.statut.${m.statut}` as any)}</span></Td>
                    <Td style={{ fontSize: 11, color: '#64748B' }}>{new Date(m.createdAt).toLocaleString()}</Td>
                    <Td style={{ fontSize: 11, color: '#DC2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.erreur || '—'}</Td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DOCS ── */}
      {tab === 'docs' && (
        <div style={card}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} color="#4F46E5" />{t('docs.title')}</h2>
          <p style={{ fontSize: 13, color: '#546E7A', marginTop: 0 }}>{t('docs.intro')}</p>
          <div style={{ background: '#0F172A', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6, fontWeight: 700 }}>{t('docs.header')}</div>
            <code style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#A5B4FC' }}>X-API-Key: sx_live_xxxxxxxx…</code>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#546E7A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>{t('docs.endpoints')}</div>
          {[
            { m: 'GET', p: '/api-public/patients', d: t('docs.listPatients') },
            { m: 'GET', p: '/api-public/patients/:id', d: t('docs.getPatient') },
            { m: 'POST', p: '/interop/hl7/resultats', d: t('docs.ingestHl7') },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1px solid #EEF2F7', marginBottom: 8 }}>
              <span style={pill(e.m === 'GET' ? '#DBEAFE' : '#DCFCE7', e.m === 'GET' ? '#1D4ED8' : '#15803D')}>{e.m}</span>
              <code style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#1A2332', fontWeight: 700 }}>{e.p}</code>
              <span style={{ fontSize: 11.5, color: '#64748B' }}>{e.d}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '9px 12px', marginTop: 10 }}>{t('docs.webhookNote')}</div>
        </div>
      )}

      {/* Reveal-once modal */}
      {revealed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={() => setRevealed(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1A2332' }}>{revealed.label}</h3>
              <button onClick={() => setRevealed(null)} style={{ ...iconBtn, border: 'none' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '9px 12px', marginBottom: 12 }}>
              {revealed.label === t('cles.createdTitle') ? t('cles.createdWarning') : t('webhooks.secretWarning')}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 12.5, background: '#0F172A', color: '#A5B4FC', padding: '11px 14px', borderRadius: 9, wordBreak: 'break-all' }}>{revealed.value}</code>
              <button style={btnPrimary} onClick={copyReveal}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('cles.copied') : t('cles.copy')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = { padding: 7, borderRadius: 8, border: '1px solid #E0E8F0', background: '#fff', cursor: 'pointer', color: '#546E7A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1A2332', ...style }}>{children}</td>;
}
function Empty({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: '#90A4AE' }}>
    <Plug size={34} style={{ display: 'block', margin: '0 auto 12px', color: '#DDD6FE' }} />
    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{text}</p>
  </div>;
}
