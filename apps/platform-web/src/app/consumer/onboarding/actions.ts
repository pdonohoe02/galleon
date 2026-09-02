"use server";

import { GalleonServiceError } from "@galleon/database";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser } from "@/lib/session";

const ONBOARDING_PATH = "/consumer/onboarding";
const WALLET_PATH = "/consumer";

// Deposit presets and bounds, in minor units. Mirrors the service-side bounds
// in @galleon/database (depositToWallet); the service re-validates, so a forged
// amount cannot get past it.
const DEPOSIT_MIN_MINOR = 100; // $1
const DEPOSIT_MAX_MINOR = 10_000; // $100

/** Parse a dollar amount (e.g. "10" or "12.50") to whole minor units, or null. */
function parseDollarsToMinor(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(trimmed)) return null;
  const minor = Math.round(Number.parseFloat(trimmed) * 100);
  return Number.isInteger(minor) ? minor : null;
}

export async function submitDeposit(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.wallet_id) redirect("/consumer/sign-in");

  // A preset radio carries minor units directly; the custom field is dollars.
  // The custom field wins when the "custom" preset is chosen.
  const choice = String(formData.get("amount") ?? "");
  let amountMinor: number | null;
  if (choice === "custom") {
    amountMinor = parseDollarsToMinor(String(formData.get("custom_amount") ?? ""));
  } else {
    amountMinor = /^\d+$/.test(choice) ? Number.parseInt(choice, 10) : null;
  }

  if (amountMinor === null || amountMinor < DEPOSIT_MIN_MINOR || amountMinor > DEPOSIT_MAX_MINOR) {
    redirect(`${ONBOARDING_PATH}?step=deposit&error=amount`);
  }

  try {
    await galleon.depositToWallet({
      walletId: user.wallet_id,
      amountMinor,
      // One-shot per user: a double-submit or a later resume of onboarding
      // returns the same deposit instead of funding twice.
      idempotencyKey: `onboarding:${user.id}`,
    });
  } catch (error) {
    if (error instanceof GalleonServiceError) redirect(`${ONBOARDING_PATH}?step=deposit&error=amount`);
    throw error;
  }

  redirect(`${ONBOARDING_PATH}?step=mcp`);
}

/** Finish onboarding (from the MCP step's Finish or Skip). */
export async function finishOnboarding(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  await galleon.markOnboarded(user.id);
  redirect(WALLET_PATH);
}

/**
 * Issue (or rotate) the caller's wallet MCP token and return the raw value to
 * show once. Called from the client TokenPanel; the token never travels in a
 * URL. Rotating invalidates any token the user configured before.
 */
export async function generateMcpToken(): Promise<{ token: string }> {
  const user = await getCurrentUser();
  if (!user?.wallet_id) throw new Error("Not signed in.");
  return galleon.issueMcpToken(user.id);
}
