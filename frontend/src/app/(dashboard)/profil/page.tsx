'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getCurrentUser, getUserInitials, getFullName } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';

type Section = 'info' | 'security' | 'preferences';

export default function ProfilPage() {
  const t = useTranslations('profil');
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Info form
  const [infoForm, setInfoForm] = useState({ firstName: '', lastName: '', email: '' });

  // Security form
  const [secForm, setSecForm] = useState({ current: '', next: '', confirm: '' });
  const [secError, setSecError] = useState<string | null>(null);

  // Preferences
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [emailNotif, setEmailNotif] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u) {
      setInfoForm({ firstName: u.firstName, lastName: u.lastName, email: u.email });
    }
  }, []);

  function showSaved(section: Section) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2500);
  }

  async function handleInfoSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      await apiClient('/auth/me', { method: 'PATCH', body: { firstName: infoForm.firstName, lastName: infoForm.lastName } });
      showSaved('info');
    } catch (err: any) {
      setSaveError(err?.message ?? t('errors.save'));
    } finally { setSaving(false); }
  }

  async function handleSecSubmit(e: FormEvent) {
    e.preventDefault();
    setSecError(null);
    if (!secForm.current || !secForm.next || !secForm.confirm) { setSecError(t('errors.allFields')); return; }
    if (secForm.next !== secForm.confirm) { setSecError(t('errors.mismatch')); return; }
    if (secForm.next.length < 8) { setSecError(t('errors.minLength')); return; }
    setSaving(true);
    try {
      await apiClient('/auth/change-password', { method: 'POST', body: { currentPassword: secForm.current, newPassword: secForm.next } });
      setSecForm({ current: '', next: '', confirm: '' });
      showSaved('security');
    } catch (err: any) {
      setSecError(err?.message ?? t('errors.currentWrong'));
    } finally { setSaving(false); }
  }

  function handlePrefSubmit(e: FormEvent) {
    e.preventDefault();
    showSaved('preferences');
  }

  const initials = getUserInitials(user);
  const fullName = getFullName(user) || t('defaultUser');
  const roleLabel = (user as unknown as Record<string, unknown>)?.role as string || t('defaultUser');

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    padding: '28px',
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#546E7A',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #CFD8DC',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#37474F',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#FAFAFA',
  };

  return (
    <div style={{ padding: '28px', maxWidth: '720px', margin: '0 auto', background: '#F5F7FA', minHeight: '100vh' }}>

      {/* Avatar + identité */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#0D47A1',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 4px 16px rgba(13,71,161,0.3)',
          }}
        >
          {initials}
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#37474F' }}>{fullName}</h1>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#546E7A' }}>{user?.email || '—'}</p>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: '#EFF6FF',
                color: '#0D47A1',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid #BFDBFE',
              }}
            >
              {roleLabel}
            </span>
            <span
              style={{
                background: '#E8F5E9',
                color: '#2E7D32',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid #A5D6A7',
              }}
            >
              {t('hopital')}
            </span>
          </div>
        </div>
      </div>

      {/* Section Mes informations */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#37474F', borderBottom: '2px solid #EFF6FF', paddingBottom: '12px' }}>
          👤 {t('info.title')}
        </h2>
        <form onSubmit={handleInfoSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{t('info.firstName')}</label>
              <input
                style={inputStyle}
                value={infoForm.firstName}
                onChange={(e) => setInfoForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder={t('info.firstNamePlaceholder')}
              />
            </div>
            <div>
              <label style={labelStyle}>{t('info.lastName')}</label>
              <input
                style={inputStyle}
                value={infoForm.lastName}
                onChange={(e) => setInfoForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder={t('info.lastNamePlaceholder')}
              />
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>{t('info.email')}</label>
            <input
              type="email"
              style={inputStyle}
              value={infoForm.email}
              onChange={(e) => setInfoForm((f) => ({ ...f, email: e.target.value }))}
              placeholder={t('info.emailPlaceholder')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              style={{
                background: '#0D47A1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('info.save')}
            </button>
            {saved === 'info' && (
              <span style={{ color: '#2E7D32', fontSize: '13px', fontWeight: 500 }}>✓ {t('info.saved')}</span>
            )}
          </div>
        </form>
      </div>

      {/* Section Sécurité */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#37474F', borderBottom: '2px solid #EFF6FF', paddingBottom: '12px' }}>
          🔒 {t('security.title')}
        </h2>
        <form onSubmit={handleSecSubmit}>
          {secError && (
            <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#C62828' }}>
              ⚠ {secError}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>{t('security.current')}</label>
              <input
                type="password"
                style={inputStyle}
                value={secForm.current}
                onChange={(e) => setSecForm((f) => ({ ...f, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('security.next')}</label>
              <input
                type="password"
                style={inputStyle}
                value={secForm.next}
                onChange={(e) => setSecForm((f) => ({ ...f, next: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('security.confirm')}</label>
              <input
                type="password"
                style={inputStyle}
                value={secForm.confirm}
                onChange={(e) => setSecForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              style={{
                background: '#0D47A1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('security.submit')}
            </button>
            {saved === 'security' && (
              <span style={{ color: '#2E7D32', fontSize: '13px', fontWeight: 500 }}>✓ {t('security.saved')}</span>
            )}
          </div>
        </form>
      </div>

      {/* Section Préférences */}
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#37474F', borderBottom: '2px solid #EFF6FF', paddingBottom: '12px' }}>
          ⚙️ {t('prefs.title')}
        </h2>
        <form onSubmit={handlePrefSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {/* Langue */}
            <div>
              <label style={labelStyle}>{t('prefs.language')}</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'fr' | 'en')}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="fr">{t('prefs.optFr')}</option>
                <option value="en">{t('prefs.optEn')}</option>
              </select>
            </div>

            {/* Notifications email */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#37474F' }}>{t('prefs.emailNotif')}</div>
                <div style={{ fontSize: '12px', color: '#546E7A', marginTop: '2px' }}>
                  {t('prefs.emailNotifDesc')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotif(!emailNotif)}
                style={{
                  width: '48px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  background: emailNotif ? '#0D47A1' : '#CFD8DC',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
                aria-label={t('prefs.toggleAria')}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: emailNotif ? '25px' : '3px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              style={{
                background: '#0D47A1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('prefs.submit')}
            </button>
            {saved === 'preferences' && (
              <span style={{ color: '#2E7D32', fontSize: '13px', fontWeight: 500 }}>✓ {t('prefs.saved')}</span>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
