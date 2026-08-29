import { randomUUID, timingSafeEqual } from "node:crypto";

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

function authorized(request: express.Request): boolean {
  if (process.env.GALLEON_DEMO_AUTH !== "true") return false;
  const expected = process.env.GALLEON_DEMO_BEARER_TOKEN;
  const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
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

app.post("/mcp", async (request, response) => {
  if (!authorized(request)) {
    response.status(process.env.GALLEON_DEMO_AUTH === "true" ? 401 : 503).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: process.env.GALLEON_DEMO_AUTH === "true"
          ? "A valid demo bearer token is required."
          : "Demo authentication is disabled. Set GALLEON_DEMO_AUTH=true for local use.",
      },
      id: null,
    });
    return;
  }

  const server = createMcpServer(galleon);
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
