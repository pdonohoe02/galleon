import { AppSidebar } from "@galleon/ui";

import { signOut } from "./actions";
import { iconAgents, iconOverview, iconSettings, iconSources, iconSpending } from "./nav-icons";

const marketingUrl = process.env.GALLEON_ISSUER ?? "http://galleon.localhost:3200";
const mcpEndpoint = process.env.GALLEON_MCP_URL ?? "http://127.0.0.1:3100/mcp";

type Active = "overview" | "sources" | "spending" | "agents";

export function WalletSidebar({
  active,
  email,
  connected,
  mcpStatus,
}: {
  active: Active;
  email: string;
  connected: boolean;
  mcpStatus: string;
}) {
  const items = [
    { key: "overview", label: "Overview", icon: iconOverview, active: active === "overview", href: "/consumer" },
    { key: "sources", label: "Sources", icon: iconSources, active: active === "sources", href: "/consumer/sources" },
    { key: "spending", label: "Spending", icon: iconSpending, active: active === "spending", href: "/consumer/spending" },
    { key: "agents", label: "Connect agent", icon: iconAgents, active: active === "agents", href: "/consumer/onboarding?step=mcp" },
    { key: "settings", label: "Settings", icon: iconSettings, disabled: true },
  ];

  return (
    <AppSidebar
      chip="Wallet"
      brandHref={marketingUrl}
      items={items}
      identity={{
        initials: email.slice(0, 2).toUpperCase(),
        name: email,
        status: mcpStatus,
        statusTone: connected ? "ok" : "muted",
        endpoint: mcpEndpoint.replace(/^https?:\/\//, ""),
      }}
      footer={
        <form action={signOut}>
          <button className="gl-button gl-button--quiet gl-button--sm" type="submit" style={{ paddingInline: 4 }}>
            Sign out
          </button>
        </form>
      }
    />
  );
}
