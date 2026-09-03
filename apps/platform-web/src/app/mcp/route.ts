// The wallet MCP, exposed on the app host at /mcp so an agent points at
// app.<host>/mcp rather than a separate service. Requests are forwarded to the
// internal MCP service (GALLEON_MCP_INTERNAL_URL), which holds the tools, keys,
// and per-user token resolution. Nothing runs on the user's machine.
const TARGET = process.env.GALLEON_MCP_INTERNAL_URL ?? "http://127.0.0.1:3100/mcp";

export const dynamic = "force-dynamic";

async function forward(request: Request, suffix = ""): Promise<Response> {
  const method = request.method;
  const headers = new Headers();
  for (const key of ["authorization", "content-type", "accept", "mcp-session-id", "mcp-protocol-version"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  try {
    const upstream = await fetch(TARGET + suffix, { method, headers, body });
    const respHeaders = new Headers();
    for (const key of ["content-type", "mcp-session-id"]) {
      const value = upstream.headers.get(key);
      if (value) respHeaders.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
  } catch {
    return Response.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "The wallet MCP is unavailable." }, id: null },
      { status: 502 },
    );
  }
}

export function POST(request: Request) {
  return forward(request);
}
export function GET(request: Request) {
  return forward(request);
}
export function DELETE(request: Request) {
  return forward(request);
}
