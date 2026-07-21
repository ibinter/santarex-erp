import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les 5 tables du module de paiement universel (préfixe `pay_`) et leurs
 * types enum Postgres. 100 % idempotente : `CREATE TABLE IF NOT EXISTS`, enums
 * créés via `DO $$ ... IF NOT EXISTS`, index `IF NOT EXISTS`. Peut donc être
 * rejouée sans erreur et cohabite avec `synchronize:true` en développement.
 *
 * Les noms de colonnes sont en camelCase (stratégie de nommage TypeORM par
 * défaut) et donc systématiquement entre guillemets doubles. Les DEFAULT et
 * types (jsonb, timestamptz, uuid_generate_v4) reproduisent exactement les
 * entités `src/payments/entities/*.ts`.
 */
export class CreatePaymentsTables1750000000000 implements MigrationInterface {
  name = 'CreatePaymentsTables1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extension pour uuid_generate_v4() (default des colonnes @PrimaryGeneratedColumn('uuid')).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Types enum (idempotents) ──────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_method_configs_type_enum') THEN
          CREATE TYPE "pay_method_configs_type_enum" AS ENUM (
            'mobile_money','gateway','bank_transfer','intl_transfer','money_transfer',
            'cash_agency','cheque','crypto','voucher','cash_on_delivery'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_method_configs_gateway_enum') THEN
          CREATE TYPE "pay_method_configs_gateway_enum" AS ENUM (
            'moneroo','cinetpay','fedapay','paystack','stripe','paypal'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_transactions_methodtype_enum') THEN
          CREATE TYPE "pay_transactions_methodtype_enum" AS ENUM (
            'mobile_money','gateway','bank_transfer','intl_transfer','money_transfer',
            'cash_agency','cheque','crypto','voucher','cash_on_delivery'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_transactions_status_enum') THEN
          CREATE TYPE "pay_transactions_status_enum" AS ENUM (
            'pending','awaiting_proof','under_review','processing','succeeded',
            'rejected','failed','expired','refunded'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_webhook_events_gateway_enum') THEN
          CREATE TYPE "pay_webhook_events_gateway_enum" AS ENUM (
            'moneroo','cinetpay','fedapay','paystack','stripe','paypal'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_webhook_events_status_enum') THEN
          CREATE TYPE "pay_webhook_events_status_enum" AS ENUM (
            'received','processed','ignored','invalid'
          );
        END IF;
      END $$;`);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pay_vouchers_status_enum') THEN
          CREATE TYPE "pay_vouchers_status_enum" AS ENUM (
            'available','used','expired','disabled'
          );
        END IF;
      END $$;`);

    // ── pay_method_configs ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_method_configs" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key"          character varying NOT NULL,
        "type"         "pay_method_configs_type_enum" NOT NULL,
        "label"        character varying,
        "enabled"      boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "gateway"      "pay_method_configs_gateway_enum",
        "publicConfig" jsonb NOT NULL DEFAULT '{}',
        "secretConfig" jsonb NOT NULL DEFAULT '{}',
        "sandbox"      boolean NOT NULL DEFAULT true,
        "instructions" text,
        "countries"    jsonb NOT NULL DEFAULT '[]',
        "offerCodes"   jsonb NOT NULL DEFAULT '[]',
        "currencies"   jsonb NOT NULL DEFAULT '[]',
        "createdAt"    TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pay_method_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_method_configs_key" UNIQUE ("key")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_method_configs_key" ON "pay_method_configs" ("key")`,
    );

    // ── pay_transactions ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_transactions" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reference"            character varying NOT NULL,
        "tenantId"             character varying NOT NULL,
        "tenantSlug"           character varying NOT NULL,
        "licenceId"            character varying,
        "offreCode"            character varying,
        "methodType"           "pay_transactions_methodtype_enum" NOT NULL,
        "methodKey"            character varying NOT NULL,
        "status"               "pay_transactions_status_enum" NOT NULL DEFAULT 'pending',
        "amountExpected"       integer NOT NULL,
        "amountReceived"       integer,
        "currency"             character varying NOT NULL DEFAULT 'XOF',
        "gatewayTransactionId" character varying,
        "paymentUrl"           text,
        "clientReference"      character varying,
        "payerName"            character varying,
        "payerEmail"           character varying,
        "payerPhone"           character varying,
        "reviewedById"         character varying,
        "reviewedAt"           TIMESTAMP WITH TIME ZONE,
        "reviewNotes"          text,
        "expiresAt"            TIMESTAMP WITH TIME ZONE,
        "metadata"             jsonb NOT NULL DEFAULT '{}',
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pay_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_transactions_reference" UNIQUE ("reference")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_transactions_reference" ON "pay_transactions" ("reference")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_transactions_tenantId" ON "pay_transactions" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_transactions_status" ON "pay_transactions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_transactions_gatewayTransactionId" ON "pay_transactions" ("gatewayTransactionId")`,
    );

    // ── pay_proofs ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_proofs" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" character varying NOT NULL,
        "storagePath"   character varying NOT NULL,
        "originalName"  character varying NOT NULL,
        "mimeType"      character varying NOT NULL,
        "sizeBytes"     integer NOT NULL,
        "sha256"        character varying(64) NOT NULL,
        "uploadedById"  character varying,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pay_proofs" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_proofs_transactionId" ON "pay_proofs" ("transactionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_proofs_sha256" ON "pay_proofs" ("sha256")`,
    );

    // ── pay_webhook_events ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_webhook_events" (
        "id"                   uuid NOT NULL DEFAULT uuid_generate_v4(),
        "gateway"              "pay_webhook_events_gateway_enum" NOT NULL,
        "eventId"              character varying NOT NULL,
        "status"               "pay_webhook_events_status_enum" NOT NULL DEFAULT 'received',
        "transactionReference" character varying,
        "signatureValid"       boolean NOT NULL DEFAULT false,
        "payload"              jsonb NOT NULL DEFAULT '{}',
        "processedAt"          TIMESTAMP WITH TIME ZONE,
        "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pay_webhook_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_webhook_events_gateway_eventId" UNIQUE ("gateway", "eventId")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_webhook_events_eventId" ON "pay_webhook_events" ("eventId")`,
    );

    // ── pay_vouchers ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pay_vouchers" (
        "id"             uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code"           character varying NOT NULL,
        "batchId"        character varying,
        "value"          integer NOT NULL DEFAULT 0,
        "currency"       character varying NOT NULL DEFAULT 'XOF',
        "offerCode"      character varying,
        "durationDays"   integer NOT NULL DEFAULT 0,
        "status"         "pay_vouchers_status_enum" NOT NULL DEFAULT 'available',
        "expiresAt"      TIMESTAMP WITH TIME ZONE,
        "usedByTenantId" character varying,
        "usedAt"         TIMESTAMP WITH TIME ZONE,
        "resellerRef"    character varying,
        "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pay_vouchers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pay_vouchers_code" UNIQUE ("code")
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_vouchers_code" ON "pay_vouchers" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_pay_vouchers_batchId" ON "pay_vouchers" ("batchId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_vouchers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_webhook_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_proofs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pay_method_configs"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "pay_vouchers_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_webhook_events_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_webhook_events_gateway_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_transactions_methodtype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_method_configs_gateway_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pay_method_configs_type_enum"`);
  }
}
