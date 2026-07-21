import { createHmac } from 'crypto';
import { PaymentGateway } from '../payments.enums';
import {
  headerValue,
  rawBodyString,
  safeEqualHex,
  WebhookHeaders,
  WebhookVerification,
} from '../gateways/gateway.interface';

/**
 * Webhooks passerelle — sécurité & idempotence.
 *
 * On éprouve ici les HELPERS de sécurité RÉELS partagés par tous les adaptateurs
 * (`gateway.interface.ts` : HMAC hex à temps constant, lecture d'en-tête insensible
 * à la casse, corps brut). On reproduit la vérification Paystack telle qu'implémentée
 * par `PaystackGateway.verifyWebhook` (HMAC-SHA512 du corps BRUT avec la secret key),
 * sans dépendre de `@nestjs/axios` requis par l'adaptateur concret.
 *
 * Scénarios :
 *  - signature invalide rejetée (valid=false) — aucune activation ;
 *  - corps altéré rejeté même avec la signature de l'original ;
 *  - signature valide acceptée + montant/statut normalisés ;
 *  - montant incorrect détectable (amount ≠ amountExpected) → non activable ;
 *  - idempotence : deux livraisons du même eventId n'activent qu'UNE fois
 *    (eventId stable + contrainte unique (gateway,eventId) de pay_webhook_events).
 */

const secretKey = 'sk_test_santarex_demo';
const REFERENCE = 'PAY-2026-000042';
const AMOUNT = 5_000_000; // centimes / kobo

const payload = JSON.stringify({
  event: 'charge.success',
  data: { id: 'evt_123456', reference: REFERENCE, amount: AMOUNT, status: 'success' },
});

const sign = (body: string) => createHmac('sha512', secretKey).update(body).digest('hex');

/** Réplique fidèle de PaystackGateway.verifyWebhook (helpers réels). */
function verifyPaystackWebhook(
  rawBody: Buffer | string,
  headers: WebhookHeaders,
  secret: string,
): WebhookVerification {
  const invalid: WebhookVerification = {
    valid: false, eventId: '', reference: '', amount: 0, status: 'pending',
  };
  const raw = rawBodyString(rawBody);
  const signature = headerValue(headers, 'x-paystack-signature');
  if (!secret || !signature) return invalid;

  const expected = createHmac('sha512', secret).update(raw).digest('hex');
  if (!safeEqualHex(expected, signature)) return invalid;

  const p = JSON.parse(raw);
  const d = p?.data ?? {};
  const status =
    p?.event === 'charge.success' || d?.status === 'success' ? 'succeeded' : 'pending';
  return {
    valid: true,
    eventId: String(d?.id ?? d?.reference ?? ''),
    reference: d?.reference ?? '',
    amount: Number(d?.amount ?? 0),
    status,
  };
}

describe('Webhook passerelle (Paystack) — signature & idempotence', () => {
  it('rejette une signature invalide (valid=false), sans donnée exploitable', () => {
    const res = verifyPaystackWebhook(
      Buffer.from(payload),
      { 'x-paystack-signature': 'deadbeef' },
      secretKey,
    );
    expect(res.valid).toBe(false);
    expect(res.status).toBe('pending');
  });

  it('rejette un corps altéré même avec la signature valide de l\'original', () => {
    const goodSigForOriginal = sign(payload);
    const tampered = payload.replace(String(AMOUNT), '999999999'); // montant gonflé
    const res = verifyPaystackWebhook(
      Buffer.from(tampered),
      { 'X-Paystack-Signature': goodSigForOriginal }, // casse volontairement différente
      secretKey,
    );
    expect(res.valid).toBe(false);
  });

  it('accepte une signature valide et normalise référence, montant et statut', () => {
    const res = verifyPaystackWebhook(
      Buffer.from(payload),
      { 'x-paystack-signature': sign(payload) },
      secretKey,
    );
    expect(res.valid).toBe(true);
    expect(res.reference).toBe(REFERENCE);
    expect(res.amount).toBe(AMOUNT);
    expect(res.status).toBe('succeeded');
    expect(res.eventId).toBe('evt_123456');
  });

  it('permet de détecter un montant incorrect (amount ≠ amountExpected) → non activable', () => {
    const res = verifyPaystackWebhook(
      Buffer.from(payload),
      { 'x-paystack-signature': sign(payload) },
      secretKey,
    );
    const amountExpected = 6_000_000; // attendu différent du reçu
    const activable = res.valid && res.amount === amountExpected;
    expect(activable).toBe(false);
  });

  it('idempotence : deux livraisons du même eventId n\'activent qu\'une fois', () => {
    // Modélise la contrainte unique (gateway, eventId) de pay_webhook_events :
    // le second traitement du même événement est ignoré.
    const processedKeys = new Set<string>();
    const activate = jest.fn();

    const deliver = (body: string) => {
      const res = verifyPaystackWebhook(
        Buffer.from(body),
        { 'x-paystack-signature': sign(body) },
        secretKey,
      );
      if (!res.valid) return;
      const key = `${PaymentGateway.PAYSTACK}:${res.eventId}`;
      if (processedKeys.has(key)) return; // doublon → ignoré (aucune activation)
      processedKeys.add(key);
      activate(res.reference);
    };

    deliver(payload); // 1re livraison
    deliver(payload); // rejeu (retry passerelle)

    expect(activate).toHaveBeenCalledTimes(1);
    expect(activate).toHaveBeenCalledWith(REFERENCE);
  });
});
