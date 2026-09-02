import { redirect } from "next/navigation";

import { galleon } from "@/lib/galleon";
import { getCurrentUser, revokeSession } from "@/lib/session";

import { McpSetup } from "../mcp-setup";
import { finishOnboarding, submitDeposit } from "./actions";

export const dynamic = "force-dynamic";

const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";
const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

// Preset deposits, in minor units. Test credits — no real money moves.
const PRESETS = [
  { minor: 500, label: "$5" },
  { minor: 1000, label: "$10" },
  { minor: 2500, label: "$25" },
];
const DEFAULT_PRESET_MINOR = 1000;

type Props = { searchParams: Promise<{ step?: string; error?: string }> };

export default async function OnboardingPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/consumer/sign-in");
  if (!user.wallet_id) {
    await revokeSession();
    redirect("/consumer/sign-in?error=wrong_surface");
  }
  // Setup is a one-time flow; once finished, the wizard is done.
  if (user.onboarded) redirect("/consumer");

  const { step: stepParam, error } = await searchParams;
  const wallet = await galleon.getWalletSummary(user.wallet_id);
  const funded = wallet.balance_minor > 0;
  // The step param wins; otherwise resume where the user left off — at the MCP
  // step once the wallet has been funded, at the deposit step before then.
  const step: "deposit" | "mcp" =
    stepParam === "mcp" || (stepParam !== "deposit" && funded) ? "mcp" : "deposit";

  return (
    <div className="galleon-ds">
      <div className="gl-shell">
        <header className="gl-masthead">
          <a className="gl-wordmark" href={marketingUrl}>
            Galleon
          </a>
          <div className="gl-masthead__aside">
            <span className="gl-status">
              <span className="gl-status__dot gl-status__dot--muted" />
              Setting up
            </span>
            <span>{user.email}</span>
          </div>
        </header>

        <div className="gl-page-header">
          <div className="gl-page-header__main">
            <p className="gl-eyebrow gl-eyebrow--accent">Welcome to Galleon</p>
            <h1 className="gl-display gl-display--3">Set up your wallet.</h1>
            <p className="gl-lede gl-lede--body">
              Two quick steps and your agent can start buying sources.
            </p>
          </div>
        </div>

        <ol className="gl-stepper" aria-label="Setup progress">
          <li
            className={`gl-stepper__step ${step === "deposit" ? "gl-stepper__step--current" : "gl-stepper__step--done"}`}
          >
            <span className="gl-stepper__index">STEP 1</span>
            <span className="gl-stepper__title">Add test credits</span>
            <span className="gl-stepper__detail">
              {funded ? `Funded — balance ${wallet.display_balance}.` : "Choose how much to deposit."}
            </span>
          </li>
          <li
            className={`gl-stepper__step ${step === "mcp" ? "gl-stepper__step--current" : "gl-stepper__step--todo"}`}
          >
            <span className="gl-stepper__index">STEP 2</span>
            <span className="gl-stepper__title">Connect your agent</span>
            <span className="gl-stepper__detail">Point Codex at your wallet over MCP. Optional.</span>
          </li>
        </ol>

        {step === "deposit" ? (
          <section className="gl-section">
            <div className="gl-section__head">
              <p className="gl-eyebrow gl-eyebrow--soft">Step 1 · Deposit</p>
            </div>
            <p className="gl-lede gl-lede--body">
              Galleon settles in <strong>test credits</strong> — no real money
              moves and nothing is withdrawable. Pick a starting balance; your
              agent spends from it, capped by your wallet&apos;s per-purchase and
              daily limits.
            </p>

            {error === "amount" ? (
              <div className="gl-notice gl-notice--critical" role="alert" style={{ marginBlockEnd: "var(--gl-space-5)" }}>
                <div className="gl-notice__copy">
                  <span>Enter an amount between $1 and $100.</span>
                </div>
              </div>
            ) : null}

            <form action={submitDeposit}>
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend className="gl-field__label" style={{ marginBlockEnd: "var(--gl-space-3)" }}>
                  Deposit amount
                </legend>
                <div className="gl-actions" style={{ gap: "var(--gl-space-3)", flexWrap: "wrap" }}>
                  {PRESETS.map((preset) => (
                    <label key={preset.minor} className="gl-tag" style={{ cursor: "pointer", gap: "var(--gl-space-2)" }}>
                      <input
                        type="radio"
                        name="amount"
                        value={String(preset.minor)}
                        defaultChecked={preset.minor === DEFAULT_PRESET_MINOR}
                      />
                      {preset.label}
                    </label>
                  ))}
                  <label className="gl-tag" style={{ cursor: "pointer", gap: "var(--gl-space-2)" }}>
                    <input type="radio" name="amount" value="custom" />
                    Custom
                    <input
                      className="gl-input"
                      type="number"
                      name="custom_amount"
                      min="1"
                      max="100"
                      step="1"
                      placeholder="50"
                      aria-label="Custom amount in dollars"
                      style={{ inlineSize: "5rem", marginInlineStart: "var(--gl-space-2)" }}
                    />
                  </label>
                </div>
              </fieldset>

              <div className="gl-actions" style={{ marginBlockStart: "var(--gl-space-6)" }}>
                <button className="gl-button gl-button--primary" type="submit">
                  Add credits &amp; continue
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="gl-section">
            <div className="gl-section__head">
              <p className="gl-eyebrow gl-eyebrow--soft">Step 2 · Connect your agent</p>
              <span className="gl-section__aside">
                <span className="gl-tag gl-tag--positive">Wallet funded · {wallet.display_balance}</span>
              </span>
            </div>

            <McpSetup endpoint={mcpEndpoint} />

            <form action={finishOnboarding} className="gl-actions" style={{ marginBlockStart: "var(--gl-space-6)" }}>
              <button className="gl-button gl-button--primary" type="submit">
                Finish &amp; go to wallet
              </button>
              <button className="gl-button gl-button--quiet" type="submit">
                Skip for now
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
