import { Button, Field, Input, Notice, Wordmark } from "@galleon/ui";

import { PASSWORD_MIN_LENGTH } from "@/lib/password";

import { authErrorMessage } from "./auth-copy";

type Mode = "sign-in" | "sign-up";

type Props = {
  mode: Mode;
  action: (formData: FormData) => Promise<void>;
  email?: string;
  error?: string;
};

const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";

const COPY: Record<Mode, { title: string; lede: string; submit: string; switchPrompt: string; switchLabel: string; switchHref: string }> = {
  "sign-in": {
    title: "Sign in to your wallet.",
    lede: "Your sources, your budget, your receipts.",
    submit: "Sign in",
    switchPrompt: "New to Galleon?",
    switchLabel: "Create a wallet",
    switchHref: "/consumer/sign-up",
  },
  "sign-up": {
    title: "Create your wallet.",
    lede: "Set a starting balance of test credits, then point your agent at it.",
    submit: "Create wallet",
    switchPrompt: "Already have a wallet?",
    switchLabel: "Sign in",
    switchHref: "/consumer/sign-in",
  },
};

export function AuthForm({ mode, action, email = "", error }: Props) {
  const copy = COPY[mode];
  const message = authErrorMessage(error);
  const isSignUp = mode === "sign-up";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--gl-surface)" }}>
      <header className="gl-masthead">
        <div className="gl-width" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBlock: 20 }}>
          <Wordmark href={marketingUrl} />
          <span className="gl-surface-chip">Wallet</span>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "72px 24px" }}>
        <section className="gl-panel" style={{ width: "100%", maxWidth: "27rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--gl-space, 18px)", padding: "28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--gl-text)" }}>
                {copy.title}
              </h1>
              <p style={{ margin: 0, color: "var(--gl-text-muted)", fontSize: 15, lineHeight: 1.5 }}>{copy.lede}</p>
            </div>

            <form action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {message ? (
                <Notice tone="critical" role="alert">
                  <span>{message}</span>
                </Notice>
              ) : null}

              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  defaultValue={email}
                  required
                  autoFocus={!email}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={isSignUp ? `At least ${PASSWORD_MIN_LENGTH} characters.` : undefined}
              >
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={isSignUp ? PASSWORD_MIN_LENGTH : undefined}
                  required
                  autoFocus={Boolean(email)}
                />
              </Field>

              <Button variant="primary" type="submit" block>
                {copy.submit}
              </Button>
            </form>

            <p style={{ margin: 0, color: "var(--gl-text-soft)", fontSize: 14 }}>
              {copy.switchPrompt}{" "}
              <a href={copy.switchHref} style={{ fontWeight: 500 }}>
                {copy.switchLabel}
              </a>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
