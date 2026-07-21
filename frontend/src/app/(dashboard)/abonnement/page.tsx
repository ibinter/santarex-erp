'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Smartphone, Building2, Globe, Send, Banknote, Coins,
  Ticket, Truck, ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle,
  Lock, RefreshCw, ExternalLink, FileText,
} from 'lucide-react';
import { apiClient, API_URL } from '@/lib/api';

// ── Types (miroir de ClientPaymentMethod côté backend) ───────────────────────
type PaymentMethodType =
  | 'mobile_money' | 'gateway' | 'bank_transfer' | 'intl_transfer'
  | 'money_transfer' | 'cash_agency' | 'cheque' | 'crypto'
  | 'voucher' | 'cash_on_delivery';

interface ClientPaymentMethod {
  key: string;
  type: PaymentMethodType;
  label: string;
  gateway: string | null;
  publicConfig: Record<string, unknown>;
  instructions: string | null;
  sandbox: boolean;
  currencies: string[];
  displayOrder: number;
}

interface Offre { code: string; nom?: string; prix?: number }
interface Transaction { reference: string; paymentUrl?: string | null; status?: string }

// Familles de formulaire dérivées du type de méthode.
type FormKind = 'gateway' | 'voucher' | 'reference' | 'proof' | 'order';

function formKindFor(type: PaymentMethodType): FormKind {
  switch (type) {
    case 'gateway': return 'gateway';
    case 'voucher': return 'voucher';
    case 'money_transfer': return 'reference'; // MTCN
    case 'crypto': return 'reference';          // hash de transaction
    case 'cash_on_delivery': return 'order';
    default: return 'proof'; // mobile_money, bank_transfer, intl_transfer, cash_agency, cheque
  }
}

const METHOD_ICON: Record<PaymentMethodType, React.ReactNode> = {
  mobile_money:    <Smartphone size={18} />,
  gateway:         <CreditCard size={18} />,
  bank_transfer:   <Building2 size={18} />,
  intl_transfer:   <Globe size={18} />,
  money_transfer:  <Send size={18} />,
  cash_agency:     <Banknote size={18} />,
  cheque:          <FileText size={18} />,
  crypto:          <Coins size={18} />,
  voucher:         <Ticket size={18} />,
  cash_on_delivery:<Truck size={18} />,
};

const REFERENCE_LABEL: Partial<Record<PaymentMethodType, string>> = {
  money_transfer: 'Code MTCN / numéro de transfert',
  crypto: 'Hash de la transaction (TxID)',
};

function fmtXOF(v?: number) {
  return typeof v === 'number' ? v.toLocaleString('fr-FR') + ' XOF' : '—';
}

// ── Bandeau de sécurité OBLIGATOIRE (présent sur toutes les vues) ─────────────
function SecurityBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
      borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.4,
      marginBottom: 16,
    }}>
      <Lock size={18} style={{ flexShrink: 0 }} />
      <span><strong>Sécurité :</strong> Nous ne vous demanderons jamais votre code secret ou mot de passe.</span>
    </div>
  );
}

