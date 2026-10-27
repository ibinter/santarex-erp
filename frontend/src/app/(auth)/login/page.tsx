'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { saveTokens, saveUser } from '@/lib/auth';
import type { LoginResponse } from '@/types';

// Démos publiques (sous-domaine demo.*) : une par formule, 100 % fictives, remises à zéro chaque nuit.
const DEMOS = [
  { code: 'pharmacie', label: 'Pharmacie', prix: '12 000', tenantId: 'demo-pharmacie', email: 'admin@demo-pharmacie.santarex.ci', password: 'Demo2025!' },
  { code: 'cabinet', label: 'Cabinet', prix: '18 000', tenantId: 'demo-cabinet', email: 'admin@demo-cabinet.santarex.ci', password: 'Demo2025!' },
  { code: 'centre', label: 'Centre de santé', prix: '35 000', tenantId: 'demo-centre', email: 'admin@demo-centre.santarex.ci', password: 'Demo2025!' },
  { code: 'clinique', label: 'Clinique', prix: '75 000', tenantId: 'demo-clinique', email: 'admin@demo-clinique.santarex.ci', password: 'Demo2025!' },
  { code: 'hopital', label: 'Hôpital', prix: '150 000', tenantId: 'clinique-saint-joseph', email: 'admin@clinique-saint-joseph.ci', password: 'Admin2025!' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const [form, setForm] = useState({ email: '', password: '', tenantId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Double authentification : jeton de verification et code saisi a la seconde etape.
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code2fa, setCode2fa] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  // Démo publique (sous-domaine demo.*) : comptes 100 % fictifs, base remise à zéro chaque nuit.
  const [isDemoHost, setIsDemoHost] = useState(false);
  useEffect(() => { setIsDemoHost(window.location.hostname.startsWith('demo.')); }, []);

  const handleDemo = (code: string) => {
    const d = DEMOS.find((x) => x.code === code);
    if (d) void doLogin({ email: d.email, password: d.password, tenantId: d.tenantId });
  };

  // Lien depuis la page de vente (/login?formule=cabinet) : connexion directe à la démo choisie.
  useEffect(() => {
    if (!isDemoHost) return;
    const f = new URLSearchParams(window.location.search).get('formule');
    if (f && DEMOS.some((x) => x.code === f)) handleDemo(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoHost]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.tenantId) {
      setError(t('fillAllFields'));
      return;
    }
    await doLogin(form);
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!challenge || !code2fa.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.verify2fa({ challengeToken: challenge, code: code2fa.trim() }) as any;
      saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
      saveUser(res.user);
      router.push(res.twoFactorSetupRequired ? '/profil?2fa=1' : res.user?.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const doLogin = async (creds: typeof form) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(creds) as any;
      if (res.requires2fa) {
        setChallenge(res.challengeToken);
        setCode2fa('');
        return;
      }
      saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
      saveUser(res.user);
      router.push(res.twoFactorSetupRequired ? '/profil?2fa=1' : res.user?.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & titre */}
        <div className="text-center mb-8">
          <img
            src="/logo-tr.png"
            alt="SANTAREX ERP"
            className="h-28 w-auto mx-auto mb-2 object-contain"
          />
          <p className="text-sm text-text-secondary mt-1 font-medium">
            {t('tagline')}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('brand')}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-card shadow-card p-8">
          {challenge ? (
            <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
              <h2 className="text-lg font-semibold text-text-primary">Vérification en deux étapes</h2>
              <p className="text-sm text-text-secondary">
                Saisissez le code à 6 chiffres affiché par votre application d’authentification
                (Google Authenticator, Microsoft Authenticator, Authy…).
              </p>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-danger">⚠ {error}</p>
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code2fa}
                onChange={(e) => setCode2fa(e.target.value)}
                placeholder="Code à 6 chiffres"
                maxLength={16}
                className="input-field text-center text-xl tracking-widest"
              />
              <button type="submit" disabled={loading || !code2fa.trim()} className="btn-primary w-full py-2.5">
                {loading ? '…' : 'Valider'}
              </button>
              <p className="text-xs text-text-secondary">
                Téléphone perdu ? Saisissez à la place un <strong>code de secours</strong> (ex. ABCDE-12345).
                Sans code de secours, demandez à un administrateur de votre établissement de réinitialiser votre accès.
              </p>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => { setChallenge(null); setCode2fa(''); setError(null); }}
              >
                ← Retour
              </button>
            </form>
          ) : (
          <>
          {isDemoHost && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-text-primary mb-1">Essayez la formule de votre choix</p>
              <p className="text-xs text-text-secondary mb-3">
                Chaque démo contient uniquement les modules de sa formule. Sans inscription.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {DEMOS.map((d) => (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => handleDemo(d.code)}
                    disabled={loading}
                    className="w-full flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 disabled:opacity-60"
                  >
                    <span className="font-semibold text-primary">Démo {d.label}</span>
                    <span className="text-xs text-text-secondary">{d.prix} FCFA / mois</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            {t('heading')}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-danger text-xs font-medium mt-0.5">⚠</span>
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Identifiant établissement */}
            <div>
              <label htmlFor="tenantId" className="label">
                {t('tenantId')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="tenantId"
                  name="tenantId"
                  type="text"
                  value={form.tenantId}
                  onChange={handleChange}
                  placeholder={t('tenantIdPlaceholder')}
                  className="input-field pl-9"
                  autoComplete="organization"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                {t('email')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('emailPlaceholder')}
                  className="input-field pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="label">
                {t('password')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t('passwordPlaceholder')}
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={showPassword ? t('hide') : t('show')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Lien mot de passe oublié */}
            <div className="text-right -mt-2">
              <Link
                href="/mot-de-passe-oublie"
                className="text-xs text-primary hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loadingButton')}
                </>
              ) : (
                t('submit')
              )}
            </button>

            {/* Lien inscription */}
            <p className="text-center text-xs text-text-secondary mt-2">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="text-primary hover:underline font-medium">
                Créer un établissement
              </Link>
            </p>
          </form>
          </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary mt-6">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
}
