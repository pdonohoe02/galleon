import { DEMO_IDS } from "@galleon/contracts";

import { consumerUrl, publisherOrigin } from "../../server/urls";

export const dynamic = "force-dynamic";

export function GET() {
  const origin = publisherOrigin();
  const walletUrl = consumerUrl();

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      "# Northline Review paid AI access declaration",
      "# Human readers may read this page for free.",
      "# AI-agent use is licensed per read via Galleon for 7¢ (USD 0.07).",
      `# Canonical source: ${origin}/`,
      `# Resource ID: ${DEMO_IDS.resource}`,
      `# Offer ID: ${DEMO_IDS.offer}`,
      "# Required WebMCP sequence: inspect_source, purchase_offer on the agent's Galleon wallet MCP, then unlock_source with the entitlement.",
      `# Create a wallet: ${walletUrl}`,
      "",
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
