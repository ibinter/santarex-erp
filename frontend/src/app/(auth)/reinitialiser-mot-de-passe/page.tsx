'use client';

import { Suspense, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';

function ResetPasswordForm() {
  const t = useTranslations('resetMotDePasse');
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';
  const linkValid = Boolean(uid && token);

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.password || !form.confirmPassword) {
      setError(t('errorAllFields'));
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
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, password: form.password }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg =
          json?.error?.message ||
          json?.message ||
          t('errorInvalidLink');
        throw new Error(msg);
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error).message || t('errorInvalidLink'));
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

        {/* Carte */}
        <div className="bg-white rounded-card shadow-card p-8">
          {!linkValid ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle size={48} className="text-danger" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {t('invalidTitle')}
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {t('invalidText')}
              </p>
              <Link
                href="/mot-de-passe-oublie"
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {t('requestNewLink')}
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {t('successTitle')}
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {t('successText')}
              </p>
              <Link
                href="/login"
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                {t('goToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                {t('heading')}
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {t('intro')}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <span className="text-danger text-xs font-medium mt-0.5">⚠</span>
                  <p className="text-xs text-danger">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {/* Nouveau mot de passe */}
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

                {/* Confirmation */}
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

                {/* Lien retour */}
                <p className="text-center text-xs text-text-secondary mt-2">
                  <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft size={12} />
                    {t('backToLogin')}
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary mt-6">
          {t('copyright', { year: String(new Date().getFullYear()) })}
        </p>
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
