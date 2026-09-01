"use server";

import { GalleonServiceError } from "@galleon/database";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { hashPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/password";
import { endSession, startSession } from "@/lib/session";

import type { AuthError } from "./auth-copy";

// The wallet host rewrites /sign-in and /sign-up onto /consumer/*, so the
// browser-facing paths are the short ones.
const SIGN_IN_PATH = "/sign-in";
const SIGN_UP_PATH = "/sign-up";
const WALLET_PATH = "/";

function back(path: string, error: AuthError, email: string): never {
  const params = new URLSearchParams({ error });
  if (email) params.set("email", email);
  redirect(`${path}?${params.toString()}`);
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(formData: FormData): Promise<void> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_SHAPE.test(email)) back(SIGN_UP_PATH, "invalid_email", email);
  if (password.length < PASSWORD_MIN_LENGTH) back(SIGN_UP_PATH, "password_too_short", email);
  if (password.length > PASSWORD_MAX_LENGTH) back(SIGN_UP_PATH, "password_too_long", email);

  let userId: string;
  try {
    const user = await galleon.createUser({
      email,
      password_hash: await hashPassword(password),
      kind: "consumer",
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof GalleonServiceError && error.code === "EMAIL_TAKEN") {
      back(SIGN_UP_PATH, "email_taken", email);
    }
    throw error;
  }

  await startSession(userId);
  redirect(WALLET_PATH);
}

export async function signIn(formData: FormData): Promise<void> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_SHAPE.test(email)) back(SIGN_IN_PATH, "invalid_email", email);

  const user = await galleon.findUserByEmail(email);
  // Verify against a real hash even when the user is unknown, so response
  // time does not reveal whether an email is registered.
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, UNKNOWN_USER_HASH).then(() => false);

  if (!ok || !user) back(SIGN_IN_PATH, "bad_credentials", email);
  if (user.kind !== "consumer") back(SIGN_IN_PATH, "wrong_surface", email);

  await startSession(user.id);
  redirect(WALLET_PATH);
}

export async function signOut(): Promise<void> {
  await endSession();
  // Back to the marketing site. GALLEON_ISSUER is the marketing host on floo
  // and galleon.localhost locally, so this works in both without new config.
  redirect(process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200");
}

// A valid scrypt string for a throwaway password, used only to equalise
// timing on the unknown-user path. Never matches anything real.
const UNKNOWN_USER_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
