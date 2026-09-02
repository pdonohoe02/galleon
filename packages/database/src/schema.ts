import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const systemMetadata = pgTable("system_metadata", {
  key: text("key").primaryKey(),
  updatedAt: timestamps.updatedAt,
  value: text("value").notNull(),
});

// Accounts. One table for both audiences; `kind` says which surface the user
// signs in to. Consumers own a wallet, publishers will own a publisher record.
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  kind: text("kind").notNull(),
  // Set when the consumer finishes (or skips) the post-sign-up onboarding
  // wizard. Null means setup is unfinished, which the dashboard surfaces as a
  // "finish setting up" banner.
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  check("users_kind_check", sql`${table.kind} IN ('consumer', 'publisher')`),
]);

// Per-user bearer tokens for the wallet MCP. The token is shown to the user
// once at issue time; only its SHA-256 is stored, so a database read cannot be
// replayed as a credential. One active token per user: issuing a new one
// replaces the old (the unique index enforces it, the service deletes first).
export const mcpTokens = pgTable("mcp_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamps.createdAt,
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => [uniqueIndex("mcp_tokens_user_id_unique").on(table.userId)]);

// Server-side sessions. The cookie carries a random token; only its SHA-256
// is stored, so a database read cannot be replayed as a session.
export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamps.createdAt,
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

export const publishers = pgTable("publishers", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

export const publisherOrigins = pgTable("publisher_origins", {
  id: uuid("id").primaryKey(),
  publisherId: uuid("publisher_id").notNull().references(() => publishers.id),
  origin: text("origin").notNull(),
  verified: boolean("verified").notNull().default(false),
  ...timestamps,
}, (table) => [uniqueIndex("publisher_origins_origin_unique").on(table.origin)]);

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey(),
  ownerType: text("owner_type").notNull(),
  // Set for consumer wallets that belong to a signed-up user. The seeded demo
  // wallet and the publisher/treasury wallets leave it null.
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  publisherId: uuid("publisher_id").references(() => publishers.id),
  publicRef: text("public_ref").notNull(),
  currency: text("currency").notNull().default("USD"),
  mode: text("mode").notNull().default("demo"),
  ...timestamps,
}, (table) => [
  uniqueIndex("wallets_public_ref_unique").on(table.publicRef),
  // Session lookup and sign-in both join on owner_user_id; without an index
  // that is a sequential scan per authenticated request. Partial and unique:
  // one consumer wallet per user, which the LIMIT 1 in those joins assumes.
  uniqueIndex("wallets_owner_user_id_consumer_unique")
    .on(table.ownerUserId)
    .where(sql`${table.ownerType} = 'consumer'`),
]);

export const walletPolicies = pgTable("wallet_policies", {
  walletId: uuid("wallet_id").primaryKey().references(() => wallets.id),
  enabled: boolean("enabled").notNull().default(true),
  maxPerPurchaseMinor: integer("max_per_purchase_minor").notNull(),
  maxDailySpendMinor: integer("max_daily_spend_minor").notNull(),
  ...timestamps,
});

export const ledgerTransactions = pgTable("ledger_transactions", {
  id: uuid("id").primaryKey(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("pending"),
  idempotencyKey: text("idempotency_key").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("ledger_transactions_idempotency_unique").on(table.idempotencyKey)]);

export const ledgerEntries = pgTable("ledger_entries", {
  id: uuid("id").primaryKey(),
  transactionId: uuid("transaction_id").notNull().references(() => ledgerTransactions.id),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamps.createdAt,
}, (table) => [
  check("ledger_entries_non_zero", sql`${table.amountMinor} <> 0`),
  index("ledger_entries_wallet_idx").on(table.walletId),
  index("ledger_entries_transaction_idx").on(table.transactionId),
]);

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey(),
  publisherId: uuid("publisher_id").notNull().references(() => publishers.id),
  canonicalUrl: text("canonical_url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  authors: jsonb("authors").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  contentType: text("content_type").notNull(),
  mimeType: text("mime_type").notNull(),
  language: text("language").notNull(),
  topics: jsonb("topics").notNull(),
  questionsAnswered: jsonb("questions_answered").notNull(),
  citation: jsonb("citation").notNull(),
  contentSha256: text("content_sha256").notNull(),
  status: text("status").notNull().default("active"),
  ...timestamps,
}, (table) => [
  uniqueIndex("resources_canonical_hash_unique").on(table.canonicalUrl, table.contentSha256),
  index("resources_publisher_idx").on(table.publisherId),
]);

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey(),
  resourceId: uuid("resource_id").notNull().references(() => resources.id),
  publisherId: uuid("publisher_id").notNull().references(() => publishers.id),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("USD"),
  accessDurationSeconds: integer("access_duration_seconds").notNull(),
  citationRequired: boolean("citation_required").notNull().default(true),
  status: text("status").notNull().default("active"),
  ...timestamps,
}, (table) => [
  check("offers_positive_amount", sql`${table.amountMinor} > 0 AND ${table.amountMinor} <= 10000`),
  index("offers_resource_idx").on(table.resourceId),
]);

export const offerPresentations = pgTable("offer_presentations", {
  id: uuid("id").primaryKey(),
  jti: uuid("jti").notNull(),
  offerId: uuid("offer_id").notNull().references(() => offers.id),
  resourceId: uuid("resource_id").notNull().references(() => resources.id),
  publisherId: uuid("publisher_id").notNull().references(() => publishers.id),
  publisherOrigin: text("publisher_origin").notNull(),
  redemptionNonceHash: text("redemption_nonce_hash").notNull(),
  publisherSessionHash: text("publisher_session_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamps.createdAt,
}, (table) => [
  uniqueIndex("offer_presentations_jti_unique").on(table.jti),
  index("offer_presentations_resource_idx").on(table.resourceId),
]);

export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  publisherId: uuid("publisher_id").notNull().references(() => publishers.id),
  resourceId: uuid("resource_id").notNull().references(() => resources.id),
  offerId: uuid("offer_id").notNull().references(() => offers.id),
  presentationJti: uuid("presentation_jti").notNull(),
  ledgerTransactionId: uuid("ledger_transaction_id").references(() => ledgerTransactions.id),
  contentSha256: text("content_sha256").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("purchases_wallet_resource_hash_unique").on(
    table.walletId,
    table.resourceId,
    table.contentSha256,
  ),
  index("purchases_publisher_idx").on(table.publisherId),
]);

export const entitlements = pgTable("entitlements", {
  id: uuid("id").primaryKey(),
  jti: uuid("jti").notNull(),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id),
  presentationJti: uuid("presentation_jti").notNull(),
  publisherOrigin: text("publisher_origin").notNull(),
  claims: jsonb("claims").notNull(),
  status: text("status").notNull().default("issued"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamps.createdAt,
}, (table) => [
  uniqueIndex("entitlements_jti_unique").on(table.jti),
  index("entitlements_purchase_idx").on(table.purchaseId),
]);

export const redemptions = pgTable("redemptions", {
  id: uuid("id").primaryKey(),
  entitlementId: uuid("entitlement_id").notNull().references(() => entitlements.id),
  publisherSessionHash: text("publisher_session_hash").notNull(),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("redemptions_entitlement_unique").on(table.entitlementId)]);

export const idempotencyKeys = pgTable("idempotency_keys", {
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  key: text("key").notNull(),
  requestHash: text("request_hash").notNull(),
  response: jsonb("response").notNull(),
  createdAt: timestamps.createdAt,
}, (table) => [uniqueIndex("idempotency_wallet_key_unique").on(table.walletId, table.key)]);
