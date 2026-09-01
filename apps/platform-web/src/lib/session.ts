import { createHash, randomBytes } from "node:crypto";

import type { UserRecord } from "@galleon/database";
import { cookies } from "next/headers";

import { galleon } from "@/lib/galleon";

// The cookie holds a random token. Only its SHA-256 is stored, so a read of
// the sessions table cannot be replayed as a login.

export const SESSION_COOKIE = "galleon_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // lax, not strict: the sign-in redirect and the logout hop to the
    // marketing host must carry the cookie on a top-level navigation.
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Create a session for the user and set the cookie. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await galleon.createSession({ user_id: userId, token_hash: hashSessionToken(token), expires_at: expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
}

/** Delete the current session server-side and clear the cookie. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await galleon.deleteSession(hashSessionToken(token));
  jar.set(SESSION_COOKIE, "", cookieOptions(0));
}

/** The signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return galleon.getSessionUser(hashSessionToken(token));
}
