import { z } from "zod";

export const DEMO_IDS = {
  consumerWallet: "00000000-0000-4000-8000-000000000001",
  publisher: "00000000-0000-4000-8000-000000000002",
  resource: "00000000-0000-4000-8000-000000000003",
  publisherWallet: "00000000-0000-4000-8000-000000000004",
  offer: "00000000-0000-4000-8000-000000000005",
  treasuryWallet: "00000000-0000-4000-8000-000000000006",
  secondResource: "00000000-0000-4000-8000-000000000007",
  secondOffer: "00000000-0000-4000-8000-000000000008",
} as const;

export const DEFAULT_PUBLISHER_DEMO_URL = "http://127.0.0.1:3001";

export function getPublisherDemoOrigin(publisherDemoUrl?: string): string {
  const origin = (publisherDemoUrl ?? DEFAULT_PUBLISHER_DEMO_URL).match(
    /^https?:\/\/[^/?#]+/i,
  )?.[0];
  if (!origin) {
    throw new Error(
      "GALLEON_PUBLISHER_DEMO_URL must be an absolute HTTP(S) URL.",
    );
  }
  return origin;
}

export function createDemoSource(publisherDemoUrl?: string) {
  const canonicalUrl = `${getPublisherDemoOrigin(publisherDemoUrl)}/`;

  return {
    authors: ["Mara Venn"],
    canonical_url: canonicalUrl,
    citation: {
      canonical_url: canonicalUrl,
      display_text:
        "Venn, M. (2026). What changes when a source can quote its own price? Northline Review.",
    },
    content_sha256:
      "33497b7ab3c6046290613b3e9d93a2404fd02b2687d109815de7e68b9c483703",
    content_type: "report",
    description:
      "A field study of independent publishers testing machine-readable, one-off source access.",
    language: "en",
    published_at: "2026-08-28T09:00:00Z",
    publisher_name: "Northline Review",
    questions_answered: [
      "How did independent publishers respond to one-off agent purchases?",
      "Which offer attributes affected source purchase conversion?",
    ],
    resource_id: DEMO_IDS.resource,
    title: "What changes when a source can quote its own price?",
    topics: ["agent commerce", "digital publishing", "micropayments"],
  } as const;
}

export const DEMO_SOURCE = createDemoSource();

export const citationSchema = z.object({
  display_text: z.string().min(1),
  canonical_url: z.string().url(),
});

export const resourceSchema = z.object({
  version: z.literal("galleon.resource.v1"),
  resource_id: z.string().uuid(),
  publisher_id: z.string().uuid(),
  publisher_name: z.string().min(1),
  canonical_url: z.string().url(),
  title: z.string().min(1),
  description: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  published_at: z.string().datetime(),
  content_type: z.string().min(1),
  mime_type: z.string().min(1),
  language: z.string().min(2),
  topics: z.array(z.string().min(1)),
  questions_answered: z.array(z.string().min(1)),
  provenance: z.object({ publisher_origin: z.string().url() }),
  citation: citationSchema,
  content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const rightsSchema = z.object({
  access: z.literal("read"),
  agent_grounding: z.literal(true),
  citation_required: z.boolean(),
  access_duration_seconds: z.number().int().positive(),
});

const jwtBaseSchema = z.object({
  iss: z.string().url(),
  aud: z.string().min(1),
  sub: z.string().min(1),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  jti: z.string().uuid(),
});

export const offerPresentationClaimsSchema = jwtBaseSchema.extend({
  version: z.literal("galleon.offer.v1"),
  offer_id: z.string().uuid(),
  resource_id: z.string().uuid(),
  publisher_id: z.string().uuid(),
  publisher_origin: z.string().url(),
  canonical_url: z.string().url(),
  title: z.string().min(1),
  description: z.string().min(1),
  questions_answered: z.array(z.string().min(1)),
  citation: citationSchema,
  content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  amount_minor: z.number().int().min(1).max(10_000),
  currency: z.literal("USD"),
  rights: rightsSchema,
  redemption_nonce: z.string().min(22),
});

export const entitlementClaimsSchema = jwtBaseSchema.extend({
  version: z.literal("galleon.entitlement.v1"),
  transaction_id: z.string().uuid().nullable(),
  purchase_id: z.string().uuid(),
  offer_id: z.string().uuid(),
  offer_presentation_jti: z.string().uuid(),
  resource_id: z.string().uuid(),
  publisher_id: z.string().uuid(),
  canonical_url: z.string().url(),
  content_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  redemption_nonce: z.string().min(22),
  rights: z.array(z.literal("read")).length(1),
  amount_minor: z.number().int().min(1).max(10_000),
  currency: z.literal("USD"),
});

const sourceSummarySchema = z.object({
  resource_id: z.string().uuid(),
  canonical_url: z.string().url(),
  title: z.string().min(1),
  description: z.string().min(1),
  publisher_name: z.string().min(1),
  authors: z.array(z.string().min(1)),
  published_at: z.string().datetime(),
  content_type: z.string().min(1),
  language: z.string().min(1),
  topics: z.array(z.string().min(1)),
  questions_answered: z.array(z.string().min(1)),
  citation: citationSchema,
});

export const inspectSourceResponseSchema = z.object({
  status: z.enum(["offer_available", "already_unlocked", "unavailable"]),
  source: sourceSummarySchema,
  offer: z
    .object({
      amount_minor: z.number().int().positive(),
      currency: z.literal("USD"),
      display_price: z.string().min(1),
      rights: rightsSchema,
      expires_at: z.string().datetime(),
      offer_token: z.string().min(100).max(8192),
    })
    .optional(),
});

export const purchaseOfferInputSchema = z.object({
  offer_token: z.string().min(100).max(8192),
  idempotency_key: z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  expected_amount_minor: z.number().int().min(1).max(10_000),
  expected_currency: z.literal("USD"),
});

export const redeemEntitlementInputSchema = z.object({
  entitlement_token: z.string().min(100).max(8192),
  resource_id: z.string().uuid(),
  publisher_origin: z.string().url(),
  redemption_nonce: z.string().min(22),
  publisher_session_hash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const galleonErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
    request_id: z.string().min(1),
    details: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
});

export type GalleonError = z.infer<typeof galleonErrorSchema>;
export type EntitlementClaims = z.infer<typeof entitlementClaimsSchema>;
export type OfferPresentationClaims = z.infer<typeof offerPresentationClaimsSchema>;
export type PurchaseOfferInput = z.infer<typeof purchaseOfferInputSchema>;
export type Resource = z.infer<typeof resourceSchema>;

export const serviceStatusSchema = z.object({
  name: z.string().min(1),
  mode: z.literal("demo"),
  status: z.enum(["starting", "ready"]),
  version: z.string().min(1),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

export function formatUsd(amountMinor: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(amountMinor / 100);
}

export const platformSurfaces = {
  consumer: "consumer",
  marketing: "marketing",
  publisher: "publisher",
} as const;

export type PlatformSurface =
  (typeof platformSurfaces)[keyof typeof platformSurfaces];
