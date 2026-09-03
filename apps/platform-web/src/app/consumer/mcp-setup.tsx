"use client";

import { Button } from "@galleon/ui";
import { useEffect, useState } from "react";

import { checkMcpConnection, generateMcpToken } from "./onboarding/actions";

const TOKEN_PLACEHOLDER = "YOUR_WALLET_TOKEN";

/** A natural-language brief the user pastes to their AI agent to set it up. */
function aiInstructions(endpoint: string, token: string): string {
  return [
    "Set up the Galleon wallet MCP so you can buy sources for me.",
    "",
    '1. Add an MCP server named "galleon":',
    `   url: ${endpoint}`,
    `   bearer token: ${token}`,
    "   (If you are Codex, also set experimental_use_rmcp_client = true in ~/.codex/config.toml.)",
    "2. Connect and call get_wallet_summary to confirm you can reach my wallet.",
    "3. When I ask for a source, use purchase_offer to buy it within my wallet's",
    "   spend limits, then cite the source you used.",
  ].join("\n");
}

/** The equivalent Codex config.toml block, for users who prefer to edit it. */
function codexConfig(endpoint: string, token: string): string {
  return [
    "[mcp_servers.galleon]",
    `url = "${endpoint}"`,
    `bearer_token = "${token}"`,
    "experimental_use_rmcp_client = true",
  ].join("\n");
}

function CopyButton({ value, label = "Copy", variant = "secondary" }: { value: string; label?: string; variant?: "primary" | "secondary" }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard blocked; the value is visible for manual copy.
        }
      }}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

const boxStyle: React.CSSProperties = {
  border: "1px solid var(--gl-line-inline)",
  borderRadius: "var(--gl-radius)",
  background: "var(--gl-surface-inline)",
  color: "var(--gl-text)",
  fontSize: 14,
  padding: "12px 14px",
  overflowX: "auto",
};

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: "var(--gl-radius-sm)",
          background: "var(--gl-accent-wash)",
          color: "var(--gl-accent)",
          fontSize: 12,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{children}</span>
    </div>
  );
}

export function McpSetup({ endpoint }: { endpoint: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const host = endpoint.replace(/^https?:\/\//, "").replace(/\/mcp$/, "");
  const shown = token ?? TOKEN_PLACEHOLDER;
  const brief = aiInstructions(endpoint, shown);
  const config = codexConfig(endpoint, shown);

  useEffect(() => {
    if (connected) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await checkMcpConnection();
        if (alive && r.connected) setConnected(true);
      } catch {
        // transient; keep polling
      }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [connected]);

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const result = await generateMcpToken();
      setToken(result.token);
    } catch {
      setError("Could not generate a token. Refresh and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 15, lineHeight: 1.6, maxWidth: "62ch" }}>
        Galleon hosts your wallet&apos;s MCP at <span style={{ fontWeight: 500 }}>{host}/mcp</span>. Point your AI
        agent at it with the token below — that&apos;s how it reads your balance and buys sources within your
        limits. Purchase authority stays inside Galleon; it never lives in a publisher&apos;s page. Nothing to
        run on your machine.
      </p>

      {/* Step 1 — token */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <StepLabel n={1}>Generate a wallet token</StepLabel>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...boxStyle, flex: 1, minWidth: "16rem", fontWeight: 500, whiteSpace: "nowrap" }}>
            {token ?? "Not generated yet"}
          </span>
          <Button variant="secondary" size="sm" onClick={onGenerate} disabled={busy}>
            {busy ? "Generating…" : token ? "Regenerate" : "Generate token"}
          </Button>
        </div>
        {token ? <span className="gl-field-hint">Shown once. Regenerating replaces it.</span> : null}
        {error ? (
          <span className="gl-field-hint" style={{ color: "var(--gl-critical)" }}>
            {error}
          </span>
        ) : null}
      </div>

      {/* Step 2 — hand it to the AI */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <StepLabel n={2}>Paste this to your AI agent</StepLabel>
          <CopyButton value={brief} label="Copy for your AI" variant="primary" />
        </div>
        <pre style={{ ...boxStyle, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55, fontFamily: "inherit" }}>{brief}</pre>
        {!token ? <span className="gl-field-hint">Generate a token above and it fills in automatically.</span> : null}
      </div>

      {/* Manual alternative */}
      <details style={{ borderTop: "1px solid var(--gl-line-soft)", paddingTop: 14 }}>
        <summary style={{ cursor: "pointer", color: "var(--gl-text-muted)", fontSize: 14, fontWeight: 500 }}>
          Prefer to edit config yourself? (Codex)
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBlockStart: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span className="gl-field-label">~/.codex/config.toml</span>
            <CopyButton value={config} label="Copy config" />
          </div>
          <pre style={{ ...boxStyle, margin: 0, whiteSpace: "pre", lineHeight: 1.55, fontFamily: "inherit" }}>{config}</pre>
        </div>
      </details>

      {/* Live status */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          alignSelf: "flex-start",
          padding: "9px 14px",
          borderRadius: "var(--gl-radius)",
          border: `1px solid ${connected ? "var(--gl-positive-wash-line)" : "var(--gl-line-strong)"}`,
          background: connected ? "var(--gl-positive-wash)" : "var(--gl-surface-subtle)",
          color: connected ? "var(--gl-positive)" : "var(--gl-text-muted)",
          fontSize: 13.5,
          fontWeight: 500,
        }}
      >
        {connected ? (
          <span aria-hidden style={{ fontSize: 14, fontWeight: 700 }}>✓</span>
        ) : (
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--gl-text-disabled)" }} />
        )}
        {connected ? "Connected — your agent reached this wallet." : "Waiting for your agent to connect…"}
      </div>
    </div>
  );
}
