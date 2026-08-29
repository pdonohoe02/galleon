import { timingSafeEqual } from "node:crypto";

import { GalleonServiceError } from "@galleon/database";
import { NextResponse } from "next/server";

function publisherKey(): string | undefined {
  if (process.env.GALLEON_PUBLISHER_API_KEY) return process.env.GALLEON_PUBLISHER_API_KEY;
  if (process.env.NODE_ENV !== "production") return "galleon-local-publisher-key";
  return undefined;
}

export function isPublisherAuthorized(request: Request): boolean {
  const expected = publisherKey();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export function apiError(error: unknown) {
  const requestId = crypto.randomUUID();
  if (error instanceof GalleonServiceError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, retryable: error.retryable, request_id: requestId } },
      { status: error.status },
    );
  }
  console.error("Galleon API request failed", {
    error: error instanceof Error ? error.message : "unknown error",
    requestId,
  });
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "The request could not be completed.", retryable: true, request_id: requestId } },
    { status: 500 },
  );
}

export function unauthorized() {
  return NextResponse.json(
    { ok: false, error: { code: "UNAUTHORIZED", message: "A valid publisher credential is required.", retryable: false, request_id: crypto.randomUUID() } },
    { status: 401 },
  );
}
