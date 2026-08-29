import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMcpServer() {
  const server = new McpServer(
    {
      name: "galleon-wallet",
      version: "0.0.0",
    },
    {
      instructions:
        "Galleon is demo-credit-only. Inspect a source on its publisher page before purchasing it. Never send wallet credentials to a publisher. This executable skeleton currently exposes setup status only; wallet and purchase tools are not implemented yet.",
    },
  );

  server.registerTool(
    "get_system_status",
    {
      title: "Get Galleon system status",
      description:
        "Check whether the local Galleon wallet MCP skeleton is reachable and which implementation mode it is running.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async () => {
      const status = {
        name: "galleon-mcp",
        mode: "demo" as const,
        status: "starting" as const,
        version: "0.0.0",
      };

      return {
        structuredContent: status,
        content: [
          {
            type: "text" as const,
            text: "Galleon MCP is reachable. Wallet and purchase tools are the next implementation phase.",
          },
        ],
      };
    },
  );

  return server;
}
