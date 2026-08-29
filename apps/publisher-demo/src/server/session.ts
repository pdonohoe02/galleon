import { createHash, createHmac, randomBytes } from "node:crypto";

import { DEMO_IDS } from "@galleon/contracts";

export const PUBLISHER_SESSION_COOKIE = "northline_galleon_session";

function sessionSecret(): string {
  if (process.env.GALLEON_PUBLISHER_SESSION_SECRET) return process.env.GALLEON_PUBLISHER_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("GALLEON_PUBLISHER_SESSION_SECRET is required in production.");
  }
  return "northline-local-session-secret-not-for-production";
}

export function createSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export function deriveSessionBinding(sessionId: string) {
  return {
    publisherSessionHash: createHash("sha256").update(sessionId).digest("hex"),
    redemptionNonce: createHmac("sha256", sessionSecret())
      .update(`${sessionId}:${DEMO_IDS.resource}`)
      .digest("base64url"),
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}
