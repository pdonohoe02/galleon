import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";

import {
  DEMO_IDS,
  DEMO_SOURCE,
  entitlementClaimsSchema,
  formatUsd,
  type EntitlementClaims,
  type OfferPresentationClaims,
  type PurchaseOfferInput,
} from "@galleon/contracts";
import {
  signEntitlement,
  signOfferPresentation,
  verifyEntitlement,
  verifyOfferPresentation,
} from "@galleon/crypto";

import { createDatabase } from "./connection";

const DATABASE_URL = "postgresql://galleon:galleon@127.0.0.1:5432/galleon";
const PUBLISHER_ORIGIN = "http://127.0.0.1:3001";
const MCP_AUDIENCE = "galleon-wallet-mcp";
const SEED_TRANSACTION_ID = "00000000-0000-4000-8000-000000000009";
const SEED_DEBIT_ID = "00000000-0000-4000-8000-000000000010";
const SEED_CREDIT_ID = "00000000-0000-4000-8000-000000000011";

// What a freshly signed-up consumer starts with. Mirrors the demo seed so the
// first session looks the same whether you are the seeded wallet or a new user.
const SIGNUP_GRANT_MINOR = 500;
const SIGNUP_MAX_PER_PURCHASE_MINOR = 100;
const SIGNUP_MAX_DAILY_SPEND_MINOR = 500;

export type UserKind = "consumer" | "publisher";

export type UserRecord = {
  id: string;
  email: string;
  kind: UserKind;
  /** The consumer wallet this user owns; null for publishers. */
  wallet_id: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  return (
    typeof error === "object" && error !== null &&
    (error as { code?: string }).code === "23505" &&
    (error as { constraint_name?: string }).constraint_name === constraint
  );
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function issuer(): string {
  return process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";
}

function pairwiseSecret(): string {
  const configured = process.env.GALLEON_PAIRWISE_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("GALLEON_PAIRWISE_SECRET is required in production.");
  }
  return "galleon-local-pairwise-secret-not-for-production";
}

function pairwiseSubject(walletId: string, origin: string): string {
  return createHmac("sha256", pairwiseSecret())
    .update(`${walletId}\u0000${origin}`)
    .digest("base64url");
}

export class GalleonServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly retryable = false,
  ) {
    super(message);
  }
}

type OfferRow = {
  offer_id: string;
  resource_id: string;
  publisher_id: string;
  publisher_name: string;
  publisher_origin: string;
  canonical_url: string;
  title: string;
  description: string;
  authors: string[];
  published_at: Date | string;
  content_type: string;
  language: string;
  topics: string[];
  questions_answered: string[];
  citation: { display_text: string; canonical_url: string };
  content_sha256: string;
  amount_minor: number;
  currency: "USD";
  access_duration_seconds: number;
  citation_required: boolean;
};

type StoredPurchaseResult = {
  status: "purchased" | "already_purchased";
  transaction_id: string | null;
  purchase_id: string;
  purchased_at: string;
  source: {
    resource_id: string;
    canonical_url: string;
    title: string;
    publisher_name: string;
  };
  payment: {
    amount_minor: number;
    currency: "USD";
    display_price: string;
    charged: boolean;
  };
  wallet: { balance_minor: number; display_balance: string; mode: "demo" };
  entitlement_claims: EntitlementClaims;
};

export type PurchaseResult = Omit<StoredPurchaseResult, "entitlement_claims"> & {
  entitlement: {
    token: string;
    expires_at: string;
    audience: string;
    resource_id: string;
  };
};

