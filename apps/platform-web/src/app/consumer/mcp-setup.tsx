"use client";

import { Button } from "@galleon/ui";
import { useEffect, useState } from "react";

import { checkMcpConnection, generateMcpToken } from "./onboarding/actions";

const TOKEN_PLACEHOLDER = "YOUR_WALLET_TOKEN";

function codexConfig(endpoint: string, token: string): string {
  return [
    "[mcp_servers.galleon]",
    `url = "${endpoint}"`,
    `bearer_token = "${token}"`,
    "experimental_use_rmcp_client = true",
  ].join("\n");
}

function connectCommand(endpoint: string, token: string): string {
  // endpoint ends in /mcp; the activation probe lives at /mcp/connect.
  return `curl -fsS ${endpoint}/connect -H "Authorization: Bearer ${token}"`;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
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
  padding: "10px 14px",
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

  const host = endpoint.replace(/^https?:\/\//, "");
  const isLocal = /^(127\.0\.0\.1|localhost|0\.0\.0\.0)/.test(host);
  const config = codexConfig(endpoint, token ?? TOKEN_PLACEHOLDER);
  const command = connectCommand(endpoint, token ?? TOKEN_PLACEHOLDER);

  // Poll for the connection until it lands, so the card flips to green the
  // moment the agent (or the curl below) reaches the server with this token.
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
        Galleon runs a small <strong>MCP server{isLocal ? " on your machine" : ""}</strong> — the broker your
        agent talks to. It holds this wallet&apos;s token and the authority to approve purchases and sign
        entitlements, so that power stays with you: it never lives inside a publisher&apos;s page and never
        travels to the publisher. Your agent asks the {isLocal ? "local " : ""}server to buy a source, the
        server checks your budget, pays from <em>this</em> wallet, and hands back a signed receipt.
        {isLocal ? " Start it with " : ""}
        {isLocal ? <span style={{ fontWeight: 500 }}>pnpm --filter @galleon/mcp dev</span> : null}
        {isLocal ? " if it isn't already running." : ""}
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

      {/* Step 2 — config */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <StepLabel n={2}>
            Add it to Codex — paste into <span style={{ fontWeight: 500 }}>~/.codex/config.toml</span>
          </StepLabel>
          <CopyButton value={config} label="Copy config" />
        </div>
        <pre style={{ ...boxStyle, margin: 0, whiteSpace: "pre", lineHeight: 1.55, fontFamily: "inherit" }}>{config}</pre>
        {!token ? <span className="gl-field-hint">Generate a token above to fill in bearer_token.</span> : null}
      </div>

      {/* Step 3 — activate */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <StepLabel n={3}>Activate — connect once with your token</StepLabel>
          <CopyButton value={command} label="Copy command" />
        </div>
        <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 14, lineHeight: 1.55, maxWidth: "62ch" }}>
          Start Codex and it connects on launch, or run this to check the link right now:
        </p>
        <pre style={{ ...boxStyle, margin: 0, whiteSpace: "pre", lineHeight: 1.55, fontFamily: "inherit" }}>{command}</pre>
      </div>

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
