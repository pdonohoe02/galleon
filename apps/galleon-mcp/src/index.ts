import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { createMcpServer } from "./server.js";

const port = Number.parseInt(process.env.PORT ?? "3100", 10);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_request, response) => {
  response.json({
    name: "galleon-mcp",
    mode: "demo",
    status: "ready",
    version: "0.0.0",
  });
});

app.post("/mcp", async (request, response) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

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
      response.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_request, response) => {
  response.status(405).set("Allow", "POST").json({
    error: "This stateless MCP endpoint accepts POST requests only.",
  });
});

app.delete("/mcp", (_request, response) => {
  response.status(405).set("Allow", "POST").json({
    error: "This stateless MCP endpoint does not create sessions.",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Galleon MCP listening on http://127.0.0.1:${port}/mcp`);
});
