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
    lede: "Starts with $5.00 of credits so your agent can buy its first source today.",
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
    <div className="galleon-ds">
      <div className="gl-shell">
        <header className="gl-masthead">
          <a className="gl-wordmark" href={marketingUrl}>
            Galleon
          </a>
          <div className="gl-masthead__aside">
            <span className="gl-status">
              <span className="gl-status__dot gl-status__dot--muted" />
              Consumer wallet
            </span>
          </div>
        </header>

        <div className="gl-page-header">
          <div className="gl-page-header__main">
            <p className="gl-eyebrow gl-eyebrow--accent">Consumer wallet</p>
            <h1 className="gl-display gl-display--3">{copy.title}</h1>
            <p className="gl-lede gl-lede--body">{copy.lede}</p>
          </div>
        </div>

        <section className="gl-section">
          <form action={action} noValidate style={{ maxWidth: "32rem" }}>
            {message ? (
              <div className="gl-notice gl-notice--critical" role="alert">
                <div className="gl-notice__copy">
                  <span>{message}</span>
                </div>
              </div>
            ) : null}

            <div className="gl-field" style={{ marginBlockStart: message ? "var(--gl-space-5)" : undefined }}>
              <label className="gl-field__label" htmlFor="email">
                Email
              </label>
              <input
                className="gl-input"
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                defaultValue={email}
                required
                autoFocus={!email}
              />
            </div>

            <div className="gl-field">
              <label className="gl-field__label" htmlFor="password">
                Password
              </label>
              <input
                className="gl-input"
                id="password"
                type="password"
                name="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? PASSWORD_MIN_LENGTH : undefined}
                required
                autoFocus={Boolean(email)}
              />
              {isSignUp ? (
                <p className="gl-field__hint">At least {PASSWORD_MIN_LENGTH} characters.</p>
              ) : null}
            </div>

            <div
              className="gl-actions"
              style={{ alignItems: "center", justifyContent: "space-between", marginBlockStart: "var(--gl-space-6)" }}
            >
              <button className="gl-button gl-button--primary" type="submit">
                {copy.submit}
              </button>
              <span className="gl-lede gl-lede--small" style={{ margin: 0 }}>
                {copy.switchPrompt}{" "}
                <a href={copy.switchHref} style={{ color: "var(--gl-accent)", fontWeight: 600 }}>
                  {copy.switchLabel}
                </a>
              </span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
