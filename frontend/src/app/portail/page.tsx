'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';

/**
 * Page de connexion PUBLIQUE du portail patient (route /portail).
 * Le token patient est stocké séparément dans localStorage sous `portail_token`
 * afin de ne jamais se mélanger avec la session du personnel.
 */
export default function PortailLoginPage() {
  const router = useRouter();
  const t = useTranslations('portail');
  const [form, setForm] = useState({ tenantSlug: '', identifiant: '', motDePasse: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug || !form.identifiant || !form.motDePasse) {
      setError(t('champsRequis'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/portail-patient/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || t('identifiantsIncorrects'));
      }
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('portail_token', data.access_token);
      }
      router.push('/portail/dashboard');
    } catch (err) {
      setError((err as Error).message || t('identifiantsIncorrects'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo-tr.png"
            alt="SANTAREX"
            className="h-24 w-auto mx-auto mb-2 object-contain"
          />
          <h1 className="text-lg font-semibold text-text-primary">{t('loginTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('loginSubtitle')}</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="tenantSlug" className="label">
                {t('tenantSlug')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="tenantSlug"
                  name="tenantSlug"
                  type="text"
                  value={form.tenantSlug}
                  onChange={handleChange}
                  placeholder={t('tenantSlugPlaceholder')}
                  className="input-field pl-9"
                  autoComplete="organization"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="identifiant" className="label">
                {t('identifiant')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="identifiant"
                  name="identifiant"
                  type="text"
                  value={form.identifiant}
                  onChange={handleChange}
                  placeholder={t('identifiantPlaceholder')}
                  className="input-field pl-9"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="motDePasse" className="label">
                {t('motDePasse')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <input
                  id="motDePasse"
                  name="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  value={form.motDePasse}
                  onChange={handleChange}
                  placeholder={t('motDePassePlaceholder')}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('connexionEnCours')}
                </>
              ) : (
                t('seConnecter')
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-text-secondary mt-6">{t('brand')}</p>
      </div>
    </div>
  );
}
