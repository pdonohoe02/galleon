// Activation probe at the app host's /mcp/connect. Resolving the bearer token
// stamps last_used_at, which flips the dashboard's connection indicator green.
import { timingSafeEqual } from "node:crypto";

import { DEMO_IDS } from "@galleon/contracts";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

function bearer(request: Request): string | undefined {
  const value = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return value && value.length > 0 ? value : undefined;
}

function matchesDemoToken(supplied: string): boolean {
  if (process.env.GALLEON_DEMO_AUTH !== "true") return false;
  const expected = process.env.GALLEON_DEMO_BEARER_TOKEN;
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

async function handle(request: Request): Promise<Response> {
  const supplied = bearer(request);
  if (!supplied) return Response.json({ ok: false, error: "A valid Galleon wallet token is required." }, { status: 401 });
  const user = await galleon.findUserByMcpToken(supplied);
  const walletId = user?.wallet_id ?? (matchesDemoToken(supplied) ? DEMO_IDS.consumerWallet : null);
  if (!walletId) return Response.json({ ok: false, error: "A valid Galleon wallet token is required." }, { status: 401 });
  try {
    const summary = await galleon.getWalletSummary(walletId);
    return Response.json({ ok: true, wallet: { display_balance: summary.display_balance, mode: summary.mode } });
  } catch {
    return Response.json({ ok: true });
  }
}

export function GET(request: Request) {
  return handle(request);
}
export function POST(request: Request) {
  return handle(request);
}
