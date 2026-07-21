// ════════════════════════════════════════════════════════════════════════════
//  Module de paiement universel IBIG Soft — énumérations partagées (contrat).
//  Adapté à SANTAREX (NestJS + TypeORM). Ne modifie pas les enums Postgres
//  existants (paiements_saas) — ce module a ses propres tables préfixées `pay_`.
// ════════════════════════════════════════════════════════════════════════════

/** Famille de moyen de paiement. */
export enum PaymentMethodType {
  MOBILE_MONEY = 'mobile_money',       // manuel, preuve uploadée
  GATEWAY = 'gateway',                 // électronique, confirmation par webhook
  BANK_TRANSFER = 'bank_transfer',     // virement national, preuve
  INTL_TRANSFER = 'intl_transfer',     // virement SWIFT/IBAN, preuve
  MONEY_TRANSFER = 'money_transfer',   // Western Union / MoneyGram / Ria, MTCN
  CASH_AGENCY = 'cash_agency',         // espèces en agence / point partenaire
  CHEQUE = 'cheque',                   // chèque bancaire
  CRYPTO = 'crypto',                   // USDT / BTC / ETH, hash de tx
  VOUCHER = 'voucher',                 // code prépayé à usage unique
  CASH_ON_DELIVERY = 'cash_on_delivery', // paiement à la livraison
}

/** Un flux manuel = preuve + validation admin ; un flux auto = webhook vérifié. */
export function isManualFlow(t: PaymentMethodType): boolean {
  return t !== PaymentMethodType.GATEWAY;
}

/** Passerelles électroniques supportées (adaptateurs). */
export enum PaymentGateway {
  MONEROO = 'moneroo',
  CINETPAY = 'cinetpay',
  FEDAPAY = 'fedapay',
  PAYSTACK = 'paystack',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

/** Opérateurs Mobile Money (pour un provider MOBILE_MONEY). */
export enum MobileMoneyOperator {
  ORANGE = 'orange',
  MTN = 'mtn',
  WAVE = 'wave',
  MOOV = 'moov',
  AIRTEL = 'airtel',
}

/** Cryptos supportées (pour un provider CRYPTO). */
export enum CryptoAsset {
  USDT = 'usdt',
  BTC = 'btc',
  ETH = 'eth',
}

/** Statut d'une transaction de paiement. */
export enum PaymentStatus {
  PENDING = 'pending',             // créée, en attente d'action client
  AWAITING_PROOF = 'awaiting_proof', // méthode manuelle, preuve non fournie
  UNDER_REVIEW = 'under_review',   // preuve fournie, en attente de validation admin
  PROCESSING = 'processing',       // passerelle : paiement lancé, webhook attendu
  SUCCEEDED = 'succeeded',         // confirmé (webhook vérifié ou admin) → licence activable
  REJECTED = 'rejected',           // refusé par l'admin
  FAILED = 'failed',               // échec passerelle
  EXPIRED = 'expired',             // commande non payée expirée
  REFUNDED = 'refunded',           // remboursé
}

/** Cycle de vie complet d'une licence (étend LicenceStatut existant). */
export enum LicenceLifecycle {
  TRIAL = 'trial',                 // essai gratuit
  AWAITING_PAYMENT = 'awaiting_payment',
  PROVISIONAL = 'provisional',     // provisoire accordée par admin (max 14j)
  ACTIVE = 'active',
  GRACE = 'grace',                 // grâce après expiration (défaut 7j)
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

/** Statut d'un voucher / code prépayé. */
export enum VoucherStatus {
  AVAILABLE = 'available',
  USED = 'used',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

/** Statut d'un événement webhook (idempotence). */
export enum WebhookStatus {
  RECEIVED = 'received',
  PROCESSED = 'processed',
  IGNORED = 'ignored',   // doublon / non pertinent
  INVALID = 'invalid',   // signature invalide
}
