import { DEMO_IDS } from "@galleon/contracts";
import { type NextRequest, NextResponse } from "next/server";

import { callGalleon } from "../../../../server/galleon";
import {
  createSessionId,
  deriveSessionBinding,
  PUBLISHER_SESSION_COOKIE,
  sessionCookieOptions,
} from "../../../../server/session";

export async function GET(request: NextRequest) {
  const existingSession = request.cookies.get(PUBLISHER_SESSION_COOKIE)?.value;
  const sessionId = existingSession ?? createSessionId();
  const binding = deriveSessionBinding(sessionId);

  try {
    const upstream = await callGalleon("/api/v1/publisher/offer-presentations", {
      resource_id: DEMO_IDS.resource,
      redemption_nonce: binding.redemptionNonce,
      publisher_session_hash: binding.publisherSessionHash,
    });
    const payload: unknown = await upstream.json();
    const response = NextResponse.json(payload, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
    if (!existingSession && upstream.ok) {
      response.cookies.set(PUBLISHER_SESSION_COOKIE, sessionId, sessionCookieOptions());
    }
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "GALLEON_UNAVAILABLE", message: "The publisher could not reach Galleon.", retryable: true, request_id: crypto.randomUUID() } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
