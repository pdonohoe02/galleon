import { createDemoSource, DEMO_IDS } from "@galleon/contracts";
import { type NextRequest, NextResponse } from "next/server";

import { callGalleon } from "../../../../server/galleon";
import { paidSource } from "../../../../server/paid-source";
import { publisherOrigin } from "../../../../server/urls";
import {
  deriveSessionBinding,
  PUBLISHER_SESSION_COOKIE,
  sessionCookieOptions,
} from "../../../../server/session";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => undefined);
  const entitlementToken =
    typeof body === "object" && body !== null && "entitlement_token" in body
      ? body.entitlement_token
      : undefined;
  if (typeof entitlementToken !== "string" || entitlementToken.length < 100 || entitlementToken.length > 8192) {
    return NextResponse.json(
      { ok: false, error: { code: "ENTITLEMENT_INVALID", message: "A valid entitlement token is required.", retryable: false, request_id: crypto.randomUUID() } },
      { status: 400 },
    );
  }

  const sessionId = request.cookies.get(PUBLISHER_SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: { code: "SESSION_REQUIRED", message: "Inspect this source in the same browser session before unlocking it.", retryable: true, request_id: crypto.randomUUID() } },
      { status: 409 },
    );
  }
  const binding = deriveSessionBinding(sessionId);
  const origin = publisherOrigin();
  const demoSource = createDemoSource(origin);

  try {
    const upstream = await callGalleon("/api/v1/publisher/entitlements/redeem", {
      entitlement_token: entitlementToken,
      resource_id: DEMO_IDS.resource,
      publisher_origin: origin,
      redemption_nonce: binding.redemptionNonce,
      publisher_session_hash: binding.publisherSessionHash,
    });
    const redemption: unknown = await upstream.json();
    if (!upstream.ok) {
      return NextResponse.json(redemption, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    }

    const response = NextResponse.json({
      status: "unlocked",
      source: {
        resource_id: DEMO_IDS.resource,
        canonical_url: demoSource.canonical_url,
        title: demoSource.title,
        content_sha256: demoSource.content_sha256,
        citation: demoSource.citation,
        ...paidSource,
      },
      redemption,
    }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set(`northline_access_${DEMO_IDS.resource}`, "granted", {
      ...sessionCookieOptions(),
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "GALLEON_UNAVAILABLE", message: "The publisher could not redeem the entitlement.", retryable: true, request_id: crypto.randomUUID() } },
      { status: 503 },
    );
  }
}
