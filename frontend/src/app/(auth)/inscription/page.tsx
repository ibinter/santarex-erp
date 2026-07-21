'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Building2, User as UserIcon, Phone, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import { saveTokens, saveUser } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODES = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'GN', 'CM', 'GA', 'CD'] as const;

export default function InscriptionPage() {
  const router = useRouter();
  const t = useTranslations('inscription');
  const [form, setForm] = useState({
    nomEtablissement: '',
    adminNom: '',
    adminPrenom: '',
    adminEmail: '',
    telephone: '',
    pays: 'CI',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.nomEtablissement ||
      !form.adminNom ||
      !form.adminPrenom ||
      !form.adminEmail ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError(t('errorRequired'));
      return;
    }
    if (!EMAIL_RE.test(form.adminEmail)) {
      setError(t('errorEmail'));
      return;
    }
    if (form.password.length < 8) {
      setError(t('errorPasswordLength'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomEtablissement: form.nomEtablissement,
          adminNom: form.adminNom,
          adminPrenom: form.adminPrenom,
          adminEmail: form.adminEmail,
          password: form.password,
          telephone: form.telephone || undefined,
          pays: form.pays || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error?.message || json?.message || t('errorSubmit');
        throw new Error(msg);
      }

      const data = json?.data !== undefined ? json.data : json;
      saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
      saveUser(data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || t('errorSubmit'));
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

        {/* Bandeau essai gratuit */}
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
          <p className="text-xs text-emerald-700 font-medium">
            {t('trialBanner')}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-card shadow-card p-8">
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
            {/* Nom établissement */}
            <div>
              <label htmlFor="nomEtablissement" className="label">
                {t('labelNomEtablissement')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="nomEtablissement"
                  name="nomEtablissement"
                  type="text"
                  value={form.nomEtablissement}
                  onChange={handleChange}
                  placeholder={t('placeholderNomEtablissement')}
                  className="input-field pl-9"
                  autoComplete="organization"
                  required
                />
              </div>
            </div>

            {/* Nom + Prénom admin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="adminNom" className="label">
                  {t('labelNom')} <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                  />
                  <input
                    id="adminNom"
                    name="adminNom"
                    type="text"
                    value={form.adminNom}
                    onChange={handleChange}
                    placeholder={t('placeholderNom')}
                    className="input-field pl-9"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="adminPrenom" className="label">
                  {t('labelPrenom')} <span className="text-danger">*</span>
                </label>
                <input
                  id="adminPrenom"
                  name="adminPrenom"
                  type="text"
                  value={form.adminPrenom}
                  onChange={handleChange}
                  placeholder={t('placeholderPrenom')}
                  className="input-field"
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="adminEmail" className="label">
                {t('labelEmail')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  value={form.adminEmail}
                  onChange={handleChange}
                  placeholder={t('placeholderEmail')}
                  className="input-field pl-9"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Téléphone + Pays */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="telephone" className="label">
                  {t('labelTelephone')}
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                  />
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={form.telephone}
                    onChange={handleChange}
                    placeholder={t('placeholderTelephone')}
                    className="input-field pl-9"
                    autoComplete="tel"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pays" className="label">
                  {t('labelPays')}
                </label>
                <div className="relative">
                  <Globe
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none z-10"
                  />
                  <select
                    id="pays"
                    name="pays"
                    value={form.pays}
                    onChange={handleChange}
                    className="input-field pl-9"
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>{t(`countries.${code}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="label">
                {t('labelPassword')} <span className="text-danger">*</span>
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
                  placeholder={t('placeholderPassword')}
                  className="input-field pl-9 pr-10"
                  autoComplete="new-password"
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

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                {t('labelConfirmPassword')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('placeholderConfirmPassword')}
                  className="input-field pl-9"
                  autoComplete="new-password"
                  required
                />
              </div>
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

            {/* Lien connexion */}
            <p className="text-center text-xs text-text-secondary mt-2">
              {t('alreadyAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('login')}
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary mt-6">
          {t('copyright', { year: String(new Date().getFullYear()) })}
        </p>
      </div>
    </div>
  );
}