export function createGalleonService(
  databaseUrl = process.env.DATABASE_URL ?? DATABASE_URL,
) {
  const database = createDatabase(databaseUrl);
  const { client } = database;
  let seedPromise: Promise<void> | undefined;

  async function ensureDemoData(): Promise<void> {
    if (seedPromise) return seedPromise;

    seedPromise = client.begin(async (sql) => {
      await sql`
        INSERT INTO publishers (id, name, status)
        VALUES (${DEMO_IDS.publisher}, 'Northline Review', 'active')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active', updated_at = now()
      `;
      await sql`
        INSERT INTO publisher_origins (id, publisher_id, origin, verified)
        VALUES ('00000000-0000-4000-8000-000000000012', ${DEMO_IDS.publisher}, ${PUBLISHER_ORIGIN}, true)
        ON CONFLICT (origin) DO UPDATE SET verified = true, updated_at = now()
      `;
      await sql`
        INSERT INTO wallets (id, owner_type, publisher_id, public_ref, currency, mode)
        VALUES
          (${DEMO_IDS.consumerWallet}, 'consumer', NULL, 'wallet_demo_consumer', 'USD', 'demo'),
          (${DEMO_IDS.publisherWallet}, 'publisher', ${DEMO_IDS.publisher}, 'wallet_demo_northline', 'USD', 'demo'),
          (${DEMO_IDS.treasuryWallet}, 'treasury', NULL, 'wallet_demo_treasury', 'USD', 'demo')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        INSERT INTO wallet_policies (wallet_id, enabled, max_per_purchase_minor, max_daily_spend_minor)
        VALUES (${DEMO_IDS.consumerWallet}, true, 100, 500)
        ON CONFLICT (wallet_id) DO UPDATE SET
          enabled = EXCLUDED.enabled,
          max_per_purchase_minor = EXCLUDED.max_per_purchase_minor,
          max_daily_spend_minor = EXCLUDED.max_daily_spend_minor,
          updated_at = now()
      `;
      await sql`
        INSERT INTO resources (
          id, publisher_id, canonical_url, title, description, authors, published_at,
          content_type, mime_type, language, topics, questions_answered, citation,
          content_sha256, status
        ) VALUES (
          ${DEMO_IDS.resource}, ${DEMO_IDS.publisher}, ${DEMO_SOURCE.canonical_url},
          ${DEMO_SOURCE.title}, ${DEMO_SOURCE.description}, ${JSON.stringify(DEMO_SOURCE.authors)}::jsonb,
          ${DEMO_SOURCE.published_at}, ${DEMO_SOURCE.content_type}, 'text/html',
          ${DEMO_SOURCE.language}, ${JSON.stringify(DEMO_SOURCE.topics)}::jsonb,
          ${JSON.stringify(DEMO_SOURCE.questions_answered)}::jsonb, ${JSON.stringify(DEMO_SOURCE.citation)}::jsonb,
          ${DEMO_SOURCE.content_sha256}, 'active'
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          content_sha256 = EXCLUDED.content_sha256,
          updated_at = now()
      `;
      await sql`
        INSERT INTO resources (
          id, publisher_id, canonical_url, title, description, authors, published_at,
          content_type, mime_type, language, topics, questions_answered, citation,
          content_sha256, status
        ) VALUES (
          ${DEMO_IDS.secondResource}, ${DEMO_IDS.publisher}, 'http://127.0.0.1:3001/field-notes',
          'Field notes: pricing small, authoritative sources',
          'A companion note on offer design for specialist publishers.',
          ${JSON.stringify(["Mara Venn"])}::jsonb, '2026-08-29T09:00:00Z', 'research_note', 'text/html', 'en',
          ${JSON.stringify(["publisher economics"])}::jsonb, ${JSON.stringify(["How should a specialist source be priced?"])}::jsonb,
          ${JSON.stringify({ display_text: "Venn, M. (2026). Field notes. Northline Review.", canonical_url: "http://127.0.0.1:3001/field-notes" })}::jsonb,
          'cfda1708f3140b2dd5d6fc1ac4de66942ee870f25c46d5d8fcb324c811cf4533', 'active'
        ) ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        INSERT INTO offers (
          id, resource_id, publisher_id, amount_minor, currency,
          access_duration_seconds, citation_required, status
        ) VALUES
          (${DEMO_IDS.offer}, ${DEMO_IDS.resource}, ${DEMO_IDS.publisher}, 7, 'USD', 86400, true, 'active'),
          (${DEMO_IDS.secondOffer}, ${DEMO_IDS.secondResource}, ${DEMO_IDS.publisher}, 12, 'USD', 86400, true, 'active')
        ON CONFLICT (id) DO UPDATE SET amount_minor = EXCLUDED.amount_minor, status = 'active', updated_at = now()
      `;
      await sql`
        INSERT INTO ledger_transactions (id, kind, status, idempotency_key)
        VALUES (${SEED_TRANSACTION_ID}, 'demo_seed', 'posted', 'demo-seed-v1')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        INSERT INTO ledger_entries (id, transaction_id, wallet_id, amount_minor, currency)
        VALUES
          (${SEED_DEBIT_ID}, ${SEED_TRANSACTION_ID}, ${DEMO_IDS.treasuryWallet}, -500, 'USD'),
          (${SEED_CREDIT_ID}, ${SEED_TRANSACTION_ID}, ${DEMO_IDS.consumerWallet}, 500, 'USD')
        ON CONFLICT (id) DO NOTHING
      `;
    }).then(() => undefined);

    try {
      await seedPromise;
    } catch (error) {
      seedPromise = undefined;
      throw error;
    }
  }

  async function getOfferRow(resourceId: string): Promise<OfferRow> {
    const rows = await client<OfferRow[]>`
      SELECT
        o.id AS offer_id, r.id AS resource_id, r.publisher_id, p.name AS publisher_name,
        po.origin AS publisher_origin, r.canonical_url, r.title, r.description, r.authors,
        r.published_at, r.content_type, r.language, r.topics, r.questions_answered,
        r.citation, r.content_sha256, o.amount_minor, o.currency,
        o.access_duration_seconds, o.citation_required
      FROM offers o
      JOIN resources r ON r.id = o.resource_id
      JOIN publishers p ON p.id = r.publisher_id
      JOIN publisher_origins po ON po.publisher_id = p.id AND po.verified = true
      WHERE r.id = ${resourceId} AND r.status = 'active' AND o.status = 'active'
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) throw new GalleonServiceError("OFFER_UNAVAILABLE", "No active offer exists for this source.", 404);
    return row;
  }

  async function createOfferPresentation(input: {
    resourceId: string;
    redemptionNonce: string;
    publisherSessionHash: string;
  }) {
    await ensureDemoData();
    const row = await getOfferRow(input.resourceId);
    if (input.redemptionNonce.length < 22 || !/^[a-f0-9]{64}$/.test(input.publisherSessionHash)) {
      throw new GalleonServiceError("PRESENTATION_INVALID", "The publisher session binding is invalid.");
    }

    const iat = nowSeconds();
    const exp = iat + 300;
    const claims: OfferPresentationClaims = {
      iss: issuer(), aud: MCP_AUDIENCE, sub: row.publisher_id, iat, exp, jti: randomUUID(),
      version: "galleon.offer.v1", offer_id: row.offer_id, resource_id: row.resource_id,
      publisher_id: row.publisher_id, publisher_origin: row.publisher_origin,
      canonical_url: row.canonical_url, title: row.title, description: row.description,
      questions_answered: row.questions_answered, citation: row.citation,
      content_sha256: row.content_sha256, amount_minor: row.amount_minor,
      currency: "USD", redemption_nonce: input.redemptionNonce,
      rights: {
        access: "read", agent_grounding: true, citation_required: row.citation_required,
        access_duration_seconds: row.access_duration_seconds,
      },
    };

    await client`
      INSERT INTO offer_presentations (
        id, jti, offer_id, resource_id, publisher_id, publisher_origin,
        redemption_nonce_hash, publisher_session_hash, expires_at
      ) VALUES (
        ${randomUUID()}, ${claims.jti}, ${row.offer_id}, ${row.resource_id}, ${row.publisher_id},
        ${row.publisher_origin}, ${sha256(input.redemptionNonce)}, ${input.publisherSessionHash},
        ${new Date(exp * 1000).toISOString()}
      )
    `;

    return {
      status: "offer_available" as const,
      source: {
        resource_id: row.resource_id, canonical_url: row.canonical_url, title: row.title,
        description: row.description, publisher_name: row.publisher_name, authors: row.authors,
        published_at: new Date(row.published_at).toISOString(), content_type: row.content_type,
        language: row.language, topics: row.topics, questions_answered: row.questions_answered,
        citation: row.citation,
      },
      offer: {
        amount_minor: row.amount_minor, currency: "USD" as const,
        display_price: formatUsd(row.amount_minor), rights: claims.rights,
        expires_at: new Date(exp * 1000).toISOString(),
        offer_token: await signOfferPresentation(claims),
      },
    };
  }

  async function purchaseOffer(
    walletId: string,
    input: PurchaseOfferInput,
  ): Promise<PurchaseResult> {
    await ensureDemoData();
    let offer: OfferPresentationClaims;
    try {
      offer = await verifyOfferPresentation(input.offer_token, MCP_AUDIENCE);
    } catch {
      throw new GalleonServiceError("OFFER_INVALID", "The signed offer is invalid or expired.");
    }
    if (offer.iss !== issuer()) {
      throw new GalleonServiceError("OFFER_INVALID", "The offer issuer is not trusted.");
    }
    if (offer.amount_minor !== input.expected_amount_minor || offer.currency !== input.expected_currency) {
      throw new GalleonServiceError("PRICE_MISMATCH", "The signed offer does not match the expected price.", 409);
    }
    const requestHash = sha256(JSON.stringify(input));

    const stored = await client.begin(async (sql): Promise<StoredPurchaseResult> => {
      const wallets = await sql<{ id: string }[]>`SELECT id FROM wallets WHERE id = ${walletId} FOR UPDATE`;
      if (!wallets[0]) throw new GalleonServiceError("WALLET_NOT_FOUND", "The authenticated wallet does not exist.", 404);

      const retries = await sql<{ request_hash: string; response: StoredPurchaseResult }[]>`
        SELECT request_hash, response FROM idempotency_keys
        WHERE wallet_id = ${walletId} AND key = ${input.idempotency_key}
      `;
      if (retries[0]) {
        if (retries[0].request_hash !== requestHash) {
          throw new GalleonServiceError("IDEMPOTENCY_CONFLICT", "This idempotency key was used for another request.", 409);
        }
        return retries[0].response;
      }

      const presentations = await sql<{ jti: string }[]>`
        SELECT jti FROM offer_presentations
        WHERE jti = ${offer.jti} AND offer_id = ${offer.offer_id}
          AND resource_id = ${offer.resource_id} AND publisher_id = ${offer.publisher_id}
          AND publisher_origin = ${offer.publisher_origin} AND expires_at > now()
      `;
      if (!presentations[0]) throw new GalleonServiceError("OFFER_INVALID", "The offer presentation is unknown or expired.");

      const offerRows = await sql<OfferRow[]>`
        SELECT o.id AS offer_id, r.id AS resource_id, r.publisher_id, p.name AS publisher_name,
          po.origin AS publisher_origin, r.canonical_url, r.title, r.description, r.authors,
          r.published_at, r.content_type, r.language, r.topics, r.questions_answered,
          r.citation, r.content_sha256, o.amount_minor, o.currency,
          o.access_duration_seconds, o.citation_required
        FROM offers o JOIN resources r ON r.id = o.resource_id
        JOIN publishers p ON p.id = r.publisher_id
        JOIN publisher_origins po ON po.publisher_id = p.id AND po.origin = ${offer.publisher_origin}
        WHERE o.id = ${offer.offer_id} AND o.status = 'active' AND r.status = 'active'
      `;
      const active = offerRows[0];
      if (!active || active.content_sha256 !== offer.content_sha256 || active.amount_minor !== offer.amount_minor) {
        throw new GalleonServiceError("OFFER_CHANGED", "The source or offer changed before purchase.", 409);
      }

      const policies = await sql<{ enabled: boolean; max_per_purchase_minor: number; max_daily_spend_minor: number }[]>`
        SELECT enabled, max_per_purchase_minor, max_daily_spend_minor
        FROM wallet_policies WHERE wallet_id = ${walletId}
      `;
      const policy = policies[0];
      if (!policy?.enabled || offer.amount_minor > policy.max_per_purchase_minor) {
        throw new GalleonServiceError("POLICY_DENIED", "The wallet policy does not allow this purchase.", 403);
      }

      const existingRows = await sql<{
        id: string; ledger_transaction_id: string | null; purchased_at: Date | string;
      }[]>`
        SELECT id, ledger_transaction_id, purchased_at FROM purchases
        WHERE wallet_id = ${walletId} AND resource_id = ${offer.resource_id}
          AND content_sha256 = ${offer.content_sha256}
      `;
      const existing = existingRows[0];
      const balanceRows = await sql<{ balance: number }[]>`
        SELECT COALESCE(SUM(le.amount_minor), 0)::int AS balance
        FROM ledger_entries le JOIN ledger_transactions lt ON lt.id = le.transaction_id
        WHERE le.wallet_id = ${walletId} AND lt.status = 'posted'
      `;
      const currentBalance = balanceRows[0]?.balance ?? 0;
      const charged = !existing;
      if (charged && currentBalance < offer.amount_minor) {
        throw new GalleonServiceError("INSUFFICIENT_FUNDS", "The wallet has insufficient credits.", 402);
      }

      if (charged) {
        const spentRows = await sql<{ spent: number }[]>`
          SELECT COALESCE(-SUM(le.amount_minor), 0)::int AS spent
          FROM ledger_entries le JOIN ledger_transactions lt ON lt.id = le.transaction_id
          WHERE le.wallet_id = ${walletId} AND lt.kind = 'purchase' AND lt.status = 'posted'
            AND le.amount_minor < 0 AND le.created_at >= date_trunc('day', now())
        `;
        if ((spentRows[0]?.spent ?? 0) + offer.amount_minor > policy.max_daily_spend_minor) {
          throw new GalleonServiceError("POLICY_DENIED", "The wallet daily spend limit would be exceeded.", 403);
        }
      }

      const purchaseId = existing?.id ?? randomUUID();
      let transactionId = existing?.ledger_transaction_id ?? null;
      const purchasedAt = existing ? new Date(existing.purchased_at) : new Date();

      if (charged) {
        transactionId = randomUUID();
        const publisherWalletRows = await sql<{ id: string }[]>`
          SELECT id FROM wallets WHERE publisher_id = ${offer.publisher_id} FOR UPDATE
        `;
        const publisherWalletId = publisherWalletRows[0]?.id;
        if (!publisherWalletId) throw new GalleonServiceError("PUBLISHER_WALLET_MISSING", "The publisher wallet is unavailable.", 500, true);

        await sql`
          INSERT INTO ledger_transactions (id, kind, status, idempotency_key)
          VALUES (${transactionId}, 'purchase', 'pending', ${`purchase:${walletId}:${input.idempotency_key}`})
        `;
        await sql`
          INSERT INTO ledger_entries (id, transaction_id, wallet_id, amount_minor, currency)
          VALUES
            (${randomUUID()}, ${transactionId}, ${walletId}, ${-offer.amount_minor}, 'USD'),
            (${randomUUID()}, ${transactionId}, ${publisherWalletId}, ${offer.amount_minor}, 'USD')
        `;
        await sql`
          INSERT INTO purchases (
            id, wallet_id, publisher_id, resource_id, offer_id, presentation_jti,
            ledger_transaction_id, content_sha256, amount_minor, currency, purchased_at
          ) VALUES (
            ${purchaseId}, ${walletId}, ${offer.publisher_id}, ${offer.resource_id}, ${offer.offer_id},
            ${offer.jti}, ${transactionId}, ${offer.content_sha256}, ${offer.amount_minor}, 'USD', ${purchasedAt.toISOString()}
          )
        `;
        await sql`UPDATE ledger_transactions SET status = 'posted', updated_at = now() WHERE id = ${transactionId}`;
      }

      const entitlementIat = nowSeconds();
      const entitlementExp = entitlementIat + 300;
      const entitlementClaims: EntitlementClaims = {
        iss: issuer(), aud: offer.publisher_origin,
        sub: pairwiseSubject(walletId, offer.publisher_origin), iat: entitlementIat,
        exp: entitlementExp, jti: randomUUID(), version: "galleon.entitlement.v1",
        transaction_id: transactionId, purchase_id: purchaseId, offer_id: offer.offer_id,
        offer_presentation_jti: offer.jti, resource_id: offer.resource_id,
        publisher_id: offer.publisher_id, canonical_url: offer.canonical_url,
        content_sha256: offer.content_sha256, redemption_nonce: offer.redemption_nonce,
        rights: ["read"], amount_minor: offer.amount_minor, currency: "USD",
      };
      await sql`
        INSERT INTO entitlements (
          id, jti, purchase_id, presentation_jti, publisher_origin, claims, status, expires_at
        ) VALUES (
          ${randomUUID()}, ${entitlementClaims.jti}, ${purchaseId}, ${offer.jti},
          ${offer.publisher_origin}, ${JSON.stringify(entitlementClaims)}::jsonb, 'issued',
          ${new Date(entitlementExp * 1000).toISOString()}
        )
      `;

      const response: StoredPurchaseResult = {
        status: charged ? "purchased" : "already_purchased",
        transaction_id: transactionId,
        purchase_id: purchaseId,
        purchased_at: purchasedAt.toISOString(),
        source: {
          resource_id: offer.resource_id, canonical_url: offer.canonical_url,
          title: offer.title, publisher_name: active.publisher_name,
        },
        payment: {
          amount_minor: offer.amount_minor, currency: "USD",
          display_price: formatUsd(offer.amount_minor), charged,
        },
        wallet: {
          balance_minor: currentBalance - (charged ? offer.amount_minor : 0),
          display_balance: formatUsd(currentBalance - (charged ? offer.amount_minor : 0)),
          mode: "demo",
        },
        entitlement_claims: entitlementClaims,
      };
      await sql`
        INSERT INTO idempotency_keys (wallet_id, key, request_hash, response)
        VALUES (${walletId}, ${input.idempotency_key}, ${requestHash}, ${JSON.stringify(response)}::jsonb)
      `;
      return response;
    });

    const claims = entitlementClaimsSchema.parse(stored.entitlement_claims);
    const { entitlement_claims: _claims, ...response } = stored;
    return {
      ...response,
      entitlement: {
        token: await signEntitlement(claims),
        expires_at: new Date(claims.exp * 1000).toISOString(),
        audience: claims.aud,
        resource_id: claims.resource_id,
      },
    };
  }

  async function redeemEntitlement(input: {
    entitlementToken: string;
    resourceId: string;
    publisherOrigin: string;
    redemptionNonce: string;
    publisherSessionHash: string;
  }) {
    await ensureDemoData();
    let claims: EntitlementClaims;
    try {
      claims = await verifyEntitlement(input.entitlementToken, input.publisherOrigin);
    } catch {
      throw new GalleonServiceError("ENTITLEMENT_INVALID", "The entitlement is invalid or expired.");
    }
    if (
      claims.iss !== issuer() || claims.resource_id !== input.resourceId ||
      claims.redemption_nonce !== input.redemptionNonce
    ) {
      throw new GalleonServiceError("ENTITLEMENT_MISMATCH", "The entitlement does not match this source session.", 403);
    }

    return client.begin(async (sql) => {
      const entitlementRows = await sql<{ id: string; status: string; claims: EntitlementClaims }[]>`
        SELECT id, status, claims FROM entitlements
        WHERE jti = ${claims.jti} AND purchase_id = ${claims.purchase_id} FOR UPDATE
      `;
      const entitlement = entitlementRows[0];
      if (!entitlement) throw new GalleonServiceError("ENTITLEMENT_UNKNOWN", "The entitlement was not issued by this Galleon instance.", 404);

      const presentations = await sql<{ publisher_session_hash: string; redemption_nonce_hash: string }[]>`
        SELECT publisher_session_hash, redemption_nonce_hash FROM offer_presentations
        WHERE jti = ${claims.offer_presentation_jti}
          AND resource_id = ${claims.resource_id} AND publisher_origin = ${input.publisherOrigin}
      `;
      const presentation = presentations[0];
      if (
        !presentation || presentation.publisher_session_hash !== input.publisherSessionHash ||
        presentation.redemption_nonce_hash !== sha256(input.redemptionNonce)
      ) {
        throw new GalleonServiceError("SESSION_MISMATCH", "The entitlement belongs to another publisher session.", 403);
      }

      if (entitlement.status === "redeemed") {
        const prior = await sql<{ publisher_session_hash: string }[]>`
          SELECT publisher_session_hash FROM redemptions WHERE entitlement_id = ${entitlement.id}
        `;
        if (prior[0]?.publisher_session_hash !== input.publisherSessionHash) {
          throw new GalleonServiceError("ENTITLEMENT_REPLAYED", "This entitlement was already redeemed in another session.", 409);
        }
        return { status: "already_redeemed" as const, claims };
      }
      if (entitlement.status !== "issued") {
        throw new GalleonServiceError("ENTITLEMENT_INVALID", "This entitlement is not redeemable.", 409);
      }

      await sql`
        INSERT INTO redemptions (id, entitlement_id, publisher_session_hash)
        VALUES (${randomUUID()}, ${entitlement.id}, ${input.publisherSessionHash})
      `;
      await sql`UPDATE entitlements SET status = 'redeemed' WHERE id = ${entitlement.id}`;
      return { status: "redeemed" as const, claims };
    });
  }

  // ---- Accounts -----------------------------------------------------------
  //
  // Password hashing and cookie handling live in platform-web; this layer only
  // persists users and sessions. Sessions are keyed by the SHA-256 of the
  // cookie token, so a leaked row is not a usable credential.

  async function createUser(input: { email: string; password_hash: string; kind: UserKind }): Promise<UserRecord> {
    await ensureDemoData();
    const email = normalizeEmail(input.email);
    const userId = randomUUID();
    const walletId = input.kind === "consumer" ? randomUUID() : null;

    try {
      await client.begin(async (sql) => {
        await sql`
          INSERT INTO users (id, email, password_hash, kind)
          VALUES (${userId}, ${email}, ${input.password_hash}, ${input.kind})
        `;
        if (walletId) {
          // A new consumer gets a funded wallet so the first session is not an
          // empty screen. Funding is a real ledger transaction from treasury,
          // the same shape as the demo seed, so the books stay balanced.
          const transactionId = randomUUID();
          await sql`
            INSERT INTO wallets (id, owner_type, owner_user_id, publisher_id, public_ref, currency, mode)
            VALUES (${walletId}, 'consumer', ${userId}, NULL, ${`wallet_${walletId}`}, 'USD', 'demo')
          `;
          await sql`
            INSERT INTO wallet_policies (wallet_id, enabled, max_per_purchase_minor, max_daily_spend_minor)
            VALUES (${walletId}, true, ${SIGNUP_MAX_PER_PURCHASE_MINOR}, ${SIGNUP_MAX_DAILY_SPEND_MINOR})
          `;
          await sql`
            INSERT INTO ledger_transactions (id, kind, status, idempotency_key)
            VALUES (${transactionId}, 'signup_grant', 'posted', ${`signup:${userId}`})
          `;
          await sql`
            INSERT INTO ledger_entries (id, transaction_id, wallet_id, amount_minor, currency)
            VALUES
              (${randomUUID()}, ${transactionId}, ${DEMO_IDS.treasuryWallet}, ${-SIGNUP_GRANT_MINOR}, 'USD'),
              (${randomUUID()}, ${transactionId}, ${walletId}, ${SIGNUP_GRANT_MINOR}, 'USD')
          `;
        }
      });
    } catch (error) {
      if (isUniqueViolation(error, "users_email_unique")) {
        throw new GalleonServiceError("EMAIL_TAKEN", "An account with that email already exists.", 409);
      }
      throw error;
    }

    return { id: userId, email, kind: input.kind, wallet_id: walletId };
  }

  async function findUserByEmail(email: string): Promise<(UserRecord & { password_hash: string }) | null> {
    const rows = await client<{ id: string; email: string; kind: UserKind; password_hash: string; wallet_id: string | null }[]>`
      SELECT u.id, u.email, u.kind, u.password_hash, w.id AS wallet_id
      FROM users u
      LEFT JOIN wallets w ON w.owner_user_id = u.id AND w.owner_type = 'consumer'
      WHERE u.email = ${normalizeEmail(email)}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async function createSession(input: { user_id: string; token_hash: string; expires_at: Date }): Promise<void> {
    await client`
      INSERT INTO sessions (token_hash, user_id, expires_at)
      VALUES (${input.token_hash}, ${input.user_id}, ${input.expires_at})
    `;
  }

  async function getSessionUser(tokenHash: string): Promise<UserRecord | null> {
    const rows = await client<{ id: string; email: string; kind: UserKind; wallet_id: string | null }[]>`
      SELECT u.id, u.email, u.kind, w.id AS wallet_id
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN wallets w ON w.owner_user_id = u.id AND w.owner_type = 'consumer'
      WHERE s.token_hash = ${tokenHash} AND s.expires_at > now()
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async function deleteSession(tokenHash: string): Promise<void> {
    await client`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
  }

  async function deleteExpiredSessions(): Promise<void> {
    await client`DELETE FROM sessions WHERE expires_at <= now()`;
  }

  async function getWalletSummary(walletId: string = DEMO_IDS.consumerWallet) {
    await ensureDemoData();
    const walletRows = await client<{ public_ref: string; balance_minor: number }[]>`
      SELECT w.public_ref, COALESCE(SUM(le.amount_minor), 0)::int AS balance_minor
      FROM wallets w LEFT JOIN ledger_entries le ON le.wallet_id = w.id
      LEFT JOIN ledger_transactions lt ON lt.id = le.transaction_id AND lt.status = 'posted'
      WHERE w.id = ${walletId} GROUP BY w.id, w.public_ref
    `;
    const policyRows = await client<{ enabled: boolean; max_per_purchase_minor: number; max_daily_spend_minor: number }[]>`
      SELECT enabled, max_per_purchase_minor, max_daily_spend_minor FROM wallet_policies WHERE wallet_id = ${walletId}
    `;
    const wallet = walletRows[0];
    if (!wallet) throw new GalleonServiceError("WALLET_NOT_FOUND", "Wallet not found.", 404);
    return {
      wallet_id: wallet.public_ref, currency: "USD" as const,
      balance_minor: wallet.balance_minor, display_balance: formatUsd(wallet.balance_minor),
      mode: "demo" as const, policy: policyRows[0],
    };
  }

  async function getConsumerPurchases(walletId: string = DEMO_IDS.consumerWallet) {
    await ensureDemoData();
    return client<{
      purchase_id: string; title: string; publisher_name: string; canonical_url: string;
      amount_minor: number; currency: "USD"; purchased_at: Date | string;
    }[]>`
      SELECT pu.id AS purchase_id, r.title, p.name AS publisher_name, r.canonical_url,
        pu.amount_minor, pu.currency, pu.purchased_at
      FROM purchases pu JOIN resources r ON r.id = pu.resource_id
      JOIN publishers p ON p.id = pu.publisher_id
      WHERE pu.wallet_id = ${walletId} ORDER BY pu.purchased_at DESC LIMIT 20
    `;
  }

  async function getPublisherSummary(publisherId = DEMO_IDS.publisher) {
    await ensureDemoData();
    const balanceRows = await client<{ balance_minor: number }[]>`
      SELECT COALESCE(SUM(le.amount_minor), 0)::int AS balance_minor
      FROM wallets w LEFT JOIN ledger_entries le ON le.wallet_id = w.id
      LEFT JOIN ledger_transactions lt ON lt.id = le.transaction_id AND lt.status = 'posted'
      WHERE w.publisher_id = ${publisherId}
    `;
    const sales = await client<{
      purchase_id: string; title: string; amount_minor: number; purchased_at: Date | string;
    }[]>`
      SELECT pu.id AS purchase_id, r.title, pu.amount_minor, pu.purchased_at
      FROM purchases pu JOIN resources r ON r.id = pu.resource_id
      WHERE pu.publisher_id = ${publisherId} ORDER BY pu.purchased_at DESC LIMIT 20
    `;
    const resourceRows = await client<{
      resource_id: string; title: string; status: string; amount_minor: number; currency: "USD";
    }[]>`
      SELECT r.id AS resource_id, r.title, o.status, o.amount_minor, o.currency
      FROM resources r JOIN offers o ON o.resource_id = r.id
      WHERE r.publisher_id = ${publisherId} ORDER BY r.created_at
    `;
    const balanceMinor = balanceRows[0]?.balance_minor ?? 0;
    return {
      balance_minor: balanceMinor, display_balance: formatUsd(balanceMinor),
      purchase_count: sales.length, sales, resources: resourceRows,
    };
  }

  async function assertLedgerBalanced() {
    await ensureDemoData();
    const unbalanced = await client<{ transaction_id: string; total: number }[]>`
      SELECT transaction_id, SUM(amount_minor)::int AS total
      FROM ledger_entries GROUP BY transaction_id HAVING SUM(amount_minor) <> 0
    `;
    if (unbalanced.length > 0) throw new Error("Ledger invariant failed: an unbalanced transaction exists.");
    return true;
  }

  return {
    assertLedgerBalanced,
    close: () => client.end(),
    createOfferPresentation,
    createSession,
    createUser,
    deleteExpiredSessions,
    deleteSession,
    ensureDemoData,
    findUserByEmail,
    getConsumerPurchases,
    getPublisherSummary,
    getSessionUser,
    getWalletSummary,
    purchaseOffer,
    redeemEntitlement,
  };
}

export function createPublisherSessionValues(sessionId: string, resourceId: string, secret: string) {
  const redemptionNonce = createHmac("sha256", secret).update(`${sessionId}:${resourceId}`).digest("base64url");
  return { publisherSessionHash: sha256(sessionId), redemptionNonce };
}

export function createPublisherSessionId(): string {
  return randomBytes(32).toString("base64url");
}
