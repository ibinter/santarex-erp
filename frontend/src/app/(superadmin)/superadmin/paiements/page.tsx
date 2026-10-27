'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL, apiClient } from '@/lib/api';
import { Wallet, CheckCircle2, AlertTriangle, Copy } from 'lucide-react';

type Config = {
  key: string;
  enabled: boolean;
  sandbox: boolean;
  secretConfig?: Record<string, string>;
};

const CLE = 'gateway.geniuspay';

const carte: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 18 };
const champ: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #CFD8DC', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' };
const etiquette: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#546E7A', margin: '14px 0 6px' };
const bouton = (couleur: string, desactive = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none',
  background: desactive ? '#B0BEC5' : couleur, color: '#fff', fontWeight: 700, fontSize: 14, cursor: desactive ? 'not-allowed' : 'pointer',
});

/**
 * Configuration de GeniusPay (paiement des licences). Les clés sont saisies ICI, dans le navigateur de
 * l'administrateur, puis stockées chiffrées côté serveur : elles ne sont jamais ré-affichées en clair.
 */
export default function PaiementsPage() {
  const [config, setConfig] = useState<Config | null | undefined>(undefined);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [returnUrl, setReturnUrl] = useState('');
  const [sandbox, setSandbox] = useState(true);
  const [active, setActive] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null);

  const urlWebhook = `${API_URL.replace(/\/$/, '')}/payments/webhooks/geniuspay`;

  const charger = useCallback(async () => {
    try {
      const r: any = await apiClient('/admin/payments/config');
      const liste: Config[] = (r?.data ?? r) as Config[];
      const c = Array.isArray(liste) ? liste.find((x) => x.key === CLE) ?? null : null;
      setConfig(c);
      if (c) { setSandbox(c.sandbox); setActive(c.enabled); }
    } catch (e: any) {
      setConfig(null);
      setRetour({ ok: false, texte: e?.message ?? 'Impossible de lire la configuration' });
    }
  }, []);

  useEffect(() => {
    setReturnUrl(`${window.location.origin}/abonnement`);
    charger();
  }, [charger]);

  async function creer() {
    setOccupe(true); setRetour(null);
    try {
      await apiClient('/admin/payments/config/seed-defaults', { method: 'POST', body: {} });
      await charger();
    } catch (e: any) {
      setRetour({ ok: false, texte: e?.message ?? 'Création impossible' });
    } finally { setOccupe(false); }
  }

  async function enregistrer() {
    setOccupe(true); setRetour(null);
    // Seuls les champs saisis sont envoyés : un champ vide ne doit jamais effacer un secret existant.
    const secretConfig: Record<string, string> = {};
    if (apiKey.trim()) secretConfig.apiKey = apiKey.trim();
    if (apiSecret.trim()) secretConfig.apiSecret = apiSecret.trim();
    if (webhookSecret.trim()) secretConfig.webhookSecret = webhookSecret.trim();
    if (returnUrl.trim()) secretConfig.returnUrl = returnUrl.trim();
    try {
      await apiClient('/admin/payments/config', {
        method: 'POST',
        body: { key: CLE, type: 'gateway', gateway: 'geniuspay', label: 'GeniusPay (Mobile Money, Wave, carte)', sandbox, enabled: active, secretConfig },
      });
      setApiKey(''); setApiSecret(''); setWebhookSecret('');
      setRetour({ ok: true, texte: 'Configuration enregistrée. Les clés sont stockées chiffrées et ne seront plus affichées.' });
      await charger();
    } catch (e: any) {
      setRetour({ ok: false, texte: e?.message ?? "Échec de l'enregistrement" });
    } finally { setOccupe(false); }
  }

  const a = (k: string) => !!config?.secretConfig?.[k];
  const incoherent = apiKey.trim() !== '' && (sandbox ? !apiKey.startsWith('pk_sandbox_') : apiKey.startsWith('pk_sandbox_'));

  return (
    <div style={{ padding: 20, maxWidth: 820 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 6px', fontSize: 22, color: '#0F172A' }}>
        <Wallet size={22} /> Paiement des licences — GeniusPay
      </h1>
      <p style={{ margin: '0 0 18px', color: '#546E7A', fontSize: 14, lineHeight: 1.5 }}>
        Vos clients règlent leur abonnement par Mobile Money, Wave ou carte via GeniusPay. La licence est activée uniquement
        quand GeniusPay confirme le paiement (jamais sur le simple retour du client).
      </p>

      {config === undefined && <div style={carte}>Chargement…</div>}

      {config === null && (
        <div style={carte}>
          <p style={{ margin: '0 0 12px', color: '#37474F' }}>La configuration GeniusPay n&apos;existe pas encore.</p>
          <button style={bouton('#1565C0', occupe)} disabled={occupe} onClick={creer}>Créer la configuration</button>
        </div>
      )}

      {config && (
        <>
          <div style={carte}>
            <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 4 }}>1. Adresse de notification (webhook) à déclarer chez GeniusPay</div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#546E7A' }}>
              Dans votre tableau de bord GeniusPay, créez un webhook avec cette adresse et les événements
              <code> payment.success</code>, <code>payment.failed</code>, <code>payment.cancelled</code>, <code>payment.expired</code>.
              GeniusPay vous donnera alors un secret de signature (commençant par <code>whsec_</code>) : saisissez-le ci-dessous.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ background: '#F5F7FA', padding: '8px 10px', borderRadius: 6, fontSize: 13, wordBreak: 'break-all', flex: 1 }}>{urlWebhook}</code>
              <button style={bouton('#546E7A')} onClick={() => navigator.clipboard?.writeText(urlWebhook)}><Copy size={14} /> Copier</button>
            </div>
          </div>

          <div style={carte}>
            <div style={{ fontWeight: 700, color: '#37474F' }}>2. Vos clés GeniusPay</div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#546E7A' }}>
              Elles se trouvent dans GeniusPay → Paramètres → API. Laissez un champ vide pour conserver la valeur déjà enregistrée.
            </p>

            <label style={etiquette}>CLÉ PUBLIQUE (pk_…) {a('apiKey') && <span style={{ color: '#2E7D32' }}>— enregistrée</span>}</label>
            <input style={champ} type="password" autoComplete="off" placeholder={a('apiKey') ? config.secretConfig!.apiKey : 'pk_sandbox_… ou pk_live_…'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} />

            <label style={etiquette}>CLÉ SECRÈTE (sk_…) {a('apiSecret') && <span style={{ color: '#2E7D32' }}>— enregistrée</span>}</label>
            <input style={champ} type="password" autoComplete="off" placeholder={a('apiSecret') ? config.secretConfig!.apiSecret : 'sk_sandbox_… ou sk_live_…'} value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />

            <label style={etiquette}>SECRET DU WEBHOOK (whsec_…) {a('webhookSecret') && <span style={{ color: '#2E7D32' }}>— enregistré</span>}</label>
            <input style={champ} type="password" autoComplete="off" placeholder={a('webhookSecret') ? config.secretConfig!.webhookSecret : 'whsec_…'} value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />

            <label style={etiquette}>PAGE DE RETOUR DU CLIENT APRÈS LE PAIEMENT</label>
            <input style={champ} value={returnUrl} onChange={(e) => setReturnUrl(e.target.value)} />
          </div>

          <div style={carte}>
            <div style={{ fontWeight: 700, color: '#37474F', marginBottom: 10 }}>3. Mode</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, marginBottom: 8 }}>
              <input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} />
              Mode test (sandbox) — les paiements sont simulés, gratuits
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Proposer GeniusPay à mes clients pour payer leur licence
            </label>
            {incoherent && (
              <div style={{ marginTop: 10, color: '#C62828', fontSize: 13 }}>
                ⚠ La clé saisie ne correspond pas au mode choisi (clés de test = pk_sandbox_…, clés réelles = pk_live_…).
              </div>
            )}
            {!sandbox && (
              <div style={{ marginTop: 10, color: '#8D6E00', fontSize: 13 }}>
                Mode réel : de vrais paiements seront encaissés. Faites d&apos;abord un essai complet en mode test.
              </div>
            )}
          </div>

          <button style={bouton('#1565C0', occupe || incoherent)} disabled={occupe || incoherent} onClick={enregistrer}>
            Enregistrer
          </button>
        </>
      )}

      {retour && (
        <div role="status" style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 10, fontSize: 14,
          background: retour.ok ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${retour.ok ? '#A5D6A7' : '#FFCDD2'}`, color: retour.ok ? '#1B5E20' : '#C62828' }}>
          {retour.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} <span>{retour.texte}</span>
        </div>
      )}
    </div>
  );
}
