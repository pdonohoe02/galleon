import { NextResponse } from "next/server";

import { apiError, isPublisherAuthorized, unauthorized } from "@/lib/api";
import { galleon } from "@/lib/galleon";

export async function POST(request: Request) {
  if (!isPublisherAuthorized(request)) return unauthorized();
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.resource_id !== "string" ||
      typeof body.redemption_nonce !== "string" ||
      typeof body.publisher_session_hash !== "string"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "REQUEST_INVALID",
            message: "The offer presentation request is invalid.",
            retryable: false,
            request_id: crypto.randomUUID(),
          },
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await galleon.createOfferPresentation({
        resourceId: body.resource_id,
        redemptionNonce: body.redemption_nonce,
        publisherSessionHash: body.publisher_session_hash,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
