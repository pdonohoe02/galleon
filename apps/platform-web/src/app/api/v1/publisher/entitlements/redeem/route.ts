import { NextResponse } from "next/server";

import { apiError, isPublisherAuthorized, unauthorized } from "@/lib/api";
import { galleon } from "@/lib/galleon";

export async function POST(request: Request) {
  if (!isPublisherAuthorized(request)) return unauthorized();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fields = [
      "entitlement_token",
      "resource_id",
      "publisher_origin",
      "redemption_nonce",
      "publisher_session_hash",
    ] as const;
    if (fields.some((field) => typeof body[field] !== "string")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "REQUEST_INVALID",
            message: "The redemption request is invalid.",
            retryable: false,
            request_id: crypto.randomUUID(),
          },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await galleon.redeemEntitlement({
        entitlementToken: body.entitlement_token as string,
        resourceId: body.resource_id as string,
        publisherOrigin: body.publisher_origin as string,
        redemptionNonce: body.redemption_nonce as string,
        publisherSessionHash: body.publisher_session_hash as string,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
