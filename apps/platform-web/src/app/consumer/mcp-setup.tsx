"use client";

import { Button } from "@galleon/ui";
import { useState } from "react";

import { generateMcpToken } from "./onboarding/actions";

const TOKEN_PLACEHOLDER = "YOUR_WALLET_TOKEN";

function codexConfig(endpoint: string, token: string): string {
  return [
    "[mcp_servers.galleon]",
    `url = "${endpoint}"`,
    `bearer_token = "${token}"`,
    "experimental_use_rmcp_client = true",
  ].join("\n");
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

export function McpSetup({ endpoint }: { endpoint: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = codexConfig(endpoint, token ?? TOKEN_PLACEHOLDER);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 15, lineHeight: 1.55, maxWidth: "58ch" }}>
        Galleon connects to your agent over MCP. Generate a wallet token, then add the block below to
        Codex&apos;s <span style={{ fontWeight: 500 }}>~/.codex/config.toml</span> — Codex reads its MCP servers
        from there. Your agent buys sources from <em>this</em> wallet and honours its spend limits.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gl-field-label">Wallet token</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...boxStyle, flex: 1, minWidth: "16rem", fontWeight: 500, whiteSpace: "nowrap" }}>
            {token ?? "Generate a token to reveal it"}
          </span>
          <Button variant="secondary" size="sm" onClick={onGenerate} disabled={busy}>
            {busy ? "Generating…" : token ? "Regenerate token" : "Generate wallet token"}
          </Button>
        </div>
        {token ? (
          <span className="gl-field-hint">Copy it now — it is shown once. Regenerating replaces it.</span>
        ) : null}
        {error ? (
          <span className="gl-field-hint" style={{ color: "var(--gl-critical)" }}>
            {error}
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span className="gl-field-label">Codex config</span>
          <CopyButton value={config} label="Copy config" />
        </div>
        <pre style={{ ...boxStyle, margin: 0, whiteSpace: "pre", lineHeight: 1.55, fontFamily: "inherit" }}>{config}</pre>
        {!token ? (
          <span className="gl-field-hint">Generate a token above to fill in bearer_token.</span>
        ) : null}
      </div>
    </div>
  );
}
