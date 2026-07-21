'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Award, CheckCircle, AlertTriangle, XCircle, RefreshCw,
  Calendar, Building2, Users, Heart, Clock, Mail,
  Zap, Star, Crown, ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type LicenceInfo = {
  valide: boolean;
  message: string;
  licence?: {
    id: string; type?: string; statut?: string;
    dateDebut?: string; dateFin?: string;
    maxUtilisateurs?: number; maxPatients?: number;
    modules?: string[];
  };
};

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function joursRestants(dateFin?: string) {
  if (!dateFin) return null;
  return Math.ceil((new Date(dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  demo:         { label: 'Démo',         icon: <Zap size={16}/>,    color: '#546E7A', bg: '#ECEFF1', border: '#CFD8DC' },
  starter:      { label: 'Starter',      icon: <Star size={16}/>,   color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  professional: { label: 'Professional', icon: <Award size={16}/>,  color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  enterprise:   { label: 'Enterprise',   icon: <Crown size={16}/>,  color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD' },
};

const MODULE_LABELS: Record<string, { label: string; icon: string }> = {
  patients:       { label: 'Patients',            icon: '👤' },
  consultations:  { label: 'Consultations',        icon: '🩺' },
  facturation:    { label: 'Facturation',          icon: '🧾' },
  pharmacie:      { label: 'Pharmacie',            icon: '💊' },
  laboratoire:    { label: 'Laboratoire',          icon: '🔬' },
  hospitalisation:{ label: 'Hospitalisation',      icon: '🛏️' },
  urgences:       { label: 'Urgences',             icon: '🚨' },
  imagerie:       { label: 'Imagerie',             icon: '🩻' },
  rh:             { label: 'Ressources Humaines',  icon: '👥' },
  reporting:      { label: 'Reporting & BI',       icon: '📊' },
  ia:             { label: 'Assistant IA (SARA)',  icon: '🤖' },
};

const PLANS = [
  { key: 'starter',      label: 'Starter',      icon: <Star size={18}/>,   color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',  features: ['Jusqu\'à 5 utilisateurs','500 patients','Consultations + Facturation','Support email'] },
  { key: 'professional', label: 'Professional', icon: <Award size={18}/>,  color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD',  features: ['Jusqu\'à 20 utilisateurs','5 000 patients','Tous les modules cliniques','Pharmacie & Laboratoire','Support prioritaire'] },
  { key: 'enterprise',   label: 'Enterprise',   icon: <Crown size={18}/>,  color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD',  features: ['Utilisateurs illimités','Patients illimités','Tous les modules','Assistant IA SARA','Reporting avancé','SLA dédié 24/7'] },
] as const;

export default function LicencePage() {
  const t = useTranslations('licence');
  const [info, setInfo] = useState<LicenceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const user = getCurrentUser();
      const tenantSlug = (user as any)?.tenantSlug ?? user?.tenantId ?? 'clinique-saint-joseph';
      const data = await apiClient<LicenceInfo>(`/superadmin/licences/tenant/${tenantSlug}/verifier`);
      setInfo(data);
    } catch (e: any) {
      setError(e?.message ?? t('verifyErrorFallback'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const jours = joursRestants(info?.licence?.dateFin);
  const alerteExpiration = jours != null && jours <= 30 && jours > 0;
  const expire = jours != null && jours <= 0;
  const active = info?.valide && !expire;

  const licence = info?.licence;
  const typeKey = licence?.type ?? 'starter';
  const typeCfg = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.starter;

  /* ── Hero gradient par statut ── */
  const heroGrad = active
    ? 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#047857 100%)'
    : expire || !info?.valide
    ? 'linear-gradient(135deg,#7F1D1D 0%,#991B1B 55%,#B91C1C 100%)'
    : alerteExpiration
    ? 'linear-gradient(135deg,#78350F 0%,#92400E 55%,#B45309 100%)'
    : 'linear-gradient(135deg,#7F1D1D 0%,#991B1B 55%,#B91C1C 100%)';
  const heroShadow = active
    ? '0 8px 28px rgba(6,78,59,0.35)'
    : '0 8px 28px rgba(127,29,29,0.35)';

  return (
    <div style={{ padding: '18px', background: '#F4F6FA', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.3)} 50%{box-shadow:0 0 0 8px rgba(255,255,255,0)} }
      `}</style>

      {/* ── HERO STATUS ──────────────────────────────────── */}
      <div style={{ background: heroGrad, borderRadius: 18, padding: '26px 28px 22px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: heroShadow }}>
        <div style={{ position: 'absolute', top: -70, right: 40,  width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div style={{ position: 'absolute', bottom: -50, right: 250, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            {/* Icon + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: loading ? '' : active ? 'glow 2.5s ease infinite' : '' }}>
                {loading
                  ? <Award size={28} color="#fff"/>
                  : active ? <ShieldCheck size={28} color="#fff"/>
                  : <XCircle size={28} color="#fff"/>}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>{t('title')}</h1>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                  {loading ? t('verifying')
                    : active ? t('activeSubtitle')
                    : expire ? t('expiredSubtitle')
                    : t('noLicenseSubtitle')}
                </p>
              </div>
            </div>

            {/* Refresh + Plan badge */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {licence && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                  {typeCfg.icon} {typeCfg.label}
                </span>
              )}
              <button onClick={load} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> {t('verify')}
              </button>
            </div>
          </div>

          {/* Bottom info bar */}
          {!loading && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              {active && jours != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '5px 13px' }}>
                  <Clock size={11} color="rgba(255,255,255,0.8)"/>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{jours}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{t('daysRemaining')}</span>
                </div>
              )}
              {licence?.dateDebut && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 13px' }}>
                  <Calendar size={11} color="rgba(255,255,255,0.7)"/>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{t('since')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{fmtDate(licence.dateDebut)}</span>
                </div>
              )}
              {licence?.dateFin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: expire ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)', border: `1px solid ${expire ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: 8, padding: '5px 13px' }}>
                  <Calendar size={11} color="rgba(255,255,255,0.7)"/>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{t('expiresOn')}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{fmtDate(licence.dateFin)}</span>
                </div>
              )}
              {!info?.valide && !licence && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '5px 13px' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{t('contactActivate')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ALERTE EXPIRATION IMMINENTE ──────────────────── */}
      {alerteExpiration && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 18px', background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: 12, marginBottom: 16 }}>
          <AlertTriangle size={18} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E' }}>{t('renewalRequired', { n: jours ?? 0 })}</div>
            <div style={{ fontSize: 12, color: '#78350F', marginTop: 3 }}>{t('renewalWarning')}</div>
          </div>
          <a href="mailto:contact@ibigsoft.com" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#92400E', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Mail size={12}/> {t('renew')}
          </a>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────── */}
      {error && (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '40px 24px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <XCircle size={24} color="#991B1B"/>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2332', marginBottom: 6 }}>{t('verifyError')}</div>
          <div style={{ fontSize: 13, color: '#90A4AE', marginBottom: 18 }}>{error}</div>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: '#0F3460', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 700 }}>
            <RefreshCw size={13}/> {t('retry')}
          </button>
        </div>
      )}

      {/* ── SKELETON ─────────────────────────────────────── */}
      {loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[100, 80, 120].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#F0F4FA,#E8EEF6)', animation: 'pulse 1.5s ease infinite' }}/>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div style={{ animation: 'fadeUp .25s ease' }}>

          {/* ── DÉTAILS LICENCE ──────────────────────────── */}
          {licence && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 18 }}>
              {[
                { icon: <Calendar size={18} color="#1E40AF"/>, label: t('subStart'), value: fmtDate(licence.dateDebut),  bg: '#DBEAFE', border: '#BFDBFE' },
                { icon: <Calendar size={18} color={expire ? '#991B1B' : '#065F46'}/>, label: t('expiration'), value: fmtDate(licence.dateFin), bg: expire ? '#FEE2E2' : '#D1FAE5', border: expire ? '#FECACA' : '#A7F3D0' },
                { icon: <Users size={18} color="#5B21B6"/>, label: t('maxUsers'), value: licence.maxUtilisateurs != null ? t('accounts', { n: licence.maxUtilisateurs }) : t('unlimited'), bg: '#EDE9FE', border: '#DDD6FE' },
                { icon: <Heart size={18} color="#BE185D"/>, label: t('maxPatients'),    value: licence.maxPatients != null ? t('patientsCount', { n: licence.maxPatients }) : t('unlimited'), bg: '#FCE7F3', border: '#F9A8D4' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${item.border}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1A2332' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MODULES ──────────────────────────────────── */}
          {licence?.modules && licence.modules.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Building2 size={16} color="#1A2332"/>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A2332', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('modulesIncluded')}</h2>
                <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 20 }}>
                  {licence.modules.length} / {Object.keys(MODULE_LABELS).length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                {Object.entries(MODULE_LABELS).map(([key, { icon }]) => {
                  const included = licence.modules!.includes(key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 10, background: included ? '#F0FDF4' : '#FAFAFA', border: `1.5px solid ${included ? '#6EE7B7' : '#E0E8F0'}`, opacity: included ? 1 : 0.5 }}>
                      <span style={{ fontSize: 15 }}>{icon}</span>
                      <span style={{ fontSize: 12, color: included ? '#065F46' : '#90A4AE', fontWeight: included ? 700 : 400 }}>{t(`module.${key}`)}</span>
                      {included && <CheckCircle size={12} color="#10B981" style={{ marginLeft: 'auto', flexShrink: 0 }}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PLANS (always shown) ──────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Crown size={16} color="#1A2332"/>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A2332', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('plansAvailable')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {PLANS.map(plan => {
                const isCurrent = plan.key === typeKey && active;
                return (
                  <div key={plan.key} style={{ borderRadius: 12, border: `2px solid ${isCurrent ? plan.border : '#E0E8F0'}`, background: isCurrent ? plan.bg : '#FAFBFC', padding: '16px 18px', position: 'relative' }}>
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 800, color: plan.color, background: plan.bg, border: `1.5px solid ${plan.border}`, padding: '2px 10px', borderRadius: 20 }}>
                        {t('current')}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isCurrent ? plan.border : '#EEF2F8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.color }}>
                        {plan.icon}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 900, color: isCurrent ? plan.color : '#1A2332' }}>{plan.label}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(t.raw(`plans.${plan.key}.features`) as string[]).map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: isCurrent ? plan.color : '#546E7A', fontWeight: isCurrent ? 600 : 400 }}>
                          <CheckCircle size={11} color={isCurrent ? plan.color : '#90A4AE'}/>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CONTACT CTA ──────────────────────────────── */}
          <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#0F3460)', borderRadius: 14, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {active ? t('upgradeTitle') : t('activateTitle')}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                {active ? t('upgradeDesc') : t('activateDesc')}
              </div>
            </div>
            <a href="mailto:contact@ibigsoft.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: '#fff', color: '#0F3460', textDecoration: 'none', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
              <Mail size={14}/> {t('contactSupport')}
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
