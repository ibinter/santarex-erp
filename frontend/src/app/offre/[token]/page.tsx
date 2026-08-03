'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface OffrePublique {
  numero: string;
  clientNom: string;
  clientEmail: string;
  logiciel: string;
  formule?: string;
  modules: string[];
  nbUtilisateurs: number;
  nbSites: number;
  duree?: string;
  devise: string;
  prixHT: number;
  remise: number;
  taxes: number;
  prixTTC: number;
  options: Array<{ libelle: string; prix: number }>;
  formation?: string;
  migration?: string;
  accompagnement?: string;
  echeancier: Array<{ libelle: string; montant: number; echeance?: string }>;
  dateValidite?: string;
  conditions?: string;
  notes?: string;
  statut: 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree';
  acceptedAt?: string;
}

const BLUE = '#0D47A1';
const TEAL = '#00838F';

const DICT = {
  fr: {
    loading: 'Chargement du devis…',
    unavailable: 'Devis indisponible',
    accepted: 'Offre acceptée',
    acceptedOn: 'le',
    thanks: 'Merci pour votre confiance.',
    expired: 'Ce devis a expiré. Contactez-nous pour une nouvelle proposition.',
    refused: 'Ce devis a été refusé.',
    recipient: 'DESTINATAIRE',
    validUntil: "Valable jusqu'au",
    quote: 'Devis',
    plan: 'Formule',
    users: 'Utilisateurs',
    sites: 'Sites',
    duration: 'Durée',
    modules: 'Modules inclus',
    options: 'Options',
    support: 'Accompagnement',
    training: 'Formation',
    migration: 'Migration',
    accompaniment: 'Accompagnement',
    totalHT: 'Total HT',
    discount: 'Remise',
    taxes: 'Taxes',
    totalTTC: 'TOTAL TTC',
    schedule: 'Échéancier de paiement',
    conditions: 'Conditions',
    accept: "Accepter l'offre",
    processing: 'Traitement…',
  },
  en: {
    loading: 'Loading quote…',
    unavailable: 'Quote unavailable',
    accepted: 'Offer accepted',
    acceptedOn: 'on',
    thanks: 'Thank you for your trust.',
    expired: 'This quote has expired. Contact us for a new proposal.',
    refused: 'This quote was declined.',
    recipient: 'RECIPIENT',
    validUntil: 'Valid until',
    quote: 'Quote',
    plan: 'Plan',
    users: 'Users',
    sites: 'Sites',
    duration: 'Duration',
    modules: 'Included modules',
    options: 'Options',
    support: 'Support',
    training: 'Training',
    migration: 'Migration',
    accompaniment: 'Support',
    totalHT: 'Subtotal (excl. tax)',
    discount: 'Discount',
    taxes: 'Taxes',
    totalTTC: 'TOTAL (incl. tax)',
    schedule: 'Payment schedule',
    conditions: 'Terms',
    accept: 'Accept the offer',
    processing: 'Processing…',
  },
};

