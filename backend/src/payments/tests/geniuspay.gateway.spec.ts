import { createHmac } from 'crypto';
import { of } from 'rxjs';
import { GeniuspayGateway } from '../gateways/geniuspay.gateway';

const SECRET_WEBHOOK = 'whsec_test_secret';
const CLES = { apiKey: 'pk_sandbox_abc', apiSecret: 'sk_sandbox_xyz', webhookSecret: SECRET_WEBHOOK };

function creer(reponse: any = { data: { success: true, data: { reference: 'MTX-0000000001', checkout_url: 'https://pay.geniuspay.ci/c/1' } } }) {
  const http: any = { post: jest.fn().mockReturnValue(of(reponse)), get: jest.fn().mockReturnValue(of(reponse)) };
  return { gw: new GeniuspayGateway(http), http };
}

const tx = (extra: any = {}): any => ({
  reference: 'PAY-2026-000123', amountExpected: 7_500_000, currency: 'XOF', tenantSlug: 'clinique-a',
  payerName: 'Awa Koné', payerEmail: 'awa@x.ci', payerPhone: '+2250700000000', ...extra,
});

/** Fabrique un webhook signé exactement comme GeniusPay (HMAC-SHA256 de « timestamp.corps »). */
function webhook(payload: object, opts: { secret?: string; ts?: number; signature?: string } = {}) {
  const corps = JSON.stringify(payload);
  const ts = String(opts.ts ?? Math.floor(Date.now() / 1000));
  const signature = opts.signature ?? createHmac('sha256', opts.secret ?? SECRET_WEBHOOK).update(`${ts}.${corps}`).digest('hex');
  return { corps, headers: { 'X-Webhook-Signature': signature, 'X-Webhook-Timestamp': ts } };
}

const succes = { id: 'evt_1', event: 'payment.success', data: { reference: 'MTX-0000000001', amount: 75000, status: 'completed', metadata: { reference: 'PAY-2026-000123' } } };

describe('GeniuspayGateway — webhook', () => {
  const { gw } = creer();

  it('accepte un webhook correctement signé et le normalise (montant en centimes)', () => {
    const w = webhook(succes);
    const r = gw.verifyWebhook(w.corps, w.headers, CLES);
    expect(r).toEqual({ valid: true, eventId: 'evt_1', reference: 'PAY-2026-000123', amount: 7_500_000, status: 'succeeded' });
  });

  it('refuse une signature fausse', () => {
    const w = webhook(succes, { signature: 'a'.repeat(64) });
    expect(gw.verifyWebhook(w.corps, w.headers, CLES).valid).toBe(false);
  });

  it('refuse un webhook signé avec un autre secret', () => {
    const w = webhook(succes, { secret: 'whsec_autre' });
    expect(gw.verifyWebhook(w.corps, w.headers, CLES).valid).toBe(false);
  });

  it('refuse un corps modifié après signature (montant falsifié)', () => {
    const w = webhook(succes);
    const falsifie = w.corps.replace('75000', '1');
    expect(gw.verifyWebhook(falsifie, w.headers, CLES).valid).toBe(false);
  });

  it('refuse un webhook rejoué : horodatage vieux de plus de 5 minutes', () => {
    const w = webhook(succes, { ts: Math.floor(Date.now() / 1000) - 301 });
    expect(gw.verifyWebhook(w.corps, w.headers, CLES).valid).toBe(false);
  });

  it('refuse un horodatage dans le futur lointain', () => {
    const w = webhook(succes, { ts: Math.floor(Date.now() / 1000) + 3600 });
    expect(gw.verifyWebhook(w.corps, w.headers, CLES).valid).toBe(false);
  });

  it('refuse quand le secret ou les en-têtes manquent', () => {
    const w = webhook(succes);
    expect(gw.verifyWebhook(w.corps, w.headers, { ...CLES, webhookSecret: '' }).valid).toBe(false);
    expect(gw.verifyWebhook(w.corps, {}, CLES).valid).toBe(false);
  });

  it('accepte le Buffer comme corps brut (comme le contrôleur le transmet)', () => {
    const w = webhook(succes);
    expect(gw.verifyWebhook(Buffer.from(w.corps), w.headers, CLES).valid).toBe(true);
  });

  it.each([
    ['payment.failed', 'failed'],
    ['payment.cancelled', 'failed'],
    ['payment.expired', 'failed'],
    ['payment.initiated', 'pending'],
    ['payment.refunded', 'pending'],
    ['webhook.test', 'pending'],
  ])('événement %s → %s', (evenement, attendu) => {
    const w = webhook({ ...succes, event: evenement });
    expect(gw.verifyWebhook(w.corps, w.headers, CLES).status).toBe(attendu);
  });
});

describe('GeniuspayGateway — création du paiement', () => {
  it('envoie un montant en XOF entiers, les clés en en-têtes et renvoie la page de paiement', async () => {
    const { gw, http } = creer();
    const r = await gw.initiate(tx(), CLES, true);
    expect(r).toEqual({ gatewayTransactionId: 'MTX-0000000001', paymentUrl: 'https://pay.geniuspay.ci/c/1' });
    const [url, body, options] = http.post.mock.calls[0];
    expect(url).toBe('https://geniuspay.ci/api/v1/merchant/payments');
    expect(body.amount).toBe(75000); // 7 500 000 centimes → 75 000 XOF
    expect(body.metadata.reference).toBe('PAY-2026-000123');
    expect(options.headers['X-API-Key']).toBe('pk_sandbox_abc');
    expect(options.headers['X-API-Secret']).toBe('sk_sandbox_xyz');
  });

  it('refuse un montant inférieur au minimum de 200 XOF', async () => {
    const { gw } = creer();
    await expect(gw.initiate(tx({ amountExpected: 15_000 }), CLES, true)).rejects.toThrow(/minimum/);
  });

  it('refuse une devise autre que XOF', async () => {
    const { gw } = creer();
    await expect(gw.initiate(tx({ currency: 'EUR' }), CLES, true)).rejects.toThrow(/XOF/);
  });

  it('refuse une clé de test en production, et une clé de production en test', async () => {
    const { gw } = creer();
    await expect(gw.initiate(tx(), CLES, false)).rejects.toThrow(/production/);
    await expect(gw.initiate(tx(), { ...CLES, apiKey: 'pk_live_abc' }, true)).rejects.toThrow(/sandbox/);
  });

  it('refuse quand les clés manquent', async () => {
    const { gw } = creer();
    await expect(gw.initiate(tx(), {}, true)).rejects.toThrow(/manquant/);
  });

  it('échoue proprement quand GeniusPay répond une erreur', async () => {
    const { gw } = creer({ data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'amount invalide' } } });
    await expect(gw.initiate(tx(), CLES, true)).rejects.toThrow(/amount invalide/);
  });
});

describe('GeniuspayGateway — contrôle du statut', () => {
  it.each([
    ['completed', 'succeeded'],
    ['failed', 'failed'],
    ['cancelled', 'failed'],
    ['expired', 'failed'],
    ['pending', 'pending'],
    ['processing', 'pending'],
  ])('statut API %s → %s', async (statut, attendu) => {
    const { gw, http } = creer({ data: { success: true, data: { status: statut, amount: 75000, metadata: { reference: 'PAY-2026-000123' } } } });
    const r = await gw.verifyStatus('MTX-0000000001', CLES, true);
    expect(r).toEqual({ status: attendu, amount: 7_500_000, reference: 'PAY-2026-000123' });
    expect(http.get.mock.calls[0][0]).toBe('https://geniuspay.ci/api/v1/merchant/payments/MTX-0000000001');
  });
});
