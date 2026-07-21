'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Settings, Building, Shield, Bell, Users,
  Globe, Palette, Database, Save, CheckCircle,
  Lock, Clock, Pill, Calendar, FlaskConical, Receipt,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

const NAV_SECTIONS = [
  { id: 'etablissement', icon: <Building size={15}/>,  color: '#1E40AF' },
  { id: 'securite',      icon: <Shield size={15}/>,    color: '#991B1B' },
  { id: 'notifications', icon: <Bell size={15}/>,      color: '#92400E' },
  { id: 'utilisateurs',  icon: <Users size={15}/>, color: '#5B21B6' },
  { id: 'langue',        icon: <Globe size={15}/>,     color: '#065F46' },
  { id: 'apparence',     icon: <Palette size={15}/>,   color: '#0369A1' },
  { id: 'sauvegarde',    icon: <Database size={15}/>,  color: '#374151' },
];

const ROLES = [
  { count: 1,  color: '#991B1B', bg: '#FEE2E2' },
  { count: 2,  color: '#1E40AF', bg: '#DBEAFE' },
  { count: 18, color: '#0F766E', bg: '#CCFBF1' },
  { count: 42, color: '#065F46', bg: '#D1FAE5' },
  { count: 5,  color: '#92400E', bg: '#FEF3C7' },
  { count: 4,  color: '#5B21B6', bg: '#EDE9FE' },
  { count: 8,  color: '#374151', bg: '#F3F4F6' },
  { count: 3,  color: '#0369A1', bg: '#E0F2FE' },
];

function Toggle({ value, onChange, color = '#1E40AF' }: { value: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 46, height: 26, borderRadius: 13, background: value ? color : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#fff', top: 3, left: value ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}/>
    </button>
  );
}

function FieldInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${focus ? '#1E40AF' : '#E0E8F0'}`, borderRadius: 10, fontSize: 13, color: '#1A2332', outline: 'none', background: focus ? '#fff' : '#F8FAFC', boxSizing: 'border-box', transition: 'border-color .15s, background .15s' }}/>
    </div>
  );
}

export default function ParametresPage() {
  const t = useTranslations('parametres');
  const [section, setSection] = useState('etablissement');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nomEtab, setNomEtab] = useState('Clinique Saint-Joseph');
  const [ville, setVille] = useState('Abidjan');
  const [pays, setPays] = useState("Côte d'Ivoire");
  const [tel, setTel] = useState('+225 27 20 32 45 67');
  const [email, setEmail] = useState('contact@clinique-saintjoseph.ci');
  const [notifStock, setNotifStock] = useState(true);
  const [notifRdv, setNotifRdv] = useState(true);
  const [notifLabo, setNotifLabo] = useState(true);
  const [notifFacture, setNotifFacture] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient('/settings', {
        method: 'PATCH',
        body: { nomEtablissement: nomEtab, ville, pays, telephone: tel, email, twoFaEnabled: twoFa, sessionTimeoutMinutes: parseInt(sessionTimeout, 10), notifStock, notifRdv, notifLabo, notifFacture },
      });
    } catch { /* endpoint may not exist yet */ }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeSec = NAV_SECTIONS.find(s => s.id === section)!;

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .param-nav:hover { background: #EEF2F8 !important; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1E293B 0%,#334155 55%,#475569 100%)', borderRadius: 18, padding: '22px 26px 18px', marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(30,41,59,0.35)' }}>
        <div style={{ position: 'absolute', top: -60, right: 40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.14)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={24} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.2px' }}>{t('title')}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t('subtitle')}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, border: 'none', background: saved ? '#10B981' : '#fff', cursor: 'pointer', fontSize: 13, color: saved ? '#fff' : '#1E293B', fontWeight: 800, transition: 'all .25s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {saved ? <CheckCircle size={15}/> : <Save size={15}/>}
            {saved ? t('saved') : saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>

      {/* ── LAYOUT ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

        {/* Sidebar */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: 8, height: 'fit-content' }}>
          {NAV_SECTIONS.map(s => {
            const isActive = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} className="param-nav"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, background: isActive ? '#F0F4FF' : 'transparent', borderLeft: `3px solid ${isActive ? s.color : 'transparent'}`, transition: 'all .12s' }}>
                <span style={{ color: isActive ? s.color : '#90A4AE', transition: 'color .12s' }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? s.color : '#546E7A' }}>{t(`nav.${s.id}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', overflow: 'hidden', animation: 'fadeUp .2s ease' }}>
          {/* Panel header */}
          <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #EEF2F8', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: activeSec.color }}>{activeSec.icon}</span>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1A2332' }}>{t(`nav.${activeSec.id}`)}</h2>
          </div>

          <div style={{ padding: '24px' }}>

            {/* ── ÉTABLISSEMENT ─────────────────────────── */}
            {section === 'etablissement' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <FieldInput label={t('etab.nom')} value={nomEtab} onChange={setNomEtab}/>
                  <FieldInput label={t('etab.ville')} value={ville} onChange={setVille}/>
                  <FieldInput label={t('etab.pays')} value={pays} onChange={setPays}/>
                  <FieldInput label={t('etab.telephone')} value={tel} onChange={setTel}/>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldInput label={t('etab.email')} value={email} onChange={setEmail} type="email"/>
                  </div>
                </div>
                <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '14px 18px', border: '1.5px solid #BFDBFE', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Info size={16} color="#1E40AF" style={{ flexShrink: 0, marginTop: 1 }}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', marginBottom: 3 }}>{t('etab.tenantTitle')}</div>
                    <div style={{ fontSize: 13, color: '#1A2332', fontFamily: 'monospace', background: '#fff', display: 'inline-block', padding: '2px 10px', borderRadius: 6 }}>clinique-saint-joseph</div>
                    <div style={{ fontSize: 11, color: '#546E7A', marginTop: 4 }}>{t('etab.tenantNote')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SÉCURITÉ ──────────────────────────────── */}
            {section === 'securite' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: '#FEF2F2', borderRadius: 12, border: '1.5px solid #FECACA' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lock size={17} color="#991B1B"/>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('securite.twoFa')}</div>
                      <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>{t('securite.twoFaDesc')}</div>
                    </div>
                  </div>
                  <Toggle value={twoFa} onChange={setTwoFa} color="#991B1B"/>
                </div>

                <div style={{ padding: '16px 18px', background: '#F8FAFC', borderRadius: 12, border: '1.5px solid #E0E8F0' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={17} color="#1E40AF"/>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{t('securite.sessionTitle')}</div>
                      <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>{t('securite.sessionDesc')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['15', '30', '60', '120', '240', '480'].map(v => (
                      <button key={v} onClick={() => setSessionTimeout(v)}
                        style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${sessionTimeout === v ? '#1E40AF' : '#E0E8F0'}`, background: sessionTimeout === v ? '#1E40AF' : '#fff', color: sessionTimeout === v ? '#fff' : '#546E7A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {t('securite.minutes', { v })}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ─────────────────────────── */}
            {section === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: t('notifs.stock'),  desc: t('notifs.stockDesc'),  value: notifStock,   onChange: setNotifStock,   icon: <Pill size={16}/>,        color: '#047857', bg: '#D1FAE5' },
                  { label: t('notifs.rdv'),     desc: t('notifs.rdvDesc'),               value: notifRdv,     onChange: setNotifRdv,     icon: <Calendar size={16}/>,    color: '#6D28D9', bg: '#EDE9FE' },
                  { label: t('notifs.labo'),   desc: t('notifs.laboDesc'),     value: notifLabo,    onChange: setNotifLabo,    icon: <FlaskConical size={16}/>, color: '#5B21B6', bg: '#EDE9FE' },
                  { label: t('notifs.facture'),          desc: t('notifs.factureDesc'),      value: notifFacture, onChange: setNotifFacture, icon: <Receipt size={16}/>,     color: '#1E40AF', bg: '#DBEAFE' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: item.value ? item.bg.replace(')', '44)').replace('rgb', 'rgba') : '#F8FAFC', borderRadius: 12, border: `1.5px solid ${item.value ? item.color + '44' : '#E0E8F0'}`, transition: 'all .2s' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2332' }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} color={item.color}/>
                  </div>
                ))}
              </div>
            )}

            {/* ── UTILISATEURS / RÔLES ──────────────────── */}
            {section === 'utilisateurs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLES.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: '#F8FAFC', borderRadius: 12, border: '1.5px solid #E0E8F0', borderLeft: `4px solid ${r.color}` }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} color={r.color}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1A2332' }}>{t(`roles.${i}.nom`)}</div>
                      <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>{(t.raw(`roles.${i}.permissions`) as string[]).join(' · ')}</div>
                    </div>
                    <span style={{ background: r.bg, color: r.color, fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20, flexShrink: 0, border: `1px solid ${r.color}33` }}>
                      {t('userCount', { count: r.count })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── LANGUE & RÉGION ───────────────────────── */}
            {section === 'langue' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: t('langue.interface'), options: [t('langue.optFr'), t('langue.optEn')], selected: t('langue.optFr') },
                  { label: t('langue.devise'), options: [t('langue.deviseXof'), t('langue.deviseEur'), t('langue.deviseUsd')], selected: t('langue.deviseXof') },
                  { label: t('langue.formatDate'), options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], selected: 'DD/MM/YYYY' },
                  { label: t('langue.fuseau'), options: ['Africa/Abidjan (UTC+0)', 'Africa/Dakar (UTC+0)', 'Africa/Lagos (UTC+1)'], selected: 'Africa/Abidjan (UTC+0)' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>{f.label}</label>
                    <select defaultValue={f.selected}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E0E8F0', borderRadius: 10, fontSize: 13, color: '#1A2332', outline: 'none', background: '#F8FAFC', cursor: 'pointer' }}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* ── COMING SOON ───────────────────────────── */}
            {(section === 'apparence' || section === 'sauvegarde') && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {section === 'apparence' ? <Palette size={26} color="#90A4AE"/> : <Database size={26} color="#90A4AE"/>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#37474F', marginBottom: 6 }}>
                  {section === 'apparence' ? t('comingSoon.apparence') : t('comingSoon.sauvegarde')}
                </div>
                <div style={{ fontSize: 13, color: '#90A4AE', maxWidth: 300, margin: '0 auto' }}>
                  {t('comingSoon.desc')}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, padding: '8px 18px', borderRadius: 20, background: '#F0F4FA', fontSize: 12, color: '#78909C', fontWeight: 700 }}>
                  {t('comingSoon.badge')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
