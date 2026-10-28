'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Award, CheckCircle, AlertTriangle, XCircle, RefreshCw,
  Calendar, Building2, Users, Heart, Clock, Mail,
  Zap, Star, Crown, ShieldCheck,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import {
  FORMULE_INFO, FORMULE_ORDRE, FORMULES_MODULES, MODULE_CODE_PAR_TITRE, modulesAjoutes,
  type FormuleCode,
} from '@/lib/formules';

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

/** Libellé français d'un module : titre de la page de vente, sinon le code mis en forme. */
const LABEL_MODULE: Record<string, string> = {
  patients: 'Patients',
  paiements: 'Paiements',
  ...Object.fromEntries(Object.entries(MODULE_CODE_PAR_TITRE).map(([titre, code]) => [code, titre]).reverse()),
};
function libelleModule(code: string) {
  return LABEL_MODULE[code] ?? code.charAt(0).toUpperCase() + code.slice(1).replace(/-/g, ' ');
}

/** Formule du client : code de l'offre, sinon celle dont les modules sont exactement les siens. */
function formuleDe(offre: string | null | undefined, modules: string[] | null): FormuleCode | null {
  if (offre && (FORMULE_ORDRE as string[]).includes(offre)) return offre as FormuleCode;
  if (!modules) return null;
  return FORMULE_ORDRE.find((f) => {
    const m = FORMULES_MODULES[f];
    return m.length === modules.length && m.every((x) => modules.includes(x));
  }) ?? null;
}

