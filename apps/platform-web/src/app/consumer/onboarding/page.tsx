import { Button, Notice, PriceField, Wordmark } from "@galleon/ui";
import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { McpSetup } from "../mcp-setup";
import { finishOnboarding, submitDeposit } from "./actions";

export const dynamic = "force-dynamic";

const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

const PRESETS = [
  { minor: 500, label: "$5" },
  { minor: 1000, label: "$10" },
  { minor: 2500, label: "$25" },
];
const DEFAULT_PRESET_MINOR = 1000;

type Props = { searchParams: Promise<{ step?: string; error?: string }> };

function Step({ index, title, detail, state }: { index: number; title: string; detail: string; state: "current" | "done" | "todo" }) {
  const accent = state === "current" ? "var(--gl-accent)" : state === "done" ? "var(--gl-positive)" : "var(--gl-text-meta)";
  return (
    <div
      style={{
        flex: 1,
        padding: "14px 18px",
        background: state === "current" ? "var(--gl-accent-wash)" : "var(--gl-surface-raised)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: accent }}>STEP {index}</span>
      <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: state === "todo" ? "var(--gl-text-soft)" : "var(--gl-text)" }}>
        {title}
      </span>
      <span style={{ fontSize: 13, color: "var(--gl-text-soft)", lineHeight: 1.5 }}>{detail}</span>
    </div>
  );
}

export default async function OnboardingPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }

  const { step: stepParam, error } = await searchParams;
  // Finished users go straight to the wallet, unless they came back to manage
  // their MCP token (?step=mcp).
  if (user.onboarded && stepParam !== "mcp") redirect("/consumer");

  const wallet = await galleon.getWalletSummary(user.wallet_id);
  const funded = wallet.balance_minor > 0;
  const step: "deposit" | "mcp" = stepParam === "mcp" || (stepParam !== "deposit" && funded) ? "mcp" : "deposit";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--gl-surface)" }}>
      <header className="gl-masthead">
        <div className="gl-width" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBlock: 20 }}>
          <Wordmark href={marketingUrl} />
          <span className="gl-surface-chip">Wallet setup</span>
        </div>
      </header>

      <main style={{ flex: 1, width: "100%", maxWidth: "44rem", margin: "0 auto", padding: "48px 24px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--gl-text)" }}>Set up your wallet.</h1>
          <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 17, lineHeight: 1.5 }}>
            Two quick steps and your agent can start buying sources.
          </p>
        </div>

        <div className="gl-flush" style={{ display: "flex" }}>
          <Step index={1} title="Add test credits" detail={funded ? `Funded — balance ${wallet.display_balance}.` : "Choose how much to deposit."} state={step === "deposit" ? "current" : "done"} />
          <div style={{ width: 1, background: "var(--gl-line-soft)" }} />
          <Step index={2} title="Connect your agent" detail="Point Codex at your wallet over MCP. Optional." state={step === "mcp" ? "current" : "todo"} />
        </div>

        {step === "deposit" ? (
          <section className="gl-panel" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 15, lineHeight: 1.55, maxWidth: "58ch" }}>
              Galleon settles in <strong>test credits</strong> — no real money moves and nothing is withdrawable.
              Pick a starting balance; your agent spends from it, capped by your wallet&apos;s per-purchase and
              daily limits.
            </p>

            {error === "amount" ? (
              <Notice tone="critical" role="alert">
                <span>Enter an amount between $1 and $100.</span>
              </Notice>
            ) : null}

            <form action={submitDeposit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="gl-field-label">Deposit amount</span>
                <div className="gl-tiles">
                  {PRESETS.map((preset) => (
                    <label key={preset.minor} className="gl-tile">
                      <input type="radio" name="amount" value={String(preset.minor)} defaultChecked={preset.minor === DEFAULT_PRESET_MINOR} />
                      {preset.label}
                    </label>
                  ))}
                  <label className="gl-tile" style={{ flex: "1.4", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <input type="radio" name="amount" value="custom" />
                    <span>Custom</span>
                    <PriceField tight name="custom_amount" inputMode="decimal" placeholder="50" aria-label="Custom amount in dollars" />
                  </label>
                </div>
              </div>

              <div>
                <Button variant="primary" type="submit">
                  Add credits &amp; continue
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <section className="gl-panel" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <McpSetup endpoint={mcpEndpoint} />
            <form action={finishOnboarding} style={{ display: "flex", gap: 10 }}>
              <Button variant="primary" type="submit">
                Finish &amp; go to wallet
              </Button>
              <Button variant="quiet" type="submit">
                Skip for now
              </Button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
