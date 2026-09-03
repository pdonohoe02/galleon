// The wallet MCP, served in-process by the app itself at the app host's /mcp.
// A stateless Streamable-HTTP MCP endpoint (JSON responses, no session state):
// the agent POSTs JSON-RPC, we resolve its bearer token to a wallet and run the
// tool against the ledger. No separate MCP service, nothing on the user's box.
import { timingSafeEqual } from "node:crypto";

import { DEMO_IDS, purchaseOfferInputSchema } from "@galleon/contracts";
import { GalleonServiceError } from "@galleon/database";

import { galleon } from "@/lib/galleon";

export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "galleon-wallet", version: "0.1.0" };
const INSTRUCTIONS =
  "First inspect a publisher page's source offer. Before calling purchase_offer, show the exact source, price, currency, and rights to the user and obtain approval. Never send wallet credentials to a publisher. Pass only the returned entitlement to the same publisher origin's unlock_source tool.";

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

/** Resolve a request to the wallet its bearer token controls, or null. */
async function resolveWallet(request: Request): Promise<{ walletId: string } | null> {
  const supplied = bearer(request);
  if (!supplied) return null;
  const user = await galleon.findUserByMcpToken(supplied);
  if (user?.wallet_id) return { walletId: user.wallet_id };
  if (matchesDemoToken(supplied)) return { walletId: DEMO_IDS.consumerWallet };
  return null;
}

// ---- Tools -----------------------------------------------------------------

const TOOLS = [
  {
    name: "get_system_status",
    description: "Check whether the Galleon wallet and ledger are ready.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_wallet_summary",
    description: "Read the authenticated Galleon wallet balance and spend policy.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "purchase_offer",
    description:
      "Purchase the exact, short-lived Galleon offer after the user approves its price and rights. Charges credits and returns a publisher-scoped entitlement.",
    inputSchema: {
      type: "object",
      properties: {
        offer_token: { type: "string", description: "Signed offer token returned by inspect_source." },
        idempotency_key: { type: "string", description: "A unique retry-safe key for this approved purchase." },
        expected_amount_minor: { type: "number", description: "The user-approved price in USD cents." },
        expected_currency: { type: "string", enum: ["USD"] },
      },
      required: ["offer_token", "idempotency_key", "expected_amount_minor", "expected_currency"],
      additionalProperties: false,
    },
  },
];

function textResult(text: string, structuredContent: unknown) {
  return { content: [{ type: "text", text }], structuredContent };
}

function errorResult(error: unknown) {
  const payload =
    error instanceof GalleonServiceError
      ? { code: error.code, message: error.message, retryable: error.retryable }
      : { code: "INTERNAL_ERROR", message: "The request could not be completed.", retryable: true };
  return { isError: true, structuredContent: { ok: false, error: payload }, content: [{ type: "text", text: `${payload.code}: ${payload.message}` }] };
}

async function callTool(walletId: string, name: string, args: Record<string, unknown>) {
  try {
    if (name === "get_system_status") {
      await galleon.ensureDemoData();
      const status = { name: "galleon-mcp", mode: "demo" as const, status: "ready" as const, version: "0.1.0" };
      return textResult("Galleon wallet and ledger are ready.", status);
    }
    if (name === "get_wallet_summary") {
      const summary = await galleon.getWalletSummary(walletId);
      return textResult(`Wallet balance: ${summary.display_balance}.`, summary);
    }
    if (name === "purchase_offer") {
      const input = purchaseOfferInputSchema.parse(args);
      const purchase = await galleon.purchaseOffer(walletId, input);
      const text = purchase.payment.charged
        ? `Purchased “${purchase.source.title}” for ${purchase.payment.display_price}. Remaining balance: ${purchase.wallet.display_balance}.`
        : `“${purchase.source.title}” was already purchased. A fresh entitlement was issued without another charge.`;
      return textResult(text, purchase);
    }
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  } catch (error) {
    // A tool-level failure (insufficient funds, policy denial, bad input) is an
    // MCP tool error result, not a JSON-RPC protocol error.
    return errorResult(error);
  }
}

// ---- JSON-RPC dispatch -----------------------------------------------------

type Rpc = { jsonrpc?: string; id?: number | string | null; method?: string; params?: Record<string, unknown> };

async function dispatch(msg: Rpc, walletId: string): Promise<object | null> {
  const { id, method, params } = msg;
  // Notifications (no id) get no response body.
  if (id === undefined || id === null) return null;

  try {
    if (method === "initialize") {
      const requested = typeof params?.protocolVersion === "string" ? params.protocolVersion : PROTOCOL_VERSION;
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: requested,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      };
    }
    if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
    if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    if (method === "tools/call") {
      const name = String(params?.name ?? "");
      const args = (params?.arguments as Record<string, unknown>) ?? {};
      const result = await callTool(walletId, name, args);
      return { jsonrpc: "2.0", id, result };
    }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32603, message: error instanceof Error ? error.message : "Internal error" } };
  }
}

export async function POST(request: Request): Promise<Response> {
  const wallet = await resolveWallet(request);
  if (!wallet) {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: bearer(request)
            ? "The bearer token is not a valid Galleon wallet token."
            : "A wallet bearer token is required. Generate one on your Galleon wallet setup screen.",
        },
        id: null,
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, { status: 400 });
  }

  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((m) => dispatch(m as Rpc, wallet.walletId)))).filter(Boolean);
    if (responses.length === 0) return new Response(null, { status: 202 });
    return Response.json(responses);
  }

  const response = await dispatch(body as Rpc, wallet.walletId);
  if (response === null) return new Response(null, { status: 202 });
  return Response.json(response);
}

// A GET with no stream to open; this stateless server has no server->client
// notifications, so decline the SSE channel cleanly.
export function GET(): Response {
  return new Response("This stateless MCP endpoint accepts POST.", { status: 405, headers: { Allow: "POST" } });
}
