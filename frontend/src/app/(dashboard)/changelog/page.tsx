'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Sparkles, RefreshCw, Star } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Nouveaute = { texte: string; formuleMin?: string };
type Version = {
  id: string;
  version: string;
  titre: string;
  datePublication?: string;
  nouveautesJson?: Nouveaute[];
  estMajeure?: boolean;
};

function unwrap(r: any): Version[] {
  if (Array.isArray(r)) return r;
  return r?.data?.data ?? r?.data ?? r?.items ?? [];
}

export default function ChangelogPage() {
  const t = useTranslations('changelog');
  const locale = useLocale();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [appVersion, setAppVersion] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const [list, ver] = await Promise.all([
        apiClient<any>('/changelog'),
        apiClient<any>('/version').catch(() => null),
      ]);
      setVersions(unwrap(list));
      const v = ver?.data ?? ver;
      if (v?.version) setAppVersion(v.version);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (d?: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={24} color="#12A594" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1A2332' }}>{t('title')}</h1>
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0E6ED',
            background: '#fff', borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            fontSize: 13, color: '#546E7A', fontWeight: 600,
          }}
        >
          <RefreshCw size={15} /> {t('refresh')}
        </button>
      </div>
      <p style={{ margin: '0 0 8px', color: '#78909C', fontSize: 14 }}>{t('subtitle')}</p>
      {appVersion && (
        <p style={{ margin: '0 0 24px', color: '#0B7285', fontSize: 13, fontWeight: 600 }}>
          {t('currentVersion', { version: appVersion })}
        </p>
      )}

      {loading ? (
        <p style={{ color: '#78909C' }}>{t('loading')}</p>
      ) : versions.length === 0 ? (
        <p style={{ color: '#78909C' }}>{t('empty')}</p>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* Ligne de timeline */}
          <div
            style={{
              position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#E0E6ED',
            }}
          />
          {versions.map((v) => (
            <div key={v.id ?? v.version} style={{ position: 'relative', marginBottom: 28 }}>
              {/* Pastille */}
              <div
                style={{
                  position: 'absolute', left: -28, top: 4, width: 16, height: 16, borderRadius: '50%',
                  background: v.estMajeure ? '#12A594' : '#fff',
                  border: `3px solid ${v.estMajeure ? '#12A594' : '#B0BEC5'}`,
                }}
              />
              <div
                style={{
                  background: '#fff', border: '1px solid #ECEFF1', borderRadius: 14,
                  padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 17, color: '#1A2332' }}>
                    v{v.version}
                  </span>
                  {v.estMajeure && (
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                        color: '#0B7285', background: '#E6FCF5', borderRadius: 6, padding: '3px 8px',
                        textTransform: 'uppercase',
                      }}
                    >
                      <Star size={11} /> {t('major')}
                    </span>
                  )}
                  {v.datePublication && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#90A4AE' }}>
                      {fmtDate(v.datePublication)}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '8px 0 12px', fontSize: 15, color: '#37474F', fontWeight: 600 }}>
                  {v.titre}
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(v.nouveautesJson ?? []).map((n, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span
                        style={{
                          marginTop: 7, flexShrink: 0, width: 5, height: 5, borderRadius: '50%',
                          background: '#12A594',
                        }}
                      />
                      <span style={{ fontSize: 14, color: '#546E7A', lineHeight: 1.5 }}>
                        {n.texte}
                        {n.formuleMin && (
                          <span
                            style={{
                              marginLeft: 8, fontSize: 11, fontWeight: 600, color: '#0B7285',
                              background: '#F1F3F5', borderRadius: 6, padding: '2px 6px', textTransform: 'uppercase',
                            }}
                          >
                            {t('formuleMin', { formule: n.formuleMin })}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
