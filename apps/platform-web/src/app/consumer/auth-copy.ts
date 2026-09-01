import { PASSWORD_MIN_LENGTH } from "@/lib/password";

// Kept out of actions.ts because a "use server" module may only export async
// functions. Pages read this to render the error the action redirected with.

export type AuthError =
  | "invalid_email"
  | "password_too_short"
  | "password_too_long"
  | "email_taken"
  | "bad_credentials"
  | "wrong_surface";

export const AUTH_ERROR_COPY: Record<AuthError, string> = {
  invalid_email: "Enter a valid email address.",
  password_too_short: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  password_too_long: "That password is too long.",
  email_taken: "An account with that email already exists. Sign in instead.",
  bad_credentials: "That email and password don't match.",
  wrong_surface: "That account is a publisher account. Sign in on the publisher console.",
};

export function authErrorMessage(value: string | undefined): string | null {
  // hasOwn, not `in`: the value comes from the query string, and `in` walks
  // the prototype chain, so ?error=__proto__ would hand back an object and
  // crash the render.
  return value && Object.hasOwn(AUTH_ERROR_COPY, value) ? AUTH_ERROR_COPY[value as AuthError] : null;
}
