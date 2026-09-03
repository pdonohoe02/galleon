# Galleon architecture

## Deployable surfaces

```text
galleon.example ───────────────┐
app.galleon.example ───────────┼─> apps/platform-web ──> shared services ──> PostgreSQL
app.galleon.example/mcp ───────┤   (wallet MCP served in-process)
publishers.galleon.example ────┘
paper.example ───────────> publisher-demo ──> entitlement redemption only
       └─ top-level WebMCP tools
```

The three Galleon web hostnames deliberately share one Next.js application. They need the same identity, wallet, resource, sales, and API layer; splitting them into separate front-end deployments now would multiply session and release coordination without creating a useful security boundary. Host routing still gives each audience a distinct root experience and leaves room to split the apps later.

The publisher demo is a separate application and origin because that boundary is fundamental to the product claim: paid content remains on publisher infrastructure.

## Implemented local path

The P0 demo path is executable against the local Postgres container:

- `GET /api/galleon/offer` on the publisher creates a session-bound, five-minute offer presentation through Galleon.
- `purchase_offer` on the authenticated wallet MCP validates that signature, enforces expected-price and wallet policy guards, posts a balanced ledger transaction, and returns a five-minute entitlement.
- `POST /api/galleon/unlock` sends that entitlement from the publisher backend to Galleon for atomic redemption, sets first-party HttpOnly access, and returns the server-only article body and citation.
- `/consumer` and `/publishers` read the same ledger and purchase records used by the MCP, so both dashboards update after a purchase.
- `/.well-known/jwks.json` exposes only the local ES256 public key. The corresponding private JWK is generated at runtime at `GALLEON_SIGNING_KEY_PATH`.

Demo authentication is deliberately fail-closed unless `GALLEON_DEMO_AUTH=true` and an exact bearer token is configured. Development-only credential fallbacks are disabled whenever `NODE_ENV=production`.

## Agent purchase flow

1. The publisher page registers `inspect_source` and `unlock_source` from top-level JavaScript.
2. `inspect_source` calls the publisher's same-origin backend. The backend obtains a short-lived, Galleon-signed offer using its server credential.
3. Codex evaluates the free offer and calls the authenticated wallet MCP's `purchase_offer` tool.
4. The wallet MCP validates the signed offer and trusted wallet context, then posts a balanced ledger transaction in PostgreSQL.
5. The MCP returns a short-lived entitlement, not a wallet credential.
6. Codex passes the entitlement to the publisher page's `unlock_source` tool.
7. The publisher backend atomically redeems it with Galleon, establishes first-party access, and returns the source and canonical citation.

## Accounts

Consumers sign up with an email and password on the wallet host. One `users` table serves both audiences; `kind` says which surface a user signs in to, and the sign-in action refuses a publisher account on the wallet host rather than signing it in somewhere it does not belong.

- Passwords are hashed with `scrypt` from `node:crypto`. The cost parameters are recorded in the stored string, so they can be raised later without invalidating existing hashes.
- Sessions are server-side rows keyed by the SHA-256 of a random cookie token. The cookie is `HttpOnly`, `SameSite=Lax` (the sign-in redirect and the logout hop to the marketing host are top-level navigations), and `Secure` in production. Sign-out deletes the row and redirects to `GALLEON_ISSUER`, which is the marketing host in every environment.
- A new consumer receives a wallet, a spend policy, and a starting grant posted as a balanced ledger transaction from the treasury wallet, so the books stay consistent with the demo seed.
- `/consumer` and `/api/v1/me/*` resolve the wallet from the session. The seeded demo wallet (`DEMO_IDS.consumerWallet`) is still what the wallet MCP charges; binding MCP bearer tokens to user wallets is the next step. Publisher identity is not yet account-backed.

## Security ownership

| Concern                                            | Owner            |
| -------------------------------------------------- | ---------------- |
| User session and dashboard authorization           | `platform-web`   |
| Wallet identity, purchase approval, and MCP scopes | `platform-web` (`/mcp`) |
| Offer and entitlement schemas                      | `contracts`      |
| Signing and verification                           | `crypto`         |
| Atomic ledger and idempotency                      | `database`       |
| WebMCP registration and same-origin calls          | `publisher-sdk`  |
| Paid source body and first-party access session    | publisher server |

Browser code, tool inputs, offer descriptions, and source content are all treated as untrusted. The publisher never receives the consumer's MCP access token, and the MCP never accepts a model-supplied wallet ID or unsigned payee.
