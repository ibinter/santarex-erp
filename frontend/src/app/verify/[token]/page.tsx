'use client';

import { useEffect, useState } from 'react';

/**
 * Page PUBLIQUE de vérification d'authenticité d'un document SANTAREX ERP.
 * Accessible sans authentification (hors groupe (dashboard)). N'affiche AUCUNE
 * donnée confidentielle : seulement logiciel, société, type, référence, date,
 * statut d'authenticité.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://santarex.ibigsoft.com/api/v1';

interface VerificationResult {
  logiciel: string;
  societe: string;
  typeDocument: string;
  reference: string;
  date: string;
  statut: string;
  authentique: boolean;
}

type Etat =
  | { phase: 'loading' }
  | { phase: 'found'; data: VerificationResult }
  | { phase: 'notfound' }
  | { phase: 'error' };

const TYPE_LABELS: Record<string, string> = {
  facture: 'Facture',
  recu: 'Reçu',
  ordonnance: 'Ordonnance',
  attestation: 'Attestation',
};

const STATUT_LABELS: Record<string, string> = {
  authentique: 'Document authentique',
  annule: 'Document annulé',
  remplace: 'Document remplacé',
  revoque: 'Document révoqué',
};

export default function VerifyPage({ params }: { params: { token: string } }) {
  const [etat, setEtat] = useState<Etat>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(
          `${API_URL}/public/verify/${encodeURIComponent(params.token)}`,
          { cache: 'no-store' },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setEtat({ phase: 'notfound' });
          return;
        }
        if (!res.ok) {
          setEtat({ phase: 'error' });
          return;
        }
        const data = (await res.json()) as VerificationResult;
        if (!cancelled) setEtat({ phase: 'found', data });
      } catch {
        if (!cancelled) setEtat({ phase: 'error' });
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [params.token]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(160deg, #0f2740 0%, #14324f 100%)',
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eef1f4',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0f2740',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            S
          </span>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, color: '#0f2740', fontSize: '15px' }}>
              SANTAREX ERP
            </div>
            <div style={{ fontSize: '12px', color: '#6b7683' }}>
              Vérification de document
            </div>
          </div>
        </header>

        <div style={{ padding: '28px 24px' }}>
          {etat.phase === 'loading' && (
            <p style={{ textAlign: 'center', color: '#6b7683', margin: 0 }}>
              Vérification en cours…
            </p>
          )}

          {etat.phase === 'notfound' && (
            <Resultat
              couleur="#b23b3b"
              fond="#fdecec"
              icone="✕"
              titre="Document introuvable"
              sousTitre="Aucun document ne correspond à ce code. Ce QR code est peut-être invalide ou expiré."
            />
          )}

          {etat.phase === 'error' && (
            <Resultat
              couleur="#8a6d1f"
              fond="#fdf6e3"
              icone="!"
              titre="Vérification indisponible"
              sousTitre="Impossible de contacter le service de vérification. Réessayez plus tard."
            />
          )}

          {etat.phase === 'found' && (
            <>
              <Resultat
                couleur={etat.data.authentique ? '#1f7a4d' : '#b23b3b'}
                fond={etat.data.authentique ? '#e8f6ee' : '#fdecec'}
                icone={etat.data.authentique ? '✓' : '✕'}
                titre={
                  STATUT_LABELS[etat.data.statut] ??
                  (etat.data.authentique ? 'Document authentique' : 'Document non valide')
                }
                sousTitre={
                  etat.data.authentique
                    ? 'Ce document a bien été émis via SANTAREX ERP.'
                    : "Ce document a été émis via SANTAREX ERP mais n'est plus valide."
                }
              />

              <dl style={{ margin: '24px 0 0', display: 'grid', gap: '2px' }}>
                <Ligne label="Logiciel" valeur={etat.data.logiciel} />
                <Ligne label="Société émettrice" valeur={etat.data.societe} />
                <Ligne
                  label="Type de document"
                  valeur={TYPE_LABELS[etat.data.typeDocument] ?? etat.data.typeDocument}
                />
                <Ligne label="Référence" valeur={etat.data.reference} />
                <Ligne
                  label="Date d'émission"
                  valeur={formaterDate(etat.data.date)}
                />
              </dl>
            </>
          )}
        </div>

        <footer
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #eef1f4',
            fontSize: '11px',
            color: '#9aa4af',
            textAlign: 'center',
          }}
        >
          Cette page ne révèle aucune donnée confidentielle du document.
        </footer>
      </div>
    </main>
  );
}

function Resultat({
  couleur,
  fond,
  icone,
  titre,
  sousTitre,
}: {
  couleur: string;
  fond: string;
  icone: string;
  titre: string;
  sousTitre: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          margin: '0 auto 14px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: fond,
          color: couleur,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 700,
        }}
      >
        {icone}
      </div>
      <h1 style={{ margin: '0 0 6px', fontSize: '19px', color: couleur }}>
        {titre}
      </h1>
      <p style={{ margin: 0, fontSize: '13px', color: '#6b7683', lineHeight: 1.5 }}>
        {sousTitre}
      </p>
    </div>
  );
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '10px 0',
        borderBottom: '1px solid #f2f4f6',
      }}
    >
      <dt style={{ fontSize: '13px', color: '#6b7683' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: '#0f2740',
          textAlign: 'right',
        }}
      >
        {valeur}
      </dd>
    </div>
  );
}

function formaterDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
