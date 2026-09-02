"use client";

import { useState } from "react";

import { generateMcpToken } from "./onboarding/actions";

const TOKEN_PLACEHOLDER = "YOUR_WALLET_TOKEN";

/** The Codex config.toml block that points a Codex agent at this wallet MCP. */
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
    <button
      type="button"
      className="gl-snippet__copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard blocked (insecure context, denied permission). The value
          // is visible for manual copy; a failed write should not throw.
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

type Props = {
  endpoint: string;
  /** Compact variant for the dashboard section (no headings/lede). */
  compact?: boolean;
};

/**
 * Wallet MCP setup for OpenAI Codex: generate a per-wallet bearer token and
 * copy the config.toml block that binds a Codex agent to this wallet. The token
 * is fetched via a server action and shown once; regenerating rotates it.
 */
export function McpSetup({ endpoint, compact = false }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownToken = token ?? TOKEN_PLACEHOLDER;
  const config = codexConfig(endpoint, shownToken);

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
    <div className="gl-panel__body" style={{ gap: "var(--gl-space-5)" }}>
      {!compact ? (
        <p style={{ margin: 0 }}>
          Galleon connects to your AI agent over MCP. Generate a wallet token,
          then add the block below to Codex&apos;s{" "}
          <span className="gl-input--mono" style={{ fontSize: "0.9em" }}>
            ~/.codex/config.toml
          </span>{" "}
          — Codex reads its MCP servers from there. Your agent buys sources from
          <em> this</em> wallet and honours its spend limits.
        </p>
      ) : null}

      <div>
        <div className="gl-snippet__row" style={{ marginBlockEnd: "var(--gl-space-2)" }}>
          <span className="gl-snippet__label" style={{ padding: "0.8rem 0.9rem" }}>
            Wallet token
          </span>
          <span className="gl-snippet__value" style={{ overflowX: "auto" }}>
            {token ?? "Generate a token to reveal it"}
          </span>
          {token ? <CopyButton value={token} /> : null}
        </div>
        <div className="gl-actions" style={{ gap: "var(--gl-space-3)", alignItems: "center" }}>
          <button
            type="button"
            className="gl-button gl-button--secondary gl-button--sm"
            onClick={onGenerate}
            disabled={busy}
          >
            {busy ? "Generating…" : token ? "Regenerate token" : "Generate wallet token"}
          </button>
          {token ? (
            <span className="gl-lede gl-lede--small" style={{ margin: 0 }}>
              Copy it now — it is shown once. Regenerating replaces it.
            </span>
          ) : null}
          {error ? (
            <span className="gl-lede gl-lede--small" style={{ margin: 0, color: "var(--gl-critical)" }}>
              {error}
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <div className="gl-snippet__row" style={{ alignItems: "stretch" }}>
          <pre
            className="gl-snippet__value gl-input--mono"
            style={{ margin: 0, whiteSpace: "pre", overflowX: "auto", lineHeight: 1.5 }}
          >
            {config}
          </pre>
          <CopyButton value={config} label="Copy config" />
        </div>
        {!token ? (
          <p className="gl-field__hint" style={{ marginBlockStart: "var(--gl-space-2)" }}>
            Generate a token above to fill in <span className="gl-input--mono">bearer_token</span>.
          </p>
        ) : null}
      </div>
    </div>
  );
}
