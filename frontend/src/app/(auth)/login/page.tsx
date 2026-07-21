'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { saveTokens, saveUser } from '@/lib/auth';
import type { LoginResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('login');
  const [form, setForm] = useState({ email: '', password: '', tenantId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.tenantId) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(form) as any;
      saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
      saveUser(res.user);
      router.push('/dashboard');
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
              <button
                type="button"
                className="text-xs text-primary hover:underline"
              >
                {t('forgotPassword')}
              </button>
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
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary mt-6">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
}