export default function AbonnementPage() {
  const [methods, setMethods] = useState<ClientPaymentMethod[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [offerCode, setOfferCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiClient<ClientPaymentMethod[]>('/payments/methods');
      setMethods(Array.isArray(list) ? [...list].sort((a, b) => a.displayOrder - b.displayOrder) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger les moyens de paiement.');
    } finally {
      setLoading(false);
    }
    // Offres : best-effort (facultatif pour le redeem voucher).
    try {
      const off = await apiClient<Offre[]>('/offres-saas');
      if (Array.isArray(off) && off.length) {
        setOffres(off);
        setOfferCode((prev) => prev || off[0].code);
      }
    } catch { /* silencieux : l'utilisateur pourra saisir le code offre */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 14px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <ShieldCheck size={22} color="#4F46E5" />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#111827' }}>Abonnement & paiement</h1>
      </div>
      <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 16px' }}>
        Choisissez un moyen de paiement pour activer ou renouveler votre licence.
      </p>

      {/* Bandeau obligatoire, toujours affiché */}
      <SecurityBanner />

      {/* Sélecteur d'offre (utilisé par la plupart des méthodes) */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
          Forfait à régler
        </label>
        {offres.length > 0 ? (
          <select
            value={offerCode}
            onChange={(e) => setOfferCode(e.target.value)}
            style={inputStyle}
          >
            {offres.map((o) => (
              <option key={o.code} value={o.code}>
                {(o.nom ?? o.code)}{o.prix ? ` — ${fmtXOF(o.prix)}` : ''}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={offerCode}
            onChange={(e) => setOfferCode(e.target.value)}
            placeholder="Code du forfait (ex : starter, pro)"
            style={inputStyle}
          />
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', padding: 24, justifyContent: 'center' }}>
          <Loader2 size={18} className="spin" /> Chargement des moyens de paiement…
        </div>
      )}

      {error && !loading && (
        <div style={{ ...noticeStyle, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={load} style={ghostBtnStyle}><RefreshCw size={14} /> Réessayer</button>
        </div>
      )}

      {!loading && !error && methods.length === 0 && (
        <div style={{ ...noticeStyle, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280' }}>
          Aucun moyen de paiement n'est activé pour le moment. Contactez le support.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {methods.map((m) => (
          <MethodCard
            key={m.key}
            method={m}
            offerCode={offerCode}
            open={openKey === m.key}
            onToggle={() => setOpenKey(openKey === m.key ? null : m.key)}
          />
        ))}
      </div>

      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Carte d'un moyen de paiement ─────────────────────────────────────────────
function MethodCard(props: {
  method: ClientPaymentMethod;
  offerCode: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { method, offerCode, open, onToggle } = props;
  const kind = formKindFor(method.type);

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: open ? '#F5F3FF' : '#fff',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', flexShrink: 0,
        }}>
          {METHOD_ICON[method.type]}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, color: '#111827', fontSize: 15 }}>
            {method.label || method.key}
          </span>
          <span style={{ display: 'block', fontSize: 12, color: '#6B7280' }}>
            {method.sandbox ? 'Mode test • ' : ''}{humanType(method.type)}
          </span>
        </span>
        <span style={{ color: '#9CA3AF', fontSize: 20, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .15s' }}>+</span>
      </button>

      {open && (
        <div style={{ padding: '4px 16px 18px', borderTop: '1px solid #F3F4F6' }}>
          {method.instructions && (
            <div style={{
              whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151', lineHeight: 1.5,
              background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10, padding: 12, margin: '12px 0',
            }}>
              {method.instructions}
            </div>
          )}
          <PublicConfigList config={method.publicConfig} />
          <MethodForm kind={kind} method={method} offerCode={offerCode} />
        </div>
      )}
    </div>
  );
}

function PublicConfigList({ config }: { config: Record<string, unknown> }) {
  const entries = Object.entries(config || {}).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;
  return (
    <dl style={{ margin: '0 0 12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 13 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt style={{ color: '#6B7280', fontWeight: 600 }}>{k}</dt>
          <dd style={{ margin: 0, color: '#111827', wordBreak: 'break-word', fontFamily: 'ui-monospace, monospace' }}>{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── Formulaire adapté au type ────────────────────────────────────────────────
function MethodForm({ kind, method, offerCode }: { kind: FormKind; method: ClientPaymentMethod; offerCode: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  // Champs
  const [clientRef, setClientRef] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const needOffer = kind !== 'voucher';

  async function createTransaction(): Promise<string> {
    const tx = await apiClient<Transaction>('/payments/transactions', {
      method: 'POST',
      body: { offerCode, methodKey: method.key },
    });
    if (!tx?.reference) throw new Error('Réponse serveur invalide (référence absente).');
    setRef(tx.reference);
    return tx.reference;
  }

  async function handleGateway() {
    setBusy(true); setMsg(null);
    try {
      const tx = await apiClient<Transaction>('/payments/transactions', {
        method: 'POST',
        body: { offerCode, methodKey: method.key },
      });
      if (tx?.paymentUrl) { window.location.href = tx.paymentUrl; return; }
      setMsg({ ok: true, text: `Commande ${tx?.reference ?? ''} créée. Redirection vers la passerelle en attente d'activation.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Erreur lors de l\'initiation du paiement.' });
    } finally { setBusy(false); }
  }

  async function handleVoucher() {
    setBusy(true); setMsg(null);
    try {
      const code = voucherCode.trim();
      if (!code) throw new Error('Saisissez un code prépayé.');
      await apiClient('/payments/vouchers/redeem', { method: 'POST', body: { code } });
      setMsg({ ok: true, text: 'Code validé : votre licence a été activée.' });
      setVoucherCode('');
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Code invalide ou déjà utilisé.' });
    } finally { setBusy(false); }
  }

  async function handleReference() {
    setBusy(true); setMsg(null);
    try {
      if (!offerCode) throw new Error('Sélectionnez d\'abord un forfait.');
      if (!clientRef.trim()) throw new Error('Saisissez la référence demandée.');
      const r = ref ?? (await createTransaction());
      await apiClient(`/payments/transactions/${encodeURIComponent(r)}/reference`, {
        method: 'POST',
        body: { clientReference: clientRef.trim() },
      });
      setMsg({ ok: true, text: `Référence enregistrée (commande ${r}). En attente de validation par nos équipes.` });
      setClientRef('');
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Impossible d\'enregistrer la référence.' });
    } finally { setBusy(false); }
  }

  async function handleProof() {
    setBusy(true); setMsg(null);
    try {
      if (!offerCode) throw new Error('Sélectionnez d\'abord un forfait.');
      if (!file) throw new Error('Ajoutez une preuve (image ou PDF).');
      const r = ref ?? (await createTransaction());
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/payments/transactions/${encodeURIComponent(r)}/proof`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || json?.message || 'Échec du téléversement de la preuve.');
      setMsg({ ok: true, text: `Preuve envoyée (commande ${r}). En attente de validation par nos équipes.` });
      setFile(null);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Impossible d\'envoyer la preuve.' });
    } finally { setBusy(false); }
  }

  async function handleOrder() {
    setBusy(true); setMsg(null);
    try {
      const r = await createTransaction();
      setMsg({ ok: true, text: `Commande ${r} enregistrée. Le paiement sera collecté à la livraison.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Impossible de créer la commande.' });
    } finally { setBusy(false); }
  }

  return (
    <div>
      {needOffer && !offerCode && (
        <p style={{ fontSize: 12, color: '#B45309', margin: '0 0 10px' }}>
          Sélectionnez un forfait en haut de page avant de continuer.
        </p>
      )}

      {kind === 'gateway' && (
        <button onClick={handleGateway} disabled={busy || !offerCode} style={primaryBtnStyle(busy || !offerCode)}>
          {busy ? <Loader2 size={16} className="spin" /> : <ExternalLink size={16} />} Payer en ligne
        </button>
      )}

      {kind === 'voucher' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="SANT-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', letterSpacing: 1 }}
          />
          <button onClick={handleVoucher} disabled={busy} style={primaryBtnStyle(busy)}>
            {busy ? <Loader2 size={16} className="spin" /> : <Ticket size={16} />} Activer le code
          </button>
        </div>
      )}

      {kind === 'reference' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>{REFERENCE_LABEL[method.type] ?? 'Référence de paiement'}</label>
          <input
            value={clientRef}
            onChange={(e) => setClientRef(e.target.value)}
            placeholder={REFERENCE_LABEL[method.type] ?? 'Référence'}
            style={inputStyle}
          />
          <button onClick={handleReference} disabled={busy || !offerCode} style={primaryBtnStyle(busy || !offerCode)}>
            {busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Envoyer la référence
          </button>
        </div>
      )}

      {kind === 'proof' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={labelStyle}>Preuve de paiement (image ou PDF, max 5 Mo)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ ...inputStyle, padding: 8 }}
          />
          <button onClick={handleProof} disabled={busy || !offerCode} style={primaryBtnStyle(busy || !offerCode)}>
            {busy ? <Loader2 size={16} className="spin" /> : <Upload size={16} />} Envoyer la preuve
          </button>
        </div>
      )}

      {kind === 'order' && (
        <button onClick={handleOrder} disabled={busy} style={primaryBtnStyle(busy)}>
          {busy ? <Loader2 size={16} className="spin" /> : <Truck size={16} />} Confirmer la commande
        </button>
      )}

      {msg && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12,
          fontSize: 13, borderRadius: 10, padding: '10px 12px',
          background: msg.ok ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${msg.ok ? '#A7F3D0' : '#FECACA'}`,
          color: msg.ok ? '#065F46' : '#991B1B',
        }}>
          {msg.ok ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
          <span>{msg.text}</span>
        </div>
      )}
    </div>
  );
}

function humanType(t: PaymentMethodType): string {
  const map: Record<PaymentMethodType, string> = {
    mobile_money: 'Mobile Money', gateway: 'Paiement en ligne', bank_transfer: 'Virement bancaire',
    intl_transfer: 'Virement international', money_transfer: 'Transfert d\'argent', cash_agency: 'Espèces en agence',
    cheque: 'Chèque', crypto: 'Cryptomonnaie', voucher: 'Code prépayé', cash_on_delivery: 'Paiement à la livraison',
  };
  return map[t] ?? t;
}

// ── Styles partagés ──────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 12px', fontSize: 14,
  border: '1px solid #D1D5DB', borderRadius: 10, outline: 'none', background: '#fff', color: '#111827',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151' };
const noticeStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12, padding: '12px 14px', fontSize: 13, marginBottom: 12,
};
const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid currentColor',
  borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: 'inherit',
};
function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 600,
    background: disabled ? '#A5B4FC' : '#4F46E5', color: '#fff', border: 'none',
    borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
