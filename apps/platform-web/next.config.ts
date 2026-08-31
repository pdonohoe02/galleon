import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // The demo's own URLs are 127.0.0.1 and *.galleon.localhost. Without these,
  // Next treats a dev request from them as cross-origin and refuses to serve
  // the client bundle, so client components never hydrate.
  allowedDevOrigins: [
    "127.0.0.1",
    "galleon.localhost",
    "app.galleon.localhost",
    "publishers.galleon.localhost",
  ],
  transpilePackages: [
    "@galleon/contracts",
    "@galleon/crypto",
    "@galleon/database",
  ],
};

export default nextConfig;
