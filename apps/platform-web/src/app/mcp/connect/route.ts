// Activation probe, exposed at the app host's /mcp/connect. Forwards to the
// internal MCP service's /connect, which resolves the bearer token (stamping
// last_used_at) so the dashboard's connection indicator flips to green.
const TARGET = process.env.GALLEON_MCP_INTERNAL_URL ?? "http://127.0.0.1:3100/mcp";

export const dynamic = "force-dynamic";

async function forward(request: Request): Promise<Response> {
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  try {
    const upstream = await fetch(`${TARGET}/connect`, { method: "POST", headers });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return Response.json({ ok: false, error: "The wallet MCP is unavailable." }, { status: 502 });
  }
}

export function GET(request: Request) {
  return forward(request);
}
export function POST(request: Request) {
  return forward(request);
}
