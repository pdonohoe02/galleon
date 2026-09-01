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
  // Expired rows are never read (getSessionUser filters on expires_at), so
  // sweep them opportunistically here rather than letting the table grow
  // without bound. Fire-and-forget; a failure must not block sign-in.
  galleon.deleteExpiredSessions().catch(() => undefined);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
}

/**
 * Delete the current session server-side and clear the cookie. Only callable
 * from a Server Action or Route Handler: Next forbids cookie writes during a
 * Server Component render. Use revokeSession() from a page.
 */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await galleon.deleteSession(hashSessionToken(token));
  jar.set(SESSION_COOKIE, "", cookieOptions(0));
}

/**
 * Delete the current session row without touching the cookie, for use inside
 * a page render where cookies cannot be modified. The cookie that remains
 * resolves to nothing, so every subsequent request reads as signed out; it is
 * overwritten by the next sign-in or sign-out, or expires.
 */
export async function revokeSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await galleon.deleteSession(hashSessionToken(token));
}

/** The signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return galleon.getSessionUser(hashSessionToken(token));
}

/**
 * The signed-in user *with a consumer wallet*, or null. The wallet surface
 * should gate on this, not on getCurrentUser: a session for a user with no
 * wallet (a publisher account, or a consumer whose wallet was removed) must
 * read as signed-out here, otherwise the dashboard bounces to sign-in and
 * sign-in bounces back forever.
 */
export async function getCurrentConsumer(): Promise<(UserRecord & { wallet_id: string }) | null> {
  const user = await getCurrentUser();
  return user?.wallet_id ? { ...user, wallet_id: user.wallet_id } : null;
}
