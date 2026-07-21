'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Building2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MotDePasseOubliePage() {
  const [form, setForm] = useState({ email: '', tenantId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.email) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    if (!EMAIL_RE.test(form.email)) {
      setError('Adresse email invalide.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          tenantId: form.tenantId || undefined,
        }),
      });
      // Réponse générique quel que soit le résultat (anti-énumération)
      setSuccess(true);
    } catch {
      // Même en cas d'erreur réseau, on affiche le message générique
      setSuccess(true);
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
            Réinitialisation du mot de passe
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            SANTAREX ERP · IBIG Softwares
          </p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-card shadow-card p-8">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Vérifiez votre boîte mail
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Si un compte existe pour cette adresse, vous recevrez un email
                contenant les instructions pour réinitialiser votre mot de passe.
              </p>
              <Link
                href="/login"
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Mot de passe oublié ?
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                Saisissez votre adresse email et nous vous enverrons un lien pour
                réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <span className="text-danger text-xs font-medium mt-0.5">⚠</span>
                  <p className="text-xs text-danger">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">
                    Email <span className="text-danger">*</span>
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
                      placeholder="vous@etablissement.ci"
                      className="input-field pl-9"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {/* Identifiant établissement (optionnel) */}
                <div>
                  <label htmlFor="tenantId" className="label">
                    Identifiant établissement <span className="text-text-secondary">(optionnel)</span>
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
                      placeholder="clinique-les-palmiers"
                      className="input-field pl-9"
                      autoComplete="organization"
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
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </button>

                {/* Lien retour */}
                <p className="text-center text-xs text-text-secondary mt-2">
                  <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft size={12} />
                    Retour à la connexion
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary mt-6">
          © {new Date().getFullYear()} SANTAREX ERP · IBIG Softwares
        </p>
      </div>
    </div>
  );
}
