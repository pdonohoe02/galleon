# Galleon

Galleon lets an AI agent purchase narrowly scoped access to content that remains on a publisher's own website. This repository is an early, demo-credit-only implementation of the Galleon TPRD.

## Architecture at a glance

The platform is split into three deployable trust boundaries:

- `apps/platform-web` serves the public landing page, consumer wallet dashboard, publisher dashboard, and platform HTTP APIs. One deployment is mapped to `galleon`, `app.galleon`, and `publishers.galleon` hostnames.
- `apps/galleon-mcp` is the authenticated Streamable HTTP wallet MCP used by Codex. Purchase authority lives here, never in publisher page JavaScript.
- `apps/publisher-demo` is an independently hosted example publisher. Its top-level JavaScript registers page-scoped WebMCP tools through `packages/publisher-sdk`.
- `apps/mock-blog` is a second, plain publication surface with one mock post. It provides a clean baseline before Galleon integration.

Shared security-sensitive code lives in `packages/contracts`, `packages/crypto`, and `packages/database`. The publisher integration is isolated in `packages/publisher-sdk`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the request flow and trust boundaries.

## Local development

Prerequisites: Node.js 22+, pnpm 11+, and Docker.

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm dev
```

Local services:

| Surface           | URL                                        |
| ----------------- | ------------------------------------------ |
| Landing page      | `http://galleon.localhost:3200`            |
| Consumer wallet   | `http://app.galleon.localhost:3200`        |
| Publisher console | `http://publishers.galleon.localhost:3200` |
| Publisher demo    | `http://127.0.0.1:3001`                    |
| Mock blog         | `http://127.0.0.1:3002`                    |
| Wallet MCP        | `http://127.0.0.1:3100/mcp`                |
| MCP health        | `http://127.0.0.1:3100/health`             |

The platform also exposes `/consumer` and `/publishers` as direct local fallbacks if wildcard localhost hostnames are unavailable.

Connecting Codex to the wallet MCP uses a bearer token, and there are two
kinds. A **per-user token**, generated from the wallet onboarding screen (or
the dashboard's Wallet MCP section), binds the agent to that user's own wallet
and spend limits — this is the normal path and needs no `.env` change. The
shared **demo token** (`GALLEON_DEMO_AUTH=true` plus a `GALLEON_DEMO_BEARER_TOKEN`
value in `.env`) maps to the seeded demo wallet, for a quick local run without
signing up. Either way, add the token to Codex's `~/.codex/config.toml`:

```toml
[mcp_servers.galleon]
url = "http://127.0.0.1:3100/mcp"
bearer_token = "gln_…"            # per-user token, or the demo token
experimental_use_rmcp_client = true
```

Balances are test credits only — no real money moves and nothing is
withdrawable. The publisher API and signing key are server-only; they are never
sent to the publisher page. For a stable production-mode local run after
building, use `pnpm start`.

## Quality checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Database schema work starts in `packages/database`. Generate and apply migrations with:

```bash
pnpm db:generate
pnpm db:migrate
```

The committed system is demo-credit-only. Do not add real payment credentials or real-money settlement paths to the MVP.
