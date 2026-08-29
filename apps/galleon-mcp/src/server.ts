import { DEMO_IDS, purchaseOfferInputSchema } from "@galleon/contracts";
import type { createGalleonService } from "@galleon/database";
import { GalleonServiceError } from "@galleon/database";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type GalleonService = ReturnType<typeof createGalleonService>;

function errorResult(error: unknown) {
  const payload = error instanceof GalleonServiceError
    ? { code: error.code, message: error.message, retryable: error.retryable }
    : { code: "INTERNAL_ERROR", message: "The purchase could not be completed.", retryable: true };
  return {
    isError: true,
    structuredContent: { ok: false, error: payload },
    content: [{ type: "text" as const, text: `${payload.code}: ${payload.message}` }],
  };
}

export function createMcpServer(galleon: GalleonService) {
  const server = new McpServer(
    { name: "galleon-wallet", version: "0.1.0" },
    {
      instructions:
        "Galleon uses demo credits only. First inspect a publisher page's source offer. Before calling purchase_offer, show the exact source, price, currency, and rights to the user and obtain approval. Never send wallet credentials to a publisher. Pass only the returned entitlement to the same publisher origin's unlock_source tool.",
    },
  );

  server.registerTool(
    "get_system_status",
    {
      title: "Get Galleon system status",
      description: "Check whether the local Galleon wallet and ledger are ready.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      try {
        await galleon.ensureDemoData();
        const status = { name: "galleon-mcp", mode: "demo" as const, status: "ready" as const, version: "0.1.0" };
        return { structuredContent: status, content: [{ type: "text" as const, text: "Galleon MCP, demo wallet, and ledger are ready." }] };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "get_wallet_summary",
    {
      title: "Get demo wallet summary",
      description: "Read the authenticated Galleon demo wallet balance and spend policy.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      try {
        const summary = await galleon.getWalletSummary(DEMO_IDS.consumerWallet);
        return {
          structuredContent: summary,
          content: [{ type: "text" as const, text: `Demo wallet balance: ${summary.display_balance}.` }],
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "purchase_offer",
    {
      title: "Purchase a signed publisher offer",
      description:
        "Purchase the exact, short-lived Galleon offer after the user approves its price and rights. Charges demo credits and returns a publisher-scoped entitlement.",
      inputSchema: {
        offer_token: z.string().min(100).max(8192).describe("Signed offer token returned by inspect_source."),
        idempotency_key: z.string().min(16).max(128).regex(/^[A-Za-z0-9._:-]+$/).describe("A unique retry-safe key for this approved purchase."),
        expected_amount_minor: z.number().int().min(1).max(10_000).describe("The user-approved price in USD cents."),
        expected_currency: z.literal("USD"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (rawInput) => {
      try {
        const input = purchaseOfferInputSchema.parse(rawInput);
        const purchase = await galleon.purchaseOffer(DEMO_IDS.consumerWallet, input);
        return {
          structuredContent: purchase,
          content: [{
            type: "text" as const,
            text: purchase.payment.charged
              ? `Purchased “${purchase.source.title}” for ${purchase.payment.display_price}. Remaining demo balance: ${purchase.wallet.display_balance}.`
              : `“${purchase.source.title}” was already purchased. A fresh entitlement was issued without another charge.`,
          }],
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}