const COULEURS_FORMULE: Record<FormuleCode, { color: string; bg: string; border: string }> = {
  pharmacie: { color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
  cabinet:   { color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  centre:    { color: '#0E7490', bg: '#CFFAFE', border: '#67E8F9' },
  clinique:  { color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD' },
  hopital:   { color: '#9D174D', bg: '#FCE7F3', border: '#F9A8D4' },
};

export default function LicencePage() {
  const t = useTranslations('licence');
  const locale = useLocale() === 'en' ? 'en' : 'fr';
  const [info, setInfo] = useState<LicenceInfo | null>(null);
  const [etat, setEtat] = useState<{ offre: string | null; modules: string[] | null }>({ offre: null, modules: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const user = getCurrentUser();
      const tenantSlug = (user as any)?.tenantSlug ?? user?.tenantId ?? 'clinique-saint-joseph';
      const data = await apiClient<LicenceInfo>(`/superadmin/licences/tenant/${tenantSlug}/verifier`);
      setInfo(data);
      // Formule et modules réels du client (mêmes données que le menu).
      try {
        const r: any = await apiClient('/licence/etat');
        const d = r?.data ?? r;
        setEtat({ offre: d?.offre ?? null, modules: Array.isArray(d?.modules) ? d.modules : null });
      } catch { /* l'écran reste correct sans ces détails */ }
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
  const formule = formuleDe(etat.offre, etat.modules);
  // Les modules viennent de la licence (liste réelle) ; null = aucune restriction.
  const modulesClient = etat.modules ?? licence?.modules ?? null;
  const nomFormule = formule
    ? FORMULE_INFO[formule].label[locale]
    : modulesClient ? 'Sur mesure' : 'Accès complet';

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
                  <Award size={16}/> {nomFormule}
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
                  <a href="/abonnement" style={{ fontSize: 12, color: '#fff', fontWeight: 800, textDecoration: 'underline' }}>{locale === 'fr' ? 'Choisir ma formule et payer en ligne →' : 'Choose my plan and pay online →'}</a>
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
          <a href="/abonnement" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: '#92400E', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Crown size={12}/> {locale === 'fr' ? 'Renouveler maintenant' : 'Renew now'}
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
          {modulesClient && modulesClient.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', padding: '20px 24px', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Building2 size={16} color="#1A2332"/>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1A2332', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{t('modulesIncluded')}</h2>
                <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 20 }}>
                  {modulesClient.length} / {FORMULES_MODULES.hopital.length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                {FORMULES_MODULES.hopital.map((key) => {
                  const included = modulesClient.includes(key);
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', borderRadius: 10, background: included ? '#F0FDF4' : '#FAFAFA', border: `1.5px solid ${included ? '#6EE7B7' : '#E0E8F0'}`, opacity: included ? 1 : 0.5 }}>
                      <span style={{ fontSize: 12, color: included ? '#065F46' : '#90A4AE', fontWeight: included ? 700 : 400 }}>{libelleModule(key)}</span>
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
              {FORMULE_ORDRE.map((f) => {
                const plan = { ...COULEURS_FORMULE[f], ...FORMULE_INFO[f] };
                const isCurrent = f === formule && !!active;
                const ajoutes = modulesAjoutes(f);
                const debut = FORMULE_ORDRE.indexOf(f) === 0;
                return (
                  <div key={f} style={{ borderRadius: 12, border: `2px solid ${isCurrent ? plan.border : '#E0E8F0'}`, background: isCurrent ? plan.bg : '#FAFBFC', padding: '16px 18px', position: 'relative' }}>
                    {isCurrent && (
                      <div style={{ position: 'absolute', top: -10, right: 14, fontSize: 10, fontWeight: 800, color: plan.color, background: plan.bg, border: `1.5px solid ${plan.border}`, padding: '2px 10px', borderRadius: 20 }}>
                        {t('current')}
                      </div>
                    )}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isCurrent ? plan.color : '#1A2332' }}>{plan.label[locale]}</div>
                      <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>{plan.cible[locale]}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: plan.color, marginTop: 6 }}>{plan.prix} FCFA / mois</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#546E7A', marginBottom: 6, fontWeight: 600 }}>
                      {FORMULES_MODULES[f].length} modules{debut ? '' : ` — dont ${ajoutes.length} de plus que la formule précédente`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {ajoutes.slice(0, 6).map((m) => (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: isCurrent ? plan.color : '#546E7A' }}>
                          <CheckCircle size={11} color={isCurrent ? plan.color : '#90A4AE'}/>
                          {libelleModule(m)}
                        </div>
                      ))}
                      {ajoutes.length > 6 && (
                        <div style={{ fontSize: 11, color: '#90A4AE', paddingLeft: 18 }}>+ {ajoutes.length - 6} autres</div>
                      )}
                    </div>
                    {/* Bouton de paiement : mène à la page Abonnement, où l'on choisit la formule puis le moyen de paiement. */}
                    {isCurrent ? (
                      <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 800, color: plan.color }}>
                        ✓ {locale === 'fr' ? 'Votre formule actuelle' : 'Your current plan'}
                      </div>
                    ) : (
                      <a href="/abonnement"
                        style={{ marginTop: 14, display: 'block', textAlign: 'center', padding: '9px 12px', borderRadius: 9, background: plan.color, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>
                        {locale === 'fr' ? 'Choisir cette formule' : 'Choose this plan'}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CONTACT CTA ──────────────────────────────── */}
          <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#0F3460)', borderRadius: 14, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {active
                  ? (locale === 'fr' ? 'Changez de formule à tout moment' : 'Change plan at any time')
                  : (locale === 'fr' ? 'Activez votre licence en ligne' : 'Activate your license online')}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                {locale === 'fr'
                  ? 'Choisissez une formule et réglez en ligne : votre licence s’active dès que le paiement est confirmé.'
                  : 'Choose a plan and pay online: your license is activated as soon as the payment is confirmed.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Le paiement se fait sur la page Abonnement (choix de la formule puis du moyen de paiement). */}
              <a href="/abonnement"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: '#2DD4BF', color: '#073B3A', textDecoration: 'none', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                <Crown size={14}/> {active ? 'Changer de formule / payer' : 'Choisir ma formule et payer'}
              </a>
              <a href="/support"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                <Mail size={14}/> {locale === 'fr' ? 'Une question ?' : 'A question?'}
              </a>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
