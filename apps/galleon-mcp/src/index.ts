import { randomUUID, timingSafeEqual } from "node:crypto";

import { DEMO_IDS } from "@galleon/contracts";
import { createGalleonService } from "@galleon/database";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { createMcpServer } from "./server.js";

const port = Number.parseInt(process.env.PORT ?? "3100", 10);
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://galleon:galleon@127.0.0.1:5432/galleon";
const galleon = createGalleonService(databaseUrl);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

function bearer(request: express.Request): string | undefined {
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  return supplied && supplied.length > 0 ? supplied : undefined;
}

function matchesDemoToken(supplied: string): boolean {
  if (process.env.GALLEON_DEMO_AUTH !== "true") return false;
  const expected = process.env.GALLEON_DEMO_BEARER_TOKEN;
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

/**
 * Resolve a request to the wallet its bearer token controls. A per-user token
 * (issued from the wallet onboarding screen) binds to that user's own wallet;
 * the shared demo token, when enabled, maps to the seeded demo wallet. Returns
 * null when no valid credential is present.
 */
async function resolveWallet(request: express.Request): Promise<{ walletId: string } | null> {
  const supplied = bearer(request);
  if (!supplied) return null;
  const user = await galleon.findUserByMcpToken(supplied);
  if (user?.wallet_id) return { walletId: user.wallet_id };
  if (matchesDemoToken(supplied)) return { walletId: DEMO_IDS.consumerWallet };
  return null;
}

app.get("/health", (_request, response) => {
  response.json({ name: "galleon-mcp", mode: "demo", status: "ready", version: "0.1.0" });
});

app.get("/ready", async (_request, response) => {
  try {
    await galleon.ensureDemoData();
    response.json({ status: "ready" });
  } catch {
    response.status(503).json({ status: "unavailable" });
  }
});

// Lightweight activation probe. A client (or a one-line curl) hits this with
// its wallet bearer token to prove the local MCP server can reach the wallet;
// resolveWallet stamps last_used_at, which flips the "connected" indicator on
// the wallet dashboard. The real MCP `initialize` handshake does the same, so
// this is only a convenience for verifying the setup before running the agent.
async function handleConnect(request: express.Request, response: express.Response) {
  let wallet: { walletId: string } | null;
  try {
    wallet = await resolveWallet(request);
  } catch {
    response.status(503).json({ ok: false, error: "Authentication is temporarily unavailable." });
    return;
  }
  if (!wallet) {
    response.status(401).json({ ok: false, error: "A valid Galleon wallet token is required." });
    return;
  }
  try {
    const summary = await galleon.getWalletSummary(wallet.walletId);
    response.json({ ok: true, wallet: { display_balance: summary.display_balance, mode: summary.mode } });
  } catch {
    response.json({ ok: true });
  }
}
app.get("/mcp/connect", handleConnect);
app.post("/mcp/connect", handleConnect);

app.post("/mcp", async (request, response) => {
  let wallet: { walletId: string } | null;
  try {
    wallet = await resolveWallet(request);
  } catch (error) {
    console.error("MCP auth lookup failed", {
      error: error instanceof Error ? error.message : "unknown error",
      requestId: randomUUID(),
    });
    response.status(503).json({ jsonrpc: "2.0", error: { code: -32603, message: "Authentication is temporarily unavailable." }, id: null });
    return;
  }

  if (!wallet) {
    // A per-user token is always accepted; the shared demo token only when
    // GALLEON_DEMO_AUTH is on. With neither, connecting is off entirely.
    const demoOn = process.env.GALLEON_DEMO_AUTH === "true";
    response.status(bearer(request) || demoOn ? 401 : 503).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: bearer(request)
          ? "The bearer token is not a valid Galleon wallet token."
          : demoOn
            ? "A wallet bearer token is required. Generate one on your Galleon wallet setup screen."
            : "Wallet authentication is not configured. Generate a token on your Galleon wallet setup screen, or set GALLEON_DEMO_AUTH=true for the shared demo wallet.",
      },
      id: null,
    });
    return;
  }

  const server = createMcpServer(galleon, wallet.walletId);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  response.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("MCP request failed", {
      error: error instanceof Error ? error.message : "unknown error",
      requestId: randomUUID(),
    });
    if (!response.headersSent) {
      response.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});

app.all("/mcp", (_request, response) => {
  response.status(405).set("Allow", "POST").json({ error: "This stateless MCP endpoint accepts POST requests only." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Galleon MCP listening on http://127.0.0.1:${port}/mcp`);
});
