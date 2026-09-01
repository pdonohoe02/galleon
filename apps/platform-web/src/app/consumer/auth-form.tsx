import { PASSWORD_MIN_LENGTH } from "@/lib/password";

import { authErrorMessage } from "./auth-copy";

type Mode = "sign-in" | "sign-up";

type Props = {
  mode: Mode;
  action: (formData: FormData) => Promise<void>;
  email?: string;
  error?: string;
};

const COPY: Record<Mode, { title: string; lede: string; submit: string; switchPrompt: string; switchLabel: string; switchHref: string }> = {
  "sign-in": {
    title: "Sign in to your wallet.",
    lede: "Your sources, your budget, your receipts.",
    submit: "Sign in",
    switchPrompt: "New to Galleon?",
    switchLabel: "Create a wallet",
    switchHref: "/sign-up",
  },
  "sign-up": {
    title: "Create your wallet.",
    lede: "Starts with $5.00 of credits so your agent can buy its first source today.",
    submit: "Create wallet",
    switchPrompt: "Already have a wallet?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
  },
};

export function AuthForm({ mode, action, email = "", error }: Props) {
  const copy = COPY[mode];
  const message = authErrorMessage(error);
  const isSignUp = mode === "sign-up";

  return (
    <div className="gl-shell">
      <header className="gl-masthead gl-masthead--solid">
        <div className="gl-width">
          <div className="gl-masthead-left">
            <a className="gl-wordmark" href={process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200"}>
              Galleon
            </a>
            <span className="gl-surface-chip">Wallet</span>
          </div>
        </div>
      </header>

      <main>
        <div className="gl-page gl-page--narrow">
          <section className="gl-page-head">
            <h1 className="gl-display">{copy.title}</h1>
            <p className="gl-lede">{copy.lede}</p>
          </section>

          <section className="gl-flush">
            <form className="gl-auth-form" action={action} noValidate>
              {message ? (
                <p className="gl-form-error" role="alert">
                  {message}
                </p>
              ) : null}

              <label className="gl-field">
                <span className="gl-field-label">Email</span>
                <input
                  className="gl-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  defaultValue={email}
                  required
                  autoFocus={!email}
                />
              </label>

              <label className="gl-field">
                <span className="gl-field-label">Password</span>
                <input
                  className="gl-input"
                  type="password"
                  name="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={isSignUp ? PASSWORD_MIN_LENGTH : undefined}
                  required
                  autoFocus={Boolean(email)}
                />
                {isSignUp ? (
                  <span className="gl-field-hint">At least {PASSWORD_MIN_LENGTH} characters.</span>
                ) : null}
              </label>

              <div className="gl-auth-actions">
                <button className="gl-button" type="submit">
                  {copy.submit}
                </button>
                <span className="gl-auth-switch">
                  {copy.switchPrompt} <a href={copy.switchHref}>{copy.switchLabel}</a>
                </span>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
