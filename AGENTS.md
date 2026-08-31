# Agent operating notes

This file is for AI coding assistants working in this floo app. It
captures the floo-specific gotchas that aren't obvious from the code.

## Working with floo

- **Run `floo preflight` before every deploy.** Catches config drift,
  missing managed-service env vars, runtime detection issues, and
  destructive plan changes — most deploy failures are preventable here.
- **Discover the installed CLI locally first.** Run `floo commands
  --json`, `floo <command> --help`, then `floo docs <topic> --json`.
  These surfaces match the installed version. Use the hosted docs for
  longer explanations after checking them.
- **Commit before connecting GitHub.** `floo apps github connect`
  creates the floo app and triggers its first deploy from GitHub. Run
  preflight, commit, and push before connecting. For a fresh app,
  declare managed services with `[managed.<name>]` in `floo.app.toml`;
  `floo services add` requires an existing app.
- **Deploy by pushing to GitHub.** `git push` to your default branch
  triggers a dev deploy; cutting a GitHub release promotes to prod.
  Don't shell out to `gcloud run deploy` — it bypasses the floo
  pipeline.

## Agent-safe deploy debugging

- **Use `floo deploys status --json` instead of `floo deploys watch`.**
  `status` returns a compact summary (deploy id, derived phase
  booleans, gateway URL, next recommended command) without dumping
  build logs that may contain audit payloads. `watch` is fine for
  humans; for scripts and agents, prefer `status`.
- **`/health` on the direct Cloud Run URL is for infrastructure
  probes, not authenticated requests.** Cloud Run liveness/startup
  probes hit it without any session, so don't infer auth state from
  whatever can reach `/health`.
- **Test the floo gateway URL after every deploy.** A 502 on
  `*.on.getfloo.com` (or your custom domain) means the deploy didn't
  finalize even if the direct Cloud Run URL serves new code. `floo
  deploys status --json` reports `host_bound: false` in that state.

## If you set `access_mode = "accounts"` (or `"password"`)

- **Trust `X-Floo-User-Email`, `X-Floo-User-Id`, `X-Floo-User-Name`,
  and `X-Floo-User-Role` on every request your app receives.** The
  floo gateway is the only path into your container — Cloud Run
  ingress is locked to `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` and
  there's no `allUsers` invoker grant. The deploy pipeline raises if
  that combination would somehow ship as `INGRESS_TRAFFIC_ALL`.
- **Don't curl your `*.run.app` URL in scripts or tests.** It
  returns 403 from Cloud Run before reaching your container — by
  design.
- **Don't accept identity headers from any other path.** The trust
  boundary is the gateway, not the network in general. Authenticate
  inter-service or internal-cron calls separately.
- **Use `floo dev --fixture-user` for local dev.** It injects the
  same headers the gateway would, so your code path stays the same
  with no auth-mode toggling.

The full background — how the deploy-time invariant works, what
exactly is enforced, and how to verify the boundary — lives at
`https://getfloo.com/docs/guides/app-auth.md`.
