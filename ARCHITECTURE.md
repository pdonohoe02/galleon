# Galleon architecture

## Deployable surfaces

```text
galleon.example ───────────────┐
app.galleon.example ───────────┼─> apps/platform-web ──> shared services ──> PostgreSQL
publishers.galleon.example ────┘             ^
                                              |
mcp.galleon.example/mcp ─> apps/galleon-mcp ─┘
                                              |
paper.example ───────────> publisher-demo ────┘ entitlement redemption only
       └─ top-level WebMCP tools
```

The three Galleon web hostnames deliberately share one Next.js application. They need the same identity, wallet, resource, sales, and API layer; splitting them into separate front-end deployments now would multiply session and release coordination without creating a useful security boundary. Host routing still gives each audience a distinct root experience and leaves room to split the apps later.

The publisher demo is a separate application and origin because that boundary is fundamental to the product claim: paid content remains on publisher infrastructure.

## Agent purchase flow

1. The publisher page registers `inspect_source` and `unlock_source` from top-level JavaScript.
2. `inspect_source` calls the publisher's same-origin backend. The backend obtains a short-lived, Galleon-signed offer using its server credential.
3. Codex evaluates the free offer and calls the authenticated wallet MCP's `purchase_offer` tool.
4. The wallet MCP validates the signed offer and trusted wallet context, then posts a balanced ledger transaction in PostgreSQL.
5. The MCP returns a short-lived entitlement, not a wallet credential.
6. Codex passes the entitlement to the publisher page's `unlock_source` tool.
7. The publisher backend atomically redeems it with Galleon, establishes first-party access, and returns the source and canonical citation.

## Security ownership

| Concern                                            | Owner            |
| -------------------------------------------------- | ---------------- |
| User session and dashboard authorization           | `platform-web`   |
| Wallet identity, purchase approval, and MCP scopes | `galleon-mcp`    |
| Offer and entitlement schemas                      | `contracts`      |
| Signing and verification                           | `crypto`         |
| Atomic ledger and idempotency                      | `database`       |
| WebMCP registration and same-origin calls          | `publisher-sdk`  |
| Paid source body and first-party access session    | publisher server |

Browser code, tool inputs, offer descriptions, and source content are all treated as untrusted. The publisher never receives the consumer's MCP access token, and the MCP never accepts a model-supplied wallet ID or unsigned payee.
