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

export default function OffrePubliquePage() {
  const params = useParams();
  const token = String(params?.token ?? '');

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

  const fmt = (n: number, d: string) => `${(n ?? 0).toLocaleString('fr-FR')} ${d}`;

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
          Chargement du devis…
        </div>
      </div>
    );
  }

  if (error && !offre) {
    return (
      <div style={page}>
        <div style={{ ...card, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Devis indisponible</h1>
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
              <div style={{ fontSize: 12, opacity: 0.85 }}>Devis</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{offre.numero}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          {/* Bandeau statut */}
          {estAccepte && (
            <Banner bg="#ecfdf5" color="#047857" icon="✓">
              Offre acceptée{offre.acceptedAt ? ` le ${new Date(offre.acceptedAt).toLocaleDateString('fr-FR')}` : ''}. Merci pour votre confiance.
            </Banner>
          )}
          {expiree && !estAccepte && (
            <Banner bg="#fffbeb" color="#b45309" icon="⏳">
              Ce devis a expiré. Contactez-nous pour une nouvelle proposition.
            </Banner>
          )}
          {refusee && (
            <Banner bg="#fef2f2" color="#b91c1c" icon="✕">
              Ce devis a été refusé.
            </Banner>
          )}

          {/* Client */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>
              DESTINATAIRE
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{offre.clientNom}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>{offre.clientEmail}</div>
            {offre.dateValidite && (
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>
                Valable jusqu'au{' '}
                <strong>{new Date(offre.dateValidite).toLocaleDateString('fr-FR')}</strong>
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
            {offre.formule ? ` — Formule ${offre.formule}` : ''}
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
            <span>Utilisateurs : <strong>{offre.nbUtilisateurs}</strong></span>
            <span>Sites : <strong>{offre.nbSites}</strong></span>
            {offre.duree && <span>Durée : <strong>{offre.duree}</strong></span>}
          </div>

          {/* Modules */}
          {offre.modules?.length > 0 && (
            <Section titre="Modules inclus">
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
            <Section titre="Options">
              {offre.options.map((o, i) => (
                <Ligne key={i} left={o.libelle} right={fmt(o.prix, devise)} />
              ))}
            </Section>
          )}

          {/* Prestations */}
          {(offre.formation || offre.migration || offre.accompagnement) && (
            <Section titre="Accompagnement">
              {offre.formation && <Puce>Formation : {offre.formation}</Puce>}
              {offre.migration && <Puce>Migration : {offre.migration}</Puce>}
              {offre.accompagnement && <Puce>Accompagnement : {offre.accompagnement}</Puce>}
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
            <Ligne left="Total HT" right={fmt(offre.prixHT, devise)} />
            {offre.remise > 0 && (
              <Ligne left="Remise" right={`- ${fmt(offre.remise, devise)}`} muted />
            )}
            <Ligne left="Taxes" right={fmt(offre.taxes, devise)} muted />
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
              <span style={{ fontWeight: 800, color: BLUE, fontSize: 18 }}>TOTAL TTC</span>
              <span style={{ fontWeight: 800, color: BLUE, fontSize: 22 }}>
                {fmt(offre.prixTTC, devise)}
              </span>
            </div>
          </div>

          {/* Échéancier */}
          {offre.echeancier?.length > 0 && (
            <Section titre="Échéancier de paiement">
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
              <strong>Conditions :</strong> {offre.conditions}
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
              {accepting ? 'Traitement…' : "Accepter l'offre"}
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
          SANTAREX ERP — IBIG SOFT · Devis {offre.numero}
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