export default function OffrePubliquePage() {
  const params = useParams();
  const token = String(params?.token ?? '');

  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(en|fr)/);
    if (m) setLocale(m[1] as 'fr' | 'en');
  }, []);
  const tr = DICT[locale];
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  const [offre, setOffre] = useState<OffrePublique | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/offres-commerciales/public/${token}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Offre introuvable');
      const data = json?.data !== undefined ? json.data : json;
      setOffre(data);
      if (data?.statut === 'acceptee') setAccepted(true);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const accepter = async () => {
    setAccepting(true);
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/offres-commerciales/public/${token}/accepter`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Impossible d'accepter l'offre");
      setAccepted(true);
      load();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setAccepting(false);
    }
  };

  const fmt = (n: number, d: string) => `${(n ?? 0).toLocaleString(dateLocale)} ${d}`;

  const page: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily:
      "'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif",
    color: '#1f2937',
    padding: '32px 16px',
  };
  const card: React.CSSProperties = {
    maxWidth: 720,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={page}>
        <div style={{ ...card, padding: 48, textAlign: 'center', color: '#94a3b8' }}>
          {tr.loading}
        </div>
      </div>
    );
  }

  if (error && !offre) {
    return (
      <div style={page}>
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{tr.unavailable}</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!offre) return null;

  const devise = offre.devise ?? 'XOF';
  const expiree = offre.statut === 'expiree';
  const refusee = offre.statut === 'refusee';
  const estAccepte = accepted || offre.statut === 'acceptee';

  return (
    <div style={page}>
      <div style={card}>
        {/* En-tête brandé */}
        <div
          style={{
            background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
            color: '#fff',
            padding: '28px 32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>
                SANTAREX ERP
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>IBIG SOFT — ibigsoft.com</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{tr.quote}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{offre.numero}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {/* Bandeau statut */}
          {estAccepte && (
            <Banner bg="#ecfdf5" color="#047857" icon="✓">
              {tr.accepted}{offre.acceptedAt ? ` ${tr.acceptedOn} ${new Date(offre.acceptedAt).toLocaleDateString(dateLocale)}` : ''}. {tr.thanks}
            </Banner>
          )}
          {expiree && !estAccepte && (
            <Banner bg="#fffbeb" color="#b45309" icon="⏳">
              {tr.expired}
            </Banner>
          )}
          {refusee && (
            <Banner bg="#fef2f2" color="#b91c1c" icon="✕">
              {tr.refused}
            </Banner>
          )}

          {/* Client */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>
              {tr.recipient}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{offre.clientNom}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>{offre.clientEmail}</div>
            {offre.dateValidite && (
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
                {tr.validUntil}{' '}
                <strong>{new Date(offre.dateValidite).toLocaleDateString(dateLocale)}</strong>
              </div>
            )}
          </div>

          {/* Produit */}
          <div
            style={{
              background: TEAL,
              color: '#fff',
              borderRadius: 10,
              padding: '12px 16px',
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            {offre.logiciel}
            {offre.formule ? ` — ${tr.plan} ${offre.formule}` : ''}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              color: '#475569',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            <span>{tr.users} : <strong>{offre.nbUtilisateurs}</strong></span>
            <span>{tr.sites} : <strong>{offre.nbSites}</strong></span>
            {offre.duree && <span>{tr.duration} : <strong>{offre.duree}</strong></span>}
          </div>

          {/* Modules */}
          {offre.modules?.length > 0 && (
            <Section titre={tr.modules}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {offre.modules.map((m) => (
                  <span
                    key={m}
                    style={{
                      background: '#eff6ff',
                      color: BLUE,
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Options */}
          {offre.options?.length > 0 && (
            <Section titre={tr.options}>
              {offre.options.map((o, i) => (
                <Ligne key={i} left={o.libelle} right={fmt(o.prix, devise)} />
              ))}
            </Section>
          )}

          {/* Prestations */}
          {(offre.formation || offre.migration || offre.accompagnement) && (
            <Section titre={tr.support}>
              {offre.formation && <Puce>{tr.training} : {offre.formation}</Puce>}
              {offre.migration && <Puce>{tr.migration} : {offre.migration}</Puce>}
              {offre.accompagnement && <Puce>{tr.accompaniment} : {offre.accompagnement}</Puce>}
            </Section>
          )}

          {/* Totaux */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 16,
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            <Ligne left={tr.totalHT} right={fmt(offre.prixHT, devise)} />
            {offre.remise > 0 && (
              <Ligne left={tr.discount} right={`- ${fmt(offre.remise, devise)}`} muted />
            )}
            <Ligne left={tr.taxes} right={fmt(offre.taxes, devise)} muted />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 10,
                borderTop: '2px solid #e2e8f0',
              }}
            >
              <span style={{ fontWeight: 800, color: BLUE, fontSize: 18 }}>{tr.totalTTC}</span>
              <span style={{ fontWeight: 800, color: BLUE, fontSize: 22 }}>
                {fmt(offre.prixTTC, devise)}
              </span>
            </div>
          </div>

          {/* Échéancier */}
          {offre.echeancier?.length > 0 && (
            <Section titre={tr.schedule}>
              {offre.echeancier.map((e, i) => (
                <Ligne
                  key={i}
                  left={`${e.libelle}${e.echeance ? ` — ${e.echeance}` : ''}`}
                  right={fmt(e.montant, devise)}
                />
              ))}
            </Section>
          )}

          {offre.conditions && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 16 }}>
              <strong>{tr.conditions} :</strong> {offre.conditions}
            </div>
          )}
          {offre.notes && (
            <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 }}>
              {offre.notes}
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 14,
                marginTop: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          {!estAccepte && !expiree && !refusee && (
            <button
              onClick={accepter}
              disabled={accepting}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '14px 20px',
                border: 'none',
                borderRadius: 12,
                background: `linear-gradient(135deg, ${BLUE}, ${TEAL})`,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: accepting ? 'default' : 'pointer',
                opacity: accepting ? 0.7 : 1,
              }}
            >
              {accepting ? tr.processing : tr.accept}
            </button>
          )}
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            fontSize: 12,
            color: '#94a3b8',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          SANTAREX ERP — IBIG SOFT · {tr.quote} {offre.numero}
        </div>
      </div>
    </div>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: BLUE,
          marginBottom: 10,
        }}
      >
        {titre}
      </div>
      {children}
    </div>
  );
}

function Ligne({
  left,
  right,
  muted,
}: {
  left: string;
  right: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        fontSize: 14,
        color: muted ? '#64748b' : '#1f2937',
      }}
    >
      <span>{left}</span>
      <span style={{ fontWeight: 600 }}>{right}</span>
    </div>
  );
}

function Puce({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, color: '#475569', padding: '3px 0' }}>• {children}</div>
  );
}

function Banner({
  bg,
  color,
  icon,
  children,
}: {
  bg: string;
  color: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: bg,
        color,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 20,
        display: 'flex',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
